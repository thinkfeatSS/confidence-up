from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.db.session import get_db
from app.db.models import Mission, UserMission, DailyMission
from app.core.security import get_current_user, AuthUser
from app.services.gamification_service import award_xp
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/missions", tags=["Missions"])


class MissionUpsertDto(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prompt: Optional[str] = None
    category: Optional[str] = "speaking"
    difficulty: Optional[str] = "MEDIUM"
    xpReward: Optional[int] = 50
    estimatedMinutes: Optional[int] = 3
    tips: Optional[List[str]] = None
    isActive: Optional[bool] = True
    sortOrder: Optional[int] = 0


class DailyMissionDto(BaseModel):
    date: str
    missionId: str


def serialize_mission(m: Mission, completed_at: Optional[datetime] = None) -> Dict[str, Any]:
    return {
        "id": m.id,
        "title": m.title,
        "prompt": m.prompt,
        "description": m.description,
        "difficulty": m.difficulty,
        "xpReward": m.xp_reward,
        "category": "speaking",
        "estimatedMinutes": 3,
        "tips": ["Stand up while speaking", "Record yourself"],
        "isCompleted": completed_at is not None,
        "completedAt": completed_at.isoformat() if completed_at else None,
        "isActive": m.is_active,
    }


def serialize_admin_mission(m: Mission) -> Dict[str, Any]:
    return {
        "id": m.id,
        "title": m.title,
        "description": m.description,
        "prompt": m.prompt,
        "category": "speaking",
        "difficulty": m.difficulty,
        "xpReward": m.xp_reward,
        "estimatedMinutes": 3,
        "tips": ["Stand up while speaking", "Record yourself"],
        "isActive": m.is_active,
        "sortOrder": m.sort_order,
        "createdAt": m.created_at.isoformat() if m.created_at else "",
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


# ─── Administrative Management Routes ──────────────────────────────────────────

@router.get("/admin/all")
async def list_missions_admin(
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    query = select(Mission)
    if search:
        query = query.where(Mission.title.ilike(f"%{search}%") | Mission.description.ilike(f"%{search}%"))
    if difficulty:
        query = query.where(Mission.difficulty == difficulty.upper())

    query = query.order_by(Mission.sort_order, Mission.created_at).limit(limit)
    res = await db.execute(query)
    missions = res.scalars().all()
    items = [serialize_admin_mission(m) for m in missions]

    return {
        "success": True,
        "data": items,
        "items": items,
    }


@router.post("")
async def create_mission(
    dto: MissionUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    mission = Mission(
        title=dto.title,
        prompt=dto.prompt or dto.title,
        description=dto.description or "",
        difficulty=(dto.difficulty or "MEDIUM").upper(),
        xp_reward=dto.xpReward or 50,
        sort_order=dto.sortOrder or 0,
        is_active=dto.isActive if dto.isActive is not None else True,
    )
    db.add(mission)
    await db.commit()
    await db.refresh(mission)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="MISSION_CREATE",
        entity_type="MISSION",
        entity_id=mission.id,
        new_data=serialize_admin_mission(mission),
    )

    return {"success": True, "data": serialize_admin_mission(mission)}


@router.patch("/{mission_id}")
async def update_mission(
    mission_id: str,
    dto: MissionUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(Mission).where(Mission.id == mission_id)
    mission = (await db.execute(stmt)).scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    if dto.title is not None:
        mission.title = dto.title
    if dto.description is not None:
        mission.description = dto.description
    if dto.prompt is not None:
        mission.prompt = dto.prompt
    if dto.difficulty is not None:
        mission.difficulty = dto.difficulty.upper()
    if dto.xpReward is not None:
        mission.xp_reward = dto.xpReward
    if dto.sortOrder is not None:
        mission.sort_order = dto.sortOrder
    if dto.isActive is not None:
        mission.is_active = dto.isActive

    await db.commit()
    await db.refresh(mission)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="MISSION_UPDATE",
        entity_type="MISSION",
        entity_id=mission.id,
        new_data=serialize_admin_mission(mission),
    )

    return {"success": True, "data": serialize_admin_mission(mission)}


@router.delete("/{mission_id}")
async def delete_mission(
    mission_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(Mission).where(Mission.id == mission_id)
    mission = (await db.execute(stmt)).scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    await db.delete(mission)
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="MISSION_DELETE",
        entity_type="MISSION",
        entity_id=mission_id,
    )

    return {"success": True, "message": "Mission deleted successfully."}


@router.post("/daily")
async def assign_daily_mission(
    dto: DailyMissionDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    # Check mission exists
    stmt_m = select(Mission).where(Mission.id == dto.missionId)
    mission = (await db.execute(stmt_m)).scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")

    # Check if entry exists for this date
    stmt_dm = select(DailyMission).where(DailyMission.date == dto.date)
    dm = (await db.execute(stmt_dm)).scalar_one_or_none()

    if dm:
        dm.mission_id = dto.missionId
    else:
        dm = DailyMission(mission_id=dto.missionId, date=dto.date)
        db.add(dm)

    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="DAILY_MISSION_SET",
        entity_type="DAILY_MISSION",
        entity_id=dto.missionId,
        new_data={"date": dto.date, "missionId": dto.missionId},
    )

    return {"success": True, "message": f"Daily mission set for {dto.date}"}
