from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import UserFeedback

router = APIRouter()


class CreateFeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    page: Optional[str] = None


@router.post("/feedback")
async def create_feedback(
    payload: CreateFeedbackRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = UserFeedback(
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
        page=payload.page,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return {
        "success": True,
        "data": {
            "id": feedback.id,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "page": feedback.page,
            "createdAt": feedback.created_at.isoformat() if feedback.created_at else None,
        }
    }


@router.get("/feedback/admin")
async def get_feedback_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    skip = (page - 1) * limit
    total_res = await db.execute(select(func.count(UserFeedback.id)))
    total = total_res.scalar() or 0

    stmt = select(UserFeedback).order_by(desc(UserFeedback.created_at)).offset(skip).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": f.id,
                    "userId": f.user_id,
                    "rating": f.rating,
                    "comment": f.comment,
                    "page": f.page,
                    "createdAt": f.created_at.isoformat() if f.created_at else None,
                }
                for f in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }


@router.get("/feedback/admin/aggregate")
async def get_feedback_aggregate(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    agg_stmt = select(func.count(UserFeedback.id), func.avg(UserFeedback.rating))
    res = await db.execute(agg_stmt)
    count, avg_rating = res.first() or (0, 0.0)

    return {
        "success": True,
        "data": {
            "totalSubmissions": count or 0,
            "averageRating": round(float(avg_rating or 0.0), 2),
        }
    }
