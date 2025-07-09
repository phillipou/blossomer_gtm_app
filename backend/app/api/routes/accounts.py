from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.app.schemas import (
    TargetAccountRequest,
    TargetAccountResponse,
    AccountCreate, AccountUpdate, AccountResponse, AccountWithRelations
)
from backend.app.services.target_account_service import generate_target_account_profile
from backend.app.services.database_service import DatabaseService
from backend.app.core.database import get_db
from backend.app.core.auth import validate_stack_auth_jwt
from backend.app.core.user_rate_limiter import jwt_rate_limit_dependency
from sqlalchemy.orm import Session

from .helpers import run_service


router = APIRouter()


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
    _: None = Depends(jwt_rate_limit_dependency("account_generate")),
):
    """
    Generate a target account profile for authenticated users (Stack Auth JWT required).
    """
    return await run_service(generate_target_account_profile, data=data)


# CRUD Operations for Account Management
# =====================================

@router.post("/accounts-crud", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    company_id: UUID = Query(..., description="Company ID to create account for"),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Create a new account for a company.
    
    - **company_id**: Company ID (must be owned by authenticated user)
    - **name**: Account name (required, max 255 chars)
    - **account_data**: JSON data with firmographics, buying signals, rationale
    """
    db_service = DatabaseService(db)
    return db_service.create_account(account_data, company_id, user["sub"])


@router.get("/accounts-crud", response_model=List[AccountResponse])
async def get_accounts(
    company_id: UUID = Query(..., description="Company ID to get accounts for"),
    skip: int = Query(0, ge=0, description="Number of accounts to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of accounts to return"),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get all accounts for a company.
    
    - **company_id**: Company ID (must be owned by authenticated user)
    - **skip**: Number of accounts to skip (for pagination)
    - **limit**: Maximum number of accounts to return (1-1000)
    """
    db_service = DatabaseService(db)
    return db_service.get_accounts(company_id, user["sub"], skip=skip, limit=limit)


@router.get("/accounts-crud/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get a specific account by ID.
    
    Only returns accounts owned by the authenticated user (via company).
    """
    db_service = DatabaseService(db)
    return db_service.get_account(account_id, user["sub"])


@router.get("/accounts-crud/{account_id}/relations", response_model=AccountWithRelations)
async def get_account_with_relations(
    account_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get an account with all related personas and campaigns.
    
    Only returns accounts owned by the authenticated user (via company).
    Includes nested persona and campaign data.
    """
    db_service = DatabaseService(db)
    return db_service.get_account_with_relations(account_id, user["sub"])


@router.put("/accounts-crud/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: UUID,
    account_data: AccountUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Update an account.
    
    Only updates accounts owned by the authenticated user (via company).
    All fields are optional - only provided fields will be updated.
    """
    db_service = DatabaseService(db)
    return db_service.update_account(account_id, account_data, user["sub"])


@router.delete("/accounts-crud/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Delete an account and all related data.
    
    Only deletes accounts owned by the authenticated user (via company).
    This will cascade delete all personas and campaigns.
    """
    db_service = DatabaseService(db)
    db_service.delete_account(account_id, user["sub"])
    return None
