from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SegmentWord(BaseModel):
    word: str
    start_ms: int
    end_ms: int
    probability: float = 1.0


class TranscriptSegmentSchema(BaseModel):
    id: int
    start_ms: int
    end_ms: int
    text: str
    confidence: float = 1.0
    words: Optional[List[SegmentWord]] = None


class LanguageBreakdownSchema(BaseModel):
    primary_language: str = "en"
    language_label: str = "English"
    is_mixed: bool = False
    distribution: Dict[str, float] = Field(default_factory=lambda: {"en": 100.0})
    confidence: float = 1.0
    source: str = "local"


class SpeechMetricsSchema(BaseModel):
    word_count: int = 0
    sentence_count: int = 0
    unique_word_count: int = 0
    vocabulary_richness: float = 0.0
    repetition_score: float = 0.0
    repeated_phrases: List[str] = Field(default_factory=list)
    
    filler_count: int = 0
    filler_words: List[str] = Field(default_factory=list)
    filler_breakdown: Dict[str, int] = Field(default_factory=dict)
    filler_density_percent: float = 0.0
    
    pronunciation_score: float = 0.0
    articulation_score: float = 0.0
    unclear_words: List[Dict[str, Any]] = Field(default_factory=list)
    
    words_per_minute: float = 0.0
    active_speaking_seconds: float = 0.0
    average_volume_db: float = 0.0
    volume_stability_score: float = 0.0
    
    pause_count: int = 0
    pause_frequency: float = 0.0
    average_pause_duration_ms: float = 0.0
    pause_ratio: float = 0.0
    natural_pauses_count: int = 0
    thinking_pauses_count: int = 0
    lost_pauses_count: int = 0
    
    transition_count: int = 0
    hedging_count: int = 0
    hedging_score: float = 0.0
    energy_score: float = 0.0
    rhythm_score: float = 0.0


class ConfidenceComponentsSchema(BaseModel):
    speech_fluency: float = 0.0
    topic_relevance: float = 0.0
    vocabulary: float = 0.0
    practice_consistency: float = 0.0
    structure: float = 0.0
    energy: float = 0.0
    pronunciation_clarity: float = 0.0


class AiCoachingOutputSchema(BaseModel):
    topic_relevance: float = Field(default=75.0, ge=0.0, le=100.0)
    topic_coverage_percent: float = Field(default=70.0, ge=0.0, le=100.0)
    missing_points: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    coaching_feedback: List[str] = Field(default_factory=list)
    personalized_suggestions: List[str] = Field(default_factory=list)
    next_mission: str = "Practice again with fewer filler words."
    coach_message: str = "Great practice session! Keep refining your structure."
    emotional_tone: str = "Neutral"


class SessionCreateResponse(BaseModel):
    session_id: str
    status: str = "queued"
    status_stage: str = "Audio uploaded"
    message: str = "Audio session created and queued for asynchronous processing"


class SessionStatusResponse(BaseModel):
    session_id: str
    status: str  # uploaded, queued, transcribing, analyzing, coaching, completed, failed
    status_stage: Optional[str] = None
    progress_percent: int = 0
    error_message: Optional[str] = None
    
    # Results (populated when completed)
    overall_confidence_score: Optional[float] = None
    confidence_components: Optional[ConfidenceComponentsSchema] = None
    transcript: Optional[str] = None
    language: Optional[LanguageBreakdownSchema] = None
    metrics: Optional[SpeechMetricsSchema] = None
    coaching: Optional[AiCoachingOutputSchema] = None
    segments: Optional[List[TranscriptSegmentSchema]] = None
    duration_seconds: Optional[float] = None
    processing_time_ms: Optional[int] = None
    xp_earned: Optional[int] = None
    confidence_engine_version: Optional[str] = None
    created_at: Optional[datetime] = None


class RetryComparisonResponse(BaseModel):
    topic: str
    attempt_1_id: str
    attempt_1_score: float
    attempt_1_fillers: int
    attempt_1_wpm: float
    
    attempt_2_id: str
    attempt_2_score: float
    attempt_2_fillers: int
    attempt_2_wpm: float
    
    score_delta: float
    filler_delta: int
    wpm_delta: float
    improvement_summary: str
