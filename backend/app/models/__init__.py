from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

Base = declarative_base()


class User(Base):
    """
    User model for authentication and API key management.
    
    This model connects to Neon Auth users for authentication
    while managing API keys for programmatic access.

    Attributes:
        id: UUID primary key
        neon_auth_user_id: Reference to Neon Auth user (from neon_auth.users_sync)
        email: Unique email address (synced from Neon Auth)
        name: Optional user name (synced from Neon Auth)
        created_at: Account creation timestamp
        last_login: Last login timestamp
        rate_limit_exempt: If True, user is exempt from rate limits
        role: User role (user, admin, etc.)
        api_keys: Relationship to APIKey
    """

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    neon_auth_user_id = Column(String(255), unique=True, nullable=True)  # Neon Auth user ID
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    rate_limit_exempt = Column(Boolean, default=False, nullable=False)
    role = Column(String(20), default="user", nullable=False)

    api_keys = relationship(
        "APIKey", back_populates="user", cascade="all, delete-orphan"
    )


class APIKey(Base):
    """
    APIKey model for storing hashed API keys and metadata.

    Attributes:
        id: UUID primary key
        user_id: Foreign key to User
        key_hash: SHA-256 hash of the API key
        key_prefix: Display prefix for the key
        name: User-provided name for the key
        tier: Access tier (free, paid, enterprise)
        is_active: Whether the key is active
        last_used: Last usage timestamp
        created_at: Creation timestamp
        user: Relationship to User
        usage_records: Relationship to APIUsage
    """

    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(64), nullable=False, unique=True)
    key_prefix = Column(String(32), nullable=False)
    name = Column(String(100))
    tier = Column(String(20), default="free")
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="api_keys")
    usage_records = relationship("APIUsage", back_populates="api_key")


class APIUsage(Base):
    """
    APIUsage model for tracking API key usage, rate limiting, and analytics.

    Attributes:
        id: UUID primary key
        api_key_id: Foreign key to APIKey
        endpoint: Endpoint accessed
        success: Whether the request succeeded
        response_time_ms: Response time in milliseconds
        error_code: Error code if any
        created_at: Timestamp of usage
        api_key: Relationship to APIKey
    """

    __tablename__ = "api_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    endpoint = Column(String(100), nullable=False)
    success = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer)
    error_code = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    api_key = relationship("APIKey", back_populates="usage_records")
