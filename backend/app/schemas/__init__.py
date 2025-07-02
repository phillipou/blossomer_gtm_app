"""
schemas.py - Centralized LLM output schemas for Blossomer GTM API

This module defines JSON schemas for LLM structured outputs, enabling reuse and validation.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ProductOverviewRequest(BaseModel):
    website_url: str = Field(
        ...,
        description="Company website or landing page URL",
    )
    user_inputted_context: Optional[str] = Field(
        None,
        description="Optional user-provided context for campaign generation",
    )
    llm_inferred_context: Optional[str] = Field(
        None,
        description="Optional context inferred from previous endpoints",
    )


class ProductOverviewResponse(BaseModel):
    company_name: str = Field(
        ...,
        description=(
            "The official name of the company as found on the website or in the provided "
            "context."
        ),
    )
    company_url: str = Field(
        ...,
        description=(
            "The canonical website URL for the company (should match the input or be extracted "
            "from the website if different)."
        ),
    )
    company_overview: str = Field(
        ...,
        description=(
            "2-3 sentence summary of what the company does, their mission, and primary focus area."
        ),
    )
    capabilities: List[str] = Field(
        ...,
        description=(
            "Technical capabilities, core product features, platform abilities, and key "
            "functionalities."
        ),
    )
    business_model: List[str] = Field(
        ...,
        description=(
            "How they make money, pricing approach, target market size, sales model, and "
            "revenue streams."
        ),
    )
    differentiated_value: List[str] = Field(
        ...,
        description=(
            "What sets them apart from competitors, unique approaches, proprietary technology, "
            "or market positioning."
        ),
    )
    customer_benefits: List[str] = Field(
        ...,
        description=(
            "Expected outcomes, ROI, efficiency gains, problem resolution, or value delivery "
            "for customers."
        ),
    )
    alternatives: List[str] = Field(
        ...,
        description=(
            "Similar services/competitors with brief comparison of similarities and key "
            "differences."
        ),
    )
    testimonials: List[str] = Field(
        ...,
        description=(
            "Up to 5 direct customer quotes found on the website, including attribution when "
            "available."
        ),
    )
    product_description: str = Field(..., description="Main product summary")
    key_features: List[str] = Field(
        ..., description="List of product features/benefits"
    )
    company_profiles: List[str] = Field(
        ..., description="Company/firmographic segments (e.g., industry, size, region)"
    )
    persona_profiles: List[str] = Field(
        ...,
        description="Persona/job role segments (e.g., job title, seniority, department)",
    )
    use_cases: List[str] = Field(
        ..., description="Use cases explicitly listed on the website"
    )
    pain_points: List[str] = Field(
        ..., description="Pain points explicitly listed on the website"
    )
    pricing: str = Field(..., description="Pricing information if available")
    confidence_scores: Dict[str, float] = Field(
        ..., description="Confidence/quality scores for each section (0-1)"
    )
    metadata: Dict[str, Any] = Field(
        ...,
        description="Additional metadata (sources, context quality, processing time, etc.)",
    )


class TargetCompanyRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation"
    )
    llm_inferred_context: Optional[str] = Field(
        None, description="Optional context inferred from previous endpoints"
    )


class TargetCompanyResponse(BaseModel):
    """
    Response model for the /campaigns/target_company endpoint.
    """

    target_company: str = Field(
        ...,
        description="Ideal company type and why they need this solution",
    )
    company_attributes: List[str] = Field(
        ...,
        description="Key company/firmographic attributes",
    )
    buying_signals: List[str] = Field(
        ...,
        description="Observable buying signals for this company type",
    )
    rationale: str = Field(
        ...,
        description="Explanation of why these companies are ideal customers",
    )
    confidence_scores: Optional[Dict[str, float]] = Field(
        None,
        description="Confidence/quality scores for each section (0-1)",
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata (sources, context quality, processing time, etc.)",
    )


class TargetPersonaRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation"
    )
    llm_inferred_context: Optional[str] = Field(
        None, description="Optional context inferred from previous endpoints"
    )


class TargetPersonaResponse(BaseModel):
    """
    Response model for the /campaigns/target_persona endpoint.
    """

    persona: str = Field(
        ...,
        description="Primary decision maker/influencer persona",
    )
    persona_attributes: List[str] = Field(
        ...,
        description="Key attributes of the persona",
    )
    persona_buying_signals: List[str] = Field(
        ...,
        description="Observable buying signals for this persona",
    )
    rationale: str = Field(
        ...,
        description="Explanation of why this persona is the ideal buyer",
    )
    confidence_scores: Optional[Dict[str, float]] = Field(
        None,
        description="Confidence/quality scores for each section (0-1)",
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata (sources, context quality, processing time, etc.)",
    )
