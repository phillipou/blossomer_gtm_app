import logging
import json
from typing import Any, Type, Optional, Dict

try:
    from fastapi import HTTPException
except ImportError:
    from starlette.exceptions import HTTPException
from backend.app.core.llm_singleton import get_llm_client
from backend.app.prompts.registry import render_prompt
from backend.app.services.content_preprocessing import ContentPreprocessingPipeline
from backend.app.services.dev_file_cache import (
    load_processed_from_cache,
    save_processed_to_cache,
)

try:
    from pydantic import BaseModel, ValidationError
except ImportError:
    from pydantic.v1 import BaseModel, ValidationError
import time
import os

logger = logging.getLogger(__name__)


def flatten_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten one level of nested dicts into the top-level dict."""
    out = dict(d)
    for k, v in d.items():
        if isinstance(v, dict):
            for subk, subv in v.items():
                if subk not in out:
                    out[subk] = subv
    return out


def is_target_account_context_sufficient(context: Any) -> bool:
    """Check if the target account context has sufficient information."""
    ctx = context
    if not isinstance(ctx, (dict, list)):
        try:
            ctx = json.loads(ctx)
        except Exception:
            ctx = {}
    print(f"[Sufficiency] Checking target account context: {ctx}")
    required_fields = [
        "company_size",
        "target_account_name",
        "target_account_description",
    ]

    def is_present(val):
        if isinstance(val, dict):
            return bool(val)
        if isinstance(val, str):
            return bool(val.strip())
        return val is not None

    if isinstance(ctx, list):
        merged = {}
        for item in ctx:
            if not isinstance(item, dict):
                continue
            merged.update(item)
        ctx = merged
    missing = [f for f in required_fields if not is_present(ctx.get(f))]
    result = not missing
    if not result:
        print(
            f"[Sufficiency] Target account context insufficient: missing fields: {missing}"
        )
    else:
        print(
            "[Sufficiency] Target account context is sufficient (all required fields present)."
        )
    return result


class ContextOrchestratorService:
    """
    Main service for orchestrating context analysis for all endpoints.
    Handles context resolution, preprocessing, caching, prompt rendering, and LLM calls.
    """

    def __init__(
        self,
        orchestrator: Optional[Any] = None,
        preprocessing_pipeline: Optional[ContentPreprocessingPipeline] = None,
    ):
        self.orchestrator = orchestrator
        self.preprocessing_pipeline = preprocessing_pipeline

    async def analyze(
        self,
        *,
        request_data: Any,
        analysis_type: str,
        prompt_template: str,
        prompt_vars_class: Type[Any],
        response_model: Type[BaseModel],
        use_preprocessing: bool = False,
    ) -> BaseModel:
        """
        Run the analysis pipeline with a two-level caching system.
        """
        try:
            total_start = time.monotonic()
            website_url = getattr(request_data, "website_url", None)
            website_content = None

            # --- Two-Level Caching Logic ---
            if analysis_type == "product_overview" and website_url:
                # 1. Check for cached PROCESSED content first
                if os.getenv("ENV") != "production":
                    cached_processed = load_processed_from_cache(website_url)
                    if cached_processed:
                        print(f"[DEV CACHE] Using cached PROCESSED content for {website_url}")
                        website_content = cached_processed

                # 2. If no processed cache, get RAW content (from cache or live scrape)
                if website_content is None:
                    from backend.app.services.website_scraper import extract_website_content
                    
                    t_scrape0 = time.monotonic()
                    scrape_result = extract_website_content(website_url)
                    t_scrape1 = time.monotonic()
                    print(f"[Scrape] Raw content scraping took {t_scrape1 - t_scrape0:.2f}s")

                    raw_content = scrape_result.get("content", "")
                    html_content = scrape_result.get("html", None)

                    # 3. Preprocess the raw content
                    if use_preprocessing and raw_content and self.preprocessing_pipeline:
                        t_preproc0 = time.monotonic()
                        print(f"[{analysis_type}] Starting preprocessing of {len(raw_content)} chars")
                        preprocessed_chunks = self.preprocessing_pipeline.process(
                            text=raw_content, html=html_content
                        )
                        website_content = "\n\n".join(preprocessed_chunks)
                        t_preproc1 = time.monotonic()
                        print(
                            f"[{analysis_type}] Preprocessing reduced content to {len(website_content)} chars "
                            f"in {t_preproc1 - t_preproc0:.2f}s"
                        )
                        
                        # 4. Save the processed content to its cache
                        if os.getenv("ENV") != "production":
                            save_processed_to_cache(website_url, website_content)
                            print(f"[DEV CACHE] Saved PROCESSED content for {website_url}")
                    else:
                        website_content = raw_content
            else:
                website_content = getattr(request_data, "website_content", None)

            # --- Prompt Construction and LLM Call ---
            t4 = time.monotonic()
            prompt_vars_kwargs = self._build_prompt_vars(
                analysis_type, request_data, website_content
            )
            prompt_vars = prompt_vars_class(**prompt_vars_kwargs)
            prompt = render_prompt(prompt_template, prompt_vars)
            t5 = time.monotonic()
            print(f"[{analysis_type}] Prompt construction took {t5 - t4:.2f}s")

            t6 = time.monotonic()
            system_prompt, user_prompt = prompt
            response = await get_llm_client().generate_structured_output(
                prompt=user_prompt,
                system_prompt=system_prompt,
                response_model=response_model,
            )
            t7 = time.monotonic()
            print(f"[{analysis_type}] LLM call took {t7 - t6:.2f}s")

            total_end = time.monotonic()
            print(f"[{analysis_type}] Total time: {total_end - total_start:.2f}s")
            return response

        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Analysis failed | analysis_type: {analysis_type} | error: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail=f"Analysis failed for {analysis_type}: {e}",
            )

    def _build_prompt_vars(
        self, analysis_type: str, request_data: Any, website_content: Optional[str]
    ) -> Dict[str, Any]:
        """Helper to construct prompt variables based on analysis type."""
        prompt_vars_kwargs = {"website_content": website_content}
        
        if analysis_type == "product_overview":
            prompt_vars_kwargs.update({
                "input_website_url": getattr(request_data, "website_url", None),
                "user_inputted_context": getattr(request_data, "user_inputted_context", None),
            })
        elif analysis_type == "target_account":
            prompt_vars_kwargs.update({
                "company_context": getattr(request_data, "company_context", None),
                "account_profile_name": getattr(request_data, "account_profile_name", None),
                "hypothesis": getattr(request_data, "hypothesis", None),
                "additional_context": getattr(request_data, "additional_context", None),
            })
        elif analysis_type == "target_persona":
            prompt_vars_kwargs.update({
                "company_context": getattr(request_data, "company_context", None),
                "target_account_context": getattr(request_data, "target_account_context", None),
                "persona_profile_name": getattr(request_data, "persona_profile_name", None),
                "hypothesis": getattr(request_data, "hypothesis", None),
                "additional_context": getattr(request_data, "additional_context", None),
            })
        elif analysis_type == "email_generation":
            prompt_vars_kwargs.update({
                "company_context": getattr(request_data, "company_context", None),
                "target_account": getattr(request_data, "target_account", None),
                "target_persona": getattr(request_data, "target_persona", None),
                "preferences": getattr(request_data, "preferences", None),
            })
            
        return prompt_vars_kwargs

    async def _resolve_context(self, request_data: Any, analysis_type: str) -> dict:
        raise NotImplementedError(
            "_resolve_context is deprecated. Orchestration is handled in the analyze method."
        )
