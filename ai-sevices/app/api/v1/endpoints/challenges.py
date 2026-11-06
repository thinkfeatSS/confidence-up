from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.db.models import Challenge, UserChallenge
from app.core.security import get_current_user, AuthUser
from app.services.gamification_service import award_xp

router = APIRouter(prefix="/challenges", tags=["Challenges"])


def serialize_challenge(c: Challenge, completed_at: Optional[datetime] = None) -> Dict[str, Any]:
    return {
        "id": c.id,
        "title": c.title,
        "prompt": c.prompt,
        "description": c.description,
        "difficulty": c.difficulty,
        "xpReward": c.xp_reward,
        "isCompleted": completed_at is not None,
        "completedAt": completed_at.isoformat() if completed_at else None,
    }


@router.get("")
async def list_challenges(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    c_stmt = select(Challenge).where(Challenge.is_active == True).order_by(Challenge.sort_order)
    challenges = (await db.execute(c_stmt)).scalars().all()

    uc_stmt = select(UserChallenge).where(UserChallenge.user_id == current_user.id)
    user_challenges = (await db.execute(uc_stmt)).scalars().all()
    completed_map = {uc.challenge_id: uc.completed_at for uc in user_challenges}

    data = [serialize_challenge(c, completed_map.get(c.id)) for c in challenges]
    return {"success": True, "data": data}


@router.post("/{challenge_id}/complete")
async def complete_challenge(
    challenge_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c_stmt = select(Challenge).where(Challenge.id == challenge_id)
    challenge = (await db.execute(c_stmt)).scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    uc_stmt = select(UserChallenge).where(
        and_(UserChallenge.user_id == current_user.id, UserChallenge.challenge_id == challenge_id)
    )
    existing = (await db.execute(uc_stmt)).scalar_one_or_none()

    if existing:
        return {"success": True, "message": "Challenge already completed", "xpAwarded": 0}

    now = datetime.utcnow()
    db.add(UserChallenge(user_id=current_user.id, challenge_id=challenge_id, completed_at=now))

    xp_res = await award_xp(db, current_user.id, challenge.xp_reward, "CHALLENGE", challenge_id)

    return {
        "success": True,
        "message": "Challenge completed!",
        "xpAwarded": challenge.xp_reward,
        "gamification": xp_res,
    }
