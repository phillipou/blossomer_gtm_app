import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from blossomer_gtm_api.services.llm_service import LLMClient, OpenAIProvider
from blossomer_gtm_api.schemas import (
    ProductOverviewRequest,
    ProductOverviewResponse,
    TargetCompanyRequest,
    TargetCompanyResponse,
    TargetPersonaRequest,
    TargetPersonaResponse,
)
from blossomer_gtm_api.services.context_orchestrator import ContextOrchestrator
from blossomer_gtm_api.services.product_overview_service import (
    generate_product_overview_service,
)
from blossomer_gtm_api.services.target_company_service import (
    generate_target_company_profile,
)
from blossomer_gtm_api.services.target_persona_service import (
    generate_target_persona_profile,
)
from blossomer_gtm_api.auth import rate_limit_dependency
from blossomer_gtm_api.database import get_db
from blossomer_gtm_api.models import APIKey
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.DEBUG)
logging.debug("DEBUG LOGGING IS ENABLED")

load_dotenv()

app = FastAPI()

# Register auth endpoints router if implemented
# try:
#     from blossomer_gtm_api.auth_endpoints import router as auth_router
#     app.include_router(auth_router)
# except ImportError:
#     pass

llm_client = LLMClient([OpenAIProvider()])  # Instantiate once for reuse


class PositioningRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    description: str = Field(..., description="Company overview or product description")
    icp: Optional[str] = Field(
        None, description="Ideal Customer Profile or customer hypotheses (optional)"
    )

    class Config:
        schema_extra = {
            "example": {
                "website_url": "https://example.com",
                "description": "AI-powered marketing automation for SMBs",
                "icp": "B2B SaaS startups",
            }
        }


class UniqueSellingPoint(BaseModel):
    theme: str = Field(..., description="USP name or theme")
    description: str = Field(..., description="Brief benefit or outcome")
    evidence: List[str] = Field(..., description="Supporting details or explanations")

    class Config:
        schema_extra = {
            "example": {
                "theme": "Buyer-Centric Messaging",
                "description": (
                    "Delivers messaging tailored to the emotional and practical needs of your ICP."
                ),
                "evidence": [
                    "Analyzes ICP pain points and language",
                    "Adapts messaging based on real buyer feedback",
                ],
            }
        }


class PositioningResponse(BaseModel):
    unique_insight: str = Field(
        ...,
        description=("Core reframe of the problem (unique insight)"),
    )
    unique_selling_points: List[UniqueSellingPoint] = Field(
        ...,
        description=("List of unique selling points (USPs)"),
    )

    class Config:
        schema_extra = {
            "example": {
                "unique_insight": (
                    "Most B2B marketing tools focus on automation, but the real bottleneck is "
                    "understanding what actually resonates with buyers. Blossomer reframes the "
                    "problem: it's not about sending more messages, but about crafting the right "
                    "message for the right ICP at the right time."
                ),
                "unique_selling_points": [
                    {
                        "theme": "Buyer-Centric Messaging",
                        "description": (
                            "Delivers messaging tailored to the emotional and practical needs of "
                            "your ICP."
                        ),
                        "evidence": [
                            "Analyzes ICP pain points and language",
                            "Adapts messaging based on real buyer feedback",
                        ],
                    },
                    {
                        "theme": "Rapid Time to Value",
                        "description": (
                            "Get actionable campaign assets in minutes, not weeks."
                        ),
                        "evidence": [
                            "Automated campaign generation",
                            "No manual copywriting required",
                        ],
                    },
                ],
            }
        }


@app.post(
    "/campaigns/positioning",
    response_model=PositioningResponse,
    summary="Generate Unique Insight and Unique Selling Points",
    tags=["Campaigns", "Positioning", "AI"],
    response_description=(
        "A unique insight and a list of unique selling points for the given company context."
    ),
)
async def generate_positioning(
    data: PositioningRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("positioning")),  # type: ignore
    db: Session = Depends(get_db),
):
    """
    Generate a Unique Insight (core reframe) and Unique Selling Points (USPs) for a B2B startup.

    - **Purpose:** Generate a Unique Insight and USPs based on company description, website, and
      (optionally) ICP.
    - **Follows:** API design best practices and the unique insight/USP methodology described in the
      project documentation.
    - **Request Example:**
        {
            "website_url": "https://example.com",
            "description": "AI-powered marketing automation for SMBs",
            "icp": "B2B SaaS startups"
        }
    - **Response Example:**
        {
            "unique_insight": (
                "Most B2B marketing tools focus on automation, but the real bottleneck is "
                "understanding what actually resonates with buyers. "
                "It's not about volume, but about crafting the right message for the "
                "right ICP at the right time."
            ),
            "unique_selling_points": [
                {
                    "theme": "Buyer-Centric Messaging",
                    "description": (
                        "Delivers messaging tailored to the emotional and practical needs of "
                        "your ICP."
                    ),
                    "evidence": [
                        "Analyzes ICP pain points and language",
                        "Adapts messaging based on real buyer feedback"
                    ]
                },
                {
                    "theme": "Rapid Time to Value",
                    "description": (
                        "Get actionable campaign assets in minutes, not weeks."
                    ),
                    "evidence": [
                        "Automated campaign generation",
                        "No manual copywriting required"
                    ]
                }
            ]
        }
    """
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


@app.post(
    "/campaigns/product_overview",
    response_model=ProductOverviewResponse,
    summary="Generate Product Overview (features, company & persona profiles, pricing)",
    tags=["Campaigns", "Product Overview", "AI"],
    response_description="A structured product overview for the given company context.",
)
async def generate_product_overview(
    data: ProductOverviewRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("product_overview")),  # type: ignore
    db: Session = Depends(get_db),
):
    orchestrator = ContextOrchestrator(llm_client)
    return await generate_product_overview_service(data, orchestrator, llm_client)


@app.post(
    "/campaigns/target_company",
    response_model=TargetCompanyResponse,
    summary="Generate Target Company Profile (firmographics, buying signals, rationale)",
    tags=["Campaigns", "Target Company", "AI"],
    response_description="A structured target company profile for the given company context.",
)
async def generate_target_company(
    data: TargetCompanyRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("target_company")),  # type: ignore
    db: Session = Depends(get_db),
):
    orchestrator = ContextOrchestrator(llm_client)
    return await generate_target_company_profile(data, orchestrator, llm_client)


@app.post(
    "/campaigns/target_persona",
    response_model=TargetPersonaResponse,
    summary="Generate Target Persona Profile (attributes, buying signals, rationale)",
    tags=["Campaigns", "Target Persona", "AI"],
    response_description="A structured target persona profile for the given company context.",
)
async def generate_target_persona(
    data: TargetPersonaRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("target_persona")),  # type: ignore
    db: Session = Depends(get_db),
):
    orchestrator = ContextOrchestrator(llm_client)
    return await generate_target_persona_profile(data, orchestrator, llm_client)


@app.get("/health")
def health_check():
    return {"status": "ok"}
