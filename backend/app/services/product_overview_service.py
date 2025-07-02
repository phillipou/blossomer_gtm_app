import logging
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.services.llm_service import LLMClient
from backend.app.prompts.models import ProductOverviewPromptVars
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.content_preprocessing import (
    ContentPreprocessingPipeline,
    SectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
)
from backend.app.services.company_analysis_service import CompanyAnalysisService
from fastapi import HTTPException

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
    Orchestrates the generation of a comprehensive product overview using the shared analysis service.
    """
    service = CompanyAnalysisService(
        orchestrator=orchestrator,
        llm_client=llm_client,
        preprocessing_pipeline=preprocessing_pipeline,
    )
    result = await service.analyze(
        request_data=data,
        analysis_type="product_overview",
        prompt_template="product_overview",
        prompt_vars_class=ProductOverviewPromptVars,
        response_model=ProductOverviewResponse,
        use_preprocessing=True,
    )
    # Check for insufficient content
    if (
        hasattr(result, "metadata")
        and result.metadata.get("context_quality") == "insufficient"
    ):
        raise HTTPException(
            status_code=422,
            detail={
                "error": (
                    "Insufficient website content for valid output. "
                    "Please provide a richer website or more context."
                ),
                "analysis_type": "product_overview",
            },
        )
    return result
