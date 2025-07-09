from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
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

from backend.app.api.helpers import run_service


router = APIRouter()


@router.post(
    "/personas/generate-ai",
    response_model=TargetPersonaResponse,
    summary="AI Generate Target Persona Profile (attributes, buying signals, rationale)",
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
    AI-generate a target persona profile for authenticated users (Stack Auth JWT required).
    """
    return await run_service(generate_target_persona_profile, data)


# CRUD Operations for Persona Management
# =====================================

@router.post("/personas", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
async def create_persona(
    persona_data: PersonaCreate,
    account_id: UUID = Query(..., description="Account ID to create persona for"),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Create a new persona for an account.
    """
    db_service = DatabaseService(db)
    return db_service.create_persona(persona_data, account_id, user["sub"])

@router.get("/personas", response_model=List[PersonaResponse])
async def get_personas(
    account_id: UUID = Query(..., description="Account ID to get personas for"),
    skip: int = Query(0, ge=0, description="Number of personas to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of personas to return"),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get all personas for an account.
    """
    db_service = DatabaseService(db)
    return db_service.get_personas(account_id, user["sub"], skip=skip, limit=limit)

@router.get("/personas/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get a specific persona by ID.
    """
    db_service = DatabaseService(db)
    return db_service.get_persona(persona_id, user["sub"])

@router.get("/personas/{persona_id}/relations", response_model=PersonaWithRelations)
async def get_persona_with_relations(
    persona_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Get a persona with all related campaigns.
    """
    db_service = DatabaseService(db)
    return db_service.get_persona_with_relations(persona_id, user["sub"])

@router.put("/personas/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: UUID,
    persona_data: PersonaUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Update a persona.
    """
    db_service = DatabaseService(db)
    return db_service.update_persona(persona_id, persona_data, user["sub"])

@router.delete("/personas/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt)
):
    """
    Delete a persona and all related campaigns.
    """
    db_service = DatabaseService(db)
    db_service.delete_persona(persona_id, user["sub"])
    return None
