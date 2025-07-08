from fastapi import APIRouter, Depends, HTTPException, Request, Response
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.core.database import get_db
from backend.app.core.demo_rate_limiter import demo_ip_rate_limit_dependency
from sqlalchemy.orm import Session
from backend.app.core.auth import validate_stack_auth_jwt


router = APIRouter()


# TODO: Implement rate limiting using JWT user ID (user['sub'])
@router.post(
    "/demo/company",
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
    orchestrator = ContextOrchestrator()
    try:
        result = await generate_product_overview_service(data, orchestrator)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post(
    "/",
    response_model=ProductOverviewResponse,
    summary="Generate Company Overview (features, company & persona profiles, pricing)",
    tags=["Company", "Overview", "AI"],
    response_description="A structured company overview for the given company context.",
)
async def prod_generate_product_overview(
    data: ProductOverviewRequest,
    user=Depends(validate_stack_auth_jwt),
    db: Session = Depends(get_db),
):
    """
    Generate a company overview for authenticated users (Stack Auth JWT required).
    """
    # user_id = user['sub']  # TODO: Use user_id for rate limiting and business logic
    orchestrator = ContextOrchestrator()
    try:
        result = await generate_product_overview_service(data, orchestrator)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
