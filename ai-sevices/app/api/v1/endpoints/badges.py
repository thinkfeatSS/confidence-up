from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.db.models import Badge, UserBadge
from app.core.security import get_current_user, AuthUser
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/badges", tags=["Badges"])


class BadgeUpsertDto(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    tier: Optional[str] = "BEGINNER"
    category: Optional[str] = "milestones"
    xpReward: Optional[int] = None
    xpValue: Optional[int] = None
    criteria: Optional[Any] = None
    isActive: Optional[bool] = True
    sortOrder: Optional[int] = 0


def serialize_badge(b: Badge, unlocked_at: str = None) -> Dict[str, Any]:
    return {
        "id": b.id,
        "name": b.name,
        "description": b.description,
        "icon": b.icon,
        "tier": b.tier,
        "category": b.category,
        "xpValue": b.xp_value,
        "xpReward": b.xp_value,
        "isUnlocked": unlocked_at is not None,
        "unlockedAt": unlocked_at,
        "isActive": b.is_active,
    }


def serialize_admin_badge(b: Badge) -> Dict[str, Any]:
    return {
        "id": b.id,
        "name": b.name,
        "description": b.description,
        "icon": b.icon,
        "tier": b.tier,
        "category": b.category,
        "xpReward": b.xp_value,
        "xpValue": b.xp_value,
        "isActive": b.is_active,
        "sortOrder": b.sort_order,
        "criteria": {"type": "challenges_completed", "value": 1},
        "createdAt": b.created_at.isoformat() if b.created_at else "",
    }


@router.get("")
async def list_all_badges(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get all active badges
    b_res = await db.execute(select(Badge).where(Badge.is_active == True).order_by(Badge.sort_order))
    badges = b_res.scalars().all()

    # Get user unlocked badge map
    ub_res = await db.execute(select(UserBadge).where(UserBadge.user_id == current_user.id))
    user_badges = ub_res.scalars().all()
    unlocked_map = {ub.badge_id: ub.unlocked_at.isoformat() for ub in user_badges}

    data = [serialize_badge(b, unlocked_map.get(b.id)) for b in badges]
    return {"success": True, "data": data}


@router.get("/me")
async def get_my_badges(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Badge, UserBadge.unlocked_at)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.unlocked_at.desc())
    )
    res = await db.execute(stmt)
    records = res.all()

    data = [serialize_badge(b, unlocked_at.isoformat()) for b, unlocked_at in records]
    return {"success": True, "data": data}


@router.get("/admin/all")
async def list_badges_admin(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    b_res = await db.execute(select(Badge).order_by(Badge.sort_order, Badge.created_at))
    badges = b_res.scalars().all()
    items = [serialize_admin_badge(b) for b in badges]
    return {
        "success": True,
        "data": items,
        "items": items,
    }


@router.post("")
async def create_badge(
    dto: BadgeUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    xp = dto.xpReward if dto.xpReward is not None else (dto.xpValue or 50)
    badge = Badge(
        name=dto.name,
        description=dto.description or "",
        icon=dto.icon or "🏆",
        tier=dto.tier or "BEGINNER",
        category=dto.category or "milestones",
        xp_value=xp,
        is_active=dto.isActive if dto.isActive is not None else True,
        sort_order=dto.sortOrder or 0,
    )
    db.add(badge)
    await db.commit()
    await db.refresh(badge)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="BADGE_CREATE",
        entity_type="BADGE",
        entity_id=badge.id,
        new_data=serialize_admin_badge(badge),
    )

    return {"success": True, "data": serialize_admin_badge(badge)}


@router.patch("/{badge_id}")
async def update_badge(
    badge_id: str,
    dto: BadgeUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    b_res = await db.execute(select(Badge).where(Badge.id == badge_id))
    badge = b_res.scalar_one_or_none()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found.")

    if dto.name is not None:
        badge.name = dto.name
    if dto.description is not None:
        badge.description = dto.description
    if dto.icon is not None:
        badge.icon = dto.icon
    if dto.tier is not None:
        badge.tier = dto.tier
    if dto.category is not None:
        badge.category = dto.category
    if dto.xpReward is not None:
        badge.xp_value = dto.xpReward
    elif dto.xpValue is not None:
        badge.xp_value = dto.xpValue
    if dto.isActive is not None:
        badge.is_active = dto.isActive
    if dto.sortOrder is not None:
        badge.sort_order = dto.sortOrder

    await db.commit()
    await db.refresh(badge)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="BADGE_UPDATE",
        entity_type="BADGE",
        entity_id=badge.id,
        new_data=serialize_admin_badge(badge),
    )

    return {"success": True, "data": serialize_admin_badge(badge)}


@router.delete("/{badge_id}")
async def delete_badge(
    badge_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    b_res = await db.execute(select(Badge).where(Badge.id == badge_id))
    badge = b_res.scalar_one_or_none()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found.")

    await db.delete(badge)
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="BADGE_DELETE",
        entity_type="BADGE",
        entity_id=badge_id,
    )

    return {"success": True, "message": "Badge deleted successfully."}
