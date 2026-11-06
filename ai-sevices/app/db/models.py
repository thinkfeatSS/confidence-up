from datetime import datetime, date
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    Text,
    JSON,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_id() -> str:
    return str(uuid.uuid4())


def generate_referral_code() -> str:
    return str(uuid.uuid4())[:8].upper()


# ─── Auth & Users ─────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_id)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column("passwordHash", String(255), nullable=True)
    google_id = Column("googleId", String(255), unique=True, nullable=True)
    avatar_url = Column("avatarUrl", String(512), nullable=True)
    role = Column(String(32), default="USER", nullable=False)  # USER, ADMIN
    is_verified = Column("isVerified", Boolean, default=False, nullable=False)
    is_blocked = Column("isBlocked", Boolean, default=False, nullable=False)
    block_reason = Column("blockReason", String(255), nullable=True)
    onboarding_completed = Column("onboardingCompleted", Boolean, default=False, nullable=False)
    onboarding_fears = Column("onboardingFears", JSON, nullable=True)
    onboarding_goals = Column("onboardingGoals", JSON, nullable=True)
    onboarding_daily_time = Column("onboardingDailyTime", String(32), nullable=True)
    preferred_languages = Column("preferredLanguages", JSON, nullable=True)
    xp_total = Column("xpTotal", Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    confidence_score = Column("confidenceScore", Float, default=0.0, nullable=False)
    referral_code = Column("referralCode", String(64), unique=True, default=generate_referral_code, nullable=False)
    referred_by_code = Column("referredByCode", String(64), nullable=True)
    deletion_requested_at = Column("deletionRequestedAt", DateTime, nullable=True)
    deletion_scheduled_at = Column("deletionScheduledAt", DateTime, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    speech_sessions = relationship("SpeechSession", back_populates="user", cascade="all, delete-orphan")


class EmailOtp(Base):
    __tablename__ = "email_otps"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), nullable=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    otp = Column(String(16), nullable=False)
    type = Column(String(32), default="VERIFY_EMAIL", nullable=False)  # VERIFY_EMAIL, FORGOT_PASSWORD
    expires_at = Column("expiresAt", DateTime, nullable=False)
    used_at = Column("usedAt", DateTime, nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column("tokenHash", String(255), nullable=False)
    device_id = Column("deviceId", String(255), nullable=True)
    expires_at = Column("expiresAt", DateTime, nullable=False)
    revoked_at = Column("revokedAt", DateTime, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fcm_token = Column("fcmToken", String(512), nullable=False)
    platform = Column(String(16), default="ANDROID", nullable=False)  # IOS, ANDROID
    app_version = Column("appVersion", String(32), nullable=True)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    dark_mode = Column("darkMode", Boolean, default=True, nullable=False)
    daily_reminders = Column("dailyReminders", Boolean, default=True, nullable=False)
    weekly_report = Column("weeklyReport", Boolean, default=True, nullable=False)
    reminder_time = Column("reminderTime", String(16), default="09:00", nullable=False)
    email_notifications = Column("emailNotifications", Boolean, default=True, nullable=False)
    push_notifications = Column("pushNotifications", Boolean, default=True, nullable=False)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="settings")


class TermsAcceptance(Base):
    __tablename__ = "terms_acceptances"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column("documentType", String(32), nullable=False)  # TERMS, PRIVACY
    version = Column(String(16), nullable=False)
    ip_address = Column("ipAddress", String(64), nullable=True)
    user_agent = Column("userAgent", String(512), nullable=True)
    accepted_at = Column("acceptedAt", DateTime, default=datetime.utcnow, nullable=False)


class AccountDeletionRequest(Base):
    __tablename__ = "account_deletion_requests"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(32), default="PENDING", nullable=False)
    requested_at = Column("requestedAt", DateTime, default=datetime.utcnow, nullable=False)
    scheduled_for = Column("scheduledFor", DateTime, nullable=False)
    processed_at = Column("processedAt", DateTime, nullable=True)


# ─── Gamification & Badges ────────────────────────────────────────────────────

class Badge(Base):
    __tablename__ = "badges"

    id = Column(String(64), primary_key=True, default=generate_id)
    name = Column(String(128), unique=True, nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(64), nullable=False)
    tier = Column(String(32), default="BEGINNER", nullable=False)  # BEGINNER, GROWTH, ADVANCED, SPECIAL
    category = Column(String(64), nullable=False)
    xp_value = Column("xpValue", Integer, default=50, nullable=False)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    sort_order = Column("sortOrder", Integer, default=0, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)

    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column("badgeId", String(64), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    unlocked_at = Column("unlockedAt", DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")


class Streak(Base):
    __tablename__ = "streaks"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_streak = Column("currentStreak", Integer, default=0, nullable=False)
    longest_streak = Column("longestStreak", Integer, default=0, nullable=False)
    last_checkin_date = Column("lastCheckinDate", String(32), nullable=True)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="streak")


class DailyCheckin(Base):
    __tablename__ = "daily_checkins"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(32), nullable=False, index=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class XpTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    source = Column(String(64), nullable=False)  # MISSION, CHALLENGE, STREAK, BADGE, DAILY_CHECKIN, FEAR_LEVEL, SPEECH_SESSION, REFERRAL
    reference_id = Column("referenceId", String(64), nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


# ─── Fear Exposure Hierarchy ──────────────────────────────────────────────────

class FearCategory(Base):
    __tablename__ = "fear_categories"

    id = Column(String(64), primary_key=True, default=generate_id)
    name = Column(String(128), unique=True, nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(64), nullable=False)
    sort_order = Column("sortOrder", Integer, default=0, nullable=False)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)

    levels = relationship("FearLevel", back_populates="category", cascade="all, delete-orphan")


class FearLevel(Base):
    __tablename__ = "fear_levels"

    id = Column(String(64), primary_key=True, default=generate_id)
    category_id = Column("categoryId", String(64), ForeignKey("fear_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    level_number = Column("levelNumber", Integer, nullable=False)
    title = Column(String(128), nullable=False)
    prompt = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    xp_reward = Column("xpReward", Integer, default=50, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)

    category = relationship("FearCategory", back_populates="levels")


class UserFearProgress(Base):
    __tablename__ = "user_fear_progress"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fear_level_id = Column("fearLevelId", String(64), ForeignKey("fear_levels.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at = Column("completedAt", DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    difficulty_rating = Column("difficultyRating", Integer, nullable=True)


# ─── Missions & Challenges ────────────────────────────────────────────────────

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(64), primary_key=True, default=generate_id)
    title = Column(String(128), nullable=False)
    prompt = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(32), default="MEDIUM", nullable=False)  # EASY, MEDIUM, HARD
    xp_reward = Column("xpReward", Integer, default=50, nullable=False)
    sort_order = Column("sortOrder", Integer, default=0, nullable=False)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class UserMission(Base):
    __tablename__ = "user_missions"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mission_id = Column("missionId", String(64), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at = Column("completedAt", DateTime, default=datetime.utcnow, nullable=False)


class DailyMission(Base):
    __tablename__ = "daily_missions"

    id = Column(String(64), primary_key=True, default=generate_id)
    mission_id = Column("missionId", String(64), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(32), unique=True, nullable=False, index=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String(64), primary_key=True, default=generate_id)
    title = Column(String(128), nullable=False)
    prompt = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(32), default="MEDIUM", nullable=False)  # EASY, MEDIUM, HARD
    xp_reward = Column("xpReward", Integer, default=50, nullable=False)
    sort_order = Column("sortOrder", Integer, default=0, nullable=False)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column("challengeId", String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at = Column("completedAt", DateTime, default=datetime.utcnow, nullable=False)


# ─── Speech Sessions & Intelligence ───────────────────────────────────────────

class SpeechSession(Base):
    __tablename__ = "speech_sessions"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript = Column(Text, nullable=False)
    language_detected = Column("languageDetected", String(64), nullable=True)
    word_count = Column("wordCount", Integer, default=0, nullable=False)
    sentence_count = Column("sentenceCount", Integer, default=0, nullable=False)
    filler_count = Column("fillerCount", Integer, default=0, nullable=False)
    vocabulary_richness = Column("vocabularyRichness", Float, default=0.0, nullable=False)
    repetition_score = Column("repetitionScore", Float, default=0.0, nullable=False)
    average_volume = Column("averageVolume", Float, default=0.0, nullable=False)
    pause_frequency = Column("pauseFrequency", Float, default=0.0, nullable=False)
    speech_speed_wpm = Column("speechSpeedWpm", Float, default=0.0, nullable=False)
    fluency_score = Column("fluencyScore", Float, default=0.0, nullable=False)
    topic_relevance_score = Column("topicRelevanceScore", Float, default=0.0, nullable=False)
    overall_confidence_score = Column("overallConfidenceScore", Float, default=0.0, nullable=False)
    duration_seconds = Column("durationSeconds", Integer, default=0, nullable=False)
    xp_earned = Column("xpEarned", Integer, default=0, nullable=False)
    language_mix = Column("languageMix", JSON, nullable=True)
    coaching_feedback = Column("coachingFeedback", JSON, nullable=True)
    personalized_suggestions = Column("personalizedSuggestions", JSON, nullable=True)
    mini_mission = Column("miniMission", String(255), nullable=True)
    analysis_meta = Column("analysisMeta", JSON, nullable=True)
    topic = Column(String(255), nullable=True)
    confidence_components = Column("confidenceComponents", JSON, nullable=True)
    local_metrics = Column("localMetrics", JSON, nullable=True)
    ai_insights = Column("aiInsights", JSON, nullable=True)
    filler_breakdown = Column("fillerBreakdown", JSON, nullable=True)
    mission_id = Column("missionId", String(64), nullable=True)
    challenge_id = Column("challengeId", String(64), nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="speech_sessions")


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column(String(64), nullable=False, index=True)
    topic = Column(String(255), nullable=True)
    mission_id = Column(String(64), nullable=True)
    challenge_id = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False, default="uploaded", index=True)
    status_stage = Column(String(64), nullable=True)
    progress_percent = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    processing_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)
    overall_confidence_score = Column(Float, default=0.0)
    fluency_score = Column(Float, default=0.0)
    topic_relevance_score = Column(Float, default=0.0)
    vocabulary_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    confidence_engine_version = Column(String(16), default="1.0")
    xp_earned = Column(Integer, default=0)
    gamification = Column(JSON, nullable=True)

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
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("PracticeSession", back_populates="audio_file")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String(64), primary_key=True, default=generate_id)
    session_id = Column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=False)
    whisper_language = Column(String(16), default="en")
    whisper_confidence = Column(Float, default=1.0)
    primary_language = Column(String(16), default="en")
    language_label = Column(String(64), default="English")
    is_mixed_language = Column(Boolean, default=False)
    language_distribution = Column(JSON, nullable=True)
    segments = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("PracticeSession", back_populates="transcript")


class SpeechMetric(Base):
    __tablename__ = "speech_metrics"

    id = Column(String(64), primary_key=True, default=generate_id)
    session_id = Column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    word_count = Column(Integer, default=0)
    sentence_count = Column(Integer, default=0)
    unique_word_count = Column(Integer, default=0)
    vocabulary_richness = Column(Float, default=0.0)
    repetition_score = Column(Float, default=0.0)
    repeated_phrases = Column(JSON, nullable=True)
    filler_count = Column(Integer, default=0)
    filler_words = Column(JSON, nullable=True)
    filler_breakdown = Column(JSON, nullable=True)
    filler_density_percent = Column(Float, default=0.0)
    pronunciation_score = Column(Float, default=0.0)
    articulation_score = Column(Float, default=0.0)
    unclear_words = Column(JSON, nullable=True)
    speech_speed_wpm = Column(Float, default=0.0)
    active_speaking_seconds = Column(Float, default=0.0)
    average_volume_db = Column(Float, default=0.0)
    volume_stability_score = Column(Float, default=0.0)
    pause_count = Column(Integer, default=0)
    pause_frequency = Column(Float, default=0.0)
    average_pause_duration_ms = Column(Float, default=0.0)
    pause_ratio = Column(Float, default=0.0)
    natural_pauses_count = Column(Integer, default=0)
    thinking_pauses_count = Column(Integer, default=0)
    lost_pauses_count = Column(Integer, default=0)
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
    provider = Column(String(32), default="ollama")
    model = Column(String(64), default="llama3.2:3b")
    topic_relevance = Column(Float, default=0.0)
    topic_coverage_percent = Column(Float, default=0.0)
    missing_points = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    coaching_feedback = Column(JSON, nullable=True)
    personalized_suggestions = Column(JSON, nullable=True)
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


# ─── System & Admin Modules ───────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(32), default="SYSTEM", nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    reference_id = Column("referenceId", String(64), nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False, index=True)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(64), primary_key=True, default=generate_id)
    title = Column(String(128), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(32), default="INFO", nullable=False)  # INFO, WARNING, UPDATE
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(32), default="OPEN", nullable=False)  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    response = Column(Text, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    page = Column(String(64), nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class ActivityTimeline(Base):
    __tablename__ = "activity_timeline"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column("eventType", String(64), nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False, index=True)


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String(64), primary_key=True, default=generate_id)
    referrer_id = Column("referrerId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    referee_id = Column("refereeId", String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(64), nullable=False)
    status = Column(String(32), default="COMPLETED", nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class AppVersion(Base):
    __tablename__ = "app_versions"

    id = Column(String(64), primary_key=True, default=generate_id)
    platform = Column(String(16), nullable=False)  # IOS, ANDROID
    version = Column(String(32), nullable=False)
    build_number = Column("buildNumber", Integer, nullable=False)
    min_version = Column("minVersion", String(32), nullable=False)
    force_update = Column("forceUpdate", Boolean, default=False, nullable=False)
    release_notes = Column("releaseNotes", Text, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, default=generate_id)
    user_id = Column("userId", String(64), nullable=True, index=True)
    action = Column(String(64), nullable=False)
    entity_type = Column("entityType", String(64), nullable=False)
    entity_id = Column("entityId", String(64), nullable=True)
    old_data = Column("oldData", JSON, nullable=True)
    new_data = Column("newData", JSON, nullable=True)
    ip_address = Column("ipAddress", String(64), nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False, index=True)
