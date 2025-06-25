"""
schemas.py - Centralized LLM output schemas for Blossomer GTM API

This module defines JSON schemas for LLM structured outputs, enabling reuse and validation.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

ICP_SCHEMA = {
    "type": "object",
    "properties": {
        "target_company": {"type": "string"},
        "company_attributes": {
            "type": "array",
            "items": {"type": "string"},
        },
        "buying_signals": {
            "type": "array",
            "items": {"type": "string"},
        },
        "persona": {"type": "string"},
        "persona_attributes": {
            "type": "array",
            "items": {"type": "string"},
        },
        "persona_buying_signals": {
            "type": "array",
            "items": {"type": "string"},
        },
        "rationale": {"type": "string"},
    },
    "required": [
        "target_company",
        "company_attributes",
        "buying_signals",
        "persona",
        "persona_attributes",
        "persona_buying_signals",
        "rationale",
    ],
}


class ProductOverviewRequest(BaseModel):
    website_url: str = Field(..., description="Company website or landing page URL")
    user_inputted_context: Optional[str] = Field(
        None, description="Optional user-provided context for campaign generation"
    )
    llm_inferred_context: Optional[str] = Field(
        None, description="Optional context inferred from previous endpoints"
    )


class ProductOverviewResponse(BaseModel):
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
    pricing: Optional[str] = Field(None, description="Pricing information if available")
    confidence_scores: Dict[str, float] = Field(
        ..., description="Confidence/quality scores for each section (0-1)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata (sources, context quality, processing time, etc.)",
    )
