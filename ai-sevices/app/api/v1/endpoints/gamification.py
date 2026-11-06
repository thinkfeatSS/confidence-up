from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.db.models import User, Streak, XpTransaction
from app.core.security import get_current_user, AuthUser
from app.services.auth_service import get_level_info
from app.services.gamification_service import record_daily_checkin

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/me/xp")
async def get_my_xp(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    u_stmt = select(User).where(User.id == current_user.id)
    user = (await db.execute(u_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    level_info = get_level_info(user.xp_total)

    # Get recent transactions
    tx_stmt = (
        select(XpTransaction)
        .where(XpTransaction.user_id == current_user.id)
        .order_by(desc(XpTransaction.created_at))
        .limit(20)
    )
    tx_res = await db.execute(tx_stmt)
    transactions = tx_res.scalars().all()

    return {
        "success": True,
        "data": {
            "totalXp": user.xp_total,
            "level": level_info["level"],
            "currentLevelXp": level_info["currentLevelXp"],
            "nextLevelXp": level_info["nextLevelXp"],
            "progressPercent": level_info["progressPercent"],
            "recentTransactions": [
                {
                    "id": t.id,
                    "amount": t.amount,
                    "source": t.source,
                    "createdAt": t.created_at.isoformat() if t.created_at else None,
                }
                for t in transactions
            ],
        },
    }


@router.get("/me/streak")
async def get_my_streak(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Streak).where(Streak.user_id == current_user.id)
    res = await db.execute(stmt)
    streak = res.scalar_one_or_none()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    current_val = streak.current_streak if streak else 0
    longest_val = streak.longest_streak if streak else 0
    checked_in_today = (streak.last_checkin_date == today_str) if streak else False

    return {
        "success": True,
        "data": {
            "currentStreak": current_val,
            "longestStreak": longest_val,
            "lastCheckinDate": streak.last_checkin_date if streak else None,
            "checkedInToday": checked_in_today,
        },
    }


@router.post("/me/checkin")
async def checkin_today(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await record_daily_checkin(db, current_user.id)
    return {"success": True, "data": res}


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=50),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.is_blocked == False).order_by(desc(User.xp_total)).limit(limit)
    res = await db.execute(stmt)
    users = res.scalars().all()

    leaderboard = []
    for rank, u in enumerate(users, 1):
        leaderboard.append({
            "rank": rank,
            "userId": u.id,
            "name": u.name,
            "avatarUrl": u.avatar_url,
            "totalXp": u.xp_total,
            "level": u.level,
            "confidenceScore": u.confidence_score,
            "isCurrentUser": u.id == current_user.id,
        })

    return {"success": True, "data": leaderboard}

