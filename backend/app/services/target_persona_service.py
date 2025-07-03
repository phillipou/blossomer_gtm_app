from backend.app.schemas import TargetPersonaRequest, TargetPersonaResponse
from backend.app.prompts.models import TargetPersonaPromptVars
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.context_orchestrator_service import ContextOrchestratorService
from backend.app.services.llm_service import LLMClient


async def generate_target_persona_profile(
    request: TargetPersonaRequest,
    orchestrator: ContextOrchestrator,
    llm_client: LLMClient,
) -> TargetPersonaResponse:
    """
    Generate a target persona profile using the shared analysis service.

    Args:
        request (TargetPersonaRequest): The validated request object.
        orchestrator (ContextOrchestrator): The context orchestrator agent.
        llm_client (LLMClient): The LLM client for prompt completion.

    Returns:
        TargetPersonaResponse: The structured response model.
    """
    service = ContextOrchestratorService(
        orchestrator=orchestrator,
        llm_client=llm_client,
    )
    return await service.analyze(
        request_data=request,
        analysis_type="target_persona",
        prompt_template="target_persona",
        prompt_vars_class=TargetPersonaPromptVars,
        response_model=TargetPersonaResponse,
        use_preprocessing=False,
    )
