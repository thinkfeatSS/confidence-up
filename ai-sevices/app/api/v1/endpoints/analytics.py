from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import (
    User,
    SpeechSession,
    Streak,
    UserMission,
    FearLevel,
    UserFearProgress,
    XpTransaction,
    UserBadge,
    Badge,
    DailyCheckin,
)

router = APIRouter()


@router.get("/analytics/me/progress")
async def get_user_progress(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns user confidence timeline, speech trend, growth metrics,
    mission completion stats, and fear progression.
    """
    userId = current_user.id
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    eight_weeks_ago = now - timedelta(days=56)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Confidence Timeline (Last 30 days)
    stmt_timeline = (
        select(SpeechSession.created_at, SpeechSession.overall_confidence_score)
        .where(SpeechSession.user_id == userId, SpeechSession.created_at >= thirty_days_ago)
        .order_by(SpeechSession.created_at.asc())
        .limit(30)
    )
    res_timeline = await db.execute(stmt_timeline)
    timeline_rows = res_timeline.all()
    confidence_timeline = [
        {"date": r[0].isoformat() if r[0] else "", "overallConfidenceScore": r[1]}
        for r in timeline_rows
    ]

    # 2. Recent Sessions for Weekly Trend (Last 8 weeks)
    stmt_trend = (
        select(SpeechSession.created_at, SpeechSession.overall_confidence_score)
        .where(SpeechSession.user_id == userId, SpeechSession.created_at >= eight_weeks_ago)
        .order_by(SpeechSession.created_at.asc())
    )
    res_trend = await db.execute(stmt_trend)
    trend_rows = res_trend.all()

    week_map: Dict[str, Dict[str, float]] = {}
    for r in trend_rows:
        dt: datetime = r[0]
        score: float = r[1]
        cal = dt.isocalendar()
        week_key = f"{cal[0]}-W{str(cal[1]).zfill(2)}"
        if week_key not in week_map:
            week_map[week_key] = {"sum": 0.0, "count": 0}
        week_map[week_key]["sum"] += score
        week_map[week_key]["count"] += 1

    speech_trend = [
        {"week": w, "avgConfidenceScore": round(data["sum"] / data["count"], 1)}
        for w, data in sorted(week_map.items())
    ]

    # 3. Streak
    stmt_streak = select(Streak).where(Streak.user_id == userId)
    res_streak = await db.execute(stmt_streak)
    streak = res_streak.scalar_one_or_none()
    current_streak = streak.current_streak if streak else 0

    # 4. Missions
    stmt_missions_total = select(func.count(UserMission.id)).where(
        UserMission.user_id == userId, UserMission.completed_at.isnot(None)
    )
    res_missions_total = await db.execute(stmt_missions_total)
    completed_missions = res_missions_total.scalar() or 0

    stmt_missions_week = select(func.count(UserMission.id)).where(
        UserMission.user_id == userId, UserMission.completed_at >= week_start
    )
    res_missions_week = await db.execute(stmt_missions_week)
    completed_this_week = res_missions_week.scalar() or 0

    # 5. Fear Progress
    stmt_fear_total = select(func.count(FearLevel.id))
    res_fear_total = await db.execute(stmt_fear_total)
    total_fear_levels = res_fear_total.scalar() or 0

    stmt_fear_user = select(func.count(UserFearProgress.id)).where(UserFearProgress.user_id == userId)
    res_fear_user = await db.execute(stmt_fear_user)
    completed_fear_levels = res_fear_user.scalar() or 0

    # 6. Growth Metrics
    all_sessions_stmt = (
        select(SpeechSession)
        .where(SpeechSession.user_id == userId)
        .order_by(SpeechSession.created_at.asc())
    )
    res_all_sessions = await db.execute(all_sessions_stmt)
    all_sessions = res_all_sessions.scalars().all()

    first_sess = all_sessions[0] if all_sessions else None
    latest_sess = all_sessions[-1] if all_sessions else None

    baseline_conf = first_sess.overall_confidence_score if first_sess else 50.0
    current_conf = latest_sess.overall_confidence_score if latest_sess else 50.0
    conf_gain = round(current_conf - baseline_conf, 1)

    growth_metrics = {
        "baselineConfidence": baseline_conf,
        "currentConfidence": current_conf,
        "confidenceGain": conf_gain,
        "totalSessions": len(all_sessions),
        "currentStreak": current_streak,
        "averageFluency": round(sum(s.fluency_score for s in all_sessions) / len(all_sessions), 1) if all_sessions else 65.0,
        "averageWpm": round(sum(s.speech_speed_wpm for s in all_sessions) / len(all_sessions), 1) if all_sessions else 120.0,
    }

    return {
        "success": True,
        "data": {
            "confidenceTimeline": confidence_timeline,
            "speechTrend": speech_trend,
            "growthMetrics": growth_metrics,
            "missionStats": {
                "total": completed_missions,
                "thisWeek": completed_this_week,
            },
            "fearProgress": {
                "total": total_fear_levels,
                "completed": completed_fear_levels,
            },
        }
    }


@router.get("/analytics/me/summary")
async def get_user_summary(
    period: str = Query("week", pattern="^(week|month)$"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns high-level summary KPIs for the user dashboard over week or month.
    """
    userId = current_user.id
    now = datetime.utcnow()
    since = now - timedelta(days=7 if period == "week" else 30)

    # XP in period
    xp_stmt = select(func.sum(XpTransaction.amount)).where(
        XpTransaction.user_id == userId, XpTransaction.created_at >= since
    )
    res_xp = await db.execute(xp_stmt)
    xp_earned = res_xp.scalar() or 0

    # Missions completed in period
    m_stmt = select(func.count(UserMission.id)).where(
        UserMission.user_id == userId, UserMission.completed_at >= since
    )
    res_m = await db.execute(m_stmt)
    missions_completed = res_m.scalar() or 0

    # Speech sessions in period
    sp_stmt = select(
        func.count(SpeechSession.id),
        func.avg(SpeechSession.overall_confidence_score)
    ).where(SpeechSession.user_id == userId, SpeechSession.created_at >= since)
    res_sp = await db.execute(sp_stmt)
    sp_count, sp_avg = res_sp.first() or (0, 0.0)

    # Badges earned in period
    b_stmt = select(func.count(UserBadge.id)).where(
        UserBadge.user_id == userId, UserBadge.earned_at >= since
    )
    res_b = await db.execute(b_stmt)
    badges_earned = res_b.scalar() or 0

    # Streak
    strk_stmt = select(Streak).where(Streak.user_id == userId)
    res_strk = await db.execute(strk_stmt)
    streak = res_strk.scalar_one_or_none()

    return {
        "success": True,
        "data": {
            "xpEarned": xp_earned,
            "missionsCompleted": missions_completed,
            "speechSessions": sp_count or 0,
            "averageConfidenceScore": round(float(sp_avg or 0.0), 1),
            "streakDays": streak.current_streak if streak else 0,
            "badgesEarned": badges_earned or 0,
        }
    }


@router.get("/analytics/admin/dashboard")
async def get_admin_dashboard(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin overview metrics for Web Management Dashboard.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # Total Users
    total_users_res = await db.execute(select(func.count(User.id)))
    total_users = total_users_res.scalar() or 0

    # Active Today (daily checkins)
    active_today_res = await db.execute(
        select(func.count(func.distinct(DailyCheckin.user_id))).where(DailyCheckin.date >= today_start)
    )
    active_today = active_today_res.scalar() or 0

    # New users this week
    new_users_res = await db.execute(
        select(func.count(User.id)).where(User.created_at >= seven_days_ago)
    )
    new_users = new_users_res.scalar() or 0

    # Total missions completed
    missions_res = await db.execute(
        select(func.count(UserMission.id)).where(UserMission.completed_at.isnot(None))
    )
    total_missions = missions_res.scalar() or 0

    # Overall speech metrics
    speech_res = await db.execute(
        select(
            func.count(SpeechSession.id),
            func.avg(SpeechSession.overall_confidence_score)
        )
    )
    sp_count, sp_avg = speech_res.first() or (0, 0.0)

    # Top badges
    top_badges_stmt = (
        select(UserBadge.badge_id, func.count(UserBadge.id).label("count"))
        .group_by(UserBadge.badge_id)
        .order_by(desc("count"))
        .limit(5)
    )
    top_badges_res = await db.execute(top_badges_stmt)
    top_badges_raw = top_badges_res.all()

    top_badges = []
    for b_id, count in top_badges_raw:
        badge_obj = await db.execute(select(Badge).where(Badge.id == b_id))
        b = badge_obj.scalar_one_or_none()
        if b:
            top_badges.append({
                "badge": {"id": b.id, "name": b.name, "icon": b.icon, "tier": b.tier},
                "count": count
            })

    # Growth Users (grouped by date)
    growth_stmt = (
        select(User.created_at)
        .where(User.created_at >= thirty_days_ago)
        .order_by(User.created_at.asc())
    )
    growth_res = await db.execute(growth_stmt)
    growth_dates = growth_res.scalars().all()
    growth_map: Dict[str, int] = {}
    for d in growth_dates:
        d_str = d.strftime("%Y-%m-%d")
        growth_map[d_str] = growth_map.get(d_str, 0) + 1

    growth_users = [{"date": k, "count": v} for k, v in sorted(growth_map.items())]

    return {
        "success": True,
        "data": {
            "totalUsers": total_users,
            "activeToday": active_today,
            "newUsersThisWeek": new_users,
            "totalMissionsCompleted": total_missions,
            "totalSpeechSessions": sp_count or 0,
            "averageConfidenceScore": round(float(sp_avg or 0.0), 1),
            "avgConfidenceScore": round(float(sp_avg or 0.0), 1),
            "topBadges": top_badges,
            "growthUsers": growth_users,
            "userGrowth": growth_users,
        }
    }
