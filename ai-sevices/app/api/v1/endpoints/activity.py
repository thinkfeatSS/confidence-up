from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import ActivityTimeline

router = APIRouter()


@router.get("/activity/me")
async def get_my_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    skip = (page - 1) * limit
    userId = current_user.id

    total_res = await db.execute(
        select(func.count(ActivityTimeline.id)).where(ActivityTimeline.user_id == userId)
    )
    total = total_res.scalar() or 0

    stmt = (
        select(ActivityTimeline)
        .where(ActivityTimeline.user_id == userId)
        .order_by(desc(ActivityTimeline.created_at))
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    events = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": e.id,
                    "eventType": e.event_type,
                    "title": e.title,
                    "description": e.description,
                    "metadata": e.metadata_json,
                    "createdAt": e.created_at.isoformat() if e.created_at else None,
                }
                for e in events
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }


@router.get("/activity/admin/{user_id}")
async def get_user_activity_admin(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    skip = (page - 1) * limit
    total_res = await db.execute(
        select(func.count(ActivityTimeline.id)).where(ActivityTimeline.user_id == user_id)
    )
    total = total_res.scalar() or 0

    stmt = (
        select(ActivityTimeline)
        .where(ActivityTimeline.user_id == user_id)
        .order_by(desc(ActivityTimeline.created_at))
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    events = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": e.id,
                    "eventType": e.event_type,
                    "title": e.title,
                    "description": e.description,
                    "metadata": e.metadata_json,
                    "createdAt": e.created_at.isoformat() if e.created_at else None,
                }
                for e in events
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }

