from backend.app.schemas import TargetPersonaRequest, TargetPersonaResponse
from backend.app.prompts.models import TargetPersonaPromptVars
from backend.app.services.context_orchestrator_service import ContextOrchestratorService


async def generate_target_persona_profile(
    request: TargetPersonaRequest,
) -> TargetPersonaResponse:
    """
    Generate a target persona profile using the shared analysis service.
    Uses the shared LLM client instance from llm_singleton.

    Args:
        request (TargetPersonaRequest): The validated request object.

    Returns:
        TargetPersonaResponse: The structured response model.
    """
    service = ContextOrchestratorService(
        orchestrator=None,  # Not used anymore
    )
    response = await service.analyze(
        request_data=request,
        analysis_type="target_persona",
        prompt_template="target_persona",
        prompt_vars_class=TargetPersonaPromptVars,
        response_model=TargetPersonaResponse,
        use_preprocessing=False,
    )
    # Set persona_name and persona_description from user_inputted_context if present
    if request.user_inputted_context:
        if request.user_inputted_context.get("persona_name"):
            response.persona_name = request.user_inputted_context["persona_name"]
    return response
