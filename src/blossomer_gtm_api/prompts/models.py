"""
models.py - Pydantic models for prompt template variables.
"""

from typing import List, Optional, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field


# ==============================================================================
# 1. IDEAL CUSTOMER PROFILE (ICP)
# ==============================================================================


class ICPPromptVars(BaseModel):
    """
    Variables for the icp.jinja2 prompt template.
    """

    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation."
    )
    llm_inferred_context: Optional[str] = Field(
        None,
        description="Optional context inferred from previous endpoints for chaining.",
    )
    website_content: Optional[str] = Field(
        None, description="The preprocessed content from the company's website."
    )


# ==============================================================================
# 2. PRODUCT OVERVIEW
# ==============================================================================


class ProductOverviewPromptVars(BaseModel):
    """
    Variables for the product_overview.jinja2 prompt template.
    """

    website_content: str = Field(
        ..., description="The preprocessed content from the company's website."
    )
    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation."
    )
    llm_inferred_context: Optional[str] = Field(
        None,
        description="Optional context inferred from previous endpoints for chaining.",
    )
    context_quality: Optional[str] = Field(
        None, description="Context quality assessment from orchestrator."
    )
    assessment_summary: Optional[str] = Field(
        None, description="Summary of context assessment."
    )


class ContextQuality(str, Enum):
    """Overall context quality assessment."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT = "insufficient"


class DataPresence(str, Enum):
    """Presence level for specific data types."""

    COMPREHENSIVE = "comprehensive"
    ADEQUATE = "adequate"
    MINIMAL = "minimal"
    MISSING = "missing"


class ContentSection(BaseModel):
    """
    Assessment of a specific content section (e.g., product features, pricing).
    """

    section_type: str = Field(
        ...,
        description="Type of content (e.g., 'product_features', 'pricing', 'customers')",
    )
    presence: DataPresence = Field(
        ...,
        description="Level of information present",
    )
    quality_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Quality score 0-1",
    )
    key_insights: List[str] = Field(
        default_factory=list,
        description="Key information extracted",
    )
    gaps: List[str] = Field(
        default_factory=list,
        description="Missing information",
    )


class EndpointReadiness(BaseModel):
    """
    Readiness assessment for a specific endpoint.
    """

    endpoint: str = Field(
        ...,
        description="Endpoint name (e.g., 'product_overview', 'target_company')",
    )
    is_ready: bool = Field(
        ...,
        description="Whether sufficient context exists",
    )
    confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="Confidence score 0-1",
    )
    missing_requirements: List[str] = Field(
        default_factory=list,
        description="What's needed for this endpoint",
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="How to improve readiness",
    )


class ContextAssessmentVars(BaseModel):
    """
    Variables for context assessment prompt template.
    """

    website_content: str
    target_endpoint: Optional[str] = None
    user_context: Optional[Dict[str, Any]] = None


class ContextAssessmentResult(BaseModel):
    """
    Comprehensive context quality assessment result from the LLM.
    This model structures the LLM's assessment of website content quality.
    """

    overall_quality: ContextQuality = Field(
        ...,
        description="Overall quality assessment of the website content",
    )
    overall_confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="Overall confidence score (0-1) in the assessment",
    )
    content_sections: List[ContentSection] = Field(
        ...,
        description="Detailed assessment of each content section found",
    )
    company_clarity: Dict[str, Any] = Field(
        ...,
        description="Assessment of how clearly the company's purpose is communicated",
    )
    endpoint_readiness: List[EndpointReadiness] = Field(
        ...,
        description="Readiness assessment for each GTM endpoint",
    )
    data_quality_metrics: Dict[str, float] = Field(
        ...,
        description="Specific quality metrics",
    )
    recommendations: Dict[str, List[str]] = Field(
        ...,
        description="Recommendations for improving context quality",
    )
    summary: str = Field(
        ...,
        description="2-3 sentence summary of the context assessment",
    )

    class Config:
        schema_extra = {
            "example": {
                "overall_quality": "medium",
                "overall_confidence": 0.75,
                "content_sections": [
                    {
                        "section_type": "product_features",
                        "presence": "comprehensive",
                        "quality_score": 0.85,
                        "key_insights": [
                            "AI-powered automation",
                            "Real-time dashboards",
                        ],
                        "gaps": ["Technical architecture details"],
                    }
                ],
                "company_clarity": {
                    "product_understanding": "clear",
                    "value_proposition": "clear",
                    "target_market": "somewhat_clear",
                    "differentiators": "adequate",
                },
                "endpoint_readiness": [
                    {
                        "endpoint": "product_overview",
                        "is_ready": True,
                        "confidence": 0.90,
                        "missing_requirements": [],
                        "recommendations": [],
                    },
                    {
                        "endpoint": "target_company",
                        "is_ready": False,
                        "confidence": 0.40,
                        "missing_requirements": [
                            "Clear industry focus",
                            "Company size indicators",
                        ],
                        "recommendations": [
                            "Add case studies",
                            "Clarify ideal customer profile",
                        ],
                    },
                ],
                "data_quality_metrics": {
                    "content_completeness": 0.75,
                    "information_specificity": 0.60,
                    "data_recency": 0.90,
                    "marketing_maturity": 0.70,
                },
                "recommendations": {
                    "immediate_actions": [
                        "Add customer testimonials",
                        "Clarify pricing model",
                    ],
                    "data_enrichment": [
                        "Analyze competitor websites",
                        "Extract LinkedIn company data",
                    ],
                    "user_input_needed": [
                        "Target company size",
                        "Geographic focus",
                    ],
                },
                "summary": (
                    "Website provides good product information but lacks clear customer targeting. "
                    "Sufficient for product overview but needs enrichment for ICP generation."
                ),
            }
        }


class TargetCompanyPromptVars(BaseModel):
    """
    Variables for the target_company.jinja2 prompt template.
    """

    website_content: Optional[str] = Field(
        None, description="The preprocessed content from the company's website."
    )
    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation."
    )
    llm_inferred_context: Optional[str] = Field(
        None,
        description="Optional context inferred from previous endpoints for chaining.",
    )


class TargetPersonaPromptVars(BaseModel):
    """
    Variables for the target_persona.jinja2 prompt template.
    """

    website_content: Optional[str] = Field(
        None, description="The preprocessed content from the company's website."
    )
    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation."
    )
    llm_inferred_context: Optional[str] = Field(
        None,
        description="Optional context inferred from previous endpoints for chaining.",
    )
