# Authentication & Database Implementation Guide

## Overview

This document outlines the implementation of user authentication and database layer for the Blossomer GTM API. We're implementing a self-service API key system with Supabase as our database provider.

## Database Architecture

### Database Provider: Supabase
- **Why Supabase**: Free PostgreSQL with excellent tooling, real-time capabilities, and clear scaling path
- **Free Tier**: 500MB storage, 50k MAU, full PostgreSQL 15 features
- **Connection**: Standard PostgreSQL connection string works with SQLAlchemy

### Database Schema

```sql
-- Core user table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    rate_limit_exempt BOOLEAN DEFAULT FALSE NOT NULL, -- Exempt from rate limits
    role VARCHAR(20) DEFAULT 'user' NOT NULL         -- User role (user, admin, etc.)
);

-- API keys for authentication
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash of actual key
    key_prefix VARCHAR(20) NOT NULL,       -- Display version: bloss_test_sk_abc123...
    name VARCHAR(100),                     -- User-provided name for the key
    tier VARCHAR(20) DEFAULT 'free',       -- free, paid, enterprise
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking for rate limiting and analytics
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    error_code VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_usage_key_time ON api_usage(api_key_id, timestamp);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint, timestamp);
```

## Authentication System

### API Key Format
```
Format: bloss_{env}_sk_{32_hex_chars}
Examples:
- bloss_test_sk_a1b2c3d4e5f6789012345678901234567890
- bloss_live_sk_x9y8z7w6v5u4321098765432109876543210

Components:
- bloss: Brand identifier
- test/live: Environment indicator  
- sk: Secret key type
- 32_hex_chars: Cryptographically secure random string
```

### Security Principles
1. **Never store actual API keys** - only SHA-256 hashes
2. **Rate limiting** per key to prevent abuse (with ability to exempt certain users via `rate_limit_exempt` flag)
3. **Key rotation** capability built-in
4. **Audit logging** of all authentication attempts
5. **Secure key generation** using cryptographic randomness
6. **Role-based access**: The `role` field allows for future admin/superuser features

## Implementation Files

### 1. Database Models (`src/blossomer_gtm_api/models.py`)

```python
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    rate_limit_exempt = Column(Boolean, default=False, nullable=False)  # Exempt from rate limits
    role = Column(String(20), default="user", nullable=False)          # User role (user, admin, etc.)
    
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(64), nullable=False, unique=True)
    key_prefix = Column(String(20), nullable=False)
    name = Column(String(100))
    tier = Column(String(20), default="free")
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="api_keys")
    usage_records = relationship("APIUsage", back_populates="api_key")

class APIUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    endpoint = Column(String(100), nullable=False)
    success = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer)
    error_code = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    api_key = relationship("APIKey", back_populates="usage_records")
```

### 2. Database Connection (`src/blossomer_gtm_api/database.py`)

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    echo=False  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables (for development - use migrations in production)
def create_tables():
    Base.metadata.create_all(bind=engine)
```

### 3. Authentication Service (`src/blossomer_gtm_api/auth.py`)

```python
import secrets
import hashlib
import logging
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import get_db
from .models import User, APIKey, APIUsage

logger = logging.getLogger(__name__)
security = HTTPBearer()

class AuthService:
    
    @staticmethod
    def generate_api_key(tier: str = "test") -> Tuple[str, str, str]:
        """
        Generate a new API key.
        
        Returns:
            Tuple of (full_key, key_hash, key_prefix)
        """
        # Generate cryptographically secure random suffix
        suffix = secrets.token_hex(16)  # 32 character hex string
        
        # Format: bloss_{tier}_sk_{suffix}
        full_key = f"bloss_{tier}_sk_{suffix}"
        
        # Hash for secure storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        # Prefix for display (first 20 chars + ...)
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
        name: str = None,
        key_name: str = "Default API Key"
    ) -> Tuple[User, str]:
        """
        Create a new user and their first API key.
        
        Returns:
            Tuple of (user, full_api_key)
        """
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
        
        # Create user
        user = User(email=email, name=name)
        db.add(user)
        db.flush()  # Get the user.id without committing
        
        # Generate API key
        full_key, key_hash, key_prefix = AuthService.generate_api_key("test")
        
        # Create API key record
        api_key = APIKey(
            user_id=user.id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            name=key_name,
            tier="free"
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
        
        api_key_record = db.query(APIKey).filter(
            and_(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            )
        ).first()
        
        if api_key_record:
            # Update last_used timestamp
            api_key_record.last_used = datetime.utcnow()
            db.commit()
        
        return api_key_record
    
    @staticmethod
    def check_rate_limit(db: Session, api_key_record: APIKey, endpoint: str) -> bool:
        """
        Check if API key has exceeded rate limits.
        
        Returns:
            True if within limits, False if rate limited
        """
        # Rate limits by tier
        limits = {
            "free": {"hour": 10, "day": 50},
            "paid": {"hour": 100, "day": 1000},
            "enterprise": {"hour": 1000, "day": 10000}
        }
        
        tier_limits = limits.get(api_key_record.tier, limits["free"])
        now = datetime.utcnow()
        
        # Check hourly limit
        hour_ago = now - timedelta(hours=1)
        hourly_usage = db.query(func.count(APIUsage.id)).filter(
            and_(
                APIUsage.api_key_id == api_key_record.id,
                APIUsage.timestamp >= hour_ago,
                APIUsage.endpoint == endpoint
            )
        ).scalar()
        
        if hourly_usage >= tier_limits["hour"]:
            return False
        
        # Check daily limit
        day_ago = now - timedelta(days=1)
        daily_usage = db.query(func.count(APIUsage.id)).filter(
            and_(
                APIUsage.api_key_id == api_key_record.id,
                APIUsage.timestamp >= day_ago
            )
        ).scalar()
        
        if daily_usage >= tier_limits["day"]:
            return False
        
        return True
    
    @staticmethod
    def log_api_usage(
        db: Session,
        api_key_record: APIKey,
        endpoint: str,
        success: bool,
        response_time_ms: int = None,
        error_code: str = None
    ):
        """Log API usage for analytics and billing."""
        usage = APIUsage(
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            success=success,
            response_time_ms=response_time_ms,
            error_code=error_code
        )
        db.add(usage)
        db.commit()

# FastAPI Dependencies
async def authenticate_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> APIKey:
    """
    FastAPI dependency for API key authentication.
    
    Returns:
        APIKey record if authentication successful
        
    Raises:
        HTTPException: 401 for invalid keys, 429 for rate limits
    """
    api_key = credentials.credentials
    
    # Validate API key format and lookup
    api_key_record = AuthService.validate_api_key(db, api_key)
    if not api_key_record:
        logger.warning(f"Invalid API key attempted: {api_key[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return api_key_record

async def check_rate_limits(
    endpoint: str,
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db)
) -> APIKey:
    """
    FastAPI dependency for rate limiting.
    Must be used after authenticate_api_key.
    """
    if not AuthService.check_rate_limit(db, api_key_record, endpoint):
        logger.warning(f"Rate limit exceeded for key {api_key_record.key_prefix}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            headers={"Retry-After": "3600"}  # Suggest retry after 1 hour
        )
    
    return api_key_record
```

### 4. API Endpoints for User Management (`src/blossomer_gtm_api/auth_endpoints.py`)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List
from .database import get_db
from .auth import AuthService, authenticate_api_key
from .models import User, APIKey

router = APIRouter(prefix="/auth", tags=["Authentication"])

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str = None

class CreateUserResponse(BaseModel):
    user_id: str
    email: str
    api_key: str
    message: str

class APIKeyInfo(BaseModel):
    id: str
    name: str
    key_prefix: str
    tier: str
    is_active: bool
    created_at: str
    last_used: str = None

@router.post("/signup", response_model=CreateUserResponse)
async def create_user_account(
    request: CreateUserRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new user account with an API key.
    
    This is a self-service endpoint for founders to get started.
    """
    try:
        user, api_key = AuthService.create_user_with_api_key(
            db=db,
            email=request.email,
            name=request.name
        )
        
        return CreateUserResponse(
            user_id=str(user.id),
            email=user.email,
            api_key=api_key,
            message="Account created successfully. Store your API key securely - it won't be shown again."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create account")

@router.get("/keys", response_model=List[APIKeyInfo])
async def list_api_keys(
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db)
):
    """
    List all API keys for the authenticated user.
    """
    user_keys = db.query(APIKey).filter(
        APIKey.user_id == api_key_record.user_id
    ).all()
    
    return [
        APIKeyInfo(
            id=str(key.id),
            name=key.name,
            key_prefix=key.key_prefix,
            tier=key.tier,
            is_active=key.is_active,
            created_at=key.created_at.isoformat(),
            last_used=key.last_used.isoformat() if key.last_used else None
        )
        for key in user_keys
    ]

@router.post("/keys/{key_id}/deactivate")
async def deactivate_api_key(
    key_id: str,
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db)
):
    """
    Deactivate an API key (soft delete).
    """
    key_to_deactivate = db.query(APIKey).filter(
        and_(
            APIKey.id == key_id,
            APIKey.user_id == api_key_record.user_id
        )
    ).first()
    
    if not key_to_deactivate:
        raise HTTPException(status_code=404, detail="API key not found")
    
    key_to_deactivate.is_active = False
    db.commit()
    
    return {"message": "API key deactivated successfully"}
```

## Integration with Campaign Endpoints

### Updated Campaign Endpoints

```python
# Example: Product Overview with authentication
@app.post("/campaigns/product_overview")
async def generate_product_overview(
    request: ProductOverviewRequest,
    api_key_record: APIKey = Depends(check_rate_limits("product_overview")),
    db: Session = Depends(get_db)
):
    """Generate product overview with authentication and rate limiting."""
    
    start_time = time.time()
    success = False
    error_code = None
    
    try:
        # Your existing campaign generation logic
        orchestrator = ContextOrchestrator(llm_client)
        result = await generate_product_overview_service(request, orchestrator, llm_client)
        success = True
        return result
        
    except HTTPException as e:
        error_code = f"HTTP_{e.status_code}"
        raise
    except Exception as e:
        error_code = "INTERNAL_ERROR"
        logger.error(f"Product overview generation failed: {e}")
        raise HTTPException(status_code=500, detail="Campaign generation failed")
        
    finally:
        # Log usage regardless of success/failure
        response_time = int((time.time() - start_time) * 1000)
        AuthService.log_api_usage(
            db=db,
            api_key_record=api_key_record,
            endpoint="product_overview",
            success=success,
            response_time_ms=response_time,
            error_code=error_code
        )
```

## Environment Variables

```bash
# Required for database connection
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Optional: Supabase client integration (for future features)
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=eyJ...

# Rate limiting configuration (optional, defaults provided)
RATE_LIMIT_FREE_HOURLY=10
RATE_LIMIT_FREE_DAILY=50
RATE_LIMIT_PAID_HOURLY=100
RATE_LIMIT_PAID_DAILY=1000
```

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to Settings → Database and copy connection string
4. Replace `[password]` with your actual database password

### 2. Initialize Database
```python
# Run once to create tables
from blossomer_gtm_api.database import create_tables
create_tables()
```

### 3. Test Authentication
```bash
# Create a test user
curl -X POST https://your-api.onrender.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Use returned API key for campaign endpoints
curl -X POST https://your-api.onrender.com/campaigns/product_overview \
  -H "Authorization: Bearer bloss_test_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"website_url": "https://stripe.com"}'
```

## Security Considerations

1. **API Key Storage**: Never log or store actual API keys, only hashes
2. **Rate Limiting**: Aggressive limits prevent abuse during free tier
3. **Input Validation**: All endpoints validate input with Pydantic models
4. **Error Handling**: Don't leak sensitive information in error messages
5. **Audit Logging**: All authentication attempts and API usage is logged

## Monitoring & Analytics

The system tracks:
- API key usage by endpoint
- Response times and success rates
- Rate limit violations
- User authentication patterns

This data supports:
- Billing calculations
- Performance optimization
- Abuse detection
- Feature usage analysis

## Testing Strategy

1. **Unit Tests**: Test key generation, hashing, validation
2. **Integration Tests**: Test full auth flow with database
3. **Load Testing**: Verify rate limiting works under load
4. **Security Testing**: Test for common auth vulnerabilities

## Migration Path

This design supports future enhancements:
- **Billing Integration**: Usage data ready for Stripe integration
- **Team Management**: Database schema supports multiple users per organization
- **Advanced Rate Limiting**: Can add per-endpoint and custom limits
- **OAuth Integration**: Can add social login alongside API keys
``` 