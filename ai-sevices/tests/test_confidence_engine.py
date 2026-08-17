import pytest
from app.services.confidence_engine import (
    calculate_speech_fluency,
    calculate_practice_consistency,
    calculate_deterministic_confidence,
)


def test_speech_fluency_ideal_pace():
    # Ideal WPM around 145, minimal pauses, high stability
    fluency = calculate_speech_fluency(
        wpm=145.0,
        pause_frequency=3.0,
        volume_stability=90.0,
        repetition_score=95.0,
        lost_pauses_count=0
    )
    assert 80.0 <= fluency <= 100.0


def test_speech_fluency_slow_and_fast_penalty():
    fluency_ideal = calculate_speech_fluency(145.0, 3.0, 80.0, 85.0, 0)
    fluency_fast = calculate_speech_fluency(230.0, 3.0, 80.0, 85.0, 0)
    fluency_slow = calculate_speech_fluency(60.0, 3.0, 80.0, 85.0, 0)
    
    assert fluency_ideal > fluency_fast
    assert fluency_ideal > fluency_slow


def test_practice_consistency_progression():
    score_low = calculate_practice_consistency(current_streak=0, sessions_last_7_days=0)
    score_high = calculate_practice_consistency(current_streak=7, sessions_last_7_days=5, previous_score=60.0, current_estimate=75.0)
    
    assert score_low < score_high
    assert 0.0 <= score_high <= 100.0


def test_deterministic_confidence_formula():
    metrics = {
        "words_per_minute": 140.0,
        "pause_frequency": 4.0,
        "volume_stability_score": 85.0,
        "repetition_score": 90.0,
        "vocabulary_richness": 80.0,
        "lost_pauses_count": 0,
        "transition_count": 2,
        "hedging_score": 90.0,
        "energy_score": 80.0,
    }
    
    final_score, components, xp = calculate_deterministic_confidence(
        metrics=metrics,
        topic_relevance_score=85.0,
        current_streak=3,
        sessions_last_7_days=4,
    )
    
    # Check bounds
    assert 0.0 <= final_score <= 100.0
    assert 0.0 <= components.speech_fluency <= 100.0
    assert 0.0 <= components.topic_relevance <= 100.0
    assert 0.0 <= components.vocabulary <= 100.0
    assert 0.0 <= components.practice_consistency <= 100.0
    
    # Check exact formula balance
    expected = (
        (components.speech_fluency * 0.30) +
        (components.topic_relevance * 0.30) +
        (components.vocabulary * 0.20) +
        (components.practice_consistency * 0.20)
    )
    assert abs(final_score - round(expected, 1)) < 0.2
    assert xp >= 50
