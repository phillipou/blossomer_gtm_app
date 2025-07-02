from backend.app.schemas import TargetCompanyRequest, TargetCompanyResponse
from backend.app.prompts.models import TargetCompanyPromptVars
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.services.llm_service import LLMClient
from backend.app.services.company_analysis_service import CompanyAnalysisService


async def generate_target_company_profile(
    request: TargetCompanyRequest,
    orchestrator: ContextOrchestrator,
    llm_client: LLMClient,
) -> TargetCompanyResponse:
    """
    Generate a target company profile using the shared analysis service.

    Args:
        request (TargetCompanyRequest): The validated request object.
        orchestrator (ContextOrchestrator): The context orchestrator agent.
        llm_client (LLMClient): The LLM client for prompt completion.

    Returns:
        TargetCompanyResponse: The structured response model.
    """
    service = CompanyAnalysisService(
        orchestrator=orchestrator,
        llm_client=llm_client,
    )
    return await service.analyze(
        request_data=request,
        analysis_type="target_company",
        prompt_template="target_company",
        prompt_vars_class=TargetCompanyPromptVars,
        response_model=TargetCompanyResponse,
        use_preprocessing=False,
    )
