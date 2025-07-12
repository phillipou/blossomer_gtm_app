import logging
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.context_orchestrator_service import ContextOrchestratorService
from backend.app.prompts.models import ProductOverviewPromptVars
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.content_preprocessing import (
    ContentPreprocessingPipeline,
    HTMLSectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
    LengthFilter,
    DuplicateFilter, # Import the DuplicateFilter
    CompositeFilter,
)

try:
    from fastapi import HTTPException
except ImportError:
    from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)

# Instantiate the pipeline once
chunker = HTMLSectionChunker()
summarizer = LangChainSummarizer()
# Combine multiple filters into a single pipeline
filter_ = CompositeFilter(
    filters=[
        DuplicateFilter(), # Add the DuplicateFilter to the pipeline
        BoilerplateFilter(),
        LengthFilter(min_len=50, max_len=2500), # Adjust min/max length as needed
    ]
)

preprocessing_pipeline = ContentPreprocessingPipeline(
    chunker=chunker,
    summarizer=summarizer,
    filter_=filter_,
)


async def generate_product_overview_service(
    data: ProductOverviewRequest,
    orchestrator: ContextOrchestrator,
) -> ProductOverviewResponse:
    """
    Orchestrates the generation of a comprehensive product overview using the shared
    analysis service. Uses the shared LLM client instance from llm_singleton.
    """
    service = ContextOrchestratorService(
        orchestrator=orchestrator,
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
