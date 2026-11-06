from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from app.db.session import get_db
from app.db.models import User, EmailOtp, RefreshToken, Device, UserSettings, Streak
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
)
from app.services.mail_service import send_verification_otp_email, send_password_reset_email
from app.core.security import get_current_user, AuthUser
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Pydantic Request Models ──────────────────────────────────────────────────

class RegisterDto(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginDto(BaseModel):
    email: EmailStr
    password: str
    deviceId: Optional[str] = None
    fcmToken: Optional[str] = None
    platform: Optional[str] = "ANDROID"


class RefreshDto(BaseModel):
    refreshToken: str


class VerifyEmailDto(BaseModel):
    email: EmailStr
    otp: str


class ResendOtpDto(BaseModel):
    email: EmailStr


class ForgotPasswordDto(BaseModel):
    email: EmailStr


class ResetPasswordDto(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str


class GoogleMobileDto(BaseModel):
    idToken: str
    deviceId: Optional[str] = None
    fcmToken: Optional[str] = None
    platform: Optional[str] = "ANDROID"


def serialize_user(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatarUrl": user.avatar_url,
        "xpTotal": user.xp_total,
        "level": user.level,
        "confidenceScore": user.confidence_score,
        "isVerified": user.is_verified,
        "onboardingCompleted": user.onboarding_completed,
        "preferredLanguages": user.preferred_languages or ["English", "Urdu"],
        "referralCode": user.referral_code,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(dto: RegisterDto, db: AsyncSession = Depends(get_db)):
    # 1. Check if email already exists
    existing = await db.execute(select(User).where(User.email == dto.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 2. Create user record
    hashed = hash_password(dto.password)
    user = User(
        name=dto.name.strip(),
        email=dto.email.lower().strip(),
        password_hash=hashed,
        is_verified=False,
        role="USER",
        level=1,
        xp_total=0,
    )
    db.add(user)
    await db.flush()

    # 3. Create default settings & streak
    settings_rec = UserSettings(user_id=user.id)
    streak_rec = Streak(user_id=user.id, current_streak=0, longest_streak=0)
    db.add(settings_rec)
    db.add(streak_rec)

    # 4. Generate 6-digit OTP
    otp_code = generate_otp()
    otp_rec = EmailOtp(
        user_id=user.id,
        email=user.email,
        otp=otp_code,
        type="VERIFY_EMAIL",
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.add(otp_rec)
    await db.commit()

    # 5. Dispatch email via Hostinger SMTP
    send_verification_otp_email(user.email, user.name, otp_code)

    return {
        "success": True,
        "message": "Registration successful. Please verify your email.",
        "data": {
            "email": user.email,
            "requiresVerification": True,
        },
    }


@router.post("/verify-email")
async def verify_email(dto: VerifyEmailDto, db: AsyncSession = Depends(get_db)):
    email = dto.email.lower().strip()
    # Find active OTP
    stmt = (
        select(EmailOtp)
        .where(
            and_(
                EmailOtp.email == email,
                EmailOtp.otp == dto.otp.strip(),
                EmailOtp.type == "VERIFY_EMAIL",
                EmailOtp.used_at.is_(None),
                EmailOtp.expires_at > datetime.utcnow(),
            )
        )
        .order_by(EmailOtp.created_at.desc())
    )
    res = await db.execute(stmt)
    otp_record = res.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    # Mark OTP used
    otp_record.used_at = datetime.utcnow()

    # Find user and mark verified
    u_res = await db.execute(select(User).where(User.email == email))
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_verified = True

    # Generate JWT tokens
    access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=refresh_token[:64],
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS),
    ))

    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "data": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": serialize_user(user),
        },
    }


@router.post("/verify-email/resend")
async def resend_verification_otp(dto: ResendOtpDto, db: AsyncSession = Depends(get_db)):
    email = dto.email.lower().strip()
    u_res = await db.execute(select(User).where(User.email == email))
    user = u_res.scalar_one_or_none()
    if not user:
        # Prevent email enumeration
        return {"success": True, "message": "If this email is registered, a new code has been sent."}

    otp_code = generate_otp()
    otp_rec = EmailOtp(
        user_id=user.id,
        email=user.email,
        otp=otp_code,
        type="VERIFY_EMAIL",
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.add(otp_rec)
    await db.commit()

    send_verification_otp_email(user.email, user.name, otp_code)
    return {"success": True, "message": "Verification code resent."}


@router.post("/login")
async def login(dto: LoginDto, db: AsyncSession = Depends(get_db)):
    email = dto.email.lower().strip()
    u_res = await db.execute(select(User).where(User.email == email))
    user = u_res.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(dto.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account suspended: {user.block_reason or 'Contact support.'}",
        )

    # Save or update device token if provided
    if dto.fcmToken:
        d_stmt = select(Device).where(and_(Device.user_id == user.id, Device.fcm_token == dto.fcmToken))
        d_res = await db.execute(d_stmt)
        device = d_res.scalar_one_or_none()
        if not device:
            db.add(Device(
                user_id=user.id,
                fcm_token=dto.fcmToken,
                platform=dto.platform or "ANDROID",
            ))

    # Generate tokens
    access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=refresh_token[:64],
        device_id=dto.deviceId,
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS),
    ))

    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "data": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": serialize_user(user),
        },
    }


@router.post("/refresh")
async def refresh_access_token(dto: RefreshDto, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(dto.refreshToken, settings.JWT_REFRESH_SECRET)
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalar_one_or_none()
        if not user or user.is_blocked:
            raise HTTPException(status_code=401, detail="User not found or suspended")

        new_access = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
        new_refresh = create_refresh_token({"sub": user.id, "email": user.email})

        db.add(RefreshToken(
            user_id=user.id,
            token_hash=new_refresh[:64],
            expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS),
        ))
        await db.commit()

        return {
            "success": True,
            "data": {
                "accessToken": new_access,
                "refreshToken": new_refresh,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/forgot-password")
async def forgot_password(dto: ForgotPasswordDto, db: AsyncSession = Depends(get_db)):
    email = dto.email.lower().strip()
    u_res = await db.execute(select(User).where(User.email == email))
    user = u_res.scalar_one_or_none()

    if user:
        otp_code = generate_otp()
        db.add(EmailOtp(
            user_id=user.id,
            email=user.email,
            otp=otp_code,
            type="FORGOT_PASSWORD",
            expires_at=datetime.utcnow() + timedelta(minutes=15),
        ))
        await db.commit()
        send_password_reset_email(user.email, otp_code)

    return {"success": True, "message": "If this email is registered, a password reset code has been sent."}


@router.post("/reset-password")
async def reset_password(dto: ResetPasswordDto, db: AsyncSession = Depends(get_db)):
    email = dto.email.lower().strip()
    stmt = (
        select(EmailOtp)
        .where(
            and_(
                EmailOtp.email == email,
                EmailOtp.otp == dto.otp.strip(),
                EmailOtp.type == "FORGOT_PASSWORD",
                EmailOtp.used_at.is_(None),
                EmailOtp.expires_at > datetime.utcnow(),
            )
        )
        .order_by(EmailOtp.created_at.desc())
    )
    res = await db.execute(stmt)
    otp_rec = res.scalar_one_or_none()

    if not otp_rec:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset code.")

    otp_rec.used_at = datetime.utcnow()

    u_res = await db.execute(select(User).where(User.email == email))
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(dto.newPassword)
    await db.commit()

    return {"success": True, "message": "Password reset successfully. You may now log in."}


@router.post("/google/mobile")
async def google_mobile_auth(dto: GoogleMobileDto, db: AsyncSession = Depends(get_db)):
    # Parse unverified token payload or verify via google-auth
    try:
        unverified = jwt.decode(dto.idToken, options={"verify_signature": False})
        email = unverified.get("email", "").lower().strip()
        name = unverified.get("name", "Google User")
        google_id = unverified.get("sub")
        avatar_url = unverified.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google token: missing email")

        u_res = await db.execute(select(User).where(User.email == email))
        user = u_res.scalar_one_or_none()

        if not user:
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                avatar_url=avatar_url,
                is_verified=True,
                role="USER",
                level=1,
                xp_total=0,
            )
            db.add(user)
            await db.flush()
            db.add(UserSettings(user_id=user.id))
            db.add(Streak(user_id=user.id, current_streak=0, longest_streak=0))
        else:
            if not user.google_id:
                user.google_id = google_id
            user.is_verified = True

        access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

        db.add(RefreshToken(
            user_id=user.id,
            token_hash=refresh_token[:64],
            expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS),
        ))

        await db.commit()
        await db.refresh(user)

        return {
            "success": True,
            "data": {
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "user": serialize_user(user),
            },
        }
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=400, detail="Google authentication failed.")


@router.post("/logout")
async def logout(current_user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user and current_user.id:
        stmt = update(RefreshToken).where(RefreshToken.user_id == current_user.id).values(revoked_at=datetime.utcnow())
        await db.execute(stmt)
        await db.commit()
    return {"success": True, "message": "Logged out successfully."}

