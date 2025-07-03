import logging
from typing import Any, Type, Optional
from fastapi import HTTPException
from backend.app.services.context_orchestrator import (
    ContextOrchestrator,
    resolve_context_for_endpoint,
)
from backend.app.services.llm_service import LLMClient
from backend.app.prompts.registry import render_prompt
from backend.app.services.content_preprocessing import ContentPreprocessingPipeline
from pydantic import BaseModel, ValidationError
import json
import time

logger = logging.getLogger(__name__)


class CompanyAnalysisService:
    """
    Shared service for company analysis endpoints (overview, target company, target persona).
    Handles context resolution, prompt rendering, LLM call, and response parsing.
    Preprocessing is optional and can be enabled per analysis type.
    """

    def __init__(
        self,
        orchestrator: ContextOrchestrator,
        llm_client: LLMClient,
        preprocessing_pipeline: Optional[ContentPreprocessingPipeline] = None,
    ):
        self.orchestrator = orchestrator
        self.llm_client = llm_client
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
        Run the analysis pipeline for the given type.
        Args:
            request_data: The validated request object (Pydantic model).
            analysis_type: One of 'product_overview', 'target_company', 'target_persona'.
            prompt_template: Jinja2 template name.
            prompt_vars_class: Class for prompt variables.
            response_model: Pydantic response model.
            use_preprocessing: Whether to run content preprocessing (for overview).
        Returns:
            BaseModel: The parsed response model.
        Raises:
            HTTPException: On LLM or validation errors, with analysis_type in context.
        """
        try:
            total_start = time.monotonic()
            # 1. Context resolution
            t0 = time.monotonic()
            if analysis_type == "product_overview":
                # Skip context assessment, just get website content
                website_url = getattr(request_data, "website_url", None)
                if not website_url:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "error": "website_url is required for product_overview"
                        },
                    )
                from backend.app.services.website_scraper import extract_website_content

                t_scrape0 = time.monotonic()
                scrape_result = extract_website_content(website_url)
                t_scrape1 = time.monotonic()
                website_content = scrape_result.get("content", "")
                html = scrape_result.get("html", None)
                # Determine if this was a cache hit by timing (cache hits are very fast)
                cache_hit = t_scrape1 - t_scrape0 < 0.05  # 50ms threshold for cache
                context_result = {
                    "source": "website",
                    "context": website_content,
                    "content": website_content,
                    "html": html,
                    "from_cache": cache_hit,
                }
                print("[product_overview] Website scraping took ")
                print(f"{t_scrape1 - t_scrape0:.2f}s")
                if cache_hit:
                    print("[product_overview] Context source: cache")
                else:
                    print("[product_overview] Context source: live scrape")
            else:
                context_result = await self._resolve_context(
                    request_data, analysis_type
                )
            t1 = time.monotonic()
            print(f"[{analysis_type}] Context resolution took {t1 - t0:.2f}s")
            # Debug: print source of context
            print(
                f"[DEBUG] Context source: {'cache' if context_result.get('from_cache') else 'firecrawl'}"
            )
            website_content = (
                context_result["context"]
                if context_result["source"] == "website"
                else None
            )
            # 2. Preprocessing (if enabled and website content present)
            t2 = time.monotonic()
            if use_preprocessing and website_content and self.preprocessing_pipeline:
                preprocessed_chunks = self.preprocessing_pipeline.process(
                    text=context_result.get("content", ""),
                    html=context_result.get("html", None),
                )
                preprocessed_text = "\n\n".join(preprocessed_chunks)
                website_content = preprocessed_text
            t3 = time.monotonic()
            if use_preprocessing and website_content and self.preprocessing_pipeline:
                print(f"[{analysis_type}] Preprocessing took {t3 - t2:.2f}s")
            # 3. Prompt construction
            t4 = time.monotonic()
            prompt_vars_kwargs = dict(
                website_content=website_content,
                user_inputted_context=getattr(
                    request_data, "user_inputted_context", None
                ),
                llm_inferred_context=getattr(
                    request_data, "llm_inferred_context", None
                ),
            )
            if analysis_type == "product_overview":
                prompt_vars_kwargs["input_website_url"] = getattr(
                    request_data, "website_url", None
                )
            prompt_vars = prompt_vars_class(**prompt_vars_kwargs)
            prompt = render_prompt(prompt_template, prompt_vars)
            t5 = time.monotonic()
            print(f"[{analysis_type}] Prompt construction took {t5 - t4:.2f}s")
            # 4. LLM call and response parsing
            t6 = time.monotonic()
            llm_output = await self.llm_client.generate_structured_output(
                prompt=prompt, response_model=response_model
            )
            t7 = time.monotonic()
            print(f"[{analysis_type}] LLM call + response parsing took {t7 - t6:.2f}s")
            print(f"[{analysis_type}] Total analyze() time: {t7 - total_start:.2f}s")
            return response_model.model_validate(llm_output)
        except (ValidationError, json.JSONDecodeError, ValueError) as e:
            logger.error(f"[{analysis_type}] Failed to parse LLM output: {e}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error": f"LLM did not return valid output for {analysis_type}.",
                    "analysis_type": analysis_type,
                    "exception": str(e),
                },
            )
        except Exception as e:
            logger.error(f"[{analysis_type}] Analysis failed: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": f"Analysis failed for {analysis_type}.",
                    "analysis_type": analysis_type,
                    "exception": str(e),
                },
            )

    async def _resolve_context(self, request_data: Any, analysis_type: str) -> dict:
        # Use the orchestrator's context resolution logic
        return await resolve_context_for_endpoint(
            request_data, analysis_type, self.orchestrator
        )
