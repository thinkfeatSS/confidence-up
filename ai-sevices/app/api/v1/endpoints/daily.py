from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.db.models import User, Mission, Challenge, DailyMission, UserMission, UserChallenge, Streak
from app.core.security import get_current_user, AuthUser

router = APIRouter(prefix="/daily", tags=["Daily Hub"])

DAILY_TIPS = [
    "Pause for 2 seconds before answering to project calm authority.",
    "Breathe deeply from your diaphragm to stabilize your vocal pitch.",
    "Replace 'I think maybe' with 'In my view' to project conviction.",
    "Make eye contact with one person at a time for at least 3 seconds.",
    "A structured answer has 3 parts: Point, Reason, Example.",
    "Slow down your speaking speed when sharing your most important point.",
    "Embrace the silence — confident speakers never rush to fill pauses.",
]


@router.get("/hub")
async def get_daily_hub(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # User
    u_res = await db.execute(select(User).where(User.id == current_user.id))
    user = u_res.scalar_one_or_none()

    # Streak
    s_res = await db.execute(select(Streak).where(Streak.user_id == current_user.id))
    streak = s_res.scalar_one_or_none()

    # Daily Mission
    dm_stmt = select(DailyMission).where(DailyMission.date == today_str)
    dm = (await db.execute(dm_stmt)).scalar_one_or_none()

    if dm:
        m_stmt = select(Mission).where(Mission.id == dm.mission_id)
        mission = (await db.execute(m_stmt)).scalar_one_or_none()
    else:
        m_stmt = select(Mission).where(Mission.is_active == True).order_by(Mission.sort_order).limit(1)
        mission = (await db.execute(m_stmt)).scalar_one_or_none()

    mission_completed = False
    if mission and user:
        um_stmt = select(UserMission).where(
            and_(UserMission.user_id == user.id, UserMission.mission_id == mission.id)
        )
        um = (await db.execute(um_stmt)).scalar_one_or_none()
        mission_completed = um is not None

    # Challenge
    c_stmt = select(Challenge).where(Challenge.is_active == True).order_by(Challenge.sort_order).limit(1)
    challenge = (await db.execute(c_stmt)).scalar_one_or_none()

    challenge_completed = False
    if challenge and user:
        uc_stmt = select(UserChallenge).where(
            and_(UserChallenge.user_id == user.id, UserChallenge.challenge_id == challenge.id)
        )
        uc = (await db.execute(uc_stmt)).scalar_one_or_none()
        challenge_completed = uc is not None

    # Pick tip based on day of year
    day_of_year = datetime.utcnow().timetuple().tm_yday
    tip = DAILY_TIPS[day_of_year % len(DAILY_TIPS)]

    mission_dict = None
    if mission:
        mission_dict = {
            "id": mission.id,
            "title": mission.title,
            "prompt": mission.prompt,
            "description": mission.description,
            "difficulty": mission.difficulty,
            "xpReward": mission.xp_reward,
            "isCompleted": mission_completed,
        }

    challenge_dict = None
    if challenge:
        challenge_dict = {
            "id": challenge.id,
            "title": challenge.title,
            "prompt": challenge.prompt,
            "description": challenge.description,
            "difficulty": challenge.difficulty,
            "xpReward": challenge.xp_reward,
            "userStatus": {
                "completed": challenge_completed,
            },
        }

    return {
        "success": True,
        "data": {
            "date": today_str,
            "tip": tip,
            "streak": streak.current_streak if streak else 0,
            "longestStreak": streak.longest_streak if streak else 0,
            "xpTotal": user.xp_total if user else 0,
            "level": user.level if user else 1,
            "mission": mission_dict,
            "missionCompleted": mission_completed,
            "challenge": challenge_dict,
            "stats": {
                "missionsCompletedToday": 1 if mission_completed else 0,
                "dailyGoalMet": mission_completed,
            },
        },
    }
