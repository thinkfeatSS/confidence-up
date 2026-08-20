import re
import math
import wave
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

# Multi-language Fillers
FILLERS_BY_LANGUAGE: Dict[str, List[str]] = {
    "English": [
        "um", "uh", "er", "ah", "eh", "hmm", "hm", "like", "you know",
        "basically", "literally", "actually", "sort of", "kind of", "i mean",
        "right", "okay so", "anyway", "honestly", "so yeah"
    ],
    "Urdu": ["تو", "یعنی", "اچھا", "بس", "مطلب", "وہ", "ہمم", "ام", "اہ", "ہم", "صحیح", "ٹھیک ہے", "دیکھیں"],
    "Sindhi": ["ته", "يعني", "اڇا", "بس", "مطلب", "هو", "هم", "صحيح"],
    "Hindi": ["तो", "मतलब", "अच्छा", "वो", "यानी", "हम्म", "अम", "आह", "उम", "सही", "ठीक है"],
    "Roman Urdu": [
        "matlab", "yani", "yaani", "acha", "achha", "bas", "toh", "to",
        "wo", "woh", "umm", "hmm", "mtlb", "bs", "sahi", "theek hai", "dekhein"
    ]
}

HESITATION_PATTERNS = [
    r"\b[uúù]m+m*\b",
    r"\b[uúù]h+h*\b",
    r"\b[eéè]r+r*\b",
    r"\b[aáà]h+h*\b",
    r"\b[eéè]h+h*\b",
    r"\b[hH]m+\b",
    r"\b[hH]mm+\b",
    r"\baa+\b",
    r"\b[eéè]m+m*\b",
]

ALL_FILLERS = [item for sublist in FILLERS_BY_LANGUAGE.values() for item in sublist]

# Transition Words
TRANSITION_WORDS = [
    "firstly", "secondly", "thirdly", "finally", "moreover", "furthermore",
    "in addition", "on the other hand", "however", "therefore", "consequently",
    "as a result", "for example", "for instance", "in conclusion", "to summarize",
    "because", "although", "while", "whereas", "meanwhile",
    # Urdu / Hindi transitions
    "پہلے", "دوسرا", "آخرکار", "مزید", "تاہم", "اس لیے", "کیونکہ", "مثال کے طور پر",
    "لیکن", "مگر", "لہٰذا", "اگرچہ"
]

# Hedging Words
HEDGING_WORDS = [
    "maybe", "perhaps", "i think", "i guess", "probably", "possibly",
    "kind of", "sort of", "somewhat", "might be", "could be", "i suppose",
    "شاید", "غالباً", "میرا خیال ہے", "ہو سکتا ہے"
]

# Mindset / Positive & Negative Lexicon
POSITIVE_WORDS = [
    "achieved", "improved", "confident", "success", "effective", "valuable",
    "leader", "learned", "growth", "opportunity", "passion", "progress",
    "کامیاب", "ترقی", "بہتر", "موقع", "امید"
]

NEGATIVE_WORDS = [
    "failed", "impossible", "terrible", "hopeless", "weakness", "scared",
    "nervous", "anxious", "doubt", "fear", "can't", "cannot",
    "ناکام", "خوف", "ڈر", "پریشان", "مایوس"
]


def clamp(val: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    return max(min_val, min(max_val, val))


def tokenize_text(text: str) -> List[str]:
    """
    Unicode-aware tokenizer supporting Latin, Arabic/Urdu, and Devanagari scripts.
    Splits on punctuation, whitespace, and Unicode separators.
    """
    if not text:
        return []
    tokens = re.findall(r"[\w\u0600-\u06FF\u0750-\u077F\u0900-\u097F]+", text.lower(), re.UNICODE)
    return [t.strip() for t in tokens if t.strip()]


def estimate_sentence_count(text: str, tokens_count: int) -> int:
    """Estimates sentence count using punctuation and clause conjunctions."""
    if not text:
        return 0
    punctuation_count = len(re.findall(r"[.!?؟۔]+", text, re.UNICODE))
    if punctuation_count > 0:
        return punctuation_count
    if tokens_count <= 0:
        return 0
    # Fallback clause breaks
    clause_breaks = len(re.findall(r"\b(and then|but|so|because|however|also|then|لیکن|مگر|پر|تو)\b", text, re.I | re.UNICODE))
    return max(1, clause_breaks + 1, round(tokens_count / 12))


def detect_fillers(text: str, tokens: List[str]) -> Tuple[int, List[str], Dict[str, int]]:
    """Detects multilingual fillers and returns count, unique words, and breakdown."""
    lower_text = text.lower()
    breakdown: Dict[str, int] = {}
    
    # 1. Multi-word fillers
    multi_word_phrases = [
        "you know", "sort of", "kind of", "i mean", "okay so", "so yeah",
        "right now", "as such", "میرا خیال ہے", "مثال کے طور پر", "ٹھیک ہے", "theek hai"
    ]
    for phrase in multi_word_phrases:
        matches = len(re.findall(r"(?:^|\s)" + re.escape(phrase) + r"(?=\s|$|[,.!?])", lower_text))
        if matches > 0:
            breakdown[phrase] = matches
            
    # 2. Hesitation sound patterns (elongated ummm, uhhh, ahhh, hmmm)
    for pat in HESITATION_PATTERNS:
        for match in re.finditer(pat, lower_text):
            word = match.group(0).strip().lower()
            if word:
                norm_word = "um" if word.startswith("u") and "m" in word else (
                    "uh" if word.startswith("u") and "h" in word else (
                        "hmm" if word.startswith("h") and "m" in word else word
                    )
                )
                breakdown[norm_word] = breakdown.get(norm_word, 0) + 1

    # 3. Single-word fillers from dictionary
    for token in tokens:
        for lang, words in FILLERS_BY_LANGUAGE.items():
            if token in words and token not in ["to", "wo", "so"]:  # prevent false positives on common words
                breakdown[token] = breakdown.get(token, 0) + 1
                break
                
    total_fillers = sum(breakdown.values())
    unique_fillers = list(breakdown.keys())
    return total_fillers, unique_fillers, breakdown


def calculate_repetition_metrics(tokens: List[str]) -> Tuple[float, List[str]]:
    """Calculates repetition score and extracts repeated phrases."""
    if len(tokens) < 4:
        return 95.0, []
        
    normalized = [t for t in tokens if len(t) > 2]
    if not normalized:
        return 95.0, []
        
    counts: Dict[str, int] = {}
    for t in normalized:
        counts[t] = counts.get(t, 0) + 1
        
    repeated_sum = sum(c - 1 for c in counts.values() if c > 1)
    repeat_rate = repeated_sum / float(len(normalized))
    repetition_score = round(clamp(100.0 - (repeat_rate * 180.0)), 1)
    
    # Repeated n-grams (2-word and 3-word phrases)
    phrases_count: Dict[str, int] = {}
    for size in [2, 3]:
        for i in range(len(tokens) - size + 1):
            phrase = " ".join(tokens[i:i+size])
            phrases_count[phrase] = phrases_count.get(phrase, 0) + 1
            
    repeated_phrases = [
        f"{p} (×{c})" for p, c in phrases_count.items()
        if c >= 2 and any(p.startswith(w) for w in ["i think", "you know", "basically", "we have", "so", "actually"])
    ][:8]
    
    return repetition_score, repeated_phrases


def count_phrase_matches(text: str, phrases: List[str]) -> int:
    lower = text.lower()
    total = 0
    for phrase in phrases:
        pattern = r"(?:^|\s)" + re.escape(phrase) + r"(?=\s|$|[,.!?])"
        total += len(re.findall(pattern, lower))
    return total


def analyze_audio_pauses_and_volume(
    audio_path: Optional[str],
    segments: List[Dict[str, Any]],
    duration_seconds: float,
    word_count: int
) -> Dict[str, Any]:
    """
    Analyzes pause intervals from Whisper segments + raw PCM audio signal (if available).
    Classifies natural (0.3-1s), thinking (1-3s), and lost (>3s) pauses.
    """
    pause_intervals = []
    
    # 1. Compute pause intervals between segments
    if segments:
        for i in range(1, len(segments)):
            prev_end = segments[i-1].get("end_ms", 0)
            curr_start = segments[i].get("start_ms", 0)
            gap_ms = curr_start - prev_end
            if gap_ms >= 300: # at least 300ms pause
                pause_intervals.append(gap_ms)
                
    # If no segments, generate synthetic baseline
    if not pause_intervals and duration_seconds > 5:
        expected_pauses = max(1, int(duration_seconds / 8))
        pause_intervals = [600] * expected_pauses
        
    natural_count = sum(1 for p in pause_intervals if 300 <= p < 1000)
    thinking_count = sum(1 for p in pause_intervals if 1000 <= p < 3000)
    lost_count = sum(1 for p in pause_intervals if p >= 3000)
    
    total_pause_ms = sum(pause_intervals)
    pause_count = len(pause_intervals)
    avg_pause_ms = round(total_pause_ms / max(1, pause_count), 1)
    
    pause_frequency = round((pause_count / max(0.1, duration_seconds / 60.0)), 1)
    pause_ratio = round(clamp((total_pause_ms / 1000.0) / max(0.1, duration_seconds), 0.0, 1.0), 2)
    
    active_speaking_seconds = max(1.0, duration_seconds - (total_pause_ms / 1000.0))
    wpm = round(word_count / (active_speaking_seconds / 60.0), 1) if active_speaking_seconds > 0 else 0.0
    
    # Audio Volume & Stability (via wave file reading if present)
    avg_volume = 72.0
    volume_stability = 80.0
    if audio_path and os.path.exists(audio_path) and audio_path.endswith(".wav"):
        try:
            with wave.open(audio_path, "rb") as wf:
                frames = wf.readframes(wf.getnframes())
                signal = np.frombuffer(frames, dtype=np.int16)
                if len(signal) > 0:
                    rms = np.sqrt(np.mean(signal.astype(float)**2))
                    avg_volume = round(clamp(float(rms) / 327.68, 10.0, 95.0), 1)
                    # Variance
                    chunk_size = max(1, len(signal) // 20)
                    chunks = [np.sqrt(np.mean(signal[i:i+chunk_size].astype(float)**2)) for i in range(0, len(signal), chunk_size)]
                    variance = float(np.var(chunks)) if len(chunks) > 1 else 10.0
                    volume_stability = round(clamp(100.0 - math.sqrt(variance) * 0.05, 30.0, 98.0), 1)
        except Exception:
            pass
            
    speaking_ratio = active_speaking_seconds / max(0.1, duration_seconds)
    energy_score = round(clamp(avg_volume * 0.35 + volume_stability * 0.35 + speaking_ratio * 100.0 * 0.3), 1)
    rhythm_score = round(clamp(100.0 - (pause_frequency * 4.0) - (lost_count * 10.0)), 1)
    
    return {
        "words_per_minute": wpm,
        "active_speaking_seconds": round(active_speaking_seconds, 1),
        "average_volume_db": avg_volume,
        "volume_stability_score": volume_stability,
        "pause_count": pause_count,
        "pause_frequency": pause_frequency,
        "average_pause_duration_ms": avg_pause_ms,
        "pause_ratio": pause_ratio,
        "natural_pauses_count": natural_count,
        "thinking_pauses_count": thinking_count,
        "lost_pauses_count": lost_count,
        "energy_score": energy_score,
        "rhythm_score": rhythm_score,
    }


def analyze_pronunciation_clarity(
    segments: List[Dict[str, Any]],
    duration_seconds: float,
    word_count: int,
    volume_stability: float
) -> Tuple[float, float, List[Dict[str, Any]]]:
    """
    Extracts word-level acoustic confidence from Whisper segments, identifies unclear or
    mispronounced words, and computes overall Pronunciation Clarity (0-100) and Articulation Score (0-100).
    """
    extracted_words = []
    if segments:
        for seg in segments:
            for w in seg.get("words", []):
                word_text = w.get("word", "").strip()
                if word_text and len(word_text) > 1:
                    extracted_words.append({
                        "word": word_text,
                        "probability": float(w.get("probability", 0.9)),
                        "start_ms": int(w.get("start_ms", 0)),
                        "end_ms": int(w.get("end_ms", 0)),
                    })
                    
    unclear_words: List[Dict[str, Any]] = []
    
    if extracted_words:
        probs = [w["probability"] for w in extracted_words]
        avg_prob = float(np.mean(probs))
        
        # Base pronunciation score
        # 0.95+ prob -> 95+, 0.80 -> 80, 0.60 -> 60
        pronunciation_score = round(clamp(avg_prob * 100.0, 40.0, 98.0), 1)
        
        # Identify unclear words (confidence < 0.70)
        for w in extracted_words:
            # Exclude very short words or known simple tokens
            if w["probability"] < 0.72 and len(w["word"]) > 2:
                unclear_words.append({
                    "word": w["word"],
                    "confidence": round(w["probability"] * 100.0, 1),
                    "start_ms": w["start_ms"],
                    "end_ms": w["end_ms"],
                })
        # Limit to top 8 unclear words sorted by lowest confidence
        unclear_words = sorted(unclear_words, key=lambda x: x["confidence"])[:8]
    else:
        # Fallback heuristic if word timestamps are not populated
        if segments:
            seg_confs = [float(s.get("confidence", 0.85)) for s in segments]
            avg_seg_conf = float(np.mean(seg_confs))
            if avg_seg_conf < 0: # logprob format (e.g. -0.2)
                base = clamp(100.0 + avg_seg_conf * 30.0, 45.0, 95.0)
            else:
                base = clamp(avg_seg_conf * 100.0, 45.0, 95.0)
            pronunciation_score = round(base, 1)
        else:
            pronunciation_score = 85.0

    # Articulation score balances acoustic clarity with volume stability & lack of mumbled words
    penalty = len(unclear_words) * 3.5
    articulation_score = round(clamp(
        (pronunciation_score * 0.65) +
        (volume_stability * 0.25) +
        (max(0.0, 10.0 - penalty)),
        35.0,
        98.0
    ), 1)
    
    return pronunciation_score, articulation_score, unclear_words


def analyze_speech_data(
    transcript: str,
    duration_seconds: float,
    audio_path: Optional[str] = None,
    segments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Comprehensive deterministic speech analytics engine producing normalized metrics.
    """
    clean_text = transcript.strip()
    tokens = tokenize_text(clean_text)
    word_count = len(tokens)
    sentence_count = estimate_sentence_count(clean_text, word_count)
    unique_tokens = set(tokens)
    unique_word_count = len(unique_tokens)
    
    # Vocabulary richness (type-token ratio normalized 0-100)
    type_token_ratio = (unique_word_count / max(1, word_count)) * 100.0 if word_count > 0 else 0.0
    vocabulary_richness = round(clamp(type_token_ratio), 1)
    
    # Repetition
    repetition_score, repeated_phrases = calculate_repetition_metrics(tokens)
    
    # Fillers
    filler_count, filler_words, filler_breakdown = detect_fillers(clean_text, tokens)
    filler_density_percent = round((filler_count / max(1, word_count)) * 100.0, 1)
    
    # Mindset, Transitions & Hedging
    transition_count = count_phrase_matches(clean_text, TRANSITION_WORDS)
    hedging_count = count_phrase_matches(clean_text, HEDGING_WORDS)
    hedging_score = round(clamp(100.0 - (hedging_count * 12.0)), 1)
    
    pos_count = count_phrase_matches(clean_text, POSITIVE_WORDS)
    neg_count = count_phrase_matches(clean_text, NEGATIVE_WORDS)
    
    # Audio metrics
    audio_metrics = analyze_audio_pauses_and_volume(
        audio_path=audio_path,
        segments=segments or [],
        duration_seconds=duration_seconds,
        word_count=word_count
    )
    
    # Pronunciation & Articulation metrics
    vol_stability = audio_metrics.get("volume_stability_score", 80.0)
    pronunciation_score, articulation_score, unclear_words = analyze_pronunciation_clarity(
        segments=segments or [],
        duration_seconds=duration_seconds,
        word_count=word_count,
        volume_stability=vol_stability
    )
    
    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "unique_word_count": unique_word_count,
        "vocabulary_richness": vocabulary_richness,
        "repetition_score": repetition_score,
        "repeated_phrases": repeated_phrases,
        "filler_count": filler_count,
        "filler_words": filler_words,
        "filler_breakdown": filler_breakdown,
        "filler_density_percent": filler_density_percent,
        "pronunciation_score": pronunciation_score,
        "articulation_score": articulation_score,
        "unclear_words": unclear_words,
        "transition_count": transition_count,
        "hedging_count": hedging_count,
        "hedging_score": hedging_score,
        "positive_count": pos_count,
        "negative_count": neg_count,
        **audio_metrics,
    }
