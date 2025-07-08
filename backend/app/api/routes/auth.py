from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from backend.app.core.database import get_db
from backend.app.core.auth import AuthService, authenticate_api_key
from backend.app.models import User, APIKey


router = APIRouter()


# Request/Response Models
class UserSignupRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserSignupResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str]
    api_key: str
    message: str


class APIKeyValidationResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    tier: Optional[str] = None
    rate_limit_exempt: Optional[bool] = None
    created_at: Optional[datetime] = None
    last_used: Optional[datetime] = None


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str]
    role: str
    rate_limit_exempt: bool
    created_at: datetime
    last_login: Optional[datetime]
    api_keys: List[dict]


class CreateAPIKeyRequest(BaseModel):
    name: str
    tier: str = "free"


class CreateAPIKeyResponse(BaseModel):
    api_key: str
    key_prefix: str
    name: str
    tier: str
    message: str


# Auth Endpoints


@router.post("/signup", response_model=UserSignupResponse)
async def signup(request: UserSignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account with an API key.
    """
    try:
        user, api_key = AuthService.create_user_with_api_key(
            db=db, email=request.email, name=request.name, key_name="Default API Key"
        )

        return UserSignupResponse(
            user_id=str(user.id),
            email=user.email,
            name=user.name,
            api_key=api_key,
            message="Account created successfully! Please save your API key - it won't be shown again.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}",
        )


@router.post("/validate", response_model=APIKeyValidationResponse)
async def validate_api_key(
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db),
):
    """
    Validate an API key and return user information.
    """
    user = api_key_record.user

    return APIKeyValidationResponse(
        valid=True,
        user_id=str(user.id),
        email=user.email,
        name=user.name,
        tier=api_key_record.tier,
        rate_limit_exempt=user.rate_limit_exempt,
        created_at=api_key_record.created_at,
        last_used=api_key_record.last_used,
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db),
):
    """
    Get user profile information and API keys.
    """
    user = api_key_record.user

    # Get all API keys for this user
    api_keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user.id, APIKey.is_active == True)
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
        email=user.email,
        name=user.name,
        role=user.role,
        rate_limit_exempt=user.rate_limit_exempt,
        created_at=user.created_at,
        last_login=user.last_login,
        api_keys=api_keys_data,
    )


@router.post("/api-keys", response_model=CreateAPIKeyResponse)
async def create_api_key(
    request: CreateAPIKeyRequest,
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db),
):
    """
    Create a new API key for the authenticated user.
    """
    user = api_key_record.user

    # Check if user already has too many API keys
    existing_keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user.id, APIKey.is_active == True)
        .count()
    )

    if existing_keys >= 10:  # Limit to 10 API keys per user
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of API keys reached (10)",
        )

    full_key, key_hash, key_prefix = AuthService.generate_api_key(request.tier)

    new_api_key = APIKey(
        user_id=user.id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=request.name,
        tier=request.tier,
    )

    db.add(new_api_key)
    db.commit()

    return CreateAPIKeyResponse(
        api_key=full_key,
        key_prefix=key_prefix,
        name=request.name,
        tier=request.tier,
        message="API key created successfully! Please save it - it won't be shown again.",
    )


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    api_key_record: APIKey = Depends(authenticate_api_key),
    db: Session = Depends(get_db),
):
    """
    Delete an API key (deactivate it).
    """
    user = api_key_record.user

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

    # Don't allow deleting the current API key
    if key_to_delete.id == api_key_record.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the API key you're currently using",
        )

    # Check if this is the user's last API key
    active_keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user.id, APIKey.is_active == True)
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
