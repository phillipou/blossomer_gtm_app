from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Query
from backend.app.schemas import (
    TargetPersonaRequest,
    TargetPersonaResponse,
    PersonaCreate, PersonaUpdate, PersonaResponse, PersonaWithRelations
)
from backend.app.services.target_persona_service import generate_target_persona_profile
from backend.app.services.database_service import DatabaseService
from backend.app.core.database import get_db
from backend.app.core.auth import validate_stack_auth_jwt
from backend.app.core.user_rate_limiter import jwt_rate_limit_dependency
from sqlalchemy.orm import Session


router = APIRouter()


@router.post(
    "/demo/personas",
    response_model=TargetPersonaResponse,
    summary="[DEMO] Generate Target Persona Profile (attributes, buying signals, rationale)",
    tags=["Demo", "Personas", "AI"],
    response_description="A structured target persona profile for the given company context.",
)
async def demo_generate_target_persona(
    data: TargetPersonaRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Generate a target persona profile for demo users, with IP-based rate limiting.
    """
    try:
        return await generate_target_persona_profile(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post(
    "/personas",
    response_model=TargetPersonaResponse,
    summary="Generate Target Persona Profile (attributes, buying signals, rationale)",
    tags=["Personas", "AI"],
    response_description="A structured target persona profile for the given company context.",
)
async def prod_generate_target_persona(
    data: TargetPersonaRequest,
    user=Depends(validate_stack_auth_jwt),
    db: Session = Depends(get_db),
    _: None = Depends(jwt_rate_limit_dependency("persona_generate")),
):
    """
    Generate a target persona profile for authenticated users (Stack Auth JWT required).
    """
    user_id = user["sub"]
    try:
        result = await generate_target_persona_profile(data)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# CRUD Operations for Persona Management
# =====================================

@router.post("/personas-crud", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
async def create_persona(
    persona_data: PersonaCreate,
    account_id: UUID = Query(..., description="Account ID to create persona for"),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Create a new persona for an account.
    
    - **account_id**: Account ID (must be owned by authenticated user via company)
    - **name**: Persona name (required, max 255 chars)
    - **persona_data**: JSON data with demographics, use cases, goals, objections
    """
    db_service = DatabaseService(db)
    return db_service.create_persona(persona_data, account_id, user["sub"])


@router.get("/personas-crud", response_model=List[PersonaResponse])
async def get_personas(
    account_id: UUID = Query(..., description="Account ID to get personas for"),
    skip: int = Query(0, ge=0, description="Number of personas to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of personas to return"),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get all personas for an account.
    
    - **account_id**: Account ID (must be owned by authenticated user via company)
    - **skip**: Number of personas to skip (for pagination)
    - **limit**: Maximum number of personas to return (1-1000)
    """
    db_service = DatabaseService(db)
    return db_service.get_personas(account_id, user["sub"], skip=skip, limit=limit)


@router.get("/personas-crud/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get a specific persona by ID.
    
    Only returns personas owned by the authenticated user (via account->company).
    """
    db_service = DatabaseService(db)
    return db_service.get_persona(persona_id, user["sub"])


@router.get("/personas-crud/{persona_id}/relations", response_model=PersonaWithRelations)
async def get_persona_with_relations(
    persona_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get a persona with all related campaigns.
    
    Only returns personas owned by the authenticated user (via account->company).
    Includes nested campaign data.
    """
    db_service = DatabaseService(db)
    return db_service.get_persona_with_relations(persona_id, user["sub"])


@router.put("/personas-crud/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: UUID,
    persona_data: PersonaUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Update a persona.
    
    Only updates personas owned by the authenticated user (via account->company).
    All fields are optional - only provided fields will be updated.
    """
    db_service = DatabaseService(db)
    return db_service.update_persona(persona_id, persona_data, user["sub"])


@router.delete("/personas-crud/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Delete a persona and all related campaigns.
    
    Only deletes personas owned by the authenticated user (via account->company).
    This will cascade delete all campaigns.
    """
    db_service = DatabaseService(db)
    db_service.delete_persona(persona_id, user["sub"])
    return None
