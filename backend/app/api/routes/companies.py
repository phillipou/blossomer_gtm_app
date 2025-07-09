"""
Company CRUD endpoints with Row-Level Security.

This module provides CRUD operations for companies, with proper user scoping
and authentication through Stack Auth JWT tokens.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.auth import validate_stack_auth_jwt
from backend.app.services.database_service import DatabaseService
from backend.app.schemas import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyWithRelations,
)
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.services.product_overview_service import generate_product_overview_service
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.api.helpers import run_service

# OpenAPI Examples
company_create_example = {
    "name": "TechFlow Solutions",
    "url": "https://techflowsolutions.com",
    "analysis_data": {
        "description": "AI-powered workflow automation platform for software teams",
        "business_profile": {
            "category": "B2B SaaS workflow automation",
            "business_model": "Monthly/annual subscriptions with tiered pricing",
            "existing_customers": "50+ software companies using the platform",
        },
        "capabilities": [
            "Automated code review workflows",
            "CI/CD pipeline optimization",
            "Team collaboration tools",
            "Performance analytics dashboard",
        ],
        "positioning": {
            "key_market_belief": "Manual dev processes are the biggest bottleneck in software delivery",
            "unique_approach": "AI-driven automation that learns from team patterns",
        },
    },
}

company_update_example = {
    "name": "TechFlow Solutions (Updated)",
    "analysis_data": {
        "description": "Updated: AI-powered workflow automation platform for software teams",
        "last_updated": "2024-Q4",
    },
}

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new company",
    description="Create a new company record for the authenticated user with analysis data.",
    responses={
        201: {"description": "Company created successfully"},
        400: {"description": "Company with this name already exists"},
        401: {"description": "Not authenticated"},
        422: {"description": "Validation error"},
    },
)
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt),
):
    """
    Create a new company for the authenticated user.

    - **name**: Company name (required, max 255 chars)
    - **url**: Company website URL (required, max 500 chars)
    - **analysis_data**: Optional JSON data with company analysis including:
      - description: Brief company description
      - business_profile: Business model and customer info
      - capabilities: List of key features
      - positioning: Market positioning and differentiation

    Returns the created company with auto-generated ID and timestamps.
    """
    db_service = DatabaseService(db)
    return db_service.create_company(company_data, user["sub"])


@router.get("/", response_model=List[CompanyResponse])
async def get_companies(
    skip: int = Query(0, ge=0, description="Number of companies to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of companies to return"
    ),
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt),
):
    """
    Get all companies for the authenticated user.

    - **skip**: Number of companies to skip (for pagination)
    - **limit**: Maximum number of companies to return (1-1000)
    """
    db_service = DatabaseService(db)
    return db_service.get_companies(user["sub"], skip=skip, limit=limit)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt),
):
    """
    Get a specific company by ID.

    Only returns companies owned by the authenticated user.
    """
    db_service = DatabaseService(db)
    return db_service.get_company(company_id, user["sub"])


@router.get("/{company_id}/relations", response_model=CompanyWithRelations)
async def get_company_with_relations(
    company_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt),
):
    """
    Get a company with all related accounts.

    Only returns companies owned by the authenticated user.
    Includes nested account data.
    """
    db_service = DatabaseService(db)
    return db_service.get_company_with_relations(company_id, user["sub"])


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt),
):
    """
    Update a company.

    Only updates companies owned by the authenticated user.
    All fields are optional - only provided fields will be updated.
    """
    db_service = DatabaseService(db)
    return db_service.update_company(company_id, company_data, user["sub"])


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(validate_stack_auth_jwt),
):
    """
    Delete a company and all related data.

    Only deletes companies owned by the authenticated user.
    This will cascade delete all accounts, personas, and campaigns.
    """
    db_service = DatabaseService(db)
    db_service.delete_company(company_id, user["sub"])
    return None


@router.post(
    "/generate-ai",
    response_model=ProductOverviewResponse,
    summary="AI Generate Company Overview (features, company & persona profiles, pricing)",
    tags=["Companies", "AI"],
    response_description="A structured company overview for the given company context.",
)
async def prod_generate_product_overview(
    data: ProductOverviewRequest,
    user=Depends(validate_stack_auth_jwt),
    db: Session = Depends(get_db),
):
    """
    AI-generate a company overview for authenticated users (Stack Auth JWT required).
    """
    orchestrator = ContextOrchestrator()
    return await run_service(
        generate_product_overview_service, data, orchestrator=orchestrator
    )
