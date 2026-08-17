from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.schemas.speech import ConfidenceComponentsSchema


def clamp(val: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    return max(min_val, min(max_val, val))


def calculate_speech_fluency(
    wpm: float,
    pause_frequency: float,
    volume_stability: float,
    repetition_score: float,
    lost_pauses_count: int
) -> float:
    """
    Calculates deterministic Speech Fluency (0-100).
    Ideal WPM: 130 - 160.
    """
    if wpm <= 0:
        pace_score = 50.0
    else:
        # Distance from ideal pace of 145 WPM
        pace_score = clamp(100.0 - abs(wpm - 145.0) * 0.7)
        
    pause_score = clamp(100.0 - (pause_frequency * 6.0) - (lost_pauses_count * 15.0))
    volume_score = clamp(volume_stability)
    rep_score = clamp(repetition_score)
    
    fluency = (
        (pace_score * 0.35) +
        (pause_score * 0.30) +
        (volume_score * 0.20) +
        (rep_score * 0.15)
    )
    return round(clamp(fluency), 1)


def calculate_practice_consistency(
    current_streak: int = 0,
    sessions_last_7_days: int = 0,
    previous_score: Optional[float] = None,
    current_estimate: Optional[float] = None
) -> float:
    """Calculates Practice Consistency score based on habits and improvement."""
    streak_score = clamp(current_streak * 12.0, 0.0, 45.0)
    freq_score = clamp(sessions_last_7_days * 10.0, 0.0, 40.0)
    
    improvement_score = 10.0
    if previous_score is not None and current_estimate is not None:
        delta = current_estimate - previous_score
        improvement_score = clamp((delta * 2.0) + 10.0, 0.0, 15.0)
        
    return round(clamp(streak_score + freq_score + improvement_score), 1)


def calculate_deterministic_confidence(
    metrics: Dict[str, Any],
    topic_relevance_score: float,
    current_streak: int = 1,
    sessions_last_7_days: int = 1,
    previous_score: Optional[float] = None
) -> Tuple[float, ConfidenceComponentsSchema, int]:
    """
    Authoritative, deterministic Confidence Scoring Engine (v1.0):
    Confidence Score = Fluency (30%) + Topic Relevance (30%) + Vocabulary (20%) + Consistency (20%)
    """
    wpm = metrics.get("words_per_minute", 120.0)
    pause_freq = metrics.get("pause_frequency", 5.0)
    vol_stability = metrics.get("volume_stability_score", 80.0)
    rep_score = metrics.get("repetition_score", 85.0)
    lost_pauses = metrics.get("lost_pauses_count", 0)
    
    # 1. Fluency
    fluency_score = calculate_speech_fluency(wpm, pause_freq, vol_stability, rep_score, lost_pauses)
    
    # 2. Topic Relevance
    topic_score = round(clamp(topic_relevance_score), 1)
    
    # 3. Vocabulary
    vocab_richness = metrics.get("vocabulary_richness", 75.0)
    vocabulary_score = round(clamp(vocab_richness * 0.75 + rep_score * 0.25), 1)
    
    # Structure & Energy
    structure_score = round(clamp(
        metrics.get("transition_count", 0) * 15.0 +
        metrics.get("hedging_score", 80.0) * 0.4 +
        30.0
    ), 1)
    energy_score = round(clamp(metrics.get("energy_score", 75.0)), 1)
    
    # Estimate for consistency
    current_estimate = (fluency_score + topic_score + vocabulary_score) / 3.0
    consistency_score = calculate_practice_consistency(
        current_streak=current_streak,
        sessions_last_7_days=sessions_last_7_days,
        previous_score=previous_score,
        current_estimate=current_estimate
    )
    
    # 4. Final Deterministic Formula (v1.0)
    final_score = (
        (fluency_score * 0.30) +
        (topic_score * 0.30) +
        (vocabulary_score * 0.20) +
        (consistency_score * 0.20)
    )
    final_score = round(clamp(final_score), 1)
    
    components = ConfidenceComponentsSchema(
        speech_fluency=fluency_score,
        topic_relevance=topic_score,
        vocabulary=vocabulary_score,
        practice_consistency=consistency_score,
        structure=structure_score,
        energy=energy_score,
    )
    
    # XP Award calculation
    if final_score >= 80:
        xp_earned = 70
    elif final_score >= 65:
        xp_earned = 50
    elif final_score >= 50:
        xp_earned = 30
    else:
        xp_earned = 15
        
    return final_score, components, xp_earned
