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
            # 1. Context resolution
            context_result = await self._resolve_context(request_data, analysis_type)
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
            if use_preprocessing and website_content and self.preprocessing_pipeline:
                preprocessed_chunks = self.preprocessing_pipeline.process(
                    text=context_result.get("content", ""),
                    html=context_result.get("html", None),
                )
                preprocessed_text = "\n\n".join(preprocessed_chunks)
                print(
                    f"[PREPROCESS] Preprocessed text length: {len(preprocessed_text)}"
                )
                print(f"[PREPROCESS] Sample: {preprocessed_text[:300]}")
                website_content = preprocessed_text
            # 3. Prompt construction
            prompt_vars = prompt_vars_class(
                website_content=website_content,
                user_inputted_context=getattr(
                    request_data, "user_inputted_context", None
                ),
                llm_inferred_context=getattr(
                    request_data, "llm_inferred_context", None
                ),
                # Add extra fields if needed for specific analysis types
            )
            prompt = render_prompt(prompt_template, prompt_vars)
            # 4. LLM call and response parsing
            llm_output = await self.llm_client.generate_structured_output(
                prompt=prompt, response_model=response_model
            )
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
