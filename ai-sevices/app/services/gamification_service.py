from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.models import (
    User,
    Badge,
    UserBadge,
    XpTransaction,
    Streak,
    DailyCheckin,
    SpeechSession,
    Notification,
)
from app.services.auth_service import get_level_info


async def award_xp(
    db: AsyncSession,
    user_id: str,
    amount: int,
    source: str,
    reference_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Atomically awards XP, records an XpTransaction, updates user level, and triggers badge evaluations.
    """
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        return {"xpEarned": 0, "totalXp": 0, "newLevel": 1, "leveledUp": False, "newBadges": []}

    old_level = user.level
    user.xp_total += max(0, amount)
    level_info = get_level_info(user.xp_total)
    user.level = level_info["level"]
    leveled_up = user.level > old_level

    # Record transaction
    tx = XpTransaction(
        user_id=user_id,
        amount=amount,
        source=source,
        reference_id=reference_id,
    )
    db.add(tx)

    # If leveled up, create in-app notification
    if leveled_up:
        notif = Notification(
            user_id=user_id,
            title="Level Up! 🎉",
            message=f"Congratulations! You reached Level {user.level} in Truefluent AI.",
            type="LEVEL_UP",
        )
        db.add(notif)

    # Evaluate new badges
    new_badges = await evaluate_user_badges(db, user_id)

    await db.commit()
    await db.refresh(user)

    return {
        "xpEarned": amount,
        "totalXp": user.xp_total,
        "newXp": user.xp_total,
        "new_xp": user.xp_total,
        "newLevel": user.level,
        "new_level": user.level,
        "leveledUp": leveled_up,
        "leveled_up": leveled_up,
        "newBadges": new_badges,
        "new_badges": new_badges,
    }


async def record_daily_checkin(db: AsyncSession, user_id: str) -> Dict[str, Any]:
    """
    Records daily checkin and computes streaks.
    """
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    # Get or create streak
    stmt = select(Streak).where(Streak.user_id == user_id)
    res = await db.execute(stmt)
    streak = res.scalar_one_or_none()

    if not streak:
        streak = Streak(user_id=user_id, current_streak=1, longest_streak=1, last_checkin_date=today_str)
        db.add(streak)
        already_checked_in = False
    elif streak.last_checkin_date == today_str:
        already_checked_in = True
    elif streak.last_checkin_date == yesterday_str:
        streak.current_streak += 1
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
        streak.last_checkin_date = today_str
        already_checked_in = False
    else:
        streak.current_streak = 1
        streak.last_checkin_date = today_str
        already_checked_in = False

    if not already_checked_in:
        # Record daily checkin
        db.add(DailyCheckin(user_id=user_id, date=today_str))
        # Award 20 checkin XP
        xp_res = await award_xp(db, user_id, 20, "DAILY_CHECKIN")
        await db.commit()
        await db.refresh(streak)
        return {
            "success": True,
            "currentStreak": streak.current_streak,
            "longestStreak": streak.longest_streak,
            "xpAwarded": 20,
            "alreadyCheckedIn": False,
        }

    return {
        "success": True,
        "currentStreak": streak.current_streak,
        "longestStreak": streak.longest_streak,
        "xpAwarded": 0,
        "alreadyCheckedIn": True,
    }


async def evaluate_user_badges(db: AsyncSession, user_id: str) -> List[Dict[str, Any]]:
    """
    Evaluates system badges against user activity metrics.
    """
    # Load unlocked badge IDs
    ub_stmt = select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
    res_ub = await db.execute(ub_stmt)
    unlocked_ids = set(res_ub.scalars().all())

    # Load all active badges
    b_stmt = select(Badge).where(Badge.is_active == True)
    res_b = await db.execute(b_stmt)
    all_badges = res_b.scalars().all()

    # User activity counts
    speech_count_stmt = select(func.count(SpeechSession.id)).where(SpeechSession.user_id == user_id)
    speech_count = (await db.execute(speech_count_stmt)).scalar() or 0

    streak_stmt = select(Streak).where(Streak.user_id == user_id)
    streak_res = await db.execute(streak_stmt)
    streak_rec = streak_res.scalar_one_or_none()
    current_streak = streak_rec.current_streak if streak_rec else 0

    newly_unlocked = []

    for badge in all_badges:
        if badge.id in unlocked_ids:
            continue

        b_name = (badge.name or "").strip().lower()
        qualifies = False
        if b_name == "first words" and speech_count >= 1:
            qualifies = True
        elif b_name == "voice explorer" and speech_count >= 5:
            qualifies = True
        elif b_name == "master orator" and speech_count >= 20:
            qualifies = True
        elif b_name == "consistency starter" and current_streak >= 3:
            qualifies = True
        elif b_name == "week warrior" and current_streak >= 7:
            qualifies = True
        elif b_name == "fortnight force" and current_streak >= 14:
            qualifies = True

        if qualifies:
            ub = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(ub)
            newly_unlocked.append({
                "id": badge.id,
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon,
                "tier": badge.tier,
            })
            # Notify user
            db.add(Notification(
                user_id=user_id,
                title="New Badge Unlocked! 🏆",
                message=f"You earned the '{badge.name}' badge in Truefluent AI.",
                type="BADGE_EARNED",
                reference_id=badge.id,
            ))

    return newly_unlocked

