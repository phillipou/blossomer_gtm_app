"""
models.py - Pydantic models for prompt template variables.
"""

from typing import List, Optional

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


class ContextAssessmentResult(BaseModel):
    """
    Schema for the structured output from the ContextAssessment agent.
    """

    quality_score: float = Field(
        ...,
        description="Confidence score (0-1) of the context's quality and completeness.",
    )
    gaps: List[str] = Field(
        ...,
        description=(
            "List of specific information gaps identified in the content "
            "(e.g., 'pricing', 'technical_specifications')."
        ),
    )
    context_quality: str = Field(
        ...,
        description="Qualitative label for the context: 'high', 'partial', or 'insufficient'.",
    )


class ContextAssessmentVars(BaseModel):
    """
    Variables for the context_assessment.jinja2 prompt template.
    """

    website_content: str = Field(
        ...,
        description="The full, pre-processed text content of the company's website.",
    )
