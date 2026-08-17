import pytest
from app.services.analytics_engine import (
    tokenize_text,
    estimate_sentence_count,
    detect_fillers,
    calculate_repetition_metrics,
    analyze_speech_data,
)


def test_tokenize_multilingual_scripts():
    english = "Hello world! This is a test."
    urdu = "یہ ایک بولنے کی پریکٹس ہے۔"
    hindi = "यह एक बोलने का अभ्यास है।"
    mixed = "Today me confidence build karna chahta hun."
    
    assert len(tokenize_text(english)) == 6
    assert len(tokenize_text(urdu)) == 6
    assert len(tokenize_text(hindi)) == 6
    assert len(tokenize_text(mixed)) == 7


def test_estimate_sentence_count():
    text = "First point is clear. Second point is also clear! Are there any questions?"
    assert estimate_sentence_count(text, 12) == 3


def test_detect_fillers_multilingual():
    # English fillers
    text_en = "Um, I think, you know, we should literally like go there."
    count, words, breakdown = detect_fillers(text_en, tokenize_text(text_en))
    assert count >= 4
    assert "you know" in breakdown or "like" in breakdown or "um" in breakdown
    
    # Urdu fillers
    text_ur = "میرا مطلب ہے کہ تو پھر اچھا بس ٹھیک ہے"
    count_ur, words_ur, _ = detect_fillers(text_ur, tokenize_text(text_ur))
    assert count_ur >= 2
    
    # Roman Urdu fillers
    text_ru = "matlab mujhe lagta hai ke bas sab theek hai"
    count_ru, _, breakdown_ru = detect_fillers(text_ru, tokenize_text(text_ru))
    assert count_ru >= 2


def test_repetition_metrics():
    repeated_text = "great project great project great project good"
    tokens = tokenize_text(repeated_text)
    score, phrases = calculate_repetition_metrics(tokens)
    assert score < 80.0  # penalized for high repetition


def test_full_speech_analytics_pipeline():
    transcript = (
        "Good morning everyone. Today I would like to introduce myself. "
        "Firstly, I have graduated in computer science. "
        "Secondly, my passion is building intelligent applications. "
        "In conclusion, I am excited to contribute."
    )
    result = analyze_speech_data(transcript, duration_seconds=20.0)
    
    assert result["word_count"] > 20
    assert result["sentence_count"] >= 3
    assert result["words_per_minute"] > 80.0
    assert result["transition_count"] >= 3
    assert result["vocabulary_richness"] > 50.0
