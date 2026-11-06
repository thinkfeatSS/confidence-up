from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import FearCategory, FearLevel, UserFearProgress
from app.core.security import get_current_user, AuthUser
from app.services.gamification_service import award_xp

router = APIRouter(prefix="/fears", tags=["Fears Hierarchy"])


class CompleteFearLevelDto(BaseModel):
    notes: Optional[str] = None
    difficultyRating: Optional[int] = 3


@router.get("")
async def list_fear_categories(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(FearCategory)
        .where(FearCategory.is_active == True)
        .options(selectinload(FearCategory.levels))
        .order_by(FearCategory.sort_order)
    )
    categories = (await db.execute(stmt)).scalars().all()

    # Get user completed levels
    ufp_stmt = select(UserFearProgress).where(UserFearProgress.user_id == current_user.id)
    progress_records = (await db.execute(ufp_stmt)).scalars().all()
    completed_map = {p.fear_level_id: p for p in progress_records}

    data = []
    for cat in categories:
        cat_levels = sorted(cat.levels, key=lambda l: l.level_number)
        levels_data = []
        for lvl in cat_levels:
            prog = completed_map.get(lvl.id)
            levels_data.append({
                "id": lvl.id,
                "levelNumber": lvl.level_number,
                "title": lvl.title,
                "prompt": lvl.prompt,
                "description": lvl.description,
                "xpReward": lvl.xp_reward,
                "isCompleted": prog is not None,
                "completedAt": prog.completed_at.isoformat() if prog else None,
            })

        data.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "icon": cat.icon,
            "sortOrder": cat.sort_order,
            "levels": levels_data,
        })

    return {"success": True, "data": data}


@router.get("/me")
async def get_my_fear_progress(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(UserFearProgress, FearLevel)
        .join(FearLevel, FearLevel.id == UserFearProgress.fear_level_id)
        .where(UserFearProgress.user_id == current_user.id)
        .order_by(UserFearProgress.completed_at.desc())
    )
    records = (await db.execute(stmt)).all()

    data = [
        {
            "id": prog.id,
            "fearLevelId": prog.fear_level_id,
            "levelTitle": lvl.title,
            "levelNumber": lvl.level_number,
            "completedAt": prog.completed_at.isoformat(),
            "notes": prog.notes,
            "difficultyRating": prog.difficulty_rating,
        }
        for prog, lvl in records
    ]
    return {"success": True, "data": data}


@router.post("/me/{fear_level_id}/complete")
async def complete_fear_level(
    fear_level_id: str,
    dto: Optional[CompleteFearLevelDto] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lvl_stmt = select(FearLevel).where(FearLevel.id == fear_level_id)
    lvl = (await db.execute(lvl_stmt)).scalar_one_or_none()
    if not lvl:
        raise HTTPException(status_code=404, detail="Fear level not found.")

    ufp_stmt = select(UserFearProgress).where(
        and_(UserFearProgress.user_id == current_user.id, UserFearProgress.fear_level_id == fear_level_id)
    )
    existing = (await db.execute(ufp_stmt)).scalar_one_or_none()

    if existing:
        return {"success": True, "message": "Fear level already completed.", "xpAwarded": 0}

    now = datetime.utcnow()
    progress_rec = UserFearProgress(
        user_id=current_user.id,
        fear_level_id=fear_level_id,
        completed_at=now,
        notes=dto.notes if dto else None,
        difficulty_rating=dto.difficultyRating if dto else 3,
    )
    db.add(progress_rec)

    xp_res = await award_xp(db, current_user.id, lvl.xp_reward, "FEAR_LEVEL", fear_level_id)

    return {
        "success": True,
        "message": "Fear exposure step completed!",
        "xpAwarded": lvl.xp_reward,
        "gamification": xp_res,
    }
