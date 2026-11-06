from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.db.models import Badge, UserBadge
from app.core.security import get_current_user, AuthUser

router = APIRouter(prefix="/badges", tags=["Badges"])


def serialize_badge(b: Badge, unlocked_at: str = None) -> Dict[str, Any]:
    return {
        "id": b.id,
        "name": b.name,
        "description": b.description,
        "icon": b.icon,
        "tier": b.tier,
        "category": b.category,
        "xpValue": b.xp_value,
        "isUnlocked": unlocked_at is not None,
        "unlockedAt": unlocked_at,
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
