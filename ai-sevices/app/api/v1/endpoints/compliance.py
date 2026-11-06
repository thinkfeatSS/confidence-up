from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import TermsAcceptance

router = APIRouter()


class AcceptDocumentRequest(BaseModel):
    documentType: str  # TERMS, PRIVACY
    version: str = "1.0"


@router.post("/compliance/accept")
async def accept_document(
    payload: AcceptDocumentRequest,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    acceptance = TermsAcceptance(
        user_id=current_user.id,
        document_type=payload.documentType.upper(),
        version=payload.version,
        ip_address=ip,
        user_agent=user_agent,
    )
    db.add(acceptance)
    await db.commit()

    return {
        "success": True,
        "message": f"Successfully accepted {payload.documentType.upper()} v{payload.version}."
    }


@router.get("/compliance/me")
async def get_user_acceptances(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(TermsAcceptance)
        .where(TermsAcceptance.user_id == current_user.id)
        .order_by(desc(TermsAcceptance.accepted_at))
    )
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "documentType": a.document_type,
                "version": a.version,
                "acceptedAt": a.accepted_at.isoformat() if a.accepted_at else None,
            }
            for a in items
        ]
    }


@router.get("/compliance/admin")
async def get_admin_acceptances(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    documentType: Optional[str] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    skip = (page - 1) * limit
    total_query = select(func.count(TermsAcceptance.id))
    query = select(TermsAcceptance).order_by(desc(TermsAcceptance.accepted_at))

    if documentType:
        total_query = total_query.where(TermsAcceptance.document_type == documentType.upper())
        query = query.where(TermsAcceptance.document_type == documentType.upper())

    total_res = await db.execute(total_query)
    total = total_res.scalar() or 0

    query = query.offset(skip).limit(limit)
    res = await db.execute(query)
    items = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": a.id,
                    "userId": a.user_id,
                    "documentType": a.document_type,
                    "version": a.version,
                    "ipAddress": a.ip_address,
                    "acceptedAt": a.accepted_at.isoformat() if a.accepted_at else None,
                }
                for a in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }
