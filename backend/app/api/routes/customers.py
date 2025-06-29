from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas import (
    TargetCompanyRequest,
    TargetCompanyResponse,
    TargetPersonaRequest,
    TargetPersonaResponse,
)
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.services.target_company_service import generate_target_company_profile
from backend.app.services.target_persona_service import generate_target_persona_profile
from backend.app.core.auth import rate_limit_dependency
from backend.app.core.database import get_db
from backend.app.models import APIKey
from backend.app.services.llm_service import LLMClient, OpenAIProvider
from sqlalchemy.orm import Session


router = APIRouter()

llm_client = LLMClient([OpenAIProvider()])


@router.post(
    "/target_accounts",
    response_model=TargetCompanyResponse,
    summary="Generate Target Account Profile (firmographics, buying signals, rationale)",
    tags=["Customers", "Target Accounts", "AI"],
    response_description="A structured target account profile for the given company context.",
)
async def generate_target_company(
    data: TargetCompanyRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("target_company")),  # type: ignore
    db: Session = Depends(get_db),
):
    orchestrator = ContextOrchestrator(llm_client)
    try:
        return await generate_target_company_profile(data, orchestrator, llm_client)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post(
    "/target_personas",
    response_model=TargetPersonaResponse,
    summary="Generate Target Persona Profile (attributes, buying signals, rationale)",
    tags=["Customers", "Target Personas", "AI"],
    response_description="A structured target persona profile for the given company context.",
)
async def generate_target_persona(
    data: TargetPersonaRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("target_persona")),  # type: ignore
    db: Session = Depends(get_db),
):
    orchestrator = ContextOrchestrator(llm_client)
    try:
        return await generate_target_persona_profile(data, orchestrator, llm_client)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
