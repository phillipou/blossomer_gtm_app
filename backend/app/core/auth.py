import secrets
import hashlib
import logging
from typing import Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.database import get_db
from backend.app.models import User, APIKey, APIUsage

logger = logging.getLogger(__name__)
security = HTTPBearer()


class AuthService:
    """
    Service for API key management, user creation, validation, rate limiting, and usage logging.
    """

    @staticmethod
    def generate_api_key(tier: str = "test") -> Tuple[str, str, str]:
        """
        Generate a new API key.
        Returns:
            Tuple of (full_key, key_hash, key_prefix)
        """
        suffix = secrets.token_hex(16)  # 32 character hex string
        full_key = f"bloss_{tier}_sk_{suffix}"
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        key_prefix = full_key[:20] + "..."
        return full_key, key_hash, key_prefix

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash an API key for database lookup."""
        return hashlib.sha256(api_key.encode()).hexdigest()

    @staticmethod
    def create_user_with_api_key(
        db: Session,
        email: str,
        name: Optional[str] = None,
        key_name: str = "Default API Key",
        role: str = "user",
        rate_limit_exempt: bool = False,
    ) -> Tuple[User, str]:
        """
        Create a new user and their first API key.
        Returns:
            Tuple of (user, full_api_key)
        """
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=400, detail="User with this email already exists"
            )
        user = User(
            email=email, name=name, role=role, rate_limit_exempt=rate_limit_exempt
        )
        db.add(user)
        db.flush()  # Get the user.id without committing
        full_key, key_hash, key_prefix = AuthService.generate_api_key("test")
        api_key = APIKey(
            user_id=user.id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            name=key_name,
            tier="free",
        )
        db.add(api_key)
        db.commit()
        logger.info(f"Created user {email} with API key {key_prefix}")
        return user, full_key

    @staticmethod
    def validate_api_key(db: Session, api_key: str) -> Optional[APIKey]:
        """
        Validate an API key and return the APIKey record if valid.
        """
        if not api_key.startswith("bloss_"):
            return None
        key_hash = AuthService.hash_api_key(api_key)
        api_key_record = (
            db.query(APIKey)
            .filter(and_(APIKey.key_hash == key_hash, APIKey.is_active))
            .first()
        )
        if api_key_record:
            setattr(api_key_record, "last_used", datetime.utcnow())
            db.commit()
        return api_key_record

    @staticmethod
    def check_rate_limit(db: Session, api_key_record: APIKey, endpoint: str) -> bool:
        """
        Check if API key has exceeded rate limits.
        Returns:
            True if within limits, False if rate limited
        """
        limits = {
            "free": {"hour": 10, "day": 50},
            "paid": {"hour": 100, "day": 1000},
            "enterprise": {"hour": 1000, "day": 10000},
        }
        tier = api_key_record.tier if isinstance(api_key_record.tier, str) else "free"
        tier_limits = limits.get(tier, limits["free"])
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        hourly_usage = (
            db.query(func.count(APIUsage.id))
            .filter(
                and_(
                    APIUsage.api_key_id == api_key_record.id,
                    APIUsage.created_at >= hour_ago,
                    APIUsage.endpoint == endpoint,
                )
            )
            .scalar()
        )
        if hourly_usage is not None and hourly_usage >= tier_limits["hour"]:
            return False
        day_ago = now - timedelta(days=1)
        daily_usage = (
            db.query(func.count(APIUsage.id))
            .filter(
                and_(
                    APIUsage.api_key_id == api_key_record.id,
                    APIUsage.created_at >= day_ago,
                )
            )
            .scalar()
        )
        if daily_usage is not None and daily_usage >= tier_limits["day"]:
            return False
        return True

    @staticmethod
    def log_api_usage(
        db: Session,
        api_key_record: APIKey,
        endpoint: str,
        success: bool,
        response_time_ms: Optional[int] = None,
        error_code: Optional[str] = None,
    ):
        """Log API usage for analytics and billing."""
        usage = APIUsage(
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            success=success,
            response_time_ms=response_time_ms,
            error_code=error_code,
        )
        db.add(usage)
        db.commit()


# FastAPI Dependencies


async def authenticate_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> APIKey:
    """
    FastAPI dependency for API key authentication only.
    Returns:
        APIKey record if authentication successful
    Raises:
        HTTPException: 401 for invalid keys
    """
    api_key = credentials.credentials
    api_key_record = AuthService.validate_api_key(db, api_key)
    if not api_key_record:
        logger.warning(f"Invalid API key attempted: {api_key[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key"
        )
    return api_key_record


def rate_limit_dependency(endpoint: str):
    async def dependency(
        api_key_record: APIKey = Depends(authenticate_api_key),
        db: Session = Depends(get_db),
    ) -> APIKey:
        user = api_key_record.user
        if user and getattr(user, "rate_limit_exempt", False):
            return api_key_record
        if not AuthService.check_rate_limit(db, api_key_record, endpoint):
            logger.warning(f"Rate limit exceeded for key {api_key_record.key_prefix}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": "3600"},
            )
        return api_key_record

    return dependency
