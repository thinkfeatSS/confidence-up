from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.session import get_db
from app.db.models import AuditLog, User
from app.core.security import get_current_user, AuthUser

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    adminId: Optional[str] = Query(None, alias="adminId"),
    action: Optional[str] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    query = select(AuditLog)
    if adminId:
        query = query.where(AuditLog.user_id == adminId)
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    query = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit)
    res = await db.execute(query)
    logs = res.scalars().all()

    # Look up admin user info
    user_ids = list({log.user_id for log in logs if log.user_id})
    user_map = {}
    if user_ids:
        u_stmt = select(User.id, User.name, User.email).where(User.id.in_(user_ids))
        u_rows = (await db.execute(u_stmt)).all()
        user_map = {row[0]: {"name": row[1], "email": row[2]} for row in u_rows}

    items = []
    for log in logs:
        admin_info = user_map.get(log.user_id) if log.user_id else None
        if not admin_info and log.user_id:
            admin_info = {"name": "Admin", "email": "admin@truefluent.ai"}

        items.append({
            "id": log.id,
            "action": log.action,
            "targetType": log.entity_type,
            "entityType": log.entity_type,
            "targetId": log.entity_id,
            "entityId": log.entity_id,
            "createdAt": log.created_at.isoformat() if log.created_at else "",
            "admin": admin_info,
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "data": items,
            "total": total,
            "page": page,
            "limit": limit,
        },
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }
