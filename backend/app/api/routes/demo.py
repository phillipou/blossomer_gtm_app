"""
Demo endpoints for unauthenticated users.

This router provides endpoints for demonstration purposes, with IP-based rate limiting
instead of JWT authentication. These routes mirror the functionality of the core AI
generation endpoints but are intended for trial usage.
"""
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.demo_rate_limiter import demo_ip_rate_limit_dependency
from backend.app.schemas import (
    ProductOverviewRequest,
    ProductOverviewResponse,
    TargetAccountRequest,
    TargetAccountResponse,
    TargetPersonaRequest,
    TargetPersonaResponse,
    EmailGenerationRequest,
    EmailGenerationResponse,
)
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.email_generation_service import (
    generate_email_campaign_service,
)
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.services.target_account_service import generate_target_account_profile
from backend.app.services.target_persona_service import generate_target_persona_profile

from .helpers import run_service

router = APIRouter()


@router.post(
    "/company/overview",
    response_model=ProductOverviewResponse,
    summary="[DEMO] Generate Company Overview (features, company & persona profiles, pricing)",
    tags=["Demo", "Company", "Overview", "AI"],
    response_description="A structured company overview for the given company context.",
)
async def demo_generate_product_overview(
    data: ProductOverviewRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _: None = Depends(demo_ip_rate_limit_dependency("company_generate")),
):
    """
    Generate a company overview for demo users, with IP-based rate limiting.
    """
    orchestrator = ContextOrchestrator()
    return await run_service(
        generate_product_overview_service, data=data, orchestrator=orchestrator
    )


@router.post(
    "/accounts",
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
    return await run_service(generate_target_account_profile, data=data)


@router.post(
    "/personas",
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
    return await run_service(generate_target_persona_profile, data=data)


@router.post(
    "/campaigns/generate-email",
    response_model=EmailGenerationResponse,
    summary="[DEMO] Generate Email Campaign",
    tags=["Demo", "Campaigns", "Email Generation", "AI"],
    response_description="A complete email campaign with subjects, body segments, and breakdown metadata.",
)
async def demo_generate_email(
    request: EmailGenerationRequest,
    req: Request,
    res: Response,
    db: Session = Depends(get_db),
    _: None = Depends(demo_ip_rate_limit_dependency("email_generation")),
):
    """
    Generate a personalized email campaign for demo users,
    with IP-based rate limiting.
    """
    orchestrator = ContextOrchestrator()
    return await run_service(
        generate_email_campaign_service, data=request, orchestrator=orchestrator
    ) 