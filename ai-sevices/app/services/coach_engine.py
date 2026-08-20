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
        filler_count = input_data.get("fillerCount", 0)
        filler_words = input_data.get("fillerWords", [])
        pron_score = input_data.get("pronunciationScore", 85.0)
        unclear_words = input_data.get("unclearWords", [])
        
        prompt = f"""You are Atlas, an expert speaking, pronunciation, and confidence coach for students.
Analyze the following speech attempt and provide constructive, motivating coaching feedback.
Pay special attention to:
1. Exact filler words detected ({filler_count} total: {', '.join(filler_words) if filler_words else 'None'}). Coach on replacing them with intentional pauses.
2. Pronunciation and word clarity (score: {pron_score}/100, unclear words: {json.dumps(unclear_words)}). Coach on clear articulation and crisp diction.
3. Content relevance and structure.

Do NOT calculate a final confidence score. Return STRICT JSON ONLY following the exact schema.

Schema:
{{
  "topic_relevance": 85.0,
  "topic_coverage_percent": 80.0,
  "missing_points": ["brief mention of future goal"],
  "strengths": ["Clear introduction", "Good vocal energy"],
  "weaknesses": ["Hesitation on filler words: like, um", "Unclear articulation on: specific"],
  "coaching_feedback": ["You opened strongly. Try pausing silently for 1 second instead of saying 'like'."],
  "personalized_suggestions": ["Articulate consonant endings clearly", "Practice pausing instead of using filler words"],
  "next_mission": "Give the same response with fewer than 2 filler words and crisp pronunciation.",
  "coach_message": "Strong effort! Focus on crisp word articulation and clean pauses.",
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


class DeterministicRuleCoach(BaseAIProvider):
    """Fallback offline coach ensuring robust feedback under all conditions."""
    async def generate_coaching(self, input_data: Dict[str, Any]) -> AiCoachingOutputSchema:
        topic = input_data.get("topic", "")
        transcript = input_data.get("transcript", "")
        wpm = input_data.get("wpm", 120.0)
        filler_count = input_data.get("fillerCount", 0)
        filler_words = input_data.get("fillerWords", [])
        pron_score = input_data.get("pronunciationScore", 85.0)
        unclear_words = input_data.get("unclearWords", [])
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
        
        # Topic feedback
        if topic_relevance >= 70.0:
            strengths.append("Stayed directly focused on the prompt topic.")
        else:
            weaknesses.append("Your response drifted slightly from the prompt.")
            suggestions.append("Mention key words from the prompt in your opening sentence.")
            
        # Pacing
        if 110.0 <= wpm <= 160.0:
            strengths.append(f"Ideal speaking pace ({int(wpm)} WPM).")
        elif wpm > 160.0:
            weaknesses.append(f"Speaking speed was fast ({int(wpm)} WPM).")
            suggestions.append("Slow down slightly and pause between key thoughts.")
        else:
            weaknesses.append(f"Speaking speed was slow ({int(wpm)} WPM).")
            suggestions.append("Increase your vocal tempo to maintain listener engagement.")
            
        # Filler words
        if filler_count == 0:
            strengths.append("Clean delivery with zero filler words detected.")
        elif filler_count <= 2:
            strengths.append(f"Minimal filler words ({filler_count} used).")
        else:
            fillers_str = ", ".join(f"'{w}'" for w in filler_words[:3]) if filler_words else "filler words"
            weaknesses.append(f"Used {filler_count} filler words ({fillers_str}).")
            suggestions.append("Use a 1-second silent pause instead of saying filler words.")
            
        # Pronunciation & Articulation
        if pron_score >= 85.0 and not unclear_words:
            strengths.append("Crisp pronunciation and clear word articulation.")
        elif pron_score < 75.0 or unclear_words:
            unclear_list = [w.get("word") for w in unclear_words[:3] if isinstance(w, dict) and w.get("word")]
            if unclear_list:
                weaknesses.append(f"Articulation was unclear on: {', '.join(unclear_list)}.")
                suggestions.append("Enunciate syllable endings more clearly and avoid rushing words.")
            else:
                weaknesses.append("Some words lacked crisp phonetic clarity.")
                suggestions.append("Open your mouth slightly wider to improve vocal projection and clarity.")
            
        # Transitions
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
            if filler_count > 2 else
            ("Practice enunciating difficult words clearly with steady volume." if unclear_words else
            "Retry and add one specific personal example to your answer.")
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
                f"Filler word count: {filler_count}. Pronunciation clarity: {int(pron_score)}%.",
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
    1. Ollama (local LLM)
    2. DeterministicRuleCoach (offline baseline fallback)
    """
    input_payload = {
        "topic": topic,
        "language": language_label,
        "transcript": transcript,
        "wordCount": metrics.get("word_count", 0),
        "wpm": metrics.get("words_per_minute", 120.0),
        "fillerCount": metrics.get("filler_count", 0),
        "fillerWords": metrics.get("filler_words", []),
        "fillerBreakdown": metrics.get("filler_breakdown", {}),
        "fillerDensityPercent": metrics.get("filler_density_percent", 0.0),
        "pronunciationScore": metrics.get("pronunciation_score", 85.0),
        "articulationScore": metrics.get("articulation_score", 85.0),
        "unclearWords": metrics.get("unclear_words", []),
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
        
    # 2. Fallback to Rule Coach
    rule_coach = DeterministicRuleCoach()
    res = await rule_coach.generate_coaching(input_payload)
    return res, "rule-coach", "deterministic-v1"
