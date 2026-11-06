from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import Notification

router = APIRouter()


@router.get("/notifications")
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    skip = (page - 1) * limit
    userId = current_user.id

    total_res = await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == userId)
    )
    total = total_res.scalar() or 0

    unread_res = await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == userId, Notification.read.is_(False))
    )
    unread_count = unread_res.scalar() or 0

    stmt = (
        select(Notification)
        .where(Notification.user_id == userId)
        .order_by(desc(Notification.created_at))
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    notifications = res.scalars().all()

    items = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "read": n.read,
            "referenceId": n.reference_id,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "unreadCount": unread_count,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }


@router.post("/notifications/read-all")
async def mark_all_read(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    userId = current_user.id
    stmt = (
        update(Notification)
        .where(Notification.user_id == userId, Notification.read.is_(False))
        .values(read=True)
    )
    await db.execute(stmt)
    await db.commit()

    return {
        "success": True,
        "message": "All notifications marked as read."
    }


@router.post("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    userId = current_user.id
    stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == userId)
    res = await db.execute(stmt)
    n = res.scalar_one_or_none()

    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    n.read = True
    await db.commit()

    return {
        "success": True,
        "message": "Notification marked as read."
    }
