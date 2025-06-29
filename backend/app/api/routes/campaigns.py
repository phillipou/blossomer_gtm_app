from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List
from backend.app.models import APIKey
from backend.app.core.auth import rate_limit_dependency
from backend.app.core.database import get_db
from sqlalchemy.orm import Session


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
    api_key_record: APIKey = Depends(rate_limit_dependency("positioning")),  # type: ignore
    db: Session = Depends(get_db),
):
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
