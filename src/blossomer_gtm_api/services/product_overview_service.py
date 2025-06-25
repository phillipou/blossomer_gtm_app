import logging
from fastapi import HTTPException
from blossomer_gtm_api.services.context_orchestrator import ContextOrchestrator
from blossomer_gtm_api.services.llm_service import LLMClient, LLMRequest
from blossomer_gtm_api.prompts.registry import render_prompt
from blossomer_gtm_api.prompts.models import ProductOverviewPromptVars
from blossomer_gtm_api.schemas import ProductOverviewRequest, ProductOverviewResponse
import json
from pydantic import ValidationError
from blossomer_gtm_api.services.content_preprocessing import (
    ContentPreprocessingPipeline,
    SectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
)

logger = logging.getLogger(__name__)

# Instantiate the pipeline once
chunker = SectionChunker()
summarizer = LangChainSummarizer()
filter_ = BoilerplateFilter()
preprocessing_pipeline = ContentPreprocessingPipeline(chunker, summarizer, filter_)


async def generate_product_overview_service(
    data: ProductOverviewRequest,
    orchestrator: ContextOrchestrator,
    llm_client: LLMClient,
) -> ProductOverviewResponse:
    """
    Orchestrates the generation of a comprehensive product overview.
    """
    logger.debug(
        f"[SERVICE] Orchestrating context for product_overview: {data.website_url}"
    )

    user_context = {
        "user_inputted_context": data.user_inputted_context,
        "llm_inferred_context": data.llm_inferred_context,
    }

    result = await orchestrator.orchestrate_context(
        website_url=data.website_url,
        target_endpoint="product_overview",
        user_context=user_context,
        auto_enrich=True,
    )

    if not result["enrichment_successful"]:
        assessment = result["assessment"]
        readiness = orchestrator.check_endpoint_readiness(
            assessment, "product_overview"
        )
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Insufficient content quality for product overview",
                "quality_assessment": assessment.overall_quality.value,
                "confidence": readiness["confidence"],
                "missing_requirements": readiness["missing_requirements"],
                "recommendations": readiness["recommendations"],
                "assessment_summary": assessment.summary,
            },
        )

    all_content = result["enriched_content"]
    content_val = all_content.get("raw_website_content", "")
    logger.debug("[DEBUG] content_val (first 500 chars):\n%s", content_val[:500])
    # Use the raw website content directly
    content_for_processing = content_val
    logger.debug(
        "[DEBUG] Raw website content for preprocessing (first 500 chars):\n%s",
        content_for_processing[:500],
    )

    # 2. After chunking
    processed_chunks = chunker.chunk(content_for_processing)
    logger.debug(f"[DEBUG] After chunking: {len(processed_chunks)} chunks")
    for i, chunk in enumerate(processed_chunks):
        logger.debug(f"[DEBUG] Chunk {i} (first 500 chars):\n{chunk[:500]}")

    # 3. After summarizer
    summarized_chunks = [summarizer.summarize(chunk) for chunk in processed_chunks]
    logger.debug(f"[DEBUG] After summarizer: {len(summarized_chunks)} chunks")
    for i, chunk in enumerate(summarized_chunks):
        logger.debug(f"[DEBUG] Summarized Chunk {i} (first 500 chars):\n{chunk[:500]}")

    # 4. After boilerplate filter
    filtered_chunks = filter_.filter(summarized_chunks)
    logger.debug(f"[DEBUG] After boilerplate filter: {len(filtered_chunks)} chunks")
    for i, chunk in enumerate(filtered_chunks):
        logger.debug(f"[DEBUG] Filtered Chunk {i} (first 500 chars):\n{chunk[:500]}")

    cleaned_content = "\n\n".join(filtered_chunks)
    cleaned_preview = cleaned_content[:500]
    logger.debug(
        "[DEBUG] Cleaned website content for prompt (first 500 chars):\n%s",
        cleaned_preview,
    )

    prompt_vars = ProductOverviewPromptVars(
        website_content=cleaned_content,
        user_inputted_context=data.user_inputted_context,
        llm_inferred_context=data.llm_inferred_context,
        context_quality=result["assessment"].overall_quality.value,
        assessment_summary=result["assessment"].summary,
    )

    prompt = render_prompt("product_overview", prompt_vars)

    logger.debug(f"[DEBUG] Rendered product_overview prompt:\n{prompt}")

    try:
        llm_request = LLMRequest(prompt=prompt)
        llm_response = await llm_client.generate(llm_request)
        return ProductOverviewResponse.parse_raw(llm_response.text)
    except (ValidationError, json.JSONDecodeError) as e:
        logger.error(
            f"Failed to generate or parse product overview: {e}\n"
            f"LLM raw output: {llm_response.text}"
        )
        refusal_phrases = [
            "i'm sorry",
            "unable to extract",
            "cannot",
            "need more information",
            "insufficient",
            "not enough information",
        ]
        if any(phrase in llm_response.text.lower() for phrase in refusal_phrases):
            user_message = (
                "The AI could not extract a product overview from the website content. "
                "Please provide more explicit product details or additional context."
            )
        else:
            user_message = "LLM did not return valid JSON."
        raise HTTPException(
            status_code=422,
            detail={
                "error": user_message,
                "llm_output": llm_response.text,
                "exception": str(e),
            },
        )
