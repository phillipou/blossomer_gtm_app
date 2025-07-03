"""
This module defines the ContextOrchestrator agent, which is responsible for
assessing context quality for campaign generation endpoints.
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException
import logging

from backend.app.prompts.models import (
    ContextAssessmentResult,
    ContextAssessmentVars,
    ContextQuality,
    CompanyOverviewResult,
)
from backend.app.prompts.registry import render_prompt
from backend.app.services.llm_service import LLMClient
from backend.app.services.website_scraper import extract_website_content


def is_company_context_sufficient(context: dict) -> bool:
    """
    Checks if context has sufficient company/product information for downstream endpoints.
    Requires:
    - company_name or target_company_name (non-empty)
    - company_overview (non-empty)
    - At least one of: use_cases or capabilities (non-empty)
    """
    name = context.get("company_name", "") or context.get("target_company_name", "")
    overview = context.get("company_overview", "")
    use_cases = context.get("use_cases", [])
    capabilities = context.get("capabilities", [])
    return (
        bool(name.strip())
        and bool(overview.strip())
        and (bool(use_cases) or bool(capabilities))
    )


def is_target_account_context_sufficient(context: dict) -> bool:
    """
    Checks if context has sufficient target account information (requires company context).
    Requires:
    - Sufficient company context (see is_company_context_sufficient)
    - industry (non-empty)
    - target_company_description (non-empty)
    - target_company_name (non-empty)
    - At least one of: employees, department_size, revenue (non-empty)
    """
    if not is_company_context_sufficient(context):
        return False
    industry = context.get("industry", "")
    target_company_desc = context.get("target_company_description", "")
    target_company_name = context.get("target_company_name", "")
    employees = context.get("employees", None)
    department_size = context.get("department_size", None)
    revenue = context.get("revenue", None)
    size_ok = any(
        [
            employees not in (None, "", []),
            department_size not in (None, "", []),
            revenue not in (None, "", []),
        ]
    )
    return (
        bool(industry.strip())
        and bool(target_company_desc.strip())
        and bool(target_company_name.strip())
        and size_ok
    )


def is_target_persona_context_sufficient(context: dict) -> bool:
    """
    Checks if context has sufficient information for target persona (requires company and target account context).
    """
    return is_company_context_sufficient(
        context
    ) and is_target_account_context_sufficient(context)


async def resolve_context_for_endpoint(
    request, endpoint_name: str, orchestrator
) -> Dict[str, Any]:
    """
    Resolve the best context for a given endpoint, preferring user, then LLM, then website scraping.
    Uses modular, daisy-chained sufficiency checks for company, target account, and target persona.
    Returns a dict with keys: 'source', 'context', 'is_ready'.
    """
    user_ctx = getattr(request, "user_inputted_context", None)
    llm_ctx = getattr(request, "llm_inferred_context", None)
    website_url = getattr(request, "website_url", None)

    if endpoint_name == "target_company":
        # Target account requires sufficient company context
        for ctx, label in [(user_ctx, "user-provided"), (llm_ctx, "LLM-inferred")]:
            if ctx:
                try:
                    ctx_dict = ctx if isinstance(ctx, dict) else {}
                    if is_target_account_context_sufficient(ctx_dict):
                        logging.info(
                            f"[target_company] Using {label} context: "
                            "sufficient for generation."
                        )
                        return {
                            "source": f"{label}_context",
                            "context": ctx,
                            "is_ready": True,
                        }
                    elif not is_company_context_sufficient(ctx_dict):
                        logging.info(
                            f"[target_company] {label} context: "
                            "insufficient company context."
                        )
                    else:
                        logging.info(
                            f"[target_company] {label} context: "
                            "insufficient target account context."
                        )
                except Exception:
                    logging.warning(
                        f"[target_company] Exception while checking {label} context sufficiency."
                    )
        if website_url:
            logging.info("[target_company] Resorting to website scraping for context.")
            scrape_result = extract_website_content(website_url)
            content = scrape_result.get("content", "")
            html = scrape_result.get("html", None)
            # Pass through cache status for accurate logging downstream
            from_cache = scrape_result.get("from_cache", False)
            return {
                "source": "website",
                "context": content,
                "content": content,
                "html": html,
                "is_ready": True,
                "from_cache": from_cache,
            }
        logging.warning(
            "[target_company] No sufficient context found and no website_url provided."
        )
        return {"source": None, "context": None, "is_ready": False}

    if endpoint_name == "target_persona":
        # Target persona requires sufficient company and target account context
        for ctx, label in [(user_ctx, "user-provided"), (llm_ctx, "LLM-inferred")]:
            if ctx:
                try:
                    ctx_dict = ctx if isinstance(ctx, dict) else {}
                    if is_target_persona_context_sufficient(ctx_dict):
                        logging.info(
                            f"[target_persona] Using {label} context: "
                            "sufficient for generation."
                        )
                        return {
                            "source": f"{label}_context",
                            "context": ctx,
                            "is_ready": True,
                        }
                    elif not is_company_context_sufficient(ctx_dict):
                        logging.info(
                            f"[target_persona] {label} context: "
                            "insufficient company context."
                        )
                    elif not is_target_account_context_sufficient(ctx_dict):
                        logging.info(
                            f"[target_persona] {label} context: "
                            "insufficient target account context."
                        )
                    else:
                        logging.info(
                            f"[target_persona] {label} context: "
                            "insufficient persona context."
                        )
                except Exception:
                    logging.warning(
                        f"[target_persona] Exception while checking {label} context sufficiency."
                    )
        if website_url:
            logging.info("[target_persona] Resorting to website scraping for context.")
            scrape_result = extract_website_content(website_url)
            content = scrape_result.get("content", "")
            html = scrape_result.get("html", None)
            # Pass through cache status for accurate logging downstream
            from_cache = scrape_result.get("from_cache", False)
            return {
                "source": "website",
                "context": content,
                "content": content,
                "html": html,
                "is_ready": True,
                "from_cache": from_cache,
            }
        logging.warning(
            "[target_persona] No sufficient context found and no website_url provided."
        )
        return {"source": None, "context": None, "is_ready": False}

    # Default: legacy logic for other endpoints
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
        scrape_result = extract_website_content(website_url)
        content = scrape_result.get("content", "")
        html = scrape_result.get("html", None)
        assessment = await orchestrator.assess_context(
            website_content=content,
            target_endpoint=endpoint_name,
            user_context=None,
        )
        readiness = orchestrator.check_endpoint_readiness(assessment, endpoint_name)
        return {
            "source": "website",
            "context": content,
            "content": content,
            "html": html,
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

    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    async def assess_context(
        self,
        website_content: str,
        target_endpoint: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> CompanyOverviewResult:
        """
        Uses an LLM to assess the quality of the provided website content for GTM endpoints.
        """
        if not website_content or not website_content.strip():
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "WEBSITE_INACCESSIBLE",
                    "message": "Unable to access website content for analysis",
                    "details": {
                        "reason": "website_scraping_failed",
                        "suggestions": [
                            "Verify the website URL is correct and publicly accessible",
                            "Check if the website blocks automated access",
                            "Try again in a few minutes if the site is temporarily down",
                        ],
                    },
                    "retry_recommended": True,
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
        - company_overview: non-empty
        - capabilities: non-empty
        All other fields are reported if low-confidence or missing, but do not block readiness.

        Returns:
            Dict[str, Any]: Dict with keys: is_ready, missing_requirements, recommendations.
        """
        # Main required fields
        company_overview_ok = bool(assessment.company_overview.strip())
        capabilities_ok = bool(getattr(assessment, "capabilities", []))

        is_ready = company_overview_ok and capabilities_ok

        missing_requirements: List[str] = []
        recommendations: List[str] = []

        if not company_overview_ok:
            missing_requirements.append("company_overview")
            recommendations.append("Add a company overview.")

        if not capabilities_ok:
            missing_requirements.append("capabilities")
            recommendations.append("Add capabilities.")

        # Confidence: always 1.0 if present, 0.0 if missing (for backward compatibility)
        confidence = 1.0 if is_ready else 0.0

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
        sources_used: List[str] = []
        enrichment_performed: List[Dict[str, Any]] = []
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

    def _create_enrichment_plan(
        self, assessment: "CompanyOverviewResult", target_endpoint: str
    ) -> Dict[str, Any]:
        """TODO: Plan enrichment steps based on assessment and endpoint requirements."""
        # Placeholder: return empty plan
        return {}

    def _execute_enrichment(
        self, enrichment_plan: Dict[str, Any], website_url: str
    ) -> Dict[str, Any]:
        """TODO: Execute enrichment plan (fetch more data, crawl specific pages, etc.)."""
        # Placeholder: return empty result
        return {}
