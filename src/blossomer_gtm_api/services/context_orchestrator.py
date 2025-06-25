"""
This module defines the ContextOrchestrator agent, which is responsible for
assessing context quality for campaign generation endpoints.
"""

from typing import Optional, Dict, Any
import logging

from blossomer_gtm_api.prompts.models import (
    ContextAssessmentResult,
    ContextAssessmentVars,
    ContextQuality,
)
from blossomer_gtm_api.prompts.registry import render_prompt
from blossomer_gtm_api.services.llm_service import LLMClient
from blossomer_gtm_api.services.website_scraper import extract_website_content


class ContextOrchestrator:
    """
    An LLM-powered agent that assesses the quality of website content to determine
    if it's sufficient for generating high-quality marketing assets.
    Uses a rich, structured output model for granular feedback and recommendations.
    """

    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def assess_context(
        self,
        website_content: str,
        target_endpoint: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> ContextAssessmentResult:
        """
        Uses an LLM to assess the quality of the provided website content for GTM endpoints.

        Args:
            website_content (str): The preprocessed content from the company's website.
            target_endpoint (Optional[str]): The endpoint being assessed (e.g., 'product_overview').
            user_context (Optional[dict]): Optional user-provided context for campaign generation.

        Returns:
            ContextAssessmentResult: A Pydantic model containing the structured,
                rich assessment from the LLM.
        """
        if not website_content or not website_content.strip():
            return ContextAssessmentResult(
                overall_quality=ContextQuality.INSUFFICIENT,
                overall_confidence=0.0,
                content_sections=[],
                company_clarity={},
                endpoint_readiness=[],
                data_quality_metrics={},
                recommendations={},
                summary="No website content available. Unable to assess context quality.",
            )

        prompt_vars = ContextAssessmentVars(
            website_content=website_content,
            target_endpoint=target_endpoint,
            user_context=user_context,
        )
        prompt = render_prompt("context_assessment", prompt_vars)

        response_model = await self.llm_client.generate_structured_output(
            prompt=prompt, response_model=ContextAssessmentResult
        )
        return ContextAssessmentResult.parse_obj(response_model)

    @staticmethod
    async def assess_website_context(
        url: str,
        orchestrator: "ContextOrchestrator",
        target_endpoint: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
        crawl: bool = False,
    ) -> ContextAssessmentResult:
        """
        Orchestrate the full context assessment workflow for a website URL.

        Args:
            url (str): The website URL to analyze.
            orchestrator (ContextOrchestrator): The LLM-powered context orchestrator agent.
            target_endpoint (Optional[str]): The endpoint being assessed (e.g., 'product_overview').
            user_context (Optional[dict]): Optional user-provided context for campaign generation.
            crawl (bool): Whether to crawl the site (multi-page) or just scrape the main page.

        Returns:
            ContextAssessmentResult: The structured context assessment result.
        """
        logger = logging.getLogger(__name__)
        try:
            scrape_result = extract_website_content(url, crawl=crawl)
            website_content = scrape_result.get("content", "")
        except Exception as e:
            logger.warning(f"Website scrape failed for {url}: {e}")
            return ContextAssessmentResult(
                overall_quality=ContextQuality.INSUFFICIENT,
                overall_confidence=0.0,
                content_sections=[],
                company_clarity={},
                endpoint_readiness=[],
                data_quality_metrics={},
                recommendations={},
                summary=f"Website scrape failed: {e}",
            )

        return await orchestrator.assess_context(
            website_content=website_content,
            target_endpoint=target_endpoint,
            user_context=user_context,
        )
