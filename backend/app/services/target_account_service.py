from backend.app.schemas import TargetAccountRequest, TargetAccountResponse
from backend.app.prompts.models import TargetAccountPromptVars
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
    llm_client: LLMClient,
) -> TargetAccountResponse:
    """
    Generate a target account profile using the shared analysis service.
    """
    service = ContextOrchestratorService(
        orchestrator=None,  # Not used anymore
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
    # Set target_company_name from user_inputted_context if present
    user_name = None
    if request.user_inputted_context:
        user_name = request.user_inputted_context.get("target_company_name")
    if user_name:
        response.target_company_name = user_name
    return response
