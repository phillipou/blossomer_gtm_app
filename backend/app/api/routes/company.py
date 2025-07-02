from fastapi import APIRouter, Depends, HTTPException, Request, Response
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.core.database import get_db
from backend.app.services.llm_service import LLMClient, OpenAIProvider
from backend.app.core.demo_rate_limiter import demo_ip_rate_limit_dependency
from backend.app.core.auth import rate_limit_dependency
from sqlalchemy.orm import Session
from backend.app.models import APIKey


router = APIRouter()

llm_client = LLMClient([OpenAIProvider()])


@router.post(
    "/demo/company/generate",
    response_model=ProductOverviewResponse,
    summary="[DEMO] Generate Company Overview (features, company & persona profiles, pricing)",
    tags=["Demo", "Company", "Overview", "AI"],
    response_description="A structured company overview for the given company context.",
)
async def demo_generate_product_overview(
    data: ProductOverviewRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _: None = Depends(demo_ip_rate_limit_dependency("company_generate")),
):
    """
    Generate a company overview for demo users, with IP-based rate limiting.
    """
    orchestrator = ContextOrchestrator(llm_client)
    try:
        result = await generate_product_overview_service(data, orchestrator, llm_client)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post(
    "/generate",
    response_model=ProductOverviewResponse,
    summary="Generate Company Overview (features, company & persona profiles, pricing)",
    tags=["Company", "Overview", "AI"],
    response_description="A structured company overview for the given company context.",
)
async def prod_generate_product_overview(
    data: ProductOverviewRequest,
    api_key_record: APIKey = Depends(rate_limit_dependency("company_generate")),
    db: Session = Depends(get_db),
):
    """
    Generate a company overview for authenticated users (API key required).
    """
    orchestrator = ContextOrchestrator(llm_client)
    try:
        result = await generate_product_overview_service(data, orchestrator, llm_client)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
