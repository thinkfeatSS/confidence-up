from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.security import get_current_user, AuthUser
from app.db.session import get_db
from app.db.models import SupportTicket, User

router = APIRouter()


class CreateTicketRequest(BaseModel):
    subject: str
    message: str


class RespondTicketRequest(BaseModel):
    response: str
    status: Optional[str] = "RESOLVED"  # OPEN, IN_PROGRESS, RESOLVED, CLOSED


@router.post("/support/tickets")
async def create_ticket(
    payload: CreateTicketRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=payload.subject,
        message=payload.message,
        status="OPEN",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return {
        "success": True,
        "data": {
            "id": ticket.id,
            "subject": ticket.subject,
            "message": ticket.message,
            "status": ticket.status,
            "createdAt": ticket.created_at.isoformat() if ticket.created_at else None,
        }
    }


@router.get("/support/tickets")
async def get_my_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    skip = (page - 1) * limit
    userId = current_user.id

    total_res = await db.execute(select(func.count(SupportTicket.id)).where(SupportTicket.user_id == userId))
    total = total_res.scalar() or 0

    stmt = (
        select(SupportTicket)
        .where(SupportTicket.user_id == userId)
        .order_by(desc(SupportTicket.created_at))
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    tickets = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": t.id,
                    "subject": t.subject,
                    "message": t.message,
                    "status": t.status,
                    "response": t.response,
                    "createdAt": t.created_at.isoformat() if t.created_at else None,
                    "updatedAt": t.updated_at.isoformat() if t.updated_at else None,
                }
                for t in tickets
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }


@router.get("/support/tickets/{ticket_id}")
async def get_ticket_details(
    ticket_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SupportTicket).where(SupportTicket.id == ticket_id)
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()

    if not t:
        raise HTTPException(status_code=404, detail="Support ticket not found.")
    if t.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized access.")

    return {
        "success": True,
        "data": {
            "id": t.id,
            "userId": t.user_id,
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "response": t.response,
            "createdAt": t.created_at.isoformat() if t.created_at else None,
            "updatedAt": t.updated_at.isoformat() if t.updated_at else None,
        }
    }


@router.get("/support/admin/tickets")
async def get_all_tickets_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    skip = (page - 1) * limit
    total_query = select(func.count(SupportTicket.id))
    query = select(SupportTicket).order_by(desc(SupportTicket.created_at))

    if status_filter:
        total_query = total_query.where(SupportTicket.status == status_filter.upper())
        query = query.where(SupportTicket.status == status_filter.upper())

    total_res = await db.execute(total_query)
    total = total_res.scalar() or 0

    query = query.offset(skip).limit(limit)
    res = await db.execute(query)
    tickets = res.scalars().all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": t.id,
                    "userId": t.user_id,
                    "subject": t.subject,
                    "message": t.message,
                    "status": t.status,
                    "response": t.response,
                    "createdAt": t.created_at.isoformat() if t.created_at else None,
                }
                for t in tickets
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    }


class AdminTicketResponseDto(BaseModel):
    adminResponse: Optional[str] = None
    response: Optional[str] = None
    status: Optional[str] = "RESOLVED"


@router.get("/support/admin/tickets/{ticket_id}")
async def get_admin_ticket_detail(
    ticket_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    stmt = select(SupportTicket).where(SupportTicket.id == ticket_id)
    t = (await db.execute(stmt)).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    u_stmt = select(User).where(User.id == t.user_id)
    u = (await db.execute(u_stmt)).scalar_one_or_none()

    return {
        "success": True,
        "data": {
            "id": t.id,
            "subject": t.subject,
            "body": t.message,
            "message": t.message,
            "status": t.status,
            "adminResponse": t.response,
            "response": t.response,
            "createdAt": t.created_at.isoformat() if t.created_at else None,
            "updatedAt": t.updated_at.isoformat() if t.updated_at else None,
            "user": {
                "id": u.id if u else t.user_id,
                "name": u.name if u else "Unknown User",
                "email": u.email if u else "unknown@user.com",
            },
        },
    }


@router.patch("/support/admin/tickets/{ticket_id}")
async def respond_admin_ticket(
    ticket_id: str,
    dto: AdminTicketResponseDto,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    stmt = select(SupportTicket).where(SupportTicket.id == ticket_id)
    t = (await db.execute(stmt)).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    resp_text = dto.adminResponse or dto.response
    if resp_text:
        t.response = resp_text
    if dto.status:
        t.status = dto.status.upper()

    await db.commit()
    await db.refresh(t)

    return {"success": True, "message": "Ticket response recorded successfully."}

