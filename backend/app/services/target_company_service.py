from typing import Any
from backend.app.schemas import TargetCompanyRequest, TargetCompanyResponse
from backend.app.prompts.models import TargetCompanyPromptVars
from backend.app.prompts.registry import render_prompt
from backend.app.services.context_orchestrator import (
    ContextOrchestrator,
    resolve_context_for_endpoint,
)


async def generate_target_company_profile(
    request: TargetCompanyRequest,
    orchestrator: ContextOrchestrator,
    llm_client: Any,
) -> TargetCompanyResponse:
    """
    Generate a target company profile using unified context assessment and LLM prompt rendering.

    Args:
        request (TargetCompanyRequest): The validated request object.
        orchestrator (ContextOrchestrator): The context orchestrator agent.
        llm_client (Any): The LLM client for prompt completion.

    Returns:
        TargetCompanyResponse: The structured response model.
    """
    context_result = await resolve_context_for_endpoint(
        request, "target_company", orchestrator
    )
    prompt_vars = TargetCompanyPromptVars(
        website_content=(
            context_result["context"] if context_result["source"] == "website" else None
        ),
        user_inputted_context=request.user_inputted_context,
        llm_inferred_context=request.llm_inferred_context,
    )
    prompt = render_prompt("target_company", prompt_vars)
    llm_output = await llm_client.generate_structured_output(
        prompt=prompt, response_model=TargetCompanyResponse
    )
    return TargetCompanyResponse.model_validate(llm_output)
