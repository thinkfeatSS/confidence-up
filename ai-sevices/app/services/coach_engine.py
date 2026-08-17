import json
from typing import Dict, Any, List, Optional, Tuple
import httpx
from pydantic import ValidationError
from app.core.config import settings
from app.core.logging import logger
from app.schemas.speech import AiCoachingOutputSchema


class BaseAIProvider:
    async def generate_coaching(self, structured_input: Dict[str, Any]) -> Optional[AiCoachingOutputSchema]:
        raise NotImplementedError


class OllamaProvider(BaseAIProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model

    async def generate_coaching(self, input_data: Dict[str, Any]) -> Optional[AiCoachingOutputSchema]:
        prompt = f"""You are Atlas, an expert speaking and confidence coach for students.
Analyze the following speech attempt and provide constructive, motivating coaching feedback.
Do NOT calculate a final confidence score. Return STRICT JSON ONLY following the exact schema.

Schema:
{{
  "topic_relevance": 85.0,
  "topic_coverage_percent": 80.0,
  "missing_points": ["brief mention of future goal"],
  "strengths": ["Clear introduction", "Good pacing"],
  "weaknesses": ["Too many filler words"],
  "coaching_feedback": ["You opened strongly. Try pausing briefly instead of using filler words."],
  "personalized_suggestions": ["Pause for 1 second before key points", "Add one concrete achievement"],
  "next_mission": "Give the same introduction with fewer than 3 filler words.",
  "coach_message": "Strong effort! Focus on crisp transitions in your next attempt.",
  "emotional_tone": "Confident"
}}

Speech Input Data:
{json.dumps(input_data, ensure_ascii=False, indent=2)}
"""
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "temperature": 0.35,
                            "top_p": 0.9,
                        }
                    }
                )
                if resp.status_code == 200:
                    raw = resp.json().get("response", "{}")
                    parsed = json.loads(raw)
                    return AiCoachingOutputSchema.model_validate(parsed)
        except Exception as e:
            logger.warning(f"Ollama coaching generation failed: {str(e)}")
        return None


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = settings.GEMINI_API_KEY, model: str = settings.GEMINI_MODEL):
        self.api_key = api_key
        self.model = model

    async def generate_coaching(self, input_data: Dict[str, Any]) -> Optional[AiCoachingOutputSchema]:
        if not self.api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        prompt = f"""You are Atlas, the ConfidenceUp speaking coach. Return strict JSON only.
Schema:
{{
  "topic_relevance": 85.0,
  "topic_coverage_percent": 80.0,
  "missing_points": ["mention career goal"],
  "strengths": ["Clear introduction"],
  "weaknesses": ["Repeated phrase"],
  "coaching_feedback": ["Structure was clear. Reduce hesitation."],
  "personalized_suggestions": ["Pause instead of filling"],
  "next_mission": "Reduce filler words by 20%.",
  "coach_message": "Good practice!",
  "emotional_tone": "Neutral"
}}

Input:
{json.dumps(input_data, ensure_ascii=False)}
"""
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.35}
                    }
                )
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    if candidates:
                        text = candidates[0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text)
                        return AiCoachingOutputSchema.model_validate(parsed)
        except Exception as e:
            logger.warning(f"Gemini fallback coaching generation failed: {str(e)}")
        return None


class DeterministicRuleCoach(BaseAIProvider):
    """Fallback offline coach ensuring robust feedback under all conditions."""
    async def generate_coaching(self, input_data: Dict[str, Any]) -> AiCoachingOutputSchema:
        topic = input_data.get("topic", "")
        transcript = input_data.get("transcript", "")
        wpm = input_data.get("wpm", 120.0)
        filler_count = input_data.get("fillerCount", 0)
        hedging_count = input_data.get("hedgingCount", 0)
        transition_count = input_data.get("transitionCount", 0)
        
        # Topic relevance estimation
        words = transcript.lower().split()
        topic_words = [w for w in topic.lower().split() if len(w) > 3]
        matched = [w for w in topic_words if any(w in spoken for spoken in words)]
        rel_pct = round((len(matched) / max(1, len(topic_words))) * 100.0) if topic_words else 75.0
        topic_relevance = max(45.0, min(95.0, float(rel_pct or 60.0)))
        
        strengths = []
        weaknesses = []
        suggestions = []
        
        if topic_relevance >= 70.0:
            strengths.append("Stayed directly focused on the prompt topic.")
        else:
            weaknesses.append("Your response drifted slightly from the prompt.")
            suggestions.append("Mention key words from the prompt in your opening sentence.")
            
        if 110.0 <= wpm <= 160.0:
            strengths.append(f"Ideal speaking pace ({int(wpm)} WPM).")
        elif wpm > 160.0:
            weaknesses.append(f"Speaking speed was fast ({int(wpm)} WPM).")
            suggestions.append("Slow down slightly and pause between paragraphs.")
        else:
            weaknesses.append(f"Speaking speed was slow ({int(wpm)} WPM).")
            suggestions.append("Increase your vocal tempo to maintain listener engagement.")
            
        if filler_count <= 2:
            strengths.append("Minimal filler words used.")
        else:
            weaknesses.append(f"Used {filler_count} filler words.")
            suggestions.append("Use a 1-second silent pause instead of saying filler words.")
            
        if transition_count >= 2:
            strengths.append("Good logical flow and transition markers.")
        else:
            suggestions.append("Use transition words like 'firstly', 'because', or 'finally' to structure your thoughts.")
            
        if not strengths:
            strengths.append("Completed a full practice recording with solid commitment.")
        if not weaknesses:
            weaknesses.append("Keep practicing to build even greater vocal endurance.")
            
        next_mission = (
            f"Retry and reduce filler words from {filler_count} to {max(1, filler_count // 2)}."
            if filler_count > 3 else
            "Retry and add one specific personal example to your answer."
        )
        
        coach_message = (
            "Great work on this attempt! Lead with your main conclusion first, then back it up with a concise example."
            if topic_relevance >= 70 else
            "Lead directly with an answer to the prompt, then support it with one clear reason."
        )
        
        return AiCoachingOutputSchema(
            topic_relevance=topic_relevance,
            topic_coverage_percent=topic_relevance,
            missing_points=["Concrete example supporting the point"] if topic_relevance < 75 else [],
            strengths=strengths[:3],
            weaknesses=weaknesses[:3],
            coaching_feedback=[
                coach_message,
                "Structure your answers: Point -> Reason -> Example -> Conclusion."
            ],
            personalized_suggestions=suggestions[:3],
            next_mission=next_mission,
            coach_message=coach_message,
            emotional_tone="Confident" if hedging_count < 2 else "Thoughtful"
        )


async def generate_ai_coaching(
    topic: str,
    transcript: str,
    language_label: str,
    metrics: Dict[str, Any]
) -> Tuple[AiCoachingOutputSchema, str, str]:
    """
    Executes AI coaching provider chain:
    1. Ollama (default local)
    2. Gemini (fallback)
    3. DeterministicRuleCoach (offline baseline)
    """
    input_payload = {
        "topic": topic,
        "language": language_label,
        "transcript": transcript,
        "wordCount": metrics.get("word_count", 0),
        "wpm": metrics.get("words_per_minute", 120.0),
        "fillerCount": metrics.get("filler_count", 0),
        "repetitionScore": metrics.get("repetition_score", 85.0),
        "vocabularyScore": metrics.get("vocabulary_richness", 75.0),
        "pauseCount": metrics.get("pause_count", 0),
        "transitionCount": metrics.get("transition_count", 0),
        "hedgingCount": metrics.get("hedging_count", 0),
    }
    
    # 1. Try Ollama
    ollama = OllamaProvider()
    res = await ollama.generate_coaching(input_payload)
    if res:
        return res, "ollama", settings.OLLAMA_MODEL
        
    # 2. Try Gemini
    gemini = GeminiProvider()
    res = await gemini.generate_coaching(input_payload)
    if res:
        return res, "gemini", settings.GEMINI_MODEL
        
    # 3. Fallback to Rule Coach
    rule_coach = DeterministicRuleCoach()
    res = await rule_coach.generate_coaching(input_payload)
    return res, "rule-coach", "deterministic-v1"
