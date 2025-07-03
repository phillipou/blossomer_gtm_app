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
            "2-3 sentence summary of what the company does, their mission, and primary focus "
            "area."
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
    Response model for the /campaigns/target_company endpoint (matches new prompt output).
    """

    target_company_name: str = Field(
        ...,
        description="Short name for the target company (5 words max, from user context or inferred)",
    )
    target_company_description: str = Field(
        ..., description="Ideal company type and why they need this solution"
    )
    firmographics: Dict[str, Any] = Field(
        ...,
        description="Firmographic attributes: industry, company_size, geography, business_model, funding_stage",
    )
    buying_signals: Dict[str, Any] = Field(
        ...,
        description="Buying signals: growth_indicators, technology_signals, organizational_signals, market_signals",
    )
    rationale: str = Field(
        ..., description="Explanation of why these companies are ideal customers"
    )
    confidence_scores: Dict[str, float] = Field(
        ..., description="Confidence/quality scores for each section (0-1)"
    )
    metadata: Dict[str, Any] = Field(
        ...,
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
    Response model for the /customers/target_personas endpoint (matches new prompt output).
    """

    persona_name: str = Field(
        ...,
        description=(
            "A short, descriptive name for the persona (5 words max). "
            "Can be inferred from context if not explicitly provided."
        ),
    )
    persona_description: str = Field(
        ...,
        description=(
            "2-3 sentences describing who this person is, their role scope, "
            "and primary responsibilities within their organization."
        ),
    )
    likely_job_titles: List[str] = Field(
        ...,
        description=(
            "3-5 specific job titles this persona might have, including "
            "various seniority levels."
        ),
    )
    status_quo: str = Field(
        ...,
        description=(
            "Current processes, workflows, tools, and methods this persona uses "
            "that your product would impact or replace."
        ),
    )
    use_cases: List[str] = Field(
        ...,
        description=(
            "3-5 specific, exciting use cases this persona would want to implement "
            "with your product."
        ),
    )
    pain_points: List[str] = Field(
        ...,
        description=(
            "3-5 specific inefficiencies, challenges, and frustrations that prevent "
            "this persona from achieving their desired outcomes in their current role."
        ),
    )
    desired_outcomes: List[str] = Field(
        ...,
        description=(
            "3-5 measurable results or improvements this persona wants to achieve, "
            "focusing on business impact and personal success metrics."
        ),
    )
    key_concerns: List[str] = Field(
        ...,
        description=(
            "3-5 reservations, objections, or hesitations this persona typically has "
            "about solutions in your product category."
        ),
    )
    why_we_matter: List[str] = Field(
        ...,
        description=(
            "3-5 compelling reasons why your specific product stands out to this persona "
            "compared to alternatives or status quo."
        ),
    )
    persona_buying_signals: List[str] = Field(
        ...,
        description=(
            "Observable behaviors, triggers, or situations that indicate this persona is "
            "actively looking for a solution like yours."
        ),
    )
    rationale: str = Field(
        ...,
        description=(
            "Evidence-based explanation for why this is the primary persona, referencing "
            "specific elements from the provided context."
        ),
    )
    metadata: Dict[str, Any] = Field(
        ...,
        description=(
            "Additional metadata (sources, context quality, assessment summary, etc.)"
        ),
    )
