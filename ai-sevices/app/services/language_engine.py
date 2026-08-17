import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger

SCRIPT_PATTERNS = {
    "latin": re.compile(r"[A-Za-z]"),
    "arabic": re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]"),
    "devanagari": re.compile(r"[\u0900-\u097F]"),
}

STOPWORDS_BY_LANGUAGE: Dict[str, List[str]] = {
    "English": [
        "the", "is", "in", "at", "of", "and", "a", "to", "it", "for", "on", "with",
        "as", "this", "that", "was", "my", "i", "we", "you", "they", "have", "are"
    ],
    "Urdu": [
        "کا", "کی", "کے", "ہے", "ہیں", "میں", "سے", "پر", "کو", "نے", "تھا", "تھے",
        "تھی", "اور", "یہ", "وہ", "ہم", "آپ", "میری", "میرا", "میرے", "کیا", "کیوں"
    ],
    "Sindhi": [
        "جو", "جي", "جا", "آهي", "آهن", "۾", "کان", "تي", "کي", "هن", "هو", "۽",
        "اسان", "توهان", "منهنجو", "منهنجي", "ڇا", "ڇو"
    ],
    "Hindi": [
        "का", "की", "के", "है", "हैं", "में", "से", "पर", "को", "ने", "था", "थे",
        "थी", "और", "यह", "वह", "हम", "आप", "मेरा", "मेरी", "मेरे", "क्या", "क्यों"
    ],
    "Roman Urdu": [
        "ka", "ki", "ke", "hai", "hain", "me", "mein", "se", "par", "ko", "ne",
        "tha", "the", "thi", "aur", "ye", "yeh", "wo", "woh", "hum", "aap",
        "meri", "mera", "mere", "kya", "kyun", "kyu", "kaise", "kuch", "bohat",
        "acha", "achha", "karna", "raha", "rahi", "rahe", "hona", "hua", "hue"
    ]
}

LANGUAGE_CODE_MAP = {
    "English": "en",
    "Urdu": "ur",
    "Sindhi": "sd",
    "Hindi": "hi",
    "Roman Urdu": "ur-Latn",
}


def count_lexicon_matches(tokens: List[str], lexicon: List[str]) -> int:
    lexicon_set = set(lexicon)
    return sum(1 for t in tokens if t.lower() in lexicon_set)


async def call_llm_language_classifier(transcript: str) -> Optional[Dict[str, Any]]:
    """Fallback LLM classification for complex mixed/code-switching speech."""
    prompt = f"""Analyze the language and code-switching distribution of the following transcript.
Return STRICT JSON ONLY with format:
{{
  "primaryLanguage": "ur",
  "languageLabel": "Mixed Urdu-English",
  "isMixed": true,
  "confidence": 0.90,
  "distribution": {{"ur": 60, "en": 40}}
}}

Transcript:
\"\"\"{transcript[:500]}\"\"\"
"""
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            if resp.status_code == 200:
                import json
                data = resp.json()
                raw_response = data.get("response", "{}")
                parsed = json.loads(raw_response)
                return {
                    "primary_language": parsed.get("primaryLanguage", "en"),
                    "language_label": parsed.get("languageLabel", "English"),
                    "is_mixed": parsed.get("isMixed", False),
                    "distribution": parsed.get("distribution", {"en": 100}),
                    "confidence": float(parsed.get("confidence", 0.85)),
                    "source": "ollama-fallback"
                }
    except Exception as e:
        logger.warning(f"LLM language fallback failed: {str(e)}")
    return None


async def detect_hybrid_language(
    transcript: str,
    user_preferred_languages: Optional[List[str]] = None,
    whisper_language: Optional[str] = None
) -> Dict[str, Any]:
    """
    Hybrid 3-layer language detection:
    Layer 1: Deterministic Unicode script + stopword & Roman Urdu lexicon scoring.
    Layer 2: User language profile context.
    Layer 3: LLM fallback if confidence < 0.70.
    """
    clean_text = transcript.strip()
    if not clean_text:
        return {
            "primary_language": "en",
            "language_label": "English",
            "is_mixed": False,
            "distribution": {"en": 100.0},
            "confidence": 1.0,
            "source": "default"
        }
        
    chars_total = max(1, len(clean_text.replace(" ", "")))
    latin_chars = len(SCRIPT_PATTERNS["latin"].findall(clean_text))
    arabic_chars = len(SCRIPT_PATTERNS["arabic"].findall(clean_text))
    devanagari_chars = len(SCRIPT_PATTERNS["devanagari"].findall(clean_text))
    
    latin_ratio = latin_chars / float(chars_total)
    arabic_ratio = arabic_chars / float(chars_total)
    devanagari_ratio = devanagari_chars / float(chars_total)
    
    tokens = re.findall(r"[\w\u0600-\u06FF\u0750-\u077F\u0900-\u097F]+", clean_text.lower(), re.UNICODE)
    
    scores: Dict[str, float] = {
        "English": latin_ratio * 40.0,
        "Urdu": arabic_ratio * 40.0,
        "Sindhi": arabic_ratio * 35.0,
        "Hindi": devanagari_ratio * 40.0,
        "Roman Urdu": (latin_ratio * 20.0) if latin_ratio > 0.3 else 0.0,
    }
    
    # Lexicon matches
    for lang, stopwords in STOPWORDS_BY_LANGUAGE.items():
        matches = count_lexicon_matches(tokens, stopwords)
        scores[lang] += matches * 8.0
        
    # User preferred languages bonus
    if user_preferred_languages:
        for pref in user_preferred_languages:
            if pref in scores:
                scores[pref] += 15.0
                
    # Whisper hint bonus
    if whisper_language:
        if whisper_language == "ur":
            scores["Urdu"] += 25.0
        elif whisper_language == "sd":
            scores["Sindhi"] += 25.0
        elif whisper_language == "hi":
            scores["Hindi"] += 25.0
        elif whisper_language == "en":
            scores["English"] += 20.0
            
    # Rank languages
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_lang, top_score = ranked[0]
    second_lang, second_score = ranked[1] if len(ranked) > 1 else (None, 0.0)
    
    # Check for code switching / mixed language
    is_mixed = False
    distribution: Dict[str, float] = {}
    
    if second_lang and second_score > 15.0 and second_score >= (top_score * 0.40):
        is_mixed = True
        total_top_two = max(1.0, top_score + second_score)
        top_pct = round((top_score / total_top_two) * 100.0, 1)
        second_pct = round((second_score / total_top_two) * 100.0, 1)
        
        c1 = LANGUAGE_CODE_MAP.get(top_lang, "en")
        c2 = LANGUAGE_CODE_MAP.get(second_lang, "ur")
        distribution = {c1: top_pct, c2: second_pct}
        label = f"Mixed {top_lang}-{second_lang}"
        confidence = min(0.95, (top_score + second_score) / 100.0)
    else:
        c1 = LANGUAGE_CODE_MAP.get(top_lang, "en")
        distribution = {c1: 100.0}
        label = top_lang
        confidence = min(0.98, top_score / 60.0)
        
    # Layer 3: If confidence is low (< 0.70) and text is long enough, fallback to LLM
    if confidence < 0.70 and len(clean_text) > 30:
        llm_result = await call_llm_language_classifier(clean_text)
        if llm_result:
            return llm_result
            
    return {
        "primary_language": LANGUAGE_CODE_MAP.get(top_lang, "en"),
        "language_label": label,
        "is_mixed": is_mixed,
        "distribution": distribution,
        "confidence": round(confidence, 2),
        "source": "deterministic-hybrid"
    }
