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
from backend.app.models import User


router = APIRouter()


# Request/Response Models for Neon Auth Integration
class NeonAuthUserRequest(BaseModel):
    neon_auth_user_id: str
    email: EmailStr
    name: Optional[str] = None


class UserProfileResponse(BaseModel):
    user_id: str
    neon_auth_user_id: Optional[str]
    email: str
    name: Optional[str]
    role: str
    created_at: datetime
    last_login: Optional[datetime]


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

    return UserProfileResponse(
        user_id=str(user.id),
        neon_auth_user_id=user.neon_auth_user_id,
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=user.created_at,
        last_login=user.last_login,
    )


# API key management is no longer supported - authentication is now handled via Stack Auth JWT tokens
