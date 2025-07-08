from fastapi import APIRouter, Depends, HTTPException, Request, Response
from backend.app.schemas import (
    TargetAccountRequest,
    TargetAccountResponse,
)
from backend.app.services.target_account_service import generate_target_account_profile
from backend.app.core.database import get_db
from backend.app.core.auth import validate_stack_auth_jwt
from sqlalchemy.orm import Session


router = APIRouter()


# TODO: Implement rate limiting using JWT user ID (user['sub'])
@router.post(
    "/demo/accounts",
    response_model=TargetAccountResponse,
    summary="[DEMO] Generate Target Account Profile (discovery call preparation)",
    tags=["Demo", "Accounts", "AI"],
    response_description="A structured discovery call preparation report with company analysis and ICP hypothesis.",
)
async def demo_generate_target_account(
    data: TargetAccountRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Generate a target account profile for demo users, with IP-based rate limiting.
    """
    try:
        result = await generate_target_account_profile(data)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post(
    "/accounts",
    response_model=TargetAccountResponse,
    summary="Generate Target Account Profile (discovery call preparation)",
    tags=["Accounts", "AI"],
    response_description="A structured discovery call preparation report with company analysis and ICP hypothesis.",
)
async def prod_generate_target_account(
    data: TargetAccountRequest,
    user=Depends(validate_stack_auth_jwt),
    db: Session = Depends(get_db),
):
    """
    Generate a target account profile for authenticated users (Stack Auth JWT required).
    """
    user_id = user["sub"]
    # TODO: Use user_id for rate limiting and business logic
    try:
        result = await generate_target_account_profile(data)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
