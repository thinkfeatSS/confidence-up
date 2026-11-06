from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import Referral, User
from app.services.gamification_service import award_xp

router = APIRouter()


class ApplyReferralRequest(BaseModel):
    code: str


@router.get("/referral/me/code")
async def get_my_referral_code(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    userId = current_user.id
    u_res = await db.execute(select(User).where(User.id == userId))
    user = u_res.scalar_one_or_none()
    
    code = f"TF-{userId[:6].upper()}"

    # Count successful referrals
    ref_count_res = await db.execute(
        select(func.count(Referral.id)).where(Referral.referrer_id == userId)
    )
    referral_count = ref_count_res.scalar() or 0

    return {
        "success": True,
        "data": {
            "referralCode": code,
            "referralCount": referral_count,
            "xpPerReferral": 100,
            "totalXpEarned": referral_count * 100,
        }
    }


@router.post("/referral/apply")
async def apply_referral_code(
    payload: ApplyReferralRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    userId = current_user.id
    code = payload.code.strip().upper()

    # Check if already applied
    existing_ref = await db.execute(select(Referral).where(Referral.referee_id == userId))
    if existing_ref.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already applied a referral code.")

    # Find referrer
    prefix = code.replace("TF-", "").lower()
    referrer_res = await db.execute(select(User).where(User.id.startswith(prefix)))
    referrer = referrer_res.scalars().first()

    if not referrer or referrer.id == userId:
        raise HTTPException(status_code=400, detail="Invalid referral code.")

    referral = Referral(
        referrer_id=referrer.id,
        referee_id=userId,
        code=code,
        status="COMPLETED",
    )
    db.add(referral)

    # Award XP to both
    await award_xp(db, referrer.id, 100, "REFERRAL", referral.id)
    await award_xp(db, userId, 50, "REFERRAL", referral.id)

    await db.commit()

    return {
        "success": True,
        "message": "Referral code applied! You earned 50 bonus XP.",
        "data": {"bonusXp": 50}
    }


@router.get("/referral/admin")
async def get_referrals_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    skip = (page - 1) * limit
    total_res = await db.execute(select(func.count(Referral.id)))
    total = total_res.scalar() or 0

    stmt = select(Referral).order_by(desc(Referral.created_at)).offset(skip).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": r.id,
                    "referrerId": r.referrer_id,
                    "refereeId": r.referee_id,
                    "code": r.code,
                    "status": r.status,
                    "createdAt": r.created_at.isoformat() if r.created_at else None,
                }
                for r in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }
