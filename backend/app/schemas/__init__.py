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
    company_context: Optional[str] = Field(
        None,
        description="Optional company context inferred from previous endpoints",
    )


class BusinessProfile(BaseModel):
    category: str = Field(..., description="5-6 words on product category")
    business_model: str = Field(
        ..., description="1-2 sentences on revenue streams and pricing"
    )
    existing_customers: str = Field(
        ..., description="1-3 sentences on customer evidence"
    )


class UseCaseAnalysis(BaseModel):
    process_impact: str = Field(
        ..., description="Primary process/workflow this product impacts"
    )
    problems_addressed: str = Field(
        ..., description="Problems and inefficiencies solved"
    )
    how_they_do_it_today: str = Field(
        ..., description="Current state/alternative approaches"
    )


class Positioning(BaseModel):
    key_market_belief: str = Field(
        ..., description="Unique POV on why current solutions fail"
    )
    unique_approach: str = Field(..., description="Differentiated value proposition")
    language_used: str = Field(..., description="Terminology and mental models used")


class ICPHypothesis(BaseModel):
    target_account_hypothesis: str = Field(..., description="Ideal customer profile")
    target_persona_hypothesis: str = Field(
        ..., description="Ideal stakeholder/decision-maker"
    )


class ProductOverviewResponse(BaseModel):
    company_name: str = Field(..., description="Official company name")
    company_url: str = Field(..., description="Canonical website URL")
    description: str = Field(
        ..., description="2-3 sentences on core identity and what they do"
    )
    business_profile: BusinessProfile = Field(
        ..., description="Business category, model, and customer evidence"
    )
    capabilities: List[str] = Field(..., description="Key features and capabilities")
    use_case_analysis: UseCaseAnalysis = Field(
        ..., description="Process impact and problems solved"
    )
    positioning: Positioning = Field(
        ..., description="Market positioning and differentiation"
    )
    objections: List[str] = Field(..., description="Common objections and concerns")
    icp_hypothesis: ICPHypothesis = Field(
        ..., description="Target customer and persona hypothesis"
    )
    metadata: Dict[str, Any] = Field(
        ..., description="Analysis metadata and quality scores"
    )


class TargetAccountRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    account_profile_name: Optional[str] = Field(
        None,
        description=(
            "Name of the target account profile "
            "(e.g., 'Mid-market SaaS companies', 'Enterprise healthcare organizations')"
        ),
    )
    hypothesis: Optional[str] = Field(
        None,
        description="User's hypothesis about why this account profile is ideal for the solution",
    )
    additional_context: Optional[str] = Field(
        None,
        description="Additional user-provided context for target account generation",
    )
    company_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Company context from previous endpoints (e.g., company/generate output)",
    )


class CompanySummary(BaseModel):
    description: str = Field(
        ...,
        description="2-3 sentences on core identity, what they do, and business model",
    )
    category: str = Field(
        ..., description="5-6 words on product category (e.g. AI-powered Sales Tool)"
    )
    business_model: str = Field(
        ..., description="1-2 sentences on revenue streams, pricing, sales model"
    )
    existing_customers: str = Field(
        ..., description="1-3 sentences on customer evidence from website"
    )


class TargetAccountResponse(BaseModel):
    """
    Response model for the /customers/target_accounts endpoint (matches new prompt output).
    """

    company_name: str = Field(..., description="Official company name")
    company_url: str = Field(..., description="Input website URL")
    company_summary: CompanySummary = Field(
        ..., description="Company overview and business details"
    )
    capabilities: List[str] = Field(
        ...,
        description="Key features and capabilities (format: 'Feature Name: Description')",
    )
    use_case_analysis: UseCaseAnalysis = Field(
        ..., description="Process impact and problems solved"
    )
    positioning: Positioning = Field(
        ..., description="Market positioning and differentiation"
    )
    objections: List[str] = Field(
        ..., description="Common objections (format: 'Title: Description')"
    )
    icp_hypothesis: ICPHypothesis = Field(
        ..., description="Target customer and persona hypothesis"
    )
    metadata: Dict[str, Any] = Field(
        ..., description="Analysis metadata and quality scores"
    )


class TargetPersonaRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    user_inputted_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Flexible user-provided context for persona generation (JSON object)",
    )
    company_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Structured context about the analyzed company/product (JSON object)",
    )
    target_account_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Structured context about the ideal customer/company type (JSON object)",
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
    primary_responsibilities: List[str] = Field(
        ...,
        description=(
            "3-5 specific responsibilities this persona has that are directly related to the "
            "product or solution being considered. Focus on what this persona is accountable "
            "for or must achieve that connects to your product's value."
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
    confidence_scores: Optional[Dict[str, float]] = Field(
        None,
        description="Confidence/quality scores for each section (0-1)",
    )
    metadata: Dict[str, Any] = Field(
        ...,
        description=(
            "Additional metadata (sources, context quality, assessment summary, etc.)"
        ),
    )
