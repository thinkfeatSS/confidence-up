from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.db.session import get_db
from app.db.models import Challenge, UserChallenge
from app.core.security import get_current_user, AuthUser
from app.services.gamification_service import award_xp
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/challenges", tags=["Challenges"])


class ChallengeUpsertDto(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prompt: Optional[str] = None
    category: Optional[str] = "speaking"
    difficulty: Optional[str] = "MEDIUM"
    xpReward: Optional[int] = 50
    durationDays: Optional[int] = 7
    tips: Optional[List[str]] = None
    isActive: Optional[bool] = True
    sortOrder: Optional[int] = 0


def serialize_challenge(c: Challenge, completed_at: Optional[datetime] = None) -> Dict[str, Any]:
    return {
        "id": c.id,
        "title": c.title,
        "prompt": c.prompt,
        "description": c.description,
        "category": "speaking",
        "difficulty": c.difficulty,
        "xpReward": c.xp_reward,
        "durationDays": 7,
        "tips": ["Practice speaking with steady volume", "Record and listen to your flow"],
        "isCompleted": completed_at is not None,
        "completedAt": completed_at.isoformat() if completed_at else None,
        "isActive": c.is_active,
    }


def serialize_admin_challenge(c: Challenge) -> Dict[str, Any]:
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "prompt": c.prompt,
        "category": "speaking",
        "difficulty": c.difficulty,
        "xpReward": c.xp_reward,
        "durationDays": 7,
        "tips": ["Practice speaking with steady volume", "Record and listen to your flow"],
        "isActive": c.is_active,
        "sortOrder": c.sort_order,
        "createdAt": c.created_at.isoformat() if c.created_at else "",
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


# ─── Administrative Management Routes ──────────────────────────────────────────

@router.get("/admin/all")
async def list_challenges_admin(
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    query = select(Challenge)
    if search:
        query = query.where(Challenge.title.ilike(f"%{search}%") | Challenge.description.ilike(f"%{search}%"))
    if difficulty:
        query = query.where(Challenge.difficulty == difficulty.upper())

    query = query.order_by(Challenge.sort_order, Challenge.created_at).limit(limit)
    res = await db.execute(query)
    challenges = res.scalars().all()
    items = [serialize_admin_challenge(c) for c in challenges]

    return {
        "success": True,
        "data": items,
        "items": items,
    }


@router.post("")
async def create_challenge(
    dto: ChallengeUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    challenge = Challenge(
        title=dto.title,
        prompt=dto.prompt or dto.title,
        description=dto.description or "",
        difficulty=(dto.difficulty or "MEDIUM").upper(),
        xp_reward=dto.xpReward or 50,
        sort_order=dto.sortOrder or 0,
        is_active=dto.isActive if dto.isActive is not None else True,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="CHALLENGE_CREATE",
        entity_type="CHALLENGE",
        entity_id=challenge.id,
        new_data=serialize_admin_challenge(challenge),
    )

    return {"success": True, "data": serialize_admin_challenge(challenge)}


@router.patch("/{challenge_id}")
async def update_challenge(
    challenge_id: str,
    dto: ChallengeUpsertDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(Challenge).where(Challenge.id == challenge_id)
    challenge = (await db.execute(stmt)).scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    if dto.title is not None:
        challenge.title = dto.title
    if dto.description is not None:
        challenge.description = dto.description
    if dto.prompt is not None:
        challenge.prompt = dto.prompt
    if dto.difficulty is not None:
        challenge.difficulty = dto.difficulty.upper()
    if dto.xpReward is not None:
        challenge.xp_reward = dto.xpReward
    if dto.sortOrder is not None:
        challenge.sort_order = dto.sortOrder
    if dto.isActive is not None:
        challenge.is_active = dto.isActive

    await db.commit()
    await db.refresh(challenge)

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="CHALLENGE_UPDATE",
        entity_type="CHALLENGE",
        entity_id=challenge.id,
        new_data=serialize_admin_challenge(challenge),
    )

    return {"success": True, "data": serialize_admin_challenge(challenge)}


@router.delete("/{challenge_id}")
async def delete_challenge(
    challenge_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(Challenge).where(Challenge.id == challenge_id)
    challenge = (await db.execute(stmt)).scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    await db.delete(challenge)
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="CHALLENGE_DELETE",
        entity_type="CHALLENGE",
        entity_id=challenge_id,
    )

    return {"success": True, "message": "Challenge deleted successfully."}
