"""
This module defines the ContextOrchestrator agent, which is responsible for
assessing context quality for campaign generation endpoints.
"""

from typing import Optional

from blossomer_gtm_api.prompts.models import (
    ContextAssessmentResult,
    ContextAssessmentVars,
)
from blossomer_gtm_api.prompts.registry import render_prompt
from blossomer_gtm_api.services.llm_service import LLMClient


class ContextOrchestrator:
    """
    An LLM-powered agent that assesses the quality of website content to determine
    if it's sufficient for generating high-quality marketing assets.
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def assess_context(
        self, website_content: str, user_context: Optional[dict] = None
    ) -> ContextAssessmentResult:
        """
        Uses an LLM to assess the quality of the provided website content.

        Args:
            website_content (str): The preprocessed content from the company's website.
            user_context (Optional[dict]): Optional user-provided context (reserved for future use).

        Returns:
            ContextAssessmentResult: A Pydantic model containing the structured
                                     assessment from the LLM.
        """
        prompt_vars = ContextAssessmentVars(website_content=website_content)
        prompt = render_prompt("context_assessment", prompt_vars)

        response_model = await self.llm_client.generate_structured_output(
            prompt=prompt, response_model=ContextAssessmentResult
        )
        return response_model
