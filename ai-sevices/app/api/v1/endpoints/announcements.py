from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import Announcement

router = APIRouter()


class CreateAnnouncementRequest(BaseModel):
    title: str
    content: Optional[str] = None
    body: Optional[str] = None
    type: Optional[str] = "INFO"  # INFO, WARNING, UPDATE
    startsAt: Optional[str] = None
    endsAt: Optional[str] = None
    isActive: Optional[bool] = True


class UpdateAnnouncementRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    body: Optional[str] = None
    type: Optional[str] = None
    startsAt: Optional[str] = None
    endsAt: Optional[str] = None
    isActive: Optional[bool] = None


@router.get("/announcements/active")
async def get_active_announcements(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Announcement)
        .where(Announcement.is_active.is_(True))
        .order_by(desc(Announcement.created_at))
    )
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "title": a.title,
                "content": a.content,
                "type": a.type,
                "isActive": a.is_active,
                "createdAt": a.created_at.isoformat() if a.created_at else None,
            }
            for a in items
        ]
    }


@router.get("/announcements")
async def get_all_announcements(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    skip = (page - 1) * limit
    total_res = await db.execute(select(func.count(Announcement.id)))
    total = total_res.scalar() or 0

    stmt = select(Announcement).order_by(desc(Announcement.created_at)).offset(skip).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": a.id,
                    "title": a.title,
                    "content": a.content,
                    "body": a.content,
                    "type": a.type,
                    "startsAt": a.created_at.isoformat() if a.created_at else None,
                    "endsAt": None,
                    "isActive": a.is_active,
                    "createdAt": a.created_at.isoformat() if a.created_at else None,
                }
                for a in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }


@router.post("/announcements")
async def create_announcement(
    payload: CreateAnnouncementRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    announcement_text = payload.content or payload.body or ""
    announcement = Announcement(
        title=payload.title,
        content=announcement_text,
        type=payload.type or "INFO",
        is_active=payload.isActive if payload.isActive is not None else True,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)

    return {
        "success": True,
        "data": {
            "id": announcement.id,
            "title": announcement.title,
            "content": announcement.content,
            "body": announcement.content,
            "type": announcement.type,
            "startsAt": announcement.created_at.isoformat() if announcement.created_at else None,
            "endsAt": None,
            "isActive": announcement.is_active,
            "createdAt": announcement.created_at.isoformat() if announcement.created_at else None,
        }
    }


@router.patch("/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    payload: UpdateAnnouncementRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    stmt = select(Announcement).where(Announcement.id == announcement_id)
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    if payload.title is not None:
        a.title = payload.title
    new_content = payload.content or payload.body
    if new_content is not None:
        a.content = new_content
    if payload.type is not None:
        a.type = payload.type
    if payload.isActive is not None:
        a.is_active = payload.isActive

    await db.commit()
    return {"success": True, "message": "Announcement updated."}


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    stmt = select(Announcement).where(Announcement.id == announcement_id)
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    await db.delete(a)
    await db.commit()
    return {"success": True, "message": "Announcement deleted."}

