from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, desc
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import (
    User,
    UserSettings,
    Device,
    SpeechSession,
    Streak,
    AccountDeletionRequest,
    UserBadge,
    Badge,
)
from app.core.security import get_current_user, AuthUser
from app.api.v1.endpoints.auth import serialize_user
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/users", tags=["Users"])


def serialize_admin_user(user: User, streak_days: int = 0) -> Dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "level": user.level,
        "xp": user.xp_total,
        "xpTotal": user.xp_total,
        "streak": streak_days,
        "createdAt": user.created_at.isoformat() if user.created_at else "",
        "isBlocked": bool(user.is_blocked),
        "role": user.role,
        "confidenceScore": user.confidence_score,
    }


class OnboardingDto(BaseModel):
    fears: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    dailyTime: Optional[str] = "10_MIN"
    preferredLanguages: Optional[List[str]] = None


class UserSettingsPatchDto(BaseModel):
    darkMode: Optional[bool] = None
    dailyReminders: Optional[bool] = None
    weeklyReport: Optional[bool] = None
    reminderTime: Optional[str] = None
    emailNotifications: Optional[bool] = None
    pushNotifications: Optional[bool] = None


class DeviceDto(BaseModel):
    fcmToken: Optional[str] = None
    deviceToken: Optional[str] = None
    platform: Optional[str] = "ANDROID"
    appVersion: Optional[str] = None


class AccountDeletionDto(BaseModel):
    reason: Optional[str] = None


@router.get("/me")
async def get_my_profile(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == current_user.id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "data": serialize_user(user)}


@router.get("/me/settings")
async def get_my_settings(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return {
        "success": True,
        "data": {
            "darkMode": settings.dark_mode,
            "dailyReminders": settings.daily_reminders,
            "weeklyReport": settings.weekly_report,
            "reminderTime": settings.reminder_time,
            "emailNotifications": settings.email_notifications,
            "pushNotifications": settings.push_notifications,
        },
    }


@router.patch("/me/settings")
async def update_my_settings(
    dto: UserSettingsPatchDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if dto.darkMode is not None:
        settings.dark_mode = dto.darkMode
    if dto.dailyReminders is not None:
        settings.daily_reminders = dto.dailyReminders
    if dto.weeklyReport is not None:
        settings.weekly_report = dto.weeklyReport
    if dto.reminderTime is not None:
        settings.reminder_time = dto.reminderTime
    if dto.emailNotifications is not None:
        settings.email_notifications = dto.emailNotifications
    if dto.pushNotifications is not None:
        settings.push_notifications = dto.pushNotifications

    await db.commit()
    await db.refresh(settings)

    return {
        "success": True,
        "data": {
            "darkMode": settings.dark_mode,
            "dailyReminders": settings.daily_reminders,
            "weeklyReport": settings.weekly_report,
            "reminderTime": settings.reminder_time,
            "emailNotifications": settings.email_notifications,
            "pushNotifications": settings.push_notifications,
        },
    }


@router.post("/me/onboarding")
async def save_onboarding(
    dto: OnboardingDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == current_user.id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.onboarding_completed = True
    user.onboarding_fears = dto.fears
    user.onboarding_goals = dto.goals
    user.onboarding_daily_time = dto.dailyTime
    if dto.preferredLanguages:
        user.preferred_languages = dto.preferredLanguages

    await db.commit()
    await db.refresh(user)

    return {"success": True, "data": serialize_user(user)}


@router.post("/me/device")
async def register_device(
    dto: DeviceDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token = dto.fcmToken or dto.deviceToken
    if not token:
        raise HTTPException(status_code=400, detail="Device token or FCM token is required.")

    stmt = select(Device).where(Device.fcm_token == token)
    res = await db.execute(stmt)
    device = res.scalar_one_or_none()

    if device:
        device.user_id = current_user.id
        device.platform = dto.platform or "ANDROID"
        device.app_version = dto.appVersion
        device.is_active = True
    else:
        device = Device(
            user_id=current_user.id,
            fcm_token=token,
            platform=dto.platform or "ANDROID",
            app_version=dto.appVersion,
        )
        db.add(device)

    await db.commit()
    return {"success": True, "message": "Device token registered"}


@router.get("/me/stats")
async def get_user_stats(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    u_stmt = select(User).where(User.id == current_user.id)
    user = (await db.execute(u_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Speech session stats
    sess_stmt = select(
        func.count(SpeechSession.id).label("total_sessions"),
        func.avg(SpeechSession.overall_confidence_score).label("avg_confidence"),
        func.avg(SpeechSession.speech_speed_wpm).label("avg_wpm"),
        func.sum(SpeechSession.duration_seconds).label("total_seconds"),
    ).where(SpeechSession.user_id == current_user.id)
    stats_res = (await db.execute(sess_stmt)).one()

    # Streak
    str_stmt = select(Streak).where(Streak.user_id == current_user.id)
    streak = (await db.execute(str_stmt)).scalar_one_or_none()

    return {
        "success": True,
        "data": {
            "totalSessions": stats_res.total_sessions or 0,
            "averageConfidence": round(float(stats_res.avg_confidence or 0.0), 1),
            "averageWpm": round(float(stats_res.avg_wpm or 0.0), 1),
            "totalPracticeSeconds": int(stats_res.total_seconds or 0),
            "currentStreak": streak.current_streak if streak else 0,
            "longestStreak": streak.longest_streak if streak else 0,
            "totalXp": user.xp_total,
            "level": user.level,
        },
    }


@router.post("/me/delete-request")
@router.delete("/me")
async def request_account_deletion(
    dto: Optional[AccountDeletionDto] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AccountDeletionRequest).where(AccountDeletionRequest.user_id == current_user.id)
    existing = (await db.execute(stmt)).scalar_one_or_none()

    scheduled_date = datetime.utcnow()
    reason_str = dto.reason if dto else "User requested account deletion"
    if not existing:
        req = AccountDeletionRequest(
            user_id=current_user.id,
            reason=reason_str,
            status="PENDING",
            scheduled_for=scheduled_date,
        )
        db.add(req)
        await db.commit()

    return {"success": True, "message": "Account deletion scheduled."}


@router.get("/admin")
@router.get("")
async def list_users_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    isBlocked: Optional[str] = Query(None, alias="isBlocked"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    query = select(User).options(selectinload(User.streak))
    if search:
        query = query.where(User.email.ilike(f"%{search}%") | User.name.ilike(f"%{search}%"))
    if isBlocked is not None and isBlocked != "":
        if isBlocked.lower() == "true":
            query = query.where(User.is_blocked == True)
        elif isBlocked.lower() == "false":
            query = query.where(User.is_blocked == False)

    # Count total
    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    res = await db.execute(query)
    users = res.scalars().all()

    users_list = [
        serialize_admin_user(u, u.streak.current_streak if u.streak else 0)
        for u in users
    ]

    return {
        "success": True,
        "data": {
            "data": users_list,
            "users": users_list,
            "total": total,
            "page": page,
            "limit": limit,
        },
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/admin/{user_id}")
async def get_user_detail_admin(
    user_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(User).where(User.id == user_id).options(selectinload(User.streak))
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")

    # Devices
    dev_stmt = select(Device).where(Device.user_id == user_id).order_by(desc(Device.created_at))
    devices = (await db.execute(dev_stmt)).scalars().all()

    # Badges
    ub_stmt = (
        select(Badge)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
    )
    badges = (await db.execute(ub_stmt)).scalars().all()

    # Activity / recent sessions
    sess_stmt = (
        select(SpeechSession)
        .where(SpeechSession.user_id == user_id)
        .order_by(desc(SpeechSession.created_at))
        .limit(10)
    )
    sessions = (await db.execute(sess_stmt)).scalars().all()

    return {
        "success": True,
        "data": {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "level": u.level,
            "xp": u.xp_total,
            "streak": u.streak.current_streak if u.streak else 0,
            "createdAt": u.created_at.isoformat() if u.created_at else "",
            "isBlocked": bool(u.is_blocked),
            "badgesEarned": len(badges),
            "devices": [
                {
                    "id": d.id,
                    "platform": d.platform,
                    "lastSeen": d.created_at.isoformat() if d.created_at else "",
                }
                for d in devices
            ],
            "activity": [
                {
                    "id": s.id,
                    "action": f"Completed practice session - score {s.overall_confidence_score:.1f}%",
                    "createdAt": s.created_at.isoformat() if s.created_at else "",
                }
                for s in sessions
            ],
            "badges": [
                {"id": b.id, "name": b.name, "tier": b.tier}
                for b in badges
            ],
        },
    }


@router.patch("/admin/{user_id}/block")
async def block_user(
    user_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(User).where(User.id == user_id)
    u = (await db.execute(stmt)).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")

    u.is_blocked = True
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="USER_BLOCK",
        entity_type="USER",
        entity_id=user_id,
        new_data={"isBlocked": True},
    )

    return {"success": True, "message": "User has been blocked."}


@router.patch("/admin/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    stmt = select(User).where(User.id == user_id)
    u = (await db.execute(stmt)).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")

    u.is_blocked = False
    await db.commit()

    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="USER_UNBLOCK",
        entity_type="USER",
        entity_id=user_id,
        new_data={"isBlocked": False},
    )

    return {"success": True, "message": "User has been unblocked."}

