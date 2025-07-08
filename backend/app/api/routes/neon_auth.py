from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Annotated
from datetime import datetime

from backend.app.core.database import get_db
from backend.app.core.auth import AuthService, authenticate_api_key
from backend.app.models import User, APIKey


router = APIRouter()


# Request/Response Models for Neon Auth Integration
class NeonAuthUserRequest(BaseModel):
    neon_auth_user_id: str
    email: EmailStr
    name: Optional[str] = None


class CreateAPIKeyRequest(BaseModel):
    name: str = "API Key"
    tier: str = "free"


class CreateAPIKeyResponse(BaseModel):
    api_key: str
    key_prefix: str
    name: str
    tier: str
    message: str


class UserProfileResponse(BaseModel):
    user_id: str
    neon_auth_user_id: Optional[str]
    email: str
    name: Optional[str]
    role: str
    rate_limit_exempt: bool
    created_at: datetime
    last_login: Optional[datetime]
    api_keys: List[dict]


# Neon Auth Token Validation (placeholder - will need to implement based on Neon Auth docs)
async def validate_neon_auth_token(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """
    Validate Neon Auth token and return user info.
    This is a placeholder - will need to implement based on Neon Auth documentation.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    # TODO: Implement actual Neon Auth token validation
    # For now, returning mock data for development
    token = authorization.split(" ")[1]

    # This should validate the token with Neon Auth and return user info
    # Placeholder implementation:
    if token == "mock_neon_auth_token":
        return {
            "user_id": "neon_auth_user_123",
            "email": "test@example.com",
            "name": "Test User",
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Neon Auth token"
    )


# Routes


@router.post("/sync-user")
async def sync_neon_auth_user(
    request: NeonAuthUserRequest,
    neon_auth_user: dict = Depends(validate_neon_auth_token),
    db: Session = Depends(get_db),
):
    """
    Sync a Neon Auth user to our local user table.
    Called when a Neon Auth user first accesses the API.
    """
    # Verify the request matches the authenticated user
    if request.neon_auth_user_id != neon_auth_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch"
        )

    user = AuthService.create_user_from_neon_auth(
        db=db,
        neon_auth_user_id=request.neon_auth_user_id,
        email=request.email,
        name=request.name,
    )

    return {
        "message": "User synced successfully",
        "user_id": str(user.id),
        "neon_auth_user_id": user.neon_auth_user_id,
    }


@router.post("/api-keys", response_model=CreateAPIKeyResponse)
async def create_api_key(
    request: CreateAPIKeyRequest,
    neon_auth_user: dict = Depends(validate_neon_auth_token),
    db: Session = Depends(get_db),
):
    """
    Create a new API key for an authenticated Neon Auth user.
    """
    # Find or create user record
    user = (
        db.query(User)
        .filter(User.neon_auth_user_id == neon_auth_user["user_id"])
        .first()
    )

    if not user:
        # Create user if they don't exist
        user = AuthService.create_user_from_neon_auth(
            db=db,
            neon_auth_user_id=neon_auth_user["user_id"],
            email=neon_auth_user["email"],
            name=neon_auth_user.get("name"),
        )

    # Check API key limits
    existing_keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user.id, APIKey.is_active)
        .count()
    )

    if existing_keys >= 10:  # Limit to 10 API keys per user
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of API keys reached (10)",
        )

    # Create the API key
    api_key = AuthService.create_api_key_for_user(
        db=db, user=user, key_name=request.name, tier=request.tier
    )

    # Get the key prefix for response
    key_prefix = api_key[:20] + "..."

    return CreateAPIKeyResponse(
        api_key=api_key,
        key_prefix=key_prefix,
        name=request.name,
        tier=request.tier,
        message="API key created successfully! Please save it - it won't be shown again.",
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    neon_auth_user: dict = Depends(validate_neon_auth_token),
    db: Session = Depends(get_db),
):
    """
    Get user profile information and API keys for authenticated Neon Auth user.
    """
    user = (
        db.query(User)
        .filter(User.neon_auth_user_id == neon_auth_user["user_id"])
        .first()
    )

    if not user:
        # Create user if they don't exist
        user = AuthService.create_user_from_neon_auth(
            db=db,
            neon_auth_user_id=neon_auth_user["user_id"],
            email=neon_auth_user["email"],
            name=neon_auth_user.get("name"),
        )

    # Get all API keys for this user
    api_keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user.id, APIKey.is_active)
        .all()
    )

    api_keys_data = []
    for key in api_keys:
        api_keys_data.append(
            {
                "id": str(key.id),
                "name": key.name,
                "key_prefix": key.key_prefix,
                "tier": key.tier,
                "created_at": key.created_at,
                "last_used": key.last_used,
            }
        )

    return UserProfileResponse(
        user_id=str(user.id),
        neon_auth_user_id=user.neon_auth_user_id,
        email=user.email,
        name=user.name,
        role=user.role,
        rate_limit_exempt=user.rate_limit_exempt,
        created_at=user.created_at,
        last_login=user.last_login,
        api_keys=api_keys_data,
    )


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    neon_auth_user: dict = Depends(validate_neon_auth_token),
    db: Session = Depends(get_db),
):
    """
    Delete an API key for authenticated Neon Auth user.
    """
    user = (
        db.query(User)
        .filter(User.neon_auth_user_id == neon_auth_user["user_id"])
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Find the API key to delete
    key_to_delete = (
        db.query(APIKey)
        .filter(
            APIKey.id == key_id, APIKey.user_id == user.id, APIKey.is_active == True
        )
        .first()
    )

    if not key_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="API key not found"
        )

    # Check if this is the user's last API key
    active_keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user.id, APIKey.is_active)
        .count()
    )

    if active_keys <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your last API key",
        )

    # Deactivate the key
    key_to_delete.is_active = False
    db.commit()

    return {"message": "API key deleted successfully"}
