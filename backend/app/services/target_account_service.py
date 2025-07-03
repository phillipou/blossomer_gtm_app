from backend.app.schemas import TargetAccountRequest, TargetAccountResponse
from backend.app.prompts.models import TargetAccountPromptVars
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.context_orchestrator_service import ContextOrchestratorService
from backend.app.services.llm_service import LLMClient
from typing import Optional
import re


def extract_target_company_name(user_inputted_context: Optional[str]) -> Optional[str]:
    """
    Extracts the target_company_name from user_inputted_context using a robust regex.
    Returns None if not found.
    """
    if not user_inputted_context:
        return None
    match = re.search(r"target_company_name:\s*(.+)", user_inputted_context)
    if match:
        return match.group(1).strip()
    return None


async def generate_target_account_profile(
    request: TargetAccountRequest,
    orchestrator: ContextOrchestrator,
    llm_client: LLMClient,
) -> TargetAccountResponse:
    """
    Generate a target account profile using the shared analysis service.

    Args:
        request (TargetAccountRequest): The validated request object.
        orchestrator (ContextOrchestrator): The context orchestrator agent.
        llm_client (LLMClient): The LLM client for prompt completion.

    Returns:
        TargetAccountResponse: The structured response model.
    """
    service = ContextOrchestratorService(
        orchestrator=orchestrator,
        llm_client=llm_client,
    )
    response: TargetAccountResponse = await service.analyze(
        request_data=request,
        analysis_type="target_account",
        prompt_template="target_account",
        prompt_vars_class=TargetAccountPromptVars,
        response_model=TargetAccountResponse,
        use_preprocessing=False,
    )
    # Use the explicit target_company_name field if provided
    if request.target_company_name:
        response.target_company_name = request.target_company_name
    return response
