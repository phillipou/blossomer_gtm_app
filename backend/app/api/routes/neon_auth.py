import os
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Annotated
from datetime import datetime
from jose import jwt, JWTError
import requests
from functools import lru_cache

from backend.app.core.database import get_db
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


# --- Stack Auth JWT Validation ---
# Reads project ID from environment. Ensure you set STACK_PROJECT_ID in your .env file.
# For production, use the production project ID. For dev, use the dev project ID.
STACK_PROJECT_ID = os.environ.get("STACK_PROJECT_ID")
if not STACK_PROJECT_ID:
    raise RuntimeError(
        "STACK_PROJECT_ID not set in environment. Set this in your .env file."
    )
JWKS_URL = f"https://api.stack-auth.com/api/v1/projects/{STACK_PROJECT_ID}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_jwks():
    resp = requests.get(JWKS_URL)
    resp.raise_for_status()
    return resp.json()


def get_public_key(token):
    jwks = get_jwks()
    unverified_header = jwt.get_unverified_header(token)
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            return key
    raise HTTPException(status_code=401, detail="Public key not found for token.")


async def validate_stack_auth_token(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """
    Validate Stack Auth JWT token and return user info from claims.
    - Verifies JWT signature using Stack Auth public keys (JWKS)
    - Checks token expiration
    - Extracts user information from verified token
    - Returns user data (user_id, email, name, etc.)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    token = authorization.split(" ", 1)[1]
    try:
        public_key = get_public_key(token)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Set to True and provide audience if needed
        )
        # Extract user info from payload (customize as needed)
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            # Add more fields as needed
        }
    except JWTError as e:
        raise HTTPException(
            status_code=401, detail=f"Invalid Stack Auth token: {str(e)}"
        )


# Routes


@router.post("/sync-user")
async def sync_neon_auth_user(
    request: NeonAuthUserRequest,
    neon_auth_user: dict = Depends(validate_stack_auth_token),
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

    user = User(
        neon_auth_user_id=request.neon_auth_user_id,
        email=request.email,
        name=request.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User synced successfully",
        "user_id": str(user.id),
        "neon_auth_user_id": user.neon_auth_user_id,
    }


# TODO: Reimplement any needed endpoints using Stack Auth JWTs only


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    neon_auth_user: dict = Depends(validate_stack_auth_token),
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
        user = User(
            neon_auth_user_id=neon_auth_user["user_id"],
            email=neon_auth_user["email"],
            name=neon_auth_user.get("name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Get all API keys for this user
    api_keys = (
        db.query(APIKey).filter(APIKey.user_id == user.id, APIKey.is_active).all()
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
    neon_auth_user: dict = Depends(validate_stack_auth_token),
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
        db.query(APIKey).filter(APIKey.user_id == user.id, APIKey.is_active).count()
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
