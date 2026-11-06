from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import FearCategory, FearLevel, UserFearProgress
from app.core.security import get_current_user, AuthUser
from app.services.gamification_service import award_xp
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/fears", tags=["Fears Hierarchy"])

COLOR_PALETTE = {
    "Public Speaking": "#06B6D4",
    "Job Interviews": "#A855F7",
    "English Speaking Fluency": "#10B981",
    "Social & Networking Confidence": "#F59E0B",
}


class CompleteFearLevelDto(BaseModel):
    notes: Optional[str] = None
    difficultyRating: Optional[int] = 3


class FearCategoryDto(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = "#06B6D4"
    sortOrder: Optional[int] = 0


def serialize_fear_category_admin(cat: FearCategory) -> Dict[str, Any]:
    levels_data = [
        {
            "id": lvl.id,
            "levelNumber": lvl.level_number,
            "title": lvl.title,
            "prompt": lvl.prompt,
            "description": lvl.description,
            "xpReward": lvl.xp_reward,
        }
        for lvl in sorted(cat.levels, key=lambda l: l.level_number)
    ]
    color = COLOR_PALETTE.get(cat.name, "#06B6D4")
    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "icon": cat.icon,
        "color": color,
        "sortOrder": cat.sort_order,
        "isActive": cat.is_active,
        "levels": levels_data,
        "fearLevels": levels_data,
    }


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
            "color": COLOR_PALETTE.get(cat.name, "#06B6D4"),
            "levels": levels_data,
            "fearLevels": levels_data,
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


# ─── Administrative Management Routes ──────────────────────────────────────────

@router.get("/admin/all")
async def list_fear_categories_admin(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = (
        select(FearCategory)
        .options(selectinload(FearCategory.levels))
        .order_by(FearCategory.sort_order, FearCategory.created_at)
    )
    categories = (await db.execute(stmt)).scalars().all()
    items = [serialize_fear_category_admin(cat) for cat in categories]

    return {
        "success": True,
        "data": items,
        "items": items,
    }


@router.post("")
async def create_fear_category(
    dto: FearCategoryDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    cat = FearCategory(
        name=dto.name,
        description=dto.description or "",
        icon=dto.icon or "🎯",
        sort_order=dto.sortOrder or 0,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)

    # Initialize with default 5-step exposure levels
    default_levels = [
        (1, f"{cat.name} Beginner", f"Introductory exposure step for {cat.name}", 25),
        (2, f"{cat.name} Intermediate", f"Intermediate exposure step for {cat.name}", 40),
        (3, f"{cat.name} Advanced", f"Target exposure step for {cat.name}", 60),
        (4, f"{cat.name} Mastery", f"High confidence challenge for {cat.name}", 80),
        (5, f"{cat.name} Peak Fluency", f"Peak fluency demonstration for {cat.name}", 100),
    ]
    for num, title, desc, xp in default_levels:
        db.add(FearLevel(
            category_id=cat.id,
            level_number=num,
            title=title,
            prompt=f"Practice {title}",
            description=desc,
            xp_reward=xp,
        ))
    await db.commit()

    # Re-fetch with levels
    stmt = select(FearCategory).where(FearCategory.id == cat.id).options(selectinload(FearCategory.levels))
    fresh = (await db.execute(stmt)).scalar_one()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="FEAR_CATEGORY_CREATE",
        entity_type="FEAR_CATEGORY",
        entity_id=cat.id,
        new_data=serialize_fear_category_admin(fresh),
    )

    return {"success": True, "data": serialize_fear_category_admin(fresh)}


@router.patch("/{category_id}")
async def update_fear_category(
    category_id: str,
    dto: FearCategoryDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(FearCategory).where(FearCategory.id == category_id).options(selectinload(FearCategory.levels))
    cat = (await db.execute(stmt)).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Fear category not found.")

    if dto.name is not None:
        cat.name = dto.name
    if dto.description is not None:
        cat.description = dto.description
    if dto.icon is not None:
        cat.icon = dto.icon
    if dto.sortOrder is not None:
        cat.sort_order = dto.sortOrder

    await db.commit()
    await db.refresh(cat)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="FEAR_CATEGORY_UPDATE",
        entity_type="FEAR_CATEGORY",
        entity_id=cat.id,
        new_data=serialize_fear_category_admin(cat),
    )

    return {"success": True, "data": serialize_fear_category_admin(cat)}


@router.delete("/{category_id}")
async def delete_fear_category(
    category_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(FearCategory).where(FearCategory.id == category_id)
    cat = (await db.execute(stmt)).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Fear category not found.")

    await db.delete(cat)
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="FEAR_CATEGORY_DELETE",
        entity_type="FEAR_CATEGORY",
        entity_id=category_id,
    )

    return {"success": True, "message": "Fear category deleted successfully."}
