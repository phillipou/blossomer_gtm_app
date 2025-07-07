"""
Test cases for target_account_service.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.app.services.target_account_service import generate_target_account_profile
from backend.app.schemas import TargetAccountRequest, TargetAccountResponse
from backend.app.prompts.models import TargetAccountPromptVars
from fastapi import HTTPException
from pydantic import ValidationError


class TestGenerateTargetAccountProfile:
    """Test cases for generate_target_account_profile function."""

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_success(self):
        """Test successful target account profile generation."""
        request_data = TargetAccountRequest(
            company_context="Test company context",
            account_profile_name="Enterprise SaaS Companies",
            hypothesis="Target mid-market SaaS companies",
            additional_context="Focus on companies with 100-500 employees",
            website_content="Company website content",
        )

        expected_response = TargetAccountResponse(
            target_account_name="Enterprise SaaS Companies",
            target_account_description="Mid-market SaaS companies with growth potential",
            firmographics={
                "industry": ["Software", "Technology", "SaaS"],
                "company_size": "100-500 employees",
                "revenue_range": "$10M-$50M",
                "geography": ["North America", "Europe"],
                "company_stage": "Growth stage",
                "business_model": "B2B SaaS",
                "funding_status": "Series A-C",
            },
            key_characteristics={
                "technology_stack": ["Cloud-based", "API-first"],
                "business_priorities": ["Growth", "Efficiency", "Scale"],
                "decision_making_process": "Committee-based",
                "budget_authority": "Department level",
                "implementation_timeline": "3-6 months",
            },
            pain_points=[
                "Scaling challenges",
                "Integration complexity",
                "Data management",
            ],
            buying_signals=[
                {
                    "title": "Funding Events",
                    "indicators": ["Series A/B/C funding", "Growth investments"],
                    "signal_source": "funding_databases",
                }
            ],
            disqualifying_factors=[
                "Too small (<50 employees)",
                "Legacy technology stack",
                "No digital transformation initiative",
            ],
            account_examples=[
                {
                    "company_name": "Example SaaS Co",
                    "industry": "HR Technology",
                    "size": "200 employees",
                    "why_good_fit": "Growing rapidly, needs scalable solutions",
                }
            ],
            engagement_strategy={
                "primary_channels": ["LinkedIn", "Email", "Events"],
                "messaging_themes": ["Growth", "Efficiency", "ROI"],
                "content_types": ["Case studies", "ROI calculators"],
                "timing_considerations": "Post-funding announcements",
            },
            metadata={
                "sources_used": ["company_context", "user_input"],
                "context_quality": "sufficient",
                "assessment_summary": "Good target account definition",
                "assumptions_made": ["Standard SaaS growth patterns"],
                "primary_context_source": "user_input",
            },
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_account_profile(request_data)

            assert result == expected_response
            assert isinstance(result, TargetAccountResponse)
            assert result.target_account_name == "Enterprise SaaS Companies"
            assert (
                result.target_account_description
                == "Mid-market SaaS companies with growth potential"
            )

            # Verify service was called with correct parameters
            mock_service.analyze.assert_called_once_with(
                request_data=request_data,
                analysis_type="target_account",
                prompt_template="target_account",
                prompt_vars_class=TargetAccountPromptVars,
                response_model=TargetAccountResponse,
                use_preprocessing=False,
            )

            # Verify service was initialized without orchestrator
            mock_service_class.assert_called_once_with(orchestrator=None)

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_minimal_request(self):
        """Test target account profile generation with minimal request data."""
        request_data = TargetAccountRequest(
            company_context="Basic company context",
            account_profile_name="Basic Account Profile",
        )

        expected_response = TargetAccountResponse(
            target_account_name="Basic Account Profile",
            target_account_description="Basic account description",
            firmographics={
                "industry": ["Technology"],
                "company_size": "Unknown",
                "revenue_range": "Unknown",
                "geography": ["Unknown"],
                "company_stage": "Unknown",
                "business_model": "Unknown",
                "funding_status": "Unknown",
            },
            key_characteristics={
                "technology_stack": ["Unknown"],
                "business_priorities": ["Unknown"],
                "decision_making_process": "Unknown",
                "budget_authority": "Unknown",
                "implementation_timeline": "Unknown",
            },
            pain_points=["Unknown pain points"],
            buying_signals=[
                {
                    "title": "Unknown signals",
                    "indicators": ["No indicators"],
                    "signal_source": "unknown",
                }
            ],
            disqualifying_factors=["Unknown factors"],
            account_examples=[
                {
                    "company_name": "Unknown",
                    "industry": "Unknown",
                    "size": "Unknown",
                    "why_good_fit": "Unknown",
                }
            ],
            engagement_strategy={
                "primary_channels": ["Unknown"],
                "messaging_themes": ["Unknown"],
                "content_types": ["Unknown"],
                "timing_considerations": "Unknown",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "limited",
                "assessment_summary": "Basic analysis with limited context",
                "assumptions_made": ["General assumptions"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_account_profile(request_data)

            assert result == expected_response
            assert result.target_account_name == "Basic Account Profile"
            assert result.metadata["context_quality"] == "limited"

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_with_all_fields(self):
        """Test target account profile generation with all optional fields."""
        request_data = TargetAccountRequest(
            company_context="Comprehensive company context with detailed information",
            account_profile_name="Premium Enterprise Accounts",
            hypothesis="Target large enterprises with complex needs",
            additional_context="Focus on Fortune 500 companies with digital transformation initiatives",
            website_content="Rich website content with product details and case studies",
        )

        expected_response = TargetAccountResponse(
            target_account_name="Premium Enterprise Accounts",
            target_account_description="Large enterprise accounts with complex requirements",
            firmographics={
                "industry": ["Enterprise Software", "Financial Services", "Healthcare"],
                "company_size": "1000+ employees",
                "revenue_range": "$100M+",
                "geography": ["Global", "North America", "Europe", "APAC"],
                "company_stage": "Mature",
                "business_model": "Enterprise B2B",
                "funding_status": "Public/Late-stage private",
            },
            key_characteristics={
                "technology_stack": ["Enterprise-grade", "Multi-cloud", "API-first"],
                "business_priorities": [
                    "Digital transformation",
                    "Operational efficiency",
                    "Compliance",
                ],
                "decision_making_process": "Committee-based with long cycles",
                "budget_authority": "C-level approval required",
                "implementation_timeline": "6-12 months",
            },
            pain_points=[
                "Legacy system integration",
                "Compliance requirements",
                "Complex organizational structure",
                "Risk management",
            ],
            buying_signals=[
                {
                    "title": "Digital Transformation Initiatives",
                    "indicators": [
                        "CTO/CDO appointments",
                        "Technology budget increases",
                    ],
                    "signal_source": "executive_moves",
                },
                {
                    "title": "Compliance Requirements",
                    "indicators": ["New regulations", "Audit findings"],
                    "signal_source": "regulatory_changes",
                },
            ],
            disqualifying_factors=[
                "Limited budget (<$1M)",
                "No digital transformation strategy",
                "Highly regulated with no change appetite",
            ],
            account_examples=[
                {
                    "company_name": "Global Financial Corp",
                    "industry": "Financial Services",
                    "size": "5000+ employees",
                    "why_good_fit": "Undergoing digital transformation with significant tech budget",
                },
                {
                    "company_name": "Healthcare Systems Inc",
                    "industry": "Healthcare",
                    "size": "2000+ employees",
                    "why_good_fit": "Needs compliance solutions for new regulations",
                },
            ],
            engagement_strategy={
                "primary_channels": [
                    "Executive events",
                    "Partner referrals",
                    "Account-based marketing",
                ],
                "messaging_themes": [
                    "Digital transformation",
                    "Compliance",
                    "Risk mitigation",
                    "ROI",
                ],
                "content_types": [
                    "Executive briefings",
                    "Compliance guides",
                    "ROI studies",
                ],
                "timing_considerations": "Post-earnings calls, during planning cycles",
            },
            metadata={
                "sources_used": ["company_context", "user_input", "website_content"],
                "context_quality": "rich",
                "assessment_summary": "Comprehensive analysis with rich context",
                "assumptions_made": [
                    "Enterprise buying patterns",
                    "Compliance requirements",
                ],
                "primary_context_source": "user_input",
            },
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_account_profile(request_data)

            assert result == expected_response
            assert result.target_account_name == "Premium Enterprise Accounts"
            assert result.metadata["context_quality"] == "rich"
            assert len(result.buying_signals) == 2
            assert len(result.account_examples) == 2

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_service_error(self):
        """Test handling of service errors."""
        request_data = TargetAccountRequest(
            company_context="Test context", account_profile_name="Test Account"
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(
                side_effect=HTTPException(status_code=500, detail="Service error")
            )
            mock_service_class.return_value = mock_service

            with pytest.raises(HTTPException) as exc_info:
                await generate_target_account_profile(request_data)

            assert exc_info.value.status_code == 500
            assert "Service error" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_validation_error(self):
        """Test handling of validation errors."""
        request_data = TargetAccountRequest(
            company_context="Test context", account_profile_name="Test Account"
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(
                side_effect=HTTPException(
                    status_code=422,
                    detail="LLM response validation failed | analysis_type: target_account | validation_errors: Invalid response",
                )
            )
            mock_service_class.return_value = mock_service

            with pytest.raises(HTTPException) as exc_info:
                await generate_target_account_profile(request_data)

            assert exc_info.value.status_code == 422
            assert "LLM response validation failed" in str(exc_info.value.detail)
            assert "target_account" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_response_structure(self):
        """Test that response has correct structure and required fields."""
        request_data = TargetAccountRequest(
            company_context="Test context", account_profile_name="Test Account"
        )

        # Create a comprehensive response to test structure
        structured_response = TargetAccountResponse(
            target_account_name="Test Account",
            target_account_description="Test description",
            firmographics={
                "industry": ["Technology"],
                "company_size": "100-500",
                "revenue_range": "$10M-$50M",
                "geography": ["North America"],
                "company_stage": "Growth",
                "business_model": "B2B SaaS",
                "funding_status": "Series A",
            },
            key_characteristics={
                "technology_stack": ["Cloud"],
                "business_priorities": ["Growth"],
                "decision_making_process": "Committee",
                "budget_authority": "Department",
                "implementation_timeline": "3-6 months",
            },
            pain_points=["Scaling challenges"],
            buying_signals=[
                {
                    "title": "Growth signals",
                    "indicators": ["Hiring", "Funding"],
                    "signal_source": "company_updates",
                }
            ],
            disqualifying_factors=["Too small"],
            account_examples=[
                {
                    "company_name": "Example Co",
                    "industry": "Technology",
                    "size": "200",
                    "why_good_fit": "Good fit",
                }
            ],
            engagement_strategy={
                "primary_channels": ["LinkedIn"],
                "messaging_themes": ["Growth"],
                "content_types": ["Case studies"],
                "timing_considerations": "Post-funding",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "sufficient",
                "assessment_summary": "Good analysis",
                "assumptions_made": ["Standard patterns"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=structured_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_account_profile(request_data)

            # Verify top-level fields
            assert hasattr(result, "target_account_name")
            assert hasattr(result, "target_account_description")
            assert hasattr(result, "firmographics")
            assert hasattr(result, "key_characteristics")
            assert hasattr(result, "pain_points")
            assert hasattr(result, "buying_signals")
            assert hasattr(result, "disqualifying_factors")
            assert hasattr(result, "account_examples")
            assert hasattr(result, "engagement_strategy")
            assert hasattr(result, "metadata")

            # Verify firmographics structure
            assert "industry" in result.firmographics
            assert "company_size" in result.firmographics
            assert "revenue_range" in result.firmographics
            assert "geography" in result.firmographics
            assert "company_stage" in result.firmographics
            assert "business_model" in result.firmographics
            assert "funding_status" in result.firmographics

            # Verify key_characteristics structure
            assert "technology_stack" in result.key_characteristics
            assert "business_priorities" in result.key_characteristics
            assert "decision_making_process" in result.key_characteristics
            assert "budget_authority" in result.key_characteristics
            assert "implementation_timeline" in result.key_characteristics

            # Verify engagement_strategy structure
            assert "primary_channels" in result.engagement_strategy
            assert "messaging_themes" in result.engagement_strategy
            assert "content_types" in result.engagement_strategy
            assert "timing_considerations" in result.engagement_strategy

            # Verify metadata structure
            assert "sources_used" in result.metadata
            assert "context_quality" in result.metadata
            assert "assessment_summary" in result.metadata
            assert "assumptions_made" in result.metadata
            assert "primary_context_source" in result.metadata

            # Verify list types
            assert isinstance(result.pain_points, list)
            assert isinstance(result.buying_signals, list)
            assert isinstance(result.disqualifying_factors, list)
            assert isinstance(result.account_examples, list)

            # Verify buying_signals structure
            assert len(result.buying_signals) > 0
            assert "title" in result.buying_signals[0]
            assert "indicators" in result.buying_signals[0]
            assert "signal_source" in result.buying_signals[0]

            # Verify account_examples structure
            assert len(result.account_examples) > 0
            assert "company_name" in result.account_examples[0]
            assert "industry" in result.account_examples[0]
            assert "size" in result.account_examples[0]
            assert "why_good_fit" in result.account_examples[0]

    @pytest.mark.asyncio
    async def test_generate_target_account_profile_no_preprocessing(self):
        """Test that preprocessing is disabled for target account analysis."""
        request_data = TargetAccountRequest(
            company_context="Test context", account_profile_name="Test Account"
        )

        expected_response = TargetAccountResponse(
            target_account_name="Test Account",
            target_account_description="Test description",
            firmographics={
                "industry": ["Technology"],
                "company_size": "100-500",
                "revenue_range": "$10M-$50M",
                "geography": ["North America"],
                "company_stage": "Growth",
                "business_model": "B2B SaaS",
                "funding_status": "Series A",
            },
            key_characteristics={
                "technology_stack": ["Cloud"],
                "business_priorities": ["Growth"],
                "decision_making_process": "Committee",
                "budget_authority": "Department",
                "implementation_timeline": "3-6 months",
            },
            pain_points=["Scaling challenges"],
            buying_signals=[
                {
                    "title": "Growth signals",
                    "indicators": ["Hiring"],
                    "signal_source": "company_updates",
                }
            ],
            disqualifying_factors=["Too small"],
            account_examples=[
                {
                    "company_name": "Example Co",
                    "industry": "Technology",
                    "size": "200",
                    "why_good_fit": "Good fit",
                }
            ],
            engagement_strategy={
                "primary_channels": ["LinkedIn"],
                "messaging_themes": ["Growth"],
                "content_types": ["Case studies"],
                "timing_considerations": "Post-funding",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "sufficient",
                "assessment_summary": "Good analysis",
                "assumptions_made": ["Standard patterns"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_account_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_account_profile(request_data)

            # Verify preprocessing is disabled
            mock_service.analyze.assert_called_once()
            call_args = mock_service.analyze.call_args
            assert call_args[1]["use_preprocessing"] is False

            assert result == expected_response
