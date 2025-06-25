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

    async def assess_url_context(
        self,
        url: str,
        target_endpoint: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
        crawl: bool = False,
    ) -> ContextAssessmentResult:
        """
        Orchestrate the full context assessment workflow for a website URL.

        Args:
            url (str): The website URL to analyze.
            target_endpoint (Optional[str]): The endpoint being assessed (e.g., 'product_overview').
            user_context (Optional[dict]): Optional user-provided context for campaign generation.
            crawl (bool): Whether to crawl the site (multi-page) or just scrape the main page.

        Returns:
            ContextAssessmentResult: The structured context assessment result.
        """
        logger = logging.getLogger(__name__)
        website_content = ""
        try:
            logger.debug(f"Attempting to scrape website: {url} (crawl={crawl})")
            scrape_result = extract_website_content(url, crawl=crawl)
            website_content = scrape_result.get("content", "")
        except Exception as e:
            logger.warning(f"Website scrape failed for {url}: {e}")

        if not website_content:
            if not crawl:
                logger.debug(
                    f"No content found from initial scrape. Retrying with full crawl: {url}"
                )
                try:
                    scrape_result = extract_website_content(url, crawl=True)
                    website_content = scrape_result.get("content", "")
                except Exception as e:
                    logger.warning(f"Website crawl failed for {url}: {e}")
            if not website_content:
                logger.debug(
                    f"No content found after full crawl for {url}. Returning insufficient result."
                )
                return ContextAssessmentResult(
                    overall_quality=ContextQuality.INSUFFICIENT,
                    overall_confidence=0.0,
                    content_sections=[],
                    company_clarity={},
                    endpoint_readiness=[],
                    data_quality_metrics={},
                    recommendations={
                        "immediate_actions": [
                            "Check website accessibility",
                            "Ensure the website has meaningful content",
                        ],
                        "data_enrichment": [
                            "Enable website crawling",
                            "Provide additional context manually",
                        ],
                        "user_input_needed": [
                            "Company description",
                            "Product features",
                        ],
                    },
                    summary=(
                        "No website content could be extracted after scraping and crawling. "
                        "Please check the website or provide additional context."
                    ),
                )
        # TODO: Phase 2 - Enrichment planning and iterative improvement
        return await self.assess_context(
            website_content=website_content,
            target_endpoint=target_endpoint,
            user_context=user_context,
        )

    def check_endpoint_readiness(
        self,
        assessment: ContextAssessmentResult,
        endpoint: str,
    ) -> Dict[str, Any]:
        """
        Check if the assessment meets readiness criteria for the given endpoint.

        Args:
            assessment (ContextAssessmentResult): The assessment result from LLM.
            endpoint (str): The endpoint to check readiness for.

        Returns:
            Dict[str, Any]: Dict with keys: is_ready, confidence, missing_requirements, recommendations.
        """
        logger = logging.getLogger(__name__)
        for readiness in assessment.endpoint_readiness:
            if readiness.endpoint == endpoint:
                logger.debug(
                    f"Endpoint readiness found for '{endpoint}': "
                    f"is_ready={readiness.is_ready}, confidence={readiness.confidence}, "
                    f"missing_requirements={readiness.missing_requirements}, "
                    f"recommendations={readiness.recommendations}"
                )
                return {
                    "is_ready": readiness.is_ready,
                    "confidence": readiness.confidence,
                    "missing_requirements": readiness.missing_requirements,
                    "recommendations": readiness.recommendations,
                }
        logger.debug(
            f"No endpoint readiness found for '{endpoint}'. "
            f"Returning not ready with overall_confidence={assessment.overall_confidence}"
        )
        return {
            "is_ready": False,
            "confidence": assessment.overall_confidence,
            "missing_requirements": [
                "Assessment did not return endpoint readiness for this endpoint."
            ],
            "recommendations": [],
        }

    async def orchestrate_context(
        self,
        website_url: str,
        target_endpoint: str,
        user_context: Optional[Dict[str, Any]] = None,
        auto_enrich: bool = True,
        max_steps: int = 3,
    ) -> Dict[str, Any]:
        """
        Main orchestration method: assess → plan → enrich → reassess (iterative improvement).

        Args:
            website_url (str): The website URL to analyze.
            target_endpoint (str): The endpoint being assessed (e.g., 'product_overview').
            user_context (Optional[dict]): Optional user-provided context for campaign generation.
            auto_enrich (bool): Whether to automatically fetch missing data.
            max_steps (int): Maximum number of enrichment iterations.

        Returns:
            Dict[str, Any]: Orchestration result with assessment, content, sources, enrichment steps, quality.
        """
        logger = logging.getLogger(__name__)
        all_content = {}
        sources_used = []
        enrichment_performed = []
        step = 0
        # Initial fetch (scrape/crawl)
        logger.debug(f"[Orchestrator] Step 1: Initial content fetch for {website_url}")
        assessment = await self.assess_url_context(
            url=website_url,
            target_endpoint=target_endpoint,
            user_context=user_context,
        )
        all_content["initial"] = assessment
        sources_used.append("website_scraper")
        # Check readiness
        readiness = self.check_endpoint_readiness(assessment, target_endpoint)
        logger.debug(f"[Orchestrator] Initial readiness: {readiness}")
        # Iterative enrichment loop (scaffold)
        while auto_enrich and not readiness["is_ready"] and step < max_steps:
            logger.debug(
                f"[Orchestrator] Enrichment iteration {step+1} for {website_url}"
            )
            # TODO: Create enrichment plan based on assessment and readiness
            enrichment_plan = self._create_enrichment_plan(assessment, target_endpoint)
            # TODO: Execute enrichment plan (fetch more data, crawl specific pages, etc.)
            enrichment_result = self._execute_enrichment(enrichment_plan, website_url)
            enrichment_performed.append(enrichment_result)
            # TODO: Merge new content into all_content
            # Reassess with new content (placeholder: just re-use initial assessment for now)
            # In future: combine all_content and reassess
            step += 1
            # For now, break loop (to be implemented)
            break
        final_quality = assessment.overall_quality.value
        return {
            "assessment": assessment,
            "enriched_content": all_content,
            "sources_used": sources_used,
            "enrichment_performed": enrichment_performed,
            "final_quality": final_quality,
        }

    def _create_enrichment_plan(self, assessment, target_endpoint):
        """TODO: Plan enrichment steps based on assessment and endpoint requirements."""
        logger = logging.getLogger(__name__)
        logger.debug(f"[Orchestrator] Planning enrichment for {target_endpoint}")
        # Placeholder: return empty plan
        return {}

    def _execute_enrichment(self, enrichment_plan, website_url):
        """TODO: Execute enrichment plan (fetch more data, crawl specific pages, etc.)."""
        logger = logging.getLogger(__name__)
        logger.debug(f"[Orchestrator] Executing enrichment plan for {website_url}")
        # Placeholder: return empty result
        return {}
