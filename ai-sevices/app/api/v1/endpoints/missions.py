from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.db.models import Mission, UserMission, DailyMission
from app.core.security import get_current_user, AuthUser
from app.services.gamification_service import award_xp

router = APIRouter(prefix="/missions", tags=["Missions"])


def serialize_mission(m: Mission, completed_at: Optional[datetime] = None) -> Dict[str, Any]:
    return {
        "id": m.id,
        "title": m.title,
        "prompt": m.prompt,
        "description": m.description,
        "difficulty": m.difficulty,
        "xpReward": m.xp_reward,
        "isCompleted": completed_at is not None,
        "completedAt": completed_at.isoformat() if completed_at else None,
    }


@router.get("")
async def list_missions(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Load all active missions
    m_stmt = select(Mission).where(Mission.is_active == True).order_by(Mission.sort_order)
    missions = (await db.execute(m_stmt)).scalars().all()

    # Load completed missions for user
    um_stmt = select(UserMission).where(UserMission.user_id == current_user.id)
    user_missions = (await db.execute(um_stmt)).scalars().all()
    completed_map = {um.mission_id: um.completed_at for um in user_missions}

    data = [serialize_mission(m, completed_map.get(m.id)) for m in missions]
    return {"success": True, "data": data}


@router.get("/today")
async def get_today_mission(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # Look for daily mission assigned for today
    dm_stmt = select(DailyMission).where(DailyMission.date == today_str)
    dm = (await db.execute(dm_stmt)).scalar_one_or_none()

    if dm:
        mission_stmt = select(Mission).where(Mission.id == dm.mission_id)
        mission = (await db.execute(mission_stmt)).scalar_one_or_none()
    else:
        # Fallback to the first active mission
        mission_stmt = select(Mission).where(Mission.is_active == True).order_by(Mission.sort_order).limit(1)
        mission = (await db.execute(mission_stmt)).scalar_one_or_none()

    if not mission:
        # Default placeholder if database empty
        return {
            "success": True,
            "data": {
                "id": "mission-default-1",
                "title": "Introduce Yourself Confidently",
                "prompt": "Tell us who you are, what you love, and what your main goal is in 60 seconds.",
                "description": "State your name and main passion with conviction.",
                "difficulty": "EASY",
                "xpReward": 50,
                "isCompleted": False,
            },
        }

    # Check if user completed it
    um_stmt = select(UserMission).where(
        and_(UserMission.user_id == current_user.id, UserMission.mission_id == mission.id)
    )
    um = (await db.execute(um_stmt)).scalar_one_or_none()

    return {"success": True, "data": serialize_mission(mission, um.completed_at if um else None)}


@router.post("/{mission_id}/complete")
async def complete_mission(
    mission_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    m_stmt = select(Mission).where(Mission.id == mission_id)
    mission = (await db.execute(m_stmt)).scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    # Check if already completed
    um_stmt = select(UserMission).where(
        and_(UserMission.user_id == current_user.id, UserMission.mission_id == mission_id)
    )
    existing = (await db.execute(um_stmt)).scalar_one_or_none()

    if existing:
        return {"success": True, "message": "Mission already completed", "xpAwarded": 0}

    now = datetime.utcnow()
    db.add(UserMission(user_id=current_user.id, mission_id=mission_id, completed_at=now))

    # Award XP
    xp_res = await award_xp(db, current_user.id, mission.xp_reward, "MISSION", mission_id)

    return {
        "success": True,
        "message": "Mission completed!",
        "xpAwarded": mission.xp_reward,
        "gamification": xp_res,
    }
