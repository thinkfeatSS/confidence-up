from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.services.mail_service import send_contact_inquiry_email
from app.core.logging import logger

router = APIRouter()


class ContactInquiryRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    website: Optional[str] = None  # Honeypot field for bot protection


@router.post("/contact")
async def submit_contact_inquiry(payload: ContactInquiryRequest):
    # Honeypot check
    if payload.website:
        logger.warning(f"Spam bot detected in contact form submission from {payload.email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission.")

    sent = send_contact_inquiry_email(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message
    )

    if not sent:
        logger.error(f"Contact form dispatch failed for {payload.email}")

    return {
        "success": True,
        "message": "Thank you, we will respond within 2 business days."
    }

