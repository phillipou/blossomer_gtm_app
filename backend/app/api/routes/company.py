from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.core.database import get_db
from backend.app.services.llm_service import LLMClient, OpenAIProvider
from sqlalchemy.orm import Session


router = APIRouter()

llm_client = LLMClient([OpenAIProvider()])


@router.post(
    "/generate",
    response_model=ProductOverviewResponse,
    summary="Generate Company Overview (features, company & persona profiles, pricing)",
    tags=["Company", "Overview", "AI"],
    response_description="A structured company overview for the given company context.",
)
async def generate_product_overview(
    data: ProductOverviewRequest,
    db: Session = Depends(get_db),
):
    # TODO: Add rate limiting for unauthenticated users (e.g., IP-based or anonymous quota)
    orchestrator = ContextOrchestrator(llm_client)
    try:
        return await generate_product_overview_service(data, orchestrator, llm_client)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
