import random
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRES_MINUTES)
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS)
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, secret: str = None) -> Dict[str, Any]:
    secret_key = secret or settings.JWT_SECRET
    return jwt.decode(token, secret_key, algorithms=[settings.JWT_ALGORITHM])


def generate_otp() -> str:
    """Generates a random 6-digit numeric OTP code"""
    return str(random.randint(100000, 999999))


def get_level_info(total_xp: int) -> Dict[str, Any]:
    """
    Computes level and progression from total XP using quadratic progression.
    Level 1: 0 - 200 XP
    Level 2: 200 - 500 XP
    Level 3: 500 - 900 XP, etc.
    """
    level = 1
    xp_for_next = 200
    accumulated = 0

    while total_xp >= accumulated + xp_for_next:
        accumulated += xp_for_next
        level += 1
        xp_for_next = int(200 * (1.2 ** (level - 1)))

    current_level_xp = total_xp - accumulated
    progress_percent = min(100, int((current_level_xp / xp_for_next) * 100))

    return {
        "level": level,
        "currentLevelXp": current_level_xp,
        "nextLevelXp": xp_for_next,
        "progressPercent": progress_percent,
        "totalXp": total_xp,
    }
