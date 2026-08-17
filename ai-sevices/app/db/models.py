from datetime import datetime
import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    JSON,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_id() -> str:
    return str(uuid.uuid4())


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column(String(64), nullable=False, index=True)
    topic = Column(String(255), nullable=True)
    mission_id = Column(String(64), nullable=True)
    challenge_id = Column(String(64), nullable=True)
    
    # Status lifecycle: uploaded, queued, transcribing, analyzing, coaching, completed, failed
    status = Column(String(32), nullable=False, default="uploaded", index=True)
    status_stage = Column(String(64), nullable=True)
    progress_percent = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Timestamps & Execution Duration
    duration_seconds = Column(Float, default=0.0)
    processing_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Computed Final Metrics
    overall_confidence_score = Column(Float, default=0.0)
    fluency_score = Column(Float, default=0.0)
    topic_relevance_score = Column(Float, default=0.0)
    vocabulary_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    confidence_engine_version = Column(String(16), default="1.0")
    xp_earned = Column(Integer, default=0)

    # Relationships
    audio_file = relationship("AudioFile", back_populates="session", uselist=False, cascade="all, delete-orphan")
    transcript = relationship("Transcript", back_populates="session", uselist=False, cascade="all, delete-orphan")
    speech_metrics = relationship("SpeechMetric", back_populates="session", uselist=False, cascade="all, delete-orphan")
    ai_feedback = relationship("AiFeedback", back_populates="session", uselist=False, cascade="all, delete-orphan")


class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(String(64), primary_key=True, default=generate_id)
    session_id = Column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    duration_seconds = Column(Float, default=0.0)
    sample_rate_hz = Column(Integer, default=16000)
    channels = Column(Integer, default=1)
    format = Column(String(16), default="m4a")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("PracticeSession", back_populates="audio_file")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String(64), primary_key=True, default=generate_id)
    session_id = Column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    raw_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=False)
    primary_language = Column(String(32), default="en")
    language_label = Column(String(64), default="English")
    is_mixed_language = Column(Boolean, default=False)
    language_distribution = Column(JSON, nullable=True) # e.g. {"ur": 64, "en": 36}
    whisper_language = Column(String(16), nullable=True)
    whisper_confidence = Column(Float, default=0.0)
    
    # Granular segments
    segments = Column(JSON, nullable=True)  # List of {startMs, endMs, text, words}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("PracticeSession", back_populates="transcript")


class SpeechMetric(Base):
    __tablename__ = "speech_metrics"

    id = Column(String(64), primary_key=True, default=generate_id)
    session_id = Column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # NLP Metrics
    word_count = Column(Integer, default=0)
    sentence_count = Column(Integer, default=0)
    unique_word_count = Column(Integer, default=0)
    vocabulary_richness = Column(Float, default=0.0) # type-token ratio normalized 0-100
    repetition_score = Column(Float, default=0.0)
    repeated_phrases = Column(JSON, nullable=True)
    
    # Fillers
    filler_count = Column(Integer, default=0)
    filler_words = Column(JSON, nullable=True)
    filler_breakdown = Column(JSON, nullable=True) # {"um": 3, "you know": 2, "yani": 1}
    
    # Audio Metrics
    words_per_minute = Column(Float, default=0.0)
    active_speaking_seconds = Column(Float, default=0.0)
    average_volume_db = Column(Float, default=0.0)
    volume_stability_score = Column(Float, default=0.0)
    
    # Pauses
    pause_count = Column(Integer, default=0)
    pause_frequency = Column(Float, default=0.0) # pauses / min
    average_pause_duration_ms = Column(Float, default=0.0)
    pause_ratio = Column(Float, default=0.0)
    natural_pauses_count = Column(Integer, default=0) # 0.3-1.0s
    thinking_pauses_count = Column(Integer, default=0) # 1.0-3.0s
    lost_pauses_count = Column(Integer, default=0) # >3.0s
    
    # Mindset & Energy
    transition_count = Column(Integer, default=0)
    hedging_count = Column(Integer, default=0)
    hedging_score = Column(Float, default=0.0)
    energy_score = Column(Float, default=0.0)
    rhythm_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("PracticeSession", back_populates="speech_metrics")


class AiFeedback(Base):
    __tablename__ = "ai_feedbacks"

    id = Column(String(64), primary_key=True, default=generate_id)
    session_id = Column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    provider = Column(String(32), default="ollama") # ollama, gemini, fallback
    model = Column(String(64), default="llama3.2:3b")
    
    topic_relevance = Column(Float, default=0.0)
    topic_coverage_percent = Column(Float, default=0.0)
    missing_points = Column(JSON, nullable=True)
    
    strengths = Column(JSON, nullable=True) # list of string
    weaknesses = Column(JSON, nullable=True) # list of string
    coaching_feedback = Column(JSON, nullable=True) # list of coaching tips
    personalized_suggestions = Column(JSON, nullable=True) # list of action suggestions
    next_mission = Column(Text, nullable=True)
    coach_message = Column(Text, nullable=True)
    emotional_tone = Column(String(64), default="Neutral")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("PracticeSession", back_populates="ai_feedback")


class UserLanguageProfile(Base):
    __tablename__ = "user_language_profiles"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column(String(64), nullable=False, unique=True, index=True)
    preferred_languages = Column(JSON, default=lambda: ["English", "Urdu"])
    recent_languages = Column(JSON, default=lambda: [])
    session_count_by_language = Column(JSON, default=lambda: {})
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
