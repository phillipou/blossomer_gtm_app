from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from typing import List
from backend.app.core.database import get_db
from backend.app.schemas import EmailGenerationRequest, EmailGenerationResponse
from backend.app.services.email_generation_service import (
    generate_email_campaign_service,
)
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from sqlalchemy.orm import Session
from backend.app.core.demo_rate_limiter import demo_ip_rate_limit_dependency
from backend.app.core.user_rate_limiter import jwt_rate_limit_dependency
from backend.app.core.auth import validate_stack_auth_jwt
import logging


class UniqueSellingPoint(BaseModel):
    theme: str = Field(..., description="USP name or theme")
    description: str = Field(..., description="Brief benefit or outcome")
    evidence: List[str] = Field(..., description="Supporting details or explanations")


class PositioningResponse(BaseModel):
    unique_insight: str = Field(
        ...,
        description=("Core reframe of the problem (unique insight)"),
    )
    unique_selling_points: List[UniqueSellingPoint] = Field(
        ...,
        description=("List of unique selling points (USPs)"),
    )


router = APIRouter()


@router.post(
    "/positioning",
    response_model=PositioningResponse,
    summary="Generate Unique Insight and Unique Selling Points",
    tags=["Campaigns", "Positioning", "AI"],
    response_description=(
        "A unique insight and a list of unique selling points for the given company context."
    ),
)
async def generate_positioning(
    data: dict,  # Should be replaced with a proper request model if available
    user=Depends(validate_stack_auth_jwt),
    db: Session = Depends(get_db),
    _: None = Depends(jwt_rate_limit_dependency("campaign_generate")),
):
    user_id = user['sub']
    # Placeholder implementation, replace with actual logic as needed
    return PositioningResponse(
        unique_insight=(
            "Most B2B marketing tools focus on automation, but the real bottleneck is "
            "understanding what actually resonates with buyers. Blossomer reframes the "
            "problem: it's not about sending more messages, but about crafting the right "
            "message for the right ICP at the right time."
        ),
        unique_selling_points=[
            UniqueSellingPoint(
                theme="Buyer-Centric Messaging",
                description=(
                    "Delivers messaging tailored to the emotional and practical needs of "
                    "your ICP."
                ),
                evidence=[
                    "Analyzes ICP pain points and language",
                    "Adapts messaging based on real buyer feedback",
                ],
            ),
            UniqueSellingPoint(
                theme="Rapid Time to Value",
                description=("Get actionable campaign assets in minutes, not weeks."),
                evidence=[
                    "Automated campaign generation",
                    "No manual copywriting required",
                ],
            ),
        ],
    )


@router.post(
    "/generate-email",
    response_model=EmailGenerationResponse,
    summary="Generate Email Campaign",
    tags=["Campaigns", "Email Generation", "AI"],
    response_description="A complete email campaign with subjects, body segments, and breakdown metadata.",
)
async def generate_email(
    request: EmailGenerationRequest,
    user=Depends(validate_stack_auth_jwt),
    db: Session = Depends(get_db),
    _: None = Depends(jwt_rate_limit_dependency("campaign_generate")),
):
    user_id = user['sub']
    """
    Generate a personalized email campaign based on company context, target account/persona,
    and user preferences from the Email Campaign Wizard.

    This endpoint synthesizes:
    - Company overview and capabilities
    - Target account firmographics and buying signals
    - Target persona demographics and use cases
    - User preferences for emphasis, opening line strategy, and CTA type

    Returns structured email content with modular segments and metadata for UI rendering.
    """
    try:
        # Get orchestrator instance
        orchestrator = ContextOrchestrator()

        # Generate email campaign using the service
        result = await generate_email_campaign_service(
            data=request, orchestrator=orchestrator
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=(f"Failed to generate email campaign: {str(e)}")
        )


@router.post(
    "/demo/campaigns/generate-email",
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
    logger = logging.getLogger(__name__)
    logger.info(f"[DEMO] Incoming EmailGenerationRequest: {request}")
    print("[DEMO] Incoming EmailGenerationRequest:", request)
    try:
        orchestrator = ContextOrchestrator()
        result = await generate_email_campaign_service(
            data=request, orchestrator=orchestrator
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=(f"Failed to generate email campaign: {str(e)}")
        )
