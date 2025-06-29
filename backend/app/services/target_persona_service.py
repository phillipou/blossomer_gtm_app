from typing import Any
from backend.app.schemas import TargetPersonaRequest, TargetPersonaResponse
from backend.app.prompts.models import TargetPersonaPromptVars
from backend.app.prompts.registry import render_prompt
from backend.app.services.context_orchestrator import (
    ContextOrchestrator,
    resolve_context_for_endpoint,
)


async def generate_target_persona_profile(
    request: TargetPersonaRequest,
    orchestrator: ContextOrchestrator,
    llm_client: Any,
) -> TargetPersonaResponse:
    """
    Generate a target persona profile using unified context assessment and LLM prompt rendering.

    Args:
        request (TargetPersonaRequest): The validated request object.
        orchestrator (ContextOrchestrator): The context orchestrator agent.
        llm_client (Any): The LLM client for prompt completion.

    Returns:
        TargetPersonaResponse: The structured response model.
    """
    context_result = await resolve_context_for_endpoint(
        request, "target_persona", orchestrator
    )
    prompt_vars = TargetPersonaPromptVars(
        website_content=(
            context_result["context"] if context_result["source"] == "website" else None
        ),
        user_inputted_context=request.user_inputted_context,
        llm_inferred_context=request.llm_inferred_context,
    )
    prompt = render_prompt("target_persona", prompt_vars)
    llm_output = await llm_client.generate_structured_output(
        prompt=prompt, response_model=TargetPersonaResponse
    )
    return TargetPersonaResponse.model_validate(llm_output)
