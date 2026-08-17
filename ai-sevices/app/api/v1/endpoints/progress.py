from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import PracticeSession, SpeechMetric

router = APIRouter()


@router.get("/progress/timeline")
async def get_progress_timeline(
    period: str = Query("all", pattern="^(daily|weekly|monthly|all)$"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns aggregated long-term progress timeline:
    Confidence trend, Fluency trend, Vocabulary growth, WPM, and Filler reduction.
    """
    stmt = (
        select(PracticeSession)
        .where(
            PracticeSession.user_id == current_user.id,
            PracticeSession.status == "completed"
        )
        .order_by(desc(PracticeSession.created_at))
        .limit(50)
    )
    res = await db.execute(stmt)
    sessions = res.scalars().all()
    
    if not sessions:
        return {
            "total_sessions": 0,
            "best_confidence_score": 0.0,
            "average_confidence_score": 0.0,
            "timeline": []
        }
        
    scores = [s.overall_confidence_score for s in sessions]
    timeline_items = []
    
    for s in reversed(sessions):
        timeline_items.append({
            "session_id": s.id,
            "date": s.created_at.strftime("%Y-%m-%d"),
            "topic": s.topic or "Speaking Practice",
            "confidence_score": s.overall_confidence_score,
            "fluency_score": s.fluency_score,
            "vocabulary_score": s.vocabulary_score,
            "topic_relevance_score": s.topic_relevance_score,
            "duration_seconds": s.duration_seconds,
        })
        
    return {
        "total_sessions": len(sessions),
        "best_confidence_score": max(scores),
        "average_confidence_score": round(sum(scores) / len(scores), 1),
        "timeline": timeline_items
    }
