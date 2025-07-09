from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.core.database import get_db
from backend.app.core.user_rate_limiter import jwt_rate_limit_dependency
from sqlalchemy.orm import Session
from backend.app.core.auth import validate_stack_auth_jwt

from .helpers import run_service


router = APIRouter()


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
    _: None = Depends(jwt_rate_limit_dependency("company_generate")),
):
    """
    Generate a company overview for authenticated users (Stack Auth JWT required).
    """
    orchestrator = ContextOrchestrator()
    return await run_service(
        generate_product_overview_service, data=data, orchestrator=orchestrator
    )
