"""
This module defines the ContextOrchestrator agent, which is responsible for
assessing context quality for campaign generation endpoints.
"""

from typing import Optional, Dict, Any

from backend.app.prompts.models import (
    ContextAssessmentResult,
    ContextAssessmentVars,
    ContextQuality,
    CompanyOverviewResult,
)
from backend.app.prompts.registry import render_prompt
from backend.app.services.llm_service import LLMClient
from backend.app.services.website_scraper import extract_website_content


async def resolve_context_for_endpoint(
    request, endpoint_name: str, orchestrator
) -> Dict[str, Any]:
    """
    Resolve the best context for a given endpoint, preferring user, then LLM, then website scraping.
    Returns a dict with keys: 'source', 'context', 'is_ready'.
    """
    # 1. User-provided context
    user_ctx = getattr(request, "user_inputted_context", None)
    if user_ctx:
        assessment = await orchestrator.assess_context(
            website_content=user_ctx,
            target_endpoint=endpoint_name,
            user_context=None,
        )
        readiness = orchestrator.check_endpoint_readiness(assessment, endpoint_name)
        if readiness.get("is_ready"):
            return {
                "source": "user_inputted_context",
                "context": user_ctx,
                "is_ready": True,
            }
    # 2. LLM-inferred context
    llm_ctx = getattr(request, "llm_inferred_context", None)
    if llm_ctx:
        assessment = await orchestrator.assess_context(
            website_content=llm_ctx,
            target_endpoint=endpoint_name,
            user_context=None,
        )
        readiness = orchestrator.check_endpoint_readiness(assessment, endpoint_name)
        if readiness.get("is_ready"):
            return {
                "source": "llm_inferred_context",
                "context": llm_ctx,
                "is_ready": True,
            }
    # 3. Website scraping
    website_url = getattr(request, "website_url", None)
    if website_url:
        assessment = await orchestrator.assess_url_context(
            url=website_url,
            target_endpoint=endpoint_name,
            user_context=None,
        )
        readiness = orchestrator.check_endpoint_readiness(assessment, endpoint_name)
        return {
            "source": "website",
            "context": website_url,
            "is_ready": readiness.get("is_ready", False),
        }
    # If all fail
    return {"source": None, "context": None, "is_ready": False}


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
    ) -> CompanyOverviewResult:
        """
        Uses an LLM to assess the quality of the provided website content for GTM endpoints.

        Args:
            website_content (str): The preprocessed content from the company's website.
            target_endpoint (Optional[str]): The endpoint being assessed (e.g., 'product_overview').
            user_context (Optional[dict]): Optional user-provided context for campaign generation.

        Returns:
            CompanyOverviewResult: A Pydantic model containing the structured,
                rich assessment from the LLM.
        """
        if not website_content or not website_content.strip():
            # Return an empty product overview structure if no content
            return CompanyOverviewResult(
                company_name="",
                company_url="",
                company_overview="",
                capabilities=[],
                business_model=[],
                differentiated_value=[],
                customer_benefits=[],
                alternatives=[],
                testimonials=[],
                product_description="",
                key_features=[],
                company_profiles=[],
                persona_profiles=[],
                use_cases=[],
                pain_points=[],
                pricing="",
                confidence_scores={
                    "company_name": 0.0,
                    "company_url": 0.0,
                    "company_overview": 0.0,
                    "capabilities": 0.0,
                    "business_model": 0.0,
                    "differentiated_value": 0.0,
                    "customer_benefits": 0.0,
                    "alternatives": 0.0,
                    "testimonials": 0.0,
                    "product_description": 0.0,
                    "key_features": 0.0,
                    "company_profiles": 0.0,
                    "persona_profiles": 0.0,
                    "use_cases": 0.0,
                    "pain_points": 0.0,
                    "pricing": 0.0,
                },
                metadata={
                    "sources_used": [],
                    "context_quality": "insufficient",
                    "assessment_summary": (
                        "No website content available. "
                        "Unable to assess context quality."
                    ),
                },
            )

        prompt_vars = ContextAssessmentVars(
            website_content=website_content,
            target_endpoint=target_endpoint,
            user_context=user_context,
        )
        prompt = render_prompt("product_overview", prompt_vars)

        response_model = await self.llm_client.generate_structured_output(
            prompt=prompt, response_model=CompanyOverviewResult
        )
        return CompanyOverviewResult.model_validate(response_model)

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
        website_content = ""
        try:
            scrape_result = extract_website_content(url, crawl=crawl)
            website_content = scrape_result.get("content", "")
        except Exception:
            pass

        if not website_content:
            if not crawl:
                try:
                    scrape_result = extract_website_content(url, crawl=True)
                    website_content = scrape_result.get("content", "")
                except Exception:
                    pass
            if not website_content:
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
        assessment: "CompanyOverviewResult",
        endpoint: str,
    ) -> Dict[str, Any]:
        """
        Check if the assessment meets readiness criteria for the given endpoint.

        Readiness now only requires:
        - company_overview: non-empty and confidence > 0.5
        - capabilities: non-empty and confidence > 0.5
        All other fields are reported if low-confidence or missing, but do not block readiness.

        Returns:
            Dict[str, Any]: Dict with keys: is_ready, confidence, missing_requirements, recommendations.
        """
        # Main required fields
        company_overview_ok = (
            bool(assessment.company_overview.strip())
            and assessment.confidence_scores.get("company_overview", 0.0) > 0.5
        )
        capabilities_ok = (
            bool(getattr(assessment, "capabilities", []))
            and assessment.confidence_scores.get("capabilities", 0.0) > 0.5
        )

        is_ready = company_overview_ok and capabilities_ok

        missing_requirements = []
        recommendations = []

        if not company_overview_ok:
            missing_requirements.append("company_overview")
            recommendations.append("Add a company overview with higher confidence.")

        if not capabilities_ok:
            missing_requirements.append("capabilities")
            recommendations.append("Add capabilities with higher confidence.")

        # Report (but do not block on) other low-confidence fields
        for k, v in assessment.confidence_scores.items():
            if k not in ("company_overview", "capabilities") and v <= 0.5:
                missing_requirements.append(k)
                recommendations.append(f"Improve confidence in {k}.")

        # Confidence: minimum of required fields, or 0 if missing
        confidence = min(
            assessment.confidence_scores.get("company_overview", 0.0),
            assessment.confidence_scores.get("capabilities", 0.0),
        )

        return {
            "is_ready": is_ready,
            "confidence": confidence,
            "missing_requirements": missing_requirements,
            "recommendations": recommendations,
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
        """
        all_content: Dict[str, Any] = {}
        sources_used = []
        enrichment_performed = []
        step = 0
        # Initial fetch (scrape/crawl)
        website_content = ""
        try:
            scrape_result = extract_website_content(website_url, crawl=False)
            website_content = scrape_result.get("content", "")
        except Exception:
            pass
        # If no content, try crawling
        if not website_content:
            try:
                scrape_result = extract_website_content(website_url, crawl=True)
                website_content = scrape_result.get("content", "")
            except Exception:
                pass
        # Assess context
        assessment = await self.assess_context(
            website_content=website_content,
            target_endpoint=target_endpoint,
            user_context=user_context,
        )
        all_content["initial"] = assessment
        all_content["raw_website_content"] = website_content
        sources_used.append("website_scraper")
        # Check readiness
        readiness = self.check_endpoint_readiness(assessment, target_endpoint)
        # Iterative enrichment loop (scaffold)
        while auto_enrich and not readiness["is_ready"] and step < max_steps:
            enrichment_plan = self._create_enrichment_plan(assessment, target_endpoint)
            enrichment_result = self._execute_enrichment(enrichment_plan, website_url)
            enrichment_performed.append(enrichment_result)
            step += 1
            break
        final_quality = assessment.metadata.get("context_quality", "")
        enrichment_successful = readiness["is_ready"] if readiness else False
        return {
            "assessment": assessment,
            "enriched_content": all_content,
            "sources_used": sources_used,
            "enrichment_performed": enrichment_performed,
            "final_quality": final_quality,
            "enrichment_successful": enrichment_successful,
        }

    def _create_enrichment_plan(self, assessment, target_endpoint):
        """TODO: Plan enrichment steps based on assessment and endpoint requirements."""
        # Placeholder: return empty plan
        return {}

    def _execute_enrichment(self, enrichment_plan, website_url):
        """TODO: Execute enrichment plan (fetch more data, crawl specific pages, etc.)."""
        # Placeholder: return empty result
        return {}
