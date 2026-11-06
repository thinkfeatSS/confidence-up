from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, desc
from app.db.session import get_db
from app.db.models import User, UserSettings, Device, SpeechSession, Streak, AccountDeletionRequest
from app.core.security import get_current_user, AuthUser
from app.api.v1.endpoints.auth import serialize_user

router = APIRouter(prefix="/users", tags=["Users"])


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
    fcmToken: str
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
    stmt = select(Device).where(Device.fcm_token == dto.fcmToken)
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
            fcm_token=dto.fcmToken,
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
async def request_account_deletion(
    dto: AccountDeletionDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AccountDeletionRequest).where(AccountDeletionRequest.user_id == current_user.id)
    existing = (await db.execute(stmt)).scalar_one_or_none()

    scheduled_date = datetime.utcnow()
    if not existing:
        req = AccountDeletionRequest(
            user_id=current_user.id,
            reason=dto.reason,
            status="PENDING",
            scheduled_for=scheduled_date,
        )
        db.add(req)
        await db.commit()

    return {"success": True, "message": "Account deletion scheduled."}


@router.get("")
async def list_users_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    query = select(User)
    if search:
        query = query.where(User.email.ilike(f"%{search}%") | User.name.ilike(f"%{search}%"))

    # Count total
    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    res = await db.execute(query)
    users = res.scalars().all()

    return {
        "success": True,
        "data": {
            "users": [serialize_user(u) for u in users],
            "total": total,
            "page": page,
            "limit": limit,
        },
    }
