from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    speech,
    gamification,
    badges,
    missions,
    challenges,
    fears,
    daily,
    analytics,
    notifications,
    announcements,
    compliance,
    contact,
    feedback,
    support,
    referral,
    activity,
    health,
    progress,
    benchmark,
    devices,
    audit,
    skill_tree,
)

api_router = APIRouter()

# ─── Truefluent AI Unified Routes ─────────────────────────────────────────────
api_router.include_router(auth.router, tags=["Authentication & Identity"])
api_router.include_router(users.router, tags=["Users & Profiles"])
api_router.include_router(speech.router, tags=["Speech Intelligence & Sessions"])
api_router.include_router(gamification.router, tags=["Gamification & XP"])
api_router.include_router(badges.router, tags=["Badges & Accolades"])
api_router.include_router(missions.router, tags=["Missions"])
api_router.include_router(challenges.router, tags=["Challenges"])
api_router.include_router(fears.router, tags=["Fear Hierarchy & Desensitization"])
api_router.include_router(daily.router, tags=["Daily Hub & Quests"])
api_router.include_router(analytics.router, tags=["Analytics & Reporting"])
api_router.include_router(notifications.router, tags=["Notifications"])
api_router.include_router(announcements.router, tags=["Announcements"])
api_router.include_router(compliance.router, tags=["Compliance & Legal"])
api_router.include_router(contact.router, tags=["Contact Inquiries"])
api_router.include_router(feedback.router, tags=["User Feedback"])
api_router.include_router(support.router, tags=["Support Desk"])
api_router.include_router(referral.router, tags=["Referrals"])
api_router.include_router(activity.router, tags=["Activity Timeline"])
api_router.include_router(devices.router, tags=["Devices & App Versions"])
api_router.include_router(audit.router, tags=["Audit Logs"])
api_router.include_router(skill_tree.router, tags=["Skill Tree"])

# ─── Specialized AI & System Operations ───────────────────────────────────────
api_router.include_router(progress.router, tags=["AI Progress Tracking"])
api_router.include_router(benchmark.router, tags=["Speech Benchmarking"])
api_router.include_router(health.router, tags=["System Health"])
