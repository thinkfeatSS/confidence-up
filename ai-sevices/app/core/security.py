from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.logging import logger

security_scheme = HTTPBearer(auto_error=False)


class AuthUser:
    def __init__(self, user_id: str, email: str, role: str = "USER"):
        self.id = user_id
        self.email = email
        self.role = role


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> AuthUser:
    """Validates JWT access token signed by the main backend (NestJS)."""
    if not credentials:
        # For local development / unauthenticated requests in dev mode
        if settings.ENVIRONMENT == "development" and settings.DEBUG:
            return AuthUser(user_id="dev-user-001", email="dev@confidenceup.local", role="USER")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        user_id: str = payload.get("sub") or payload.get("userId")
        email: str = payload.get("email", "")
        role: str = payload.get("role", "USER")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub claim",
            )
            
        return AuthUser(user_id=user_id, email=email, role=role)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidTokenError, Exception) as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
