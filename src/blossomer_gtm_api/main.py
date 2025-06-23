from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI()


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
async def generate_positioning(data: PositioningRequest):
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


@app.get("/health")
def health_check():
    return {"status": "ok"}
