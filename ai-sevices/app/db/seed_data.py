import asyncio
import uuid
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import engine, AsyncSessionLocal
from app.db.models import (
    Base,
    User,
    Streak,
    UserSettings,
    Badge,
    FearCategory,
    FearLevel,
    Mission,
    Challenge,
    SpeechSession,
    ActivityTimeline,
    TermsAcceptance,
)


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def seed():
    print("🌱 Initializing Truefluent AI Database & Schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Badges
        print(" Seeding Badges...")
        badges_data = [
            # Beginner
            {"name": "First Step", "description": "Complete your very first challenge", "icon": "🌱", "tier": "BEGINNER", "category": "milestones", "xp_value": 25},
            {"name": "First Speech", "description": "Record your first practice speech", "icon": "🎤", "tier": "BEGINNER", "category": "speaking", "xp_value": 30},
            {"name": "Streak Starter", "description": "Complete challenges 3 days in a row", "icon": "🔥", "tier": "BEGINNER", "category": "streak", "xp_value": 40},
            {"name": "Fear Facer", "description": "Complete your first fear exposure level", "icon": "😤", "tier": "BEGINNER", "category": "fear", "xp_value": 35},
            {"name": "Daily Warrior", "description": "Complete your first daily mission", "icon": "☀️", "tier": "BEGINNER", "category": "missions", "xp_value": 30},
            # Growth
            {"name": "Week Warrior", "description": "Maintain a 7-day streak", "icon": "⚔️", "tier": "GROWTH", "category": "streak", "xp_value": 75},
            {"name": "Speech Collector", "description": "Complete 10 speech sessions", "icon": "📊", "tier": "GROWTH", "category": "speaking", "xp_value": 80},
            {"name": "Challenge Crusher", "description": "Complete 20 challenges", "icon": "💪", "tier": "GROWTH", "category": "challenges", "xp_value": 100},
            {"name": "Social Butterfly", "description": "Complete 5 social challenges", "icon": "🦋", "tier": "GROWTH", "category": "social", "xp_value": 70},
            {"name": "Score Riser", "description": "Reach a confidence score of 70+", "icon": "📈", "tier": "GROWTH", "category": "confidence", "xp_value": 85},
            {"name": "XP Hunter", "description": "Earn 500 total XP", "icon": "⭐", "tier": "GROWTH", "category": "xp", "xp_value": 50},
            # Advanced
            {"name": "No Filler Master", "description": "Complete a speech with 0 filler words", "icon": "🏆", "tier": "ADVANCED", "category": "speaking", "xp_value": 120},
            {"name": "30-Day Streak", "description": "Maintain a streak for 30 consecutive days", "icon": "🌋", "tier": "ADVANCED", "category": "streak", "xp_value": 200},
            {"name": "Confidence Booster", "description": "Reach a confidence score of 90+", "icon": "🚀", "tier": "ADVANCED", "category": "confidence", "xp_value": 150},
            {"name": "Top Communicator", "description": "Complete 50 challenges total", "icon": "👑", "tier": "ADVANCED", "category": "challenges", "xp_value": 180},
        ]

        for b in badges_data:
            existing = await db.execute(select(Badge).where(Badge.name == b["name"]))
            if not existing.scalar_one_or_none():
                db.add(Badge(**b))

        # 2. Seed Fear Categories & Levels
        print(" Seeding Fear Categories & Exposure Levels...")
        categories_data = [
            {
                "name": "Public Speaking",
                "description": "Gradually face the fear of speaking in front of others.",
                "icon": "🎤",
                "levels": [
                    {"level": 1, "title": "Speak Alone", "prompt": "Speak for 2 minutes on any topic alone in your room.", "xp": 30},
                    {"level": 2, "title": "Speak to a Friend", "prompt": "Have a 5-minute conversation with a close friend.", "xp": 40},
                    {"level": 3, "title": "Small Group of 3", "prompt": "Share a 2-minute story with 3 people.", "xp": 55},
                    {"level": 4, "title": "Record Video", "prompt": "Record a 2-minute video on your phone speaking on any topic.", "xp": 70},
                    {"level": 5, "title": "Present to Class", "prompt": "Give a 3-minute presentation to a small audience.", "xp": 100},
                ]
            },
            {
                "name": "Job Interviews",
                "description": "Build high-impact interview delivery step by step.",
                "icon": "💼",
                "levels": [
                    {"level": 1, "title": "Self-Interview Alone", "prompt": "Answer common interview questions out loud.", "xp": 30},
                    {"level": 2, "title": "STAR Method Practice", "prompt": "Explain a past challenge using Situation, Task, Action, Result.", "xp": 45},
                    {"level": 3, "title": "Mock Interview", "prompt": "Do a 10-minute mock interview with a peer.", "xp": 60},
                    {"level": 4, "title": "Video Mock Interview", "prompt": "Record a full video answering 5 tough questions.", "xp": 80},
                    {"level": 5, "title": "Executive Pitch", "prompt": "Deliver a concise 2-minute elevator pitch to a hiring manager.", "xp": 100},
                ]
            },
            {
                "name": "English Speaking Fluency",
                "description": "Grow fluency and comfort in professional English.",
                "icon": "🗣️",
                "levels": [
                    {"level": 1, "title": "Think in English 10 Min", "prompt": "Mentally narrate your actions in English for 10 minutes.", "xp": 25},
                    {"level": 2, "title": "Daily Self-Talk", "prompt": "Have a 5-minute self-talk session about your day in English.", "xp": 35},
                    {"level": 3, "title": "Summarize an Article", "prompt": "Read an article and summarize its main points verbally.", "xp": 50},
                    {"level": 4, "title": "Partner Conversation", "prompt": "Hold a 10-minute English-only conversation.", "xp": 70},
                    {"level": 5, "title": "Live Discussion", "prompt": "Actively participate in an English discussion or meeting.", "xp": 100},
                ]
            },
            {
                "name": "Social & Networking Confidence",
                "description": "Overcome social hesitation and communicate naturally.",
                "icon": "🤝",
                "levels": [
                    {"level": 1, "title": "Eye Contact & Warm Greeting", "prompt": "Greet 5 people warmly with eye contact.", "xp": 25},
                    {"level": 2, "title": "Small Talk Starter", "prompt": "Start a 1-minute casual conversation with an acquaintance.", "xp": 40},
                    {"level": 3, "title": "Group Contribution", "prompt": "Share a distinct opinion during a group conversation.", "xp": 60},
                    {"level": 4, "title": "Storytelling", "prompt": "Tell an engaging 2-minute personal anecdote.", "xp": 75},
                    {"level": 5, "title": "Host Conversation", "prompt": "Lead an engaging discussion with 3 or more people.", "xp": 100},
                ]
            }
        ]

        for cat_info in categories_data:
            existing_cat = await db.execute(select(FearCategory).where(FearCategory.name == cat_info["name"]))
            category = existing_cat.scalar_one_or_none()
            if not category:
                category = FearCategory(
                    name=cat_info["name"],
                    description=cat_info["description"],
                    icon=cat_info["icon"],
                )
                db.add(category)
                await db.flush()

                for l in cat_info["levels"]:
                    level_obj = FearLevel(
                        category_id=category.id,
                        level_number=l["level"],
                        title=l["title"],
                        prompt=l["prompt"],
                        description=f"Level {l['level']} of {cat_info['name']}: {l['title']}",
                        xp_reward=l["xp"]
                    )
                    db.add(level_obj)

        # 3. Seed Missions
        print(" Seeding Missions...")
        missions_data = [
            {"title": "Morning Vocal Warmup", "prompt": "Wake up your vocal cords with a 60-second freestyle speech on what you want to achieve today.", "description": "Record a 60-second freestyle speech to wake up your vocal cords.", "xp_reward": 30, "difficulty": "EASY"},
            {"title": "The 60-Second Pitch", "prompt": "Introduce yourself, what you do, and your biggest aspiration in under 60 seconds.", "description": "Introduce yourself and your biggest aspiration in under a minute.", "xp_reward": 50, "difficulty": "MEDIUM"},
            {"title": "Zero-Filler Challenge", "prompt": "Speak for 90 seconds about your favorite hobby without using 'um', 'uh', or 'like'.", "description": "Speak for 90 seconds about your favorite hobby without using 'um', 'uh', or 'like'.", "xp_reward": 75, "difficulty": "HARD"},
            {"title": "Storytelling Flow", "prompt": "Describe an unforgettable lesson you learned. Use vivid descriptive details and natural pauses.", "description": "Describe an unforgettable lesson you learned. Use vivid descriptive details.", "xp_reward": 60, "difficulty": "MEDIUM"},
        ]

        for m in missions_data:
            existing_m = await db.execute(select(Mission).where(Mission.title == m["title"]))
            if not existing_m.scalar_one_or_none():
                db.add(Mission(**m))

        # 4. Seed Admin & Demo Users
        print(" Seeding Admin & Demo Accounts...")
        users_to_seed = [
            {
                "email": "admin@truefluent.ai",
                "name": "Truefluent Administrator",
                "password": "Admin@Truefluent123!",
                "role": "ADMIN",
                "confidence_score": 92.5,
                "streak": 24,
                "total_xp": 2400,
                "level": 6,
            },
            {
                "email": "admin@binaryunit.tech",
                "name": "Truefluent Admin Tech",
                "password": "Admin@12345",
                "role": "ADMIN",
                "confidence_score": 88.0,
                "streak": 15,
                "total_xp": 1850,
                "level": 5,
            },
            {
                "email": "demo@truefluent.ai",
                "name": "Alex Demo",
                "password": "Demo@Truefluent123!",
                "role": "USER",
                "confidence_score": 78.4,
                "streak": 7,
                "total_xp": 820,
                "level": 3,
            },
            {
                "email": "sarah@truefluent.ai",
                "name": "Sarah Jenkins",
                "password": "Demo@Truefluent123!",
                "role": "USER",
                "confidence_score": 83.2,
                "streak": 12,
                "total_xp": 1420,
                "level": 4,
            },
            {
                "email": "zayd@truefluent.ai",
                "name": "Zayd Malik",
                "password": "Demo@Truefluent123!",
                "role": "USER",
                "confidence_score": 71.0,
                "streak": 4,
                "total_xp": 480,
                "level": 2,
            },
        ]

        for u_data in users_to_seed:
            existing_u = await db.execute(select(User).where(User.email == u_data["email"]))
            user = existing_u.scalar_one_or_none()
            if not user:
                user = User(
                    email=u_data["email"],
                    name=u_data["name"],
                    password_hash=hash_pw(u_data["password"]),
                    role=u_data["role"],
                    is_verified=True,
                    onboarding_completed=True,
                    confidence_score=u_data["confidence_score"],
                    xp_total=u_data["total_xp"],
                    level=u_data["level"],
                    referral_code=f"TF-{uuid.uuid4().hex[:6].upper()}",
                )
                db.add(user)
                await db.flush()

                # Streak
                db.add(Streak(
                    user_id=user.id,
                    current_streak=u_data["streak"],
                    longest_streak=u_data["streak"] + 5,
                    last_checkin_date=datetime.utcnow().strftime("%Y-%m-%d")
                ))

                # Settings
                db.add(UserSettings(
                    user_id=user.id,
                    daily_reminders=True,
                    dark_mode=True,
                    weekly_report=True,
                    email_notifications=True,
                    push_notifications=True,
                    reminder_time="09:00",
                ))

                # Terms
                db.add(TermsAcceptance(user_id=user.id, document_type="TERMS", version="1.0"))
                db.add(TermsAcceptance(user_id=user.id, document_type="PRIVACY", version="1.0"))

                # Seed Sample Speech Sessions for Demo users
                now = datetime.utcnow()
                for i in range(5):
                    s_score = min(95.0, u_data["confidence_score"] - (4 - i) * 3.5)
                    sess = SpeechSession(
                        user_id=user.id,
                        topic="My Career Ambitions and Personal Growth",
                        transcript="Hello everyone, today I want to share my career ambitions and how I plan to achieve personal growth through dedicated daily communication practice.",
                        language_detected="en",
                        word_count=120,
                        sentence_count=8,
                        filler_count=1,
                        vocabulary_richness=0.78,
                        average_volume=-18.5,
                        speech_speed_wpm=135.0,
                        fluency_score=s_score,
                        topic_relevance_score=90.0,
                        overall_confidence_score=s_score,
                        duration_seconds=45,
                        xp_earned=50,
                        created_at=now - timedelta(days=(5 - i) * 2),
                        coaching_feedback=["Clear voice projection", "Pacing was natural"],
                        personalized_suggestions=["Try pausing before key takeaways"],
                    )
                    db.add(sess)

                # Activity Timeline
                db.add(ActivityTimeline(
                    user_id=user.id,
                    event_type="SIGN_UP",
                    title="Account Created",
                    description=f"Welcome to Truefluent AI, {u_data['name']}!"
                ))

        await db.commit()
    print("✅ Database successfully seeded with Truefluent AI master content, badges, and verified users!")


if __name__ == "__main__":
    asyncio.run(seed())
