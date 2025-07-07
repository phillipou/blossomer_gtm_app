"""
Test cases for product_overview_service.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.services.context_orchestrator_agent import ContextOrchestrator
from backend.app.schemas import ProductOverviewRequest, ProductOverviewResponse
from backend.app.prompts.models import ProductOverviewPromptVars
from fastapi import HTTPException
from pydantic import BaseModel


class MockProductOverviewResponse(BaseModel):
    """Mock response model for testing."""

    company_name: str
    company_url: str
    description: str
    metadata: dict = {}


class TestGenerateProductOverviewService:
    """Test cases for generate_product_overview_service function."""

    @pytest.mark.asyncio
    async def test_generate_product_overview_success(self):
        """Test successful product overview generation."""
        request_data = ProductOverviewRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        expected_response = ProductOverviewResponse(
            company_name="Test Company",
            company_url="https://example.com",
            description="Test company description",
            business_profile={
                "category": "Technology",
                "business_model": "SaaS",
                "existing_customers": "Enterprise clients",
            },
            capabilities=["Feature 1", "Feature 2"],
            use_case_analysis={
                "process_impact": "Improves efficiency",
                "problems_addressed": "Solves key problems",
                "how_they_do_it_today": "Manual processes",
            },
            positioning={
                "key_market_belief": "Market needs automation",
                "unique_approach": "AI-powered solution",
                "language_used": "Professional tone",
            },
            objections=["Cost concerns", "Integration complexity"],
            icp_hypothesis={
                "target_account_hypothesis": "Enterprise customers",
                "target_persona_hypothesis": "Technical decision makers",
            },
            metadata={
                "sources_used": ["website"],
                "context_quality": "sufficient",
                "assessment_summary": "Good coverage",
                "assumptions_made": ["Assumption 1"],
                "primary_context_source": "website",
            },
            buying_signals=[
                {
                    "title": "Funding signals",
                    "indicators": ["Recent funding"],
                    "signal_source": "news",
                }
            ],
        )

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_product_overview_service(
                data=request_data, orchestrator=mock_orchestrator
            )

            assert result == expected_response
            assert isinstance(result, ProductOverviewResponse)
            assert result.company_name == "Test Company"
            assert result.company_url == "https://example.com"
            assert result.description == "Test company description"

            # Verify service was called with correct parameters
            mock_service.analyze.assert_called_once_with(
                request_data=request_data,
                analysis_type="product_overview",
                prompt_template="product_overview",
                prompt_vars_class=ProductOverviewPromptVars,
                response_model=ProductOverviewResponse,
                use_preprocessing=True,
            )

    @pytest.mark.asyncio
    async def test_generate_product_overview_with_preprocessing(self):
        """Test that preprocessing pipeline is properly configured."""
        request_data = ProductOverviewRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        expected_response = ProductOverviewResponse(
            company_name="Test Company",
            company_url="https://example.com",
            description="Test company description",
            business_profile={
                "category": "Technology",
                "business_model": "SaaS",
                "existing_customers": "Enterprise clients",
            },
            capabilities=["Feature 1", "Feature 2"],
            use_case_analysis={
                "process_impact": "Improves efficiency",
                "problems_addressed": "Solves key problems",
                "how_they_do_it_today": "Manual processes",
            },
            positioning={
                "key_market_belief": "Market needs automation",
                "unique_approach": "AI-powered solution",
                "language_used": "Professional tone",
            },
            objections=["Cost concerns", "Integration complexity"],
            icp_hypothesis={
                "target_account_hypothesis": "Enterprise customers",
                "target_persona_hypothesis": "Technical decision makers",
            },
            metadata={
                "sources_used": ["website"],
                "context_quality": "sufficient",
                "assessment_summary": "Good coverage",
                "assumptions_made": ["Assumption 1"],
                "primary_context_source": "website",
            },
            buying_signals=[
                {
                    "title": "Funding signals",
                    "indicators": ["Recent funding"],
                    "signal_source": "news",
                }
            ],
        )

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_product_overview_service(
                data=request_data, orchestrator=mock_orchestrator
            )

            # Verify service was initialized with preprocessing pipeline
            mock_service_class.assert_called_once()
            init_args = mock_service_class.call_args
            assert init_args[1]["orchestrator"] == mock_orchestrator
            assert init_args[1]["preprocessing_pipeline"] is not None

            # Verify preprocessing was enabled
            mock_service.analyze.assert_called_once()
            analyze_args = mock_service.analyze.call_args
            assert analyze_args[1]["use_preprocessing"] is True

    @pytest.mark.asyncio
    async def test_generate_product_overview_insufficient_content(self):
        """Test handling of insufficient content error."""
        request_data = ProductOverviewRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        # Mock response with insufficient content
        insufficient_response = MockProductOverviewResponse(
            company_name="Test Company",
            company_url="https://example.com",
            description="Test description",
            metadata={
                "context_quality": "insufficient",
                "sources_used": ["website"],
                "assessment_summary": "Insufficient content",
            },
        )

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=insufficient_response)
            mock_service_class.return_value = mock_service

            with pytest.raises(HTTPException) as exc_info:
                await generate_product_overview_service(
                    data=request_data, orchestrator=mock_orchestrator
                )

            assert exc_info.value.status_code == 422
            assert "Insufficient website content" in str(exc_info.value.detail["error"])
            assert exc_info.value.detail["analysis_type"] == "product_overview"

    @pytest.mark.asyncio
    async def test_generate_product_overview_orchestrator_error(self):
        """Test handling of orchestrator service errors."""
        request_data = ProductOverviewRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(
                side_effect=HTTPException(status_code=500, detail="Service error")
            )
            mock_service_class.return_value = mock_service

            with pytest.raises(HTTPException) as exc_info:
                await generate_product_overview_service(
                    data=request_data, orchestrator=mock_orchestrator
                )

            assert exc_info.value.status_code == 500
            assert "Service error" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_generate_product_overview_with_minimal_request(self):
        """Test product overview generation with minimal request data."""
        request_data = ProductOverviewRequest(website_url="https://example.com")

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        expected_response = ProductOverviewResponse(
            company_name="Minimal Company",
            company_url="https://example.com",
            description="Minimal description",
            business_profile={
                "category": "Unknown",
                "business_model": "Unknown",
                "existing_customers": "Unknown",
            },
            capabilities=["Basic feature"],
            use_case_analysis={
                "process_impact": "Unknown impact",
                "problems_addressed": "Unknown problems",
                "how_they_do_it_today": "Unknown processes",
            },
            positioning={
                "key_market_belief": "Unknown belief",
                "unique_approach": "Unknown approach",
                "language_used": "Unknown language",
            },
            objections=["Unknown objections"],
            icp_hypothesis={
                "target_account_hypothesis": "Unknown targets",
                "target_persona_hypothesis": "Unknown personas",
            },
            metadata={
                "sources_used": ["website"],
                "context_quality": "sufficient",
                "assessment_summary": "Basic coverage",
                "assumptions_made": ["Limited data"],
                "primary_context_source": "website",
            },
            buying_signals=[
                {
                    "title": "Unknown signals",
                    "indicators": ["No indicators"],
                    "signal_source": "unknown",
                }
            ],
        )

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_product_overview_service(
                data=request_data, orchestrator=mock_orchestrator
            )

            assert result == expected_response
            assert result.company_name == "Minimal Company"
            assert result.metadata["context_quality"] == "sufficient"

    @pytest.mark.asyncio
    async def test_generate_product_overview_response_validation(self):
        """Test that response validation works correctly."""
        request_data = ProductOverviewRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        # Create a valid response
        valid_response = ProductOverviewResponse(
            company_name="Valid Company",
            company_url="https://example.com",
            description="Valid description with sufficient length",
            business_profile={
                "category": "Technology",
                "business_model": "SaaS platform",
                "existing_customers": "Enterprise customers",
            },
            capabilities=["Feature A", "Feature B", "Feature C"],
            use_case_analysis={
                "process_impact": "Streamlines operations",
                "problems_addressed": "Solves efficiency issues",
                "how_they_do_it_today": "Manual processes",
            },
            positioning={
                "key_market_belief": "Automation is key",
                "unique_approach": "AI-powered solution",
                "language_used": "Technical but accessible",
            },
            objections=["Cost", "Implementation time"],
            icp_hypothesis={
                "target_account_hypothesis": "Mid-market companies",
                "target_persona_hypothesis": "Operations managers",
            },
            metadata={
                "sources_used": ["website"],
                "context_quality": "sufficient",
                "assessment_summary": "Comprehensive analysis",
                "assumptions_made": ["Standard industry practices"],
                "primary_context_source": "website",
            },
            buying_signals=[
                {
                    "title": "Growth signals",
                    "indicators": ["Revenue growth", "Team expansion"],
                    "signal_source": "company_updates",
                }
            ],
        )

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=valid_response)
            mock_service_class.return_value = mock_service

            result = await generate_product_overview_service(
                data=request_data, orchestrator=mock_orchestrator
            )

            # Verify all required fields are present
            assert hasattr(result, "company_name")
            assert hasattr(result, "company_url")
            assert hasattr(result, "description")
            assert hasattr(result, "business_profile")
            assert hasattr(result, "capabilities")
            assert hasattr(result, "use_case_analysis")
            assert hasattr(result, "positioning")
            assert hasattr(result, "objections")
            assert hasattr(result, "icp_hypothesis")
            assert hasattr(result, "metadata")
            assert hasattr(result, "buying_signals")

            # Verify nested structure
            assert "category" in result.business_profile
            assert "business_model" in result.business_profile
            assert "existing_customers" in result.business_profile

            assert "process_impact" in result.use_case_analysis
            assert "problems_addressed" in result.use_case_analysis
            assert "how_they_do_it_today" in result.use_case_analysis

            assert "key_market_belief" in result.positioning
            assert "unique_approach" in result.positioning
            assert "language_used" in result.positioning

            assert "target_account_hypothesis" in result.icp_hypothesis
            assert "target_persona_hypothesis" in result.icp_hypothesis

            assert "sources_used" in result.metadata
            assert "context_quality" in result.metadata

            assert isinstance(result.capabilities, list)
            assert isinstance(result.objections, list)
            assert isinstance(result.buying_signals, list)

    @pytest.mark.asyncio
    async def test_generate_product_overview_metadata_handling(self):
        """Test proper handling of metadata fields."""
        request_data = ProductOverviewRequest(
            website_url="https://example.com", user_inputted_context="Rich context data"
        )

        mock_orchestrator = MagicMock(spec=ContextOrchestrator)

        response_with_metadata = ProductOverviewResponse(
            company_name="Metadata Company",
            company_url="https://example.com",
            description="Company with rich metadata",
            business_profile={
                "category": "Technology",
                "business_model": "SaaS",
                "existing_customers": "Enterprise",
            },
            capabilities=["Feature 1"],
            use_case_analysis={
                "process_impact": "Impact",
                "problems_addressed": "Problems",
                "how_they_do_it_today": "Current state",
            },
            positioning={
                "key_market_belief": "Belief",
                "unique_approach": "Approach",
                "language_used": "Language",
            },
            objections=["Objection 1"],
            icp_hypothesis={
                "target_account_hypothesis": "Account hypothesis",
                "target_persona_hypothesis": "Persona hypothesis",
            },
            metadata={
                "sources_used": ["website", "user_input"],
                "context_quality": "rich",
                "assessment_summary": "Comprehensive analysis with rich context",
                "assumptions_made": ["Assumption 1", "Assumption 2"],
                "primary_context_source": "user_input",
            },
            buying_signals=[
                {
                    "title": "Strong signals",
                    "indicators": ["Multiple indicators"],
                    "signal_source": "multiple",
                }
            ],
        )

        with patch(
            "backend.app.services.product_overview_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=response_with_metadata)
            mock_service_class.return_value = mock_service

            result = await generate_product_overview_service(
                data=request_data, orchestrator=mock_orchestrator
            )

            # Verify metadata fields
            assert result.metadata["context_quality"] == "rich"
            assert result.metadata["sources_used"] == ["website", "user_input"]
            assert result.metadata["primary_context_source"] == "user_input"
            assert "Comprehensive analysis" in result.metadata["assessment_summary"]
            assert len(result.metadata["assumptions_made"]) == 2
