"""
Test cases for target_persona_service.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.app.services.target_persona_service import generate_target_persona_profile
from backend.app.schemas import TargetPersonaRequest, TargetPersonaResponse
from backend.app.prompts.models import TargetPersonaPromptVars
from fastapi import HTTPException


class TestGenerateTargetPersonaProfile:
    """Test cases for generate_target_persona_profile function."""

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_success(self):
        """Test successful target persona profile generation."""
        request_data = TargetPersonaRequest(
            persona_profile_name="Chief Technology Officer",
            hypothesis="CTOs are primary decision makers for enterprise software",
            additional_context="Focus on CTOs at mid-market companies",
            company_context="Enterprise software company",
            target_account_context="Mid-market SaaS companies",
            website_content="Company website content",
        )

        expected_response = TargetPersonaResponse(
            target_persona_name="Chief Technology Officer",
            persona_description="Senior technology leader responsible for technical strategy",
            demographics={
                "title": "Chief Technology Officer",
                "department": "Technology",
                "seniority_level": "C-Level",
                "years_experience": "10-15 years",
                "education": "Computer Science or Engineering degree",
                "typical_background": "Software engineering and technology leadership",
            },
            psychographics={
                "motivations": ["Innovation", "Technical excellence", "Team growth"],
                "goals": [
                    "Modernize technology stack",
                    "Improve system reliability",
                    "Build scalable solutions",
                ],
                "challenges": [
                    "Technical debt",
                    "Talent acquisition",
                    "Budget constraints",
                ],
                "values": ["Innovation", "Quality", "Collaboration"],
                "preferred_communication": "Technical depth with business context",
            },
            day_in_life={
                "primary_responsibilities": [
                    "Technical strategy",
                    "Team leadership",
                    "Architecture decisions",
                ],
                "tools_used": ["Slack", "Jira", "GitHub", "AWS/GCP/Azure"],
                "meeting_schedule": "40% meetings, 60% technical work",
                "decision_making_process": "Data-driven with technical validation",
                "information_sources": [
                    "Technical blogs",
                    "Industry conferences",
                    "Peer networks",
                ],
            },
            pain_points=[
                "Legacy system maintenance",
                "Scaling challenges",
                "Security concerns",
                "Technical talent shortage",
            ],
            buying_behavior={
                "decision_making_role": "Primary technical decision maker",
                "evaluation_criteria": [
                    "Technical fit",
                    "Scalability",
                    "Security",
                    "ROI",
                ],
                "decision_timeline": "3-6 months",
                "budget_influence": "High influence on technical budget",
                "preferred_vendor_interaction": "Technical demos and deep dives",
            },
            messaging_preferences={
                "communication_channels": [
                    "Email",
                    "LinkedIn",
                    "Technical conferences",
                ],
                "content_types": [
                    "Technical whitepapers",
                    "Case studies",
                    "Architecture guides",
                ],
                "messaging_tone": "Technical but accessible",
                "key_value_propositions": [
                    "Technical excellence",
                    "Scalability",
                    "Innovation",
                ],
                "objection_handling": "Address technical concerns with proof points",
            },
            engagement_strategy={
                "outreach_timing": "Tuesday-Thursday, 9-11 AM",
                "content_calendar": "Technical content weekly, product updates monthly",
                "event_participation": "Technical conferences and meetups",
                "social_media_strategy": "LinkedIn thought leadership",
                "referral_sources": "Technical peers and industry analysts",
            },
            metadata={
                "sources_used": [
                    "company_context",
                    "target_account_context",
                    "user_input",
                ],
                "context_quality": "sufficient",
                "assessment_summary": "Good persona definition with technical focus",
                "assumptions_made": [
                    "Standard CTO responsibilities",
                    "Mid-market company structure",
                ],
                "primary_context_source": "user_input",
            },
        )

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=expected_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            assert result == expected_response
            assert isinstance(result, TargetPersonaResponse)
            assert result.target_persona_name == "Chief Technology Officer"
            assert (
                result.persona_description
                == "Senior technology leader responsible for technical strategy"
            )

            # Verify service was called with correct parameters
            mock_service.analyze.assert_called_once_with(
                request_data=request_data,
                analysis_type="target_persona",
                prompt_template="target_persona",
                prompt_vars_class=TargetPersonaPromptVars,
                response_model=TargetPersonaResponse,
                use_preprocessing=False,
            )

            # Verify service was initialized without orchestrator
            mock_service_class.assert_called_once_with(orchestrator=None)

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_name_override(self):
        """Test that persona_profile_name overrides target_persona_name."""
        request_data = TargetPersonaRequest(
            persona_profile_name="VP of Engineering",
            hypothesis="VPs are key technical decision makers",
            company_context="Tech company context",
        )

        # Mock response with different target_persona_name
        mock_response = TargetPersonaResponse(
            target_persona_name="Different Name",  # This should be overridden
            persona_description="Technical leader",
            demographics={
                "title": "VP of Engineering",
                "department": "Engineering",
                "seniority_level": "VP Level",
                "years_experience": "8-12 years",
                "education": "Engineering degree",
                "typical_background": "Software engineering",
            },
            psychographics={
                "motivations": ["Team success"],
                "goals": ["Deliver quality software"],
                "challenges": ["Resource constraints"],
                "values": ["Quality"],
                "preferred_communication": "Direct and technical",
            },
            day_in_life={
                "primary_responsibilities": ["Team management"],
                "tools_used": ["Jira"],
                "meeting_schedule": "50% meetings",
                "decision_making_process": "Collaborative",
                "information_sources": ["Tech blogs"],
            },
            pain_points=["Technical debt"],
            buying_behavior={
                "decision_making_role": "Influencer",
                "evaluation_criteria": ["Technical fit"],
                "decision_timeline": "2-4 months",
                "budget_influence": "Medium",
                "preferred_vendor_interaction": "Technical demos",
            },
            messaging_preferences={
                "communication_channels": ["Email"],
                "content_types": ["Technical docs"],
                "messaging_tone": "Technical",
                "key_value_propositions": ["Efficiency"],
                "objection_handling": "Address concerns",
            },
            engagement_strategy={
                "outreach_timing": "Business hours",
                "content_calendar": "Weekly updates",
                "event_participation": "Tech events",
                "social_media_strategy": "LinkedIn",
                "referral_sources": "Peers",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "sufficient",
                "assessment_summary": "Good analysis",
                "assumptions_made": ["Standard VP role"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=mock_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            # Verify the name was overridden
            assert result.target_persona_name == "VP of Engineering"
            assert result.persona_description == "Technical leader"

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_no_name_override(self):
        """Test that target_persona_name is not overridden when persona_profile_name is None."""
        request_data = TargetPersonaRequest(
            hypothesis="Test hypothesis", company_context="Test context"
        )

        mock_response = TargetPersonaResponse(
            target_persona_name="Original Name",
            persona_description="Technical leader",
            demographics={
                "title": "Technical Leader",
                "department": "Engineering",
                "seniority_level": "Senior",
                "years_experience": "5+ years",
                "education": "Engineering degree",
                "typical_background": "Software engineering",
            },
            psychographics={
                "motivations": ["Success"],
                "goals": ["Deliver software"],
                "challenges": ["Constraints"],
                "values": ["Quality"],
                "preferred_communication": "Direct",
            },
            day_in_life={
                "primary_responsibilities": ["Development"],
                "tools_used": ["IDE"],
                "meeting_schedule": "30% meetings",
                "decision_making_process": "Analytical",
                "information_sources": ["Documentation"],
            },
            pain_points=["Technical challenges"],
            buying_behavior={
                "decision_making_role": "User",
                "evaluation_criteria": ["Usability"],
                "decision_timeline": "1-2 months",
                "budget_influence": "Low",
                "preferred_vendor_interaction": "Product demos",
            },
            messaging_preferences={
                "communication_channels": ["Email"],
                "content_types": ["Technical docs"],
                "messaging_tone": "Technical",
                "key_value_propositions": ["Efficiency"],
                "objection_handling": "Address concerns",
            },
            engagement_strategy={
                "outreach_timing": "Business hours",
                "content_calendar": "As needed",
                "event_participation": "Tech meetups",
                "social_media_strategy": "LinkedIn",
                "referral_sources": "Colleagues",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "sufficient",
                "assessment_summary": "Basic analysis",
                "assumptions_made": ["Standard role"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=mock_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            # Verify the name was not overridden
            assert result.target_persona_name == "Original Name"

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_minimal_request(self):
        """Test target persona profile generation with minimal request data."""
        request_data = TargetPersonaRequest(company_context="Basic company context")

        minimal_response = TargetPersonaResponse(
            target_persona_name="Generic Persona",
            persona_description="Basic persona description",
            demographics={
                "title": "Unknown",
                "department": "Unknown",
                "seniority_level": "Unknown",
                "years_experience": "Unknown",
                "education": "Unknown",
                "typical_background": "Unknown",
            },
            psychographics={
                "motivations": ["Unknown"],
                "goals": ["Unknown"],
                "challenges": ["Unknown"],
                "values": ["Unknown"],
                "preferred_communication": "Unknown",
            },
            day_in_life={
                "primary_responsibilities": ["Unknown"],
                "tools_used": ["Unknown"],
                "meeting_schedule": "Unknown",
                "decision_making_process": "Unknown",
                "information_sources": ["Unknown"],
            },
            pain_points=["Unknown pain points"],
            buying_behavior={
                "decision_making_role": "Unknown",
                "evaluation_criteria": ["Unknown"],
                "decision_timeline": "Unknown",
                "budget_influence": "Unknown",
                "preferred_vendor_interaction": "Unknown",
            },
            messaging_preferences={
                "communication_channels": ["Unknown"],
                "content_types": ["Unknown"],
                "messaging_tone": "Unknown",
                "key_value_propositions": ["Unknown"],
                "objection_handling": "Unknown",
            },
            engagement_strategy={
                "outreach_timing": "Unknown",
                "content_calendar": "Unknown",
                "event_participation": "Unknown",
                "social_media_strategy": "Unknown",
                "referral_sources": "Unknown",
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
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=minimal_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            assert result == minimal_response
            assert result.target_persona_name == "Generic Persona"
            assert result.metadata["context_quality"] == "limited"

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_with_all_fields(self):
        """Test target persona profile generation with all optional fields."""
        request_data = TargetPersonaRequest(
            persona_profile_name="Senior Product Manager",
            hypothesis="Product managers are key stakeholders for product-related decisions",
            additional_context="Focus on B2B product managers with enterprise experience",
            company_context="Enterprise software company with product-led growth",
            target_account_context="Mid-market and enterprise B2B companies",
            website_content="Comprehensive product information and case studies",
        )

        comprehensive_response = TargetPersonaResponse(
            target_persona_name="Senior Product Manager",
            persona_description="Experienced product leader responsible for product strategy and roadmap",
            demographics={
                "title": "Senior Product Manager",
                "department": "Product Management",
                "seniority_level": "Senior",
                "years_experience": "5-8 years",
                "education": "Business or Engineering degree, often MBA",
                "typical_background": "Product management, consulting, or engineering",
            },
            psychographics={
                "motivations": [
                    "Product success",
                    "User satisfaction",
                    "Market growth",
                ],
                "goals": [
                    "Launch successful products",
                    "Increase user adoption",
                    "Drive revenue growth",
                ],
                "challenges": [
                    "Competing priorities",
                    "Resource constraints",
                    "Technical complexity",
                ],
                "values": [
                    "Customer-centricity",
                    "Data-driven decisions",
                    "Innovation",
                ],
                "preferred_communication": "Strategic with tactical details",
            },
            day_in_life={
                "primary_responsibilities": [
                    "Product strategy",
                    "Roadmap planning",
                    "Stakeholder management",
                ],
                "tools_used": [
                    "Jira",
                    "Slack",
                    "Figma",
                    "Analytics tools",
                    "Roadmap tools",
                ],
                "meeting_schedule": "60% meetings, 40% strategic work",
                "decision_making_process": "Data-driven with user feedback",
                "information_sources": [
                    "User research",
                    "Market analysis",
                    "Competitive intelligence",
                ],
            },
            pain_points=[
                "Balancing feature requests",
                "Technical debt vs new features",
                "Cross-functional alignment",
                "Measuring product success",
            ],
            buying_behavior={
                "decision_making_role": "Primary influencer and evaluator",
                "evaluation_criteria": [
                    "User impact",
                    "Technical feasibility",
                    "Business value",
                    "Integration ease",
                ],
                "decision_timeline": "2-4 months",
                "budget_influence": "High influence on product budget",
                "preferred_vendor_interaction": "Product demos and pilot programs",
            },
            messaging_preferences={
                "communication_channels": ["Email", "LinkedIn", "Product conferences"],
                "content_types": [
                    "Product comparisons",
                    "ROI calculators",
                    "User success stories",
                ],
                "messaging_tone": "Strategic and outcome-focused",
                "key_value_propositions": [
                    "User experience",
                    "Business impact",
                    "Implementation ease",
                ],
                "objection_handling": "Address with data, case studies, and pilot opportunities",
            },
            engagement_strategy={
                "outreach_timing": "Tuesday-Thursday, 10 AM-12 PM",
                "content_calendar": "Product insights weekly, industry trends monthly",
                "event_participation": "Product conferences, user groups, webinars",
                "social_media_strategy": "LinkedIn thought leadership on product strategy",
                "referral_sources": "Product management community, current users, industry analysts",
            },
            metadata={
                "sources_used": [
                    "company_context",
                    "target_account_context",
                    "user_input",
                    "website_content",
                ],
                "context_quality": "rich",
                "assessment_summary": "Comprehensive persona analysis with rich context",
                "assumptions_made": [
                    "Standard PM responsibilities",
                    "B2B product focus",
                    "Enterprise context",
                ],
                "primary_context_source": "user_input",
            },
        )

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=comprehensive_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            assert result == comprehensive_response
            assert result.target_persona_name == "Senior Product Manager"
            assert result.metadata["context_quality"] == "rich"
            assert len(result.pain_points) == 4
            assert "Product strategy" in result.day_in_life["primary_responsibilities"]

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_service_error(self):
        """Test handling of service errors."""
        request_data = TargetPersonaRequest(company_context="Test context")

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(
                side_effect=HTTPException(status_code=500, detail="Service error")
            )
            mock_service_class.return_value = mock_service

            with pytest.raises(HTTPException) as exc_info:
                await generate_target_persona_profile(request_data)

            assert exc_info.value.status_code == 500
            assert "Service error" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_validation_error(self):
        """Test handling of validation errors."""
        request_data = TargetPersonaRequest(company_context="Test context")

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(
                side_effect=HTTPException(
                    status_code=422,
                    detail="LLM response validation failed | analysis_type: target_persona | validation_errors: Invalid response",
                )
            )
            mock_service_class.return_value = mock_service

            with pytest.raises(HTTPException) as exc_info:
                await generate_target_persona_profile(request_data)

            assert exc_info.value.status_code == 422
            assert "LLM response validation failed" in str(exc_info.value.detail)
            assert "target_persona" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_response_structure(self):
        """Test that response has correct structure and required fields."""
        request_data = TargetPersonaRequest(company_context="Test context")

        structured_response = TargetPersonaResponse(
            target_persona_name="Test Persona",
            persona_description="Test description",
            demographics={
                "title": "Test Title",
                "department": "Test Department",
                "seniority_level": "Senior",
                "years_experience": "5+ years",
                "education": "Degree",
                "typical_background": "Background",
            },
            psychographics={
                "motivations": ["Motivation 1"],
                "goals": ["Goal 1"],
                "challenges": ["Challenge 1"],
                "values": ["Value 1"],
                "preferred_communication": "Direct",
            },
            day_in_life={
                "primary_responsibilities": ["Responsibility 1"],
                "tools_used": ["Tool 1"],
                "meeting_schedule": "50% meetings",
                "decision_making_process": "Analytical",
                "information_sources": ["Source 1"],
            },
            pain_points=["Pain point 1"],
            buying_behavior={
                "decision_making_role": "Decision maker",
                "evaluation_criteria": ["Criteria 1"],
                "decision_timeline": "1-3 months",
                "budget_influence": "High",
                "preferred_vendor_interaction": "Demos",
            },
            messaging_preferences={
                "communication_channels": ["Email"],
                "content_types": ["Content 1"],
                "messaging_tone": "Professional",
                "key_value_propositions": ["Value prop 1"],
                "objection_handling": "Address concerns",
            },
            engagement_strategy={
                "outreach_timing": "Business hours",
                "content_calendar": "Weekly",
                "event_participation": "Conferences",
                "social_media_strategy": "LinkedIn",
                "referral_sources": "Peers",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "sufficient",
                "assessment_summary": "Good analysis",
                "assumptions_made": ["Standard assumptions"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=structured_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            # Verify top-level fields
            assert hasattr(result, "target_persona_name")
            assert hasattr(result, "persona_description")
            assert hasattr(result, "demographics")
            assert hasattr(result, "psychographics")
            assert hasattr(result, "day_in_life")
            assert hasattr(result, "pain_points")
            assert hasattr(result, "buying_behavior")
            assert hasattr(result, "messaging_preferences")
            assert hasattr(result, "engagement_strategy")
            assert hasattr(result, "metadata")

            # Verify nested structure - demographics
            assert "title" in result.demographics
            assert "department" in result.demographics
            assert "seniority_level" in result.demographics
            assert "years_experience" in result.demographics
            assert "education" in result.demographics
            assert "typical_background" in result.demographics

            # Verify nested structure - psychographics
            assert "motivations" in result.psychographics
            assert "goals" in result.psychographics
            assert "challenges" in result.psychographics
            assert "values" in result.psychographics
            assert "preferred_communication" in result.psychographics

            # Verify nested structure - day_in_life
            assert "primary_responsibilities" in result.day_in_life
            assert "tools_used" in result.day_in_life
            assert "meeting_schedule" in result.day_in_life
            assert "decision_making_process" in result.day_in_life
            assert "information_sources" in result.day_in_life

            # Verify nested structure - buying_behavior
            assert "decision_making_role" in result.buying_behavior
            assert "evaluation_criteria" in result.buying_behavior
            assert "decision_timeline" in result.buying_behavior
            assert "budget_influence" in result.buying_behavior
            assert "preferred_vendor_interaction" in result.buying_behavior

            # Verify nested structure - messaging_preferences
            assert "communication_channels" in result.messaging_preferences
            assert "content_types" in result.messaging_preferences
            assert "messaging_tone" in result.messaging_preferences
            assert "key_value_propositions" in result.messaging_preferences
            assert "objection_handling" in result.messaging_preferences

            # Verify nested structure - engagement_strategy
            assert "outreach_timing" in result.engagement_strategy
            assert "content_calendar" in result.engagement_strategy
            assert "event_participation" in result.engagement_strategy
            assert "social_media_strategy" in result.engagement_strategy
            assert "referral_sources" in result.engagement_strategy

            # Verify metadata structure
            assert "sources_used" in result.metadata
            assert "context_quality" in result.metadata
            assert "assessment_summary" in result.metadata
            assert "assumptions_made" in result.metadata
            assert "primary_context_source" in result.metadata

            # Verify list types
            assert isinstance(result.pain_points, list)

            # Verify list fields in nested objects
            assert isinstance(result.psychographics["motivations"], list)
            assert isinstance(result.psychographics["goals"], list)
            assert isinstance(result.psychographics["challenges"], list)
            assert isinstance(result.psychographics["values"], list)

    @pytest.mark.asyncio
    async def test_generate_target_persona_profile_no_preprocessing(self):
        """Test that preprocessing is disabled for target persona analysis."""
        request_data = TargetPersonaRequest(company_context="Test context")

        mock_response = TargetPersonaResponse(
            target_persona_name="Test Persona",
            persona_description="Test description",
            demographics={
                "title": "Test Title",
                "department": "Test Department",
                "seniority_level": "Senior",
                "years_experience": "5+ years",
                "education": "Degree",
                "typical_background": "Background",
            },
            psychographics={
                "motivations": ["Motivation 1"],
                "goals": ["Goal 1"],
                "challenges": ["Challenge 1"],
                "values": ["Value 1"],
                "preferred_communication": "Direct",
            },
            day_in_life={
                "primary_responsibilities": ["Responsibility 1"],
                "tools_used": ["Tool 1"],
                "meeting_schedule": "50% meetings",
                "decision_making_process": "Analytical",
                "information_sources": ["Source 1"],
            },
            pain_points=["Pain point 1"],
            buying_behavior={
                "decision_making_role": "Decision maker",
                "evaluation_criteria": ["Criteria 1"],
                "decision_timeline": "1-3 months",
                "budget_influence": "High",
                "preferred_vendor_interaction": "Demos",
            },
            messaging_preferences={
                "communication_channels": ["Email"],
                "content_types": ["Content 1"],
                "messaging_tone": "Professional",
                "key_value_propositions": ["Value prop 1"],
                "objection_handling": "Address concerns",
            },
            engagement_strategy={
                "outreach_timing": "Business hours",
                "content_calendar": "Weekly",
                "event_participation": "Conferences",
                "social_media_strategy": "LinkedIn",
                "referral_sources": "Peers",
            },
            metadata={
                "sources_used": ["company_context"],
                "context_quality": "sufficient",
                "assessment_summary": "Good analysis",
                "assumptions_made": ["Standard assumptions"],
                "primary_context_source": "company_context",
            },
        )

        with patch(
            "backend.app.services.target_persona_service.ContextOrchestratorService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.analyze = AsyncMock(return_value=mock_response)
            mock_service_class.return_value = mock_service

            result = await generate_target_persona_profile(request_data)

            # Verify preprocessing is disabled
            mock_service.analyze.assert_called_once()
            call_args = mock_service.analyze.call_args
            assert call_args[1]["use_preprocessing"] is False

            assert result == mock_response
