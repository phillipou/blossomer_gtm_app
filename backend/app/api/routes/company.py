from fastapi import APIRouter, Depends, HTTPException, Request, Response
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.core.database import get_db
from backend.app.services.llm_service import LLMClient, OpenAIProvider
from backend.app.core.demo_ip_rate_limit import demo_ip_rate_limit_dependency
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
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _: None = Depends(demo_ip_rate_limit_dependency("company_generate")),
):
    """
    Generate a company overview for demo users, with IP-based rate limiting.
    Authenticated users should use the API key system.
    """
    orchestrator = ContextOrchestrator(llm_client)
    try:
        result = await generate_product_overview_service(data, orchestrator, llm_client)
        # Rate limit headers are set by the dependency on the response
        return result
    except ValueError as e:
        # Rate limit headers are set by the dependency on the response
        raise HTTPException(status_code=422, detail=str(e))
