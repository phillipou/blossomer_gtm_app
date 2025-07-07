"""
Test cases for ContextOrchestratorService.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.app.services.context_orchestrator_service import (
    ContextOrchestratorService,
    flatten_dict,
    is_target_account_context_sufficient,
)
from backend.app.services.content_preprocessing import ContentPreprocessingPipeline
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException


class MockPromptVars(BaseModel):
    """Mock prompt variables class for testing."""

    website_content: str = ""
    input_website_url: str = ""
    user_inputted_context: str = ""
    persona_profile_name: str = ""
    hypothesis: str = ""
    additional_context: str = ""
    company_context: str = ""
    target_account_context: str = ""
    account_profile_name: str = ""


class MockResponseModel(BaseModel):
    """Mock response model for testing."""

    result: str
    confidence: float = 0.0


class MockRequest:
    """Mock request object for testing."""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestFlattenDict:
    """Test cases for flatten_dict utility function."""

    def test_flatten_dict_empty_dict(self):
        """Test flatten_dict with empty dict."""
        result = flatten_dict({})
        assert result == {}

    def test_flatten_dict_flat_dict(self):
        """Test flatten_dict with already flat dict."""
        input_dict = {"a": 1, "b": 2}
        result = flatten_dict(input_dict)
        assert result == {"a": 1, "b": 2}

    def test_flatten_dict_nested_dict(self):
        """Test flatten_dict with nested dict."""
        input_dict = {"a": 1, "b": {"c": 2, "d": 3}, "e": 4}
        result = flatten_dict(input_dict)
        assert result == {"a": 1, "b": {"c": 2, "d": 3}, "c": 2, "d": 3, "e": 4}

    def test_flatten_dict_no_overwrite(self):
        """Test flatten_dict doesn't overwrite existing keys."""
        input_dict = {"a": 1, "b": {"a": 2, "c": 3}}
        result = flatten_dict(input_dict)
        assert result["a"] == 1  # Original value preserved
        assert result["c"] == 3  # New value added
        assert result["b"] == {"a": 2, "c": 3}  # Nested dict preserved


class TestIsTargetAccountContextSufficient:
    """Test cases for is_target_account_context_sufficient function."""

    def test_sufficient_context_dict(self):
        """Test context with all required fields."""
        context = {
            "company_size": "50-100",
            "target_account_name": "Test Company",
            "target_account_description": "A test company",
        }
        result = is_target_account_context_sufficient(context)
        assert result is True

    def test_insufficient_context_missing_fields(self):
        """Test context missing required fields."""
        context = {"company_size": "50-100"}
        result = is_target_account_context_sufficient(context)
        assert result is False

    def test_insufficient_context_empty_fields(self):
        """Test context with empty field values."""
        context = {
            "company_size": "",
            "target_account_name": "Test Company",
            "target_account_description": "A test company",
        }
        result = is_target_account_context_sufficient(context)
        assert result is False

    def test_context_as_list(self):
        """Test context as list of dicts."""
        context = [
            {"company_size": "50-100"},
            {"target_account_name": "Test Company"},
            {"target_account_description": "A test company"},
        ]
        result = is_target_account_context_sufficient(context)
        assert result is True

    def test_context_as_json_string(self):
        """Test context as JSON string."""
        context = '{"company_size": "50-100", "target_account_name": "Test Company", "target_account_description": "A test company"}'
        result = is_target_account_context_sufficient(context)
        assert result is True

    def test_context_invalid_json(self):
        """Test context as invalid JSON string."""
        context = "invalid json"
        result = is_target_account_context_sufficient(context)
        assert result is False

    def test_context_none_values(self):
        """Test context with None values."""
        context = {
            "company_size": None,
            "target_account_name": "Test Company",
            "target_account_description": "A test company",
        }
        result = is_target_account_context_sufficient(context)
        assert result is False


class TestContextOrchestratorService:
    """Test cases for ContextOrchestratorService."""

    def test_init_default(self):
        """Test service initialization with defaults."""
        service = ContextOrchestratorService()
        assert service.orchestrator is None
        assert service.preprocessing_pipeline is None

    def test_init_with_params(self):
        """Test service initialization with parameters."""
        orchestrator = MagicMock()
        pipeline = MagicMock()
        service = ContextOrchestratorService(
            orchestrator=orchestrator, preprocessing_pipeline=pipeline
        )
        assert service.orchestrator == orchestrator
        assert service.preprocessing_pipeline == pipeline

    @pytest.mark.asyncio
    async def test_analyze_product_overview_success(self):
        """Test successful product_overview analysis."""
        service = ContextOrchestratorService()
        request_data = MockRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_response = MockResponseModel(result="success", confidence=0.95)

        with patch(
            "backend.app.services.website_scraper.extract_website_content"
        ) as mock_extract:
            mock_extract.return_value = {
                "content": "Test website content",
                "html": "<html>Test</html>",
            }

            with patch(
                "backend.app.services.context_orchestrator_service.render_prompt"
            ) as mock_render:
                mock_render.return_value = ("System prompt", "User prompt")

                with patch(
                    "backend.app.services.context_orchestrator_service.get_llm_client"
                ) as mock_client:
                    mock_client.return_value.generate_structured_output = AsyncMock(
                        return_value=mock_response
                    )

                    result = await service.analyze(
                        request_data=request_data,
                        analysis_type="product_overview",
                        prompt_template="test_template",
                        prompt_vars_class=MockPromptVars,
                        response_model=MockResponseModel,
                        use_preprocessing=False,
                    )

                    assert result == mock_response
                    mock_extract.assert_called_once_with("https://example.com")
                    mock_render.assert_called_once()
                    mock_client.return_value.generate_structured_output.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_product_overview_missing_website_url(self):
        """Test product_overview analysis with missing website_url."""
        service = ContextOrchestratorService()
        request_data = MockRequest()

        with pytest.raises(HTTPException) as exc_info:
            await service.analyze(
                request_data=request_data,
                analysis_type="product_overview",
                prompt_template="test_template",
                prompt_vars_class=MockPromptVars,
                response_model=MockResponseModel,
            )

        assert exc_info.value.status_code == 422
        assert "website_url is required" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_analyze_with_preprocessing(self):
        """Test analysis with preprocessing enabled."""
        mock_pipeline = MagicMock()
        mock_pipeline.process.return_value = ["Processed chunk 1", "Processed chunk 2"]

        service = ContextOrchestratorService(preprocessing_pipeline=mock_pipeline)
        request_data = MockRequest(
            website_url="https://example.com", user_inputted_context="Test context"
        )

        mock_response = MockResponseModel(result="success", confidence=0.95)

        with patch(
            "backend.app.services.website_scraper.extract_website_content"
        ) as mock_extract:
            mock_extract.return_value = {
                "content": "Test website content",
                "html": "<html>Test</html>",
            }

            with patch(
                "backend.app.services.context_orchestrator_service.render_prompt"
            ) as mock_render:
                mock_render.return_value = ("System prompt", "User prompt")

                with patch(
                    "backend.app.services.context_orchestrator_service.get_llm_client"
                ) as mock_client:
                    mock_client.return_value.generate_structured_output = AsyncMock(
                        return_value=mock_response
                    )

                    result = await service.analyze(
                        request_data=request_data,
                        analysis_type="product_overview",
                        prompt_template="test_template",
                        prompt_vars_class=MockPromptVars,
                        response_model=MockResponseModel,
                        use_preprocessing=True,
                    )

                    assert result == mock_response
                    mock_pipeline.process.assert_called_once_with(
                        text="Test website content", html="<html>Test</html>"
                    )

                    # Verify the prompt was called with preprocessed content
                    mock_render.assert_called_once()
                    call_args = mock_render.call_args[0]
                    prompt_vars = call_args[1]
                    assert (
                        prompt_vars.website_content
                        == "Processed chunk 1\n\nProcessed chunk 2"
                    )

    @pytest.mark.asyncio
    async def test_analyze_target_account_success(self):
        """Test successful target_account analysis."""
        service = ContextOrchestratorService()
        request_data = MockRequest(
            website_content="Test content",
            company_context="Company context",
            account_profile_name="Test Account",
            hypothesis="Test hypothesis",
            additional_context="Additional context",
        )

        mock_response = MockResponseModel(result="success", confidence=0.95)

        with patch(
            "backend.app.services.context_orchestrator_service.render_prompt"
        ) as mock_render:
            mock_render.return_value = ("System prompt", "User prompt")

            with patch(
                "backend.app.services.context_orchestrator_service.get_llm_client"
            ) as mock_client:
                mock_client.return_value.generate_structured_output = AsyncMock(
                    return_value=mock_response
                )

                result = await service.analyze(
                    request_data=request_data,
                    analysis_type="target_account",
                    prompt_template="test_template",
                    prompt_vars_class=MockPromptVars,
                    response_model=MockResponseModel,
                )

                assert result == mock_response
                mock_render.assert_called_once()

                # Verify prompt vars contain target account specific fields
                call_args = mock_render.call_args[0]
                prompt_vars = call_args[1]
                assert prompt_vars.company_context == "Company context"
                assert prompt_vars.account_profile_name == "Test Account"
                assert prompt_vars.hypothesis == "Test hypothesis"
                assert prompt_vars.additional_context == "Additional context"

    @pytest.mark.asyncio
    async def test_analyze_target_persona_success(self):
        """Test successful target_persona analysis."""
        service = ContextOrchestratorService()
        request_data = MockRequest(
            website_content="Test content",
            persona_profile_name="Test Persona",
            hypothesis="Test hypothesis",
            additional_context="Additional context",
            company_context="Company context",
            target_account_context="Account context",
        )

        mock_response = MockResponseModel(result="success", confidence=0.95)

        with patch(
            "backend.app.services.context_orchestrator_service.render_prompt"
        ) as mock_render:
            mock_render.return_value = ("System prompt", "User prompt")

            with patch(
                "backend.app.services.context_orchestrator_service.get_llm_client"
            ) as mock_client:
                mock_client.return_value.generate_structured_output = AsyncMock(
                    return_value=mock_response
                )

                result = await service.analyze(
                    request_data=request_data,
                    analysis_type="target_persona",
                    prompt_template="test_template",
                    prompt_vars_class=MockPromptVars,
                    response_model=MockResponseModel,
                )

                assert result == mock_response
                mock_render.assert_called_once()

                # Verify prompt vars contain target persona specific fields
                call_args = mock_render.call_args[0]
                prompt_vars = call_args[1]
                assert prompt_vars.persona_profile_name == "Test Persona"
                assert prompt_vars.hypothesis == "Test hypothesis"
                assert prompt_vars.additional_context == "Additional context"
                assert prompt_vars.company_context == "Company context"
                assert prompt_vars.target_account_context == "Account context"

    @pytest.mark.asyncio
    async def test_analyze_validation_error(self):
        """Test analysis with LLM validation error."""
        service = ContextOrchestratorService()
        request_data = MockRequest(website_url="https://example.com")

        with patch(
            "backend.app.services.website_scraper.extract_website_content"
        ) as mock_extract:
            mock_extract.return_value = {
                "content": "Test website content",
                "html": "<html>Test</html>",
            }

            with patch(
                "backend.app.services.context_orchestrator_service.render_prompt"
            ) as mock_render:
                mock_render.return_value = ("System prompt", "User prompt")

                with patch(
                    "backend.app.services.context_orchestrator_service.get_llm_client"
                ) as mock_client:
                    # Create a proper ValidationError
                    try:
                        MockResponseModel(
                            result="", confidence="invalid"
                        )  # This will raise ValidationError
                    except ValidationError as e:
                        validation_error = e

                    mock_client.return_value.generate_structured_output = AsyncMock(
                        side_effect=validation_error
                    )

                    with pytest.raises(HTTPException) as exc_info:
                        await service.analyze(
                            request_data=request_data,
                            analysis_type="product_overview",
                            prompt_template="test_template",
                            prompt_vars_class=MockPromptVars,
                            response_model=MockResponseModel,
                        )

                    assert exc_info.value.status_code == 422
                    assert "LLM response validation failed" in str(
                        exc_info.value.detail
                    )
                    assert "analysis_type: product_overview" in str(
                        exc_info.value.detail
                    )

    @pytest.mark.asyncio
    async def test_analyze_generic_error(self):
        """Test analysis with generic error."""
        service = ContextOrchestratorService()
        request_data = MockRequest(website_url="https://example.com")

        with patch(
            "backend.app.services.website_scraper.extract_website_content"
        ) as mock_extract:
            mock_extract.side_effect = Exception("Test error")

            with pytest.raises(HTTPException) as exc_info:
                await service.analyze(
                    request_data=request_data,
                    analysis_type="product_overview",
                    prompt_template="test_template",
                    prompt_vars_class=MockPromptVars,
                    response_model=MockResponseModel,
                )

            assert exc_info.value.status_code == 500
            assert "Analysis failed" in str(exc_info.value.detail)
            assert "analysis_type: product_overview" in str(exc_info.value.detail)
            assert "Test error" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_analyze_cache_hit_detection(self):
        """Test cache hit detection based on timing."""
        service = ContextOrchestratorService()
        request_data = MockRequest(website_url="https://example.com")

        mock_response = MockResponseModel(result="success", confidence=0.95)

        with patch(
            "backend.app.services.website_scraper.extract_website_content"
        ) as mock_extract:
            # Mock fast response to simulate cache hit
            mock_extract.return_value = {
                "content": "Test website content",
                "html": "<html>Test</html>",
            }

            with patch(
                "backend.app.services.context_orchestrator_service.render_prompt"
            ) as mock_render:
                mock_render.return_value = ("System prompt", "User prompt")

                with patch(
                    "backend.app.services.context_orchestrator_service.get_llm_client"
                ) as mock_client:
                    mock_client.return_value.generate_structured_output = AsyncMock(
                        return_value=mock_response
                    )

                    # Mock time.monotonic to simulate fast cache response
                    with patch("time.monotonic") as mock_time:
                        mock_time.side_effect = [
                            0.0,
                            0.01,
                            0.02,
                            0.03,
                            0.04,
                            0.05,
                            0.06,
                            0.07,
                            0.08,
                        ]

                        result = await service.analyze(
                            request_data=request_data,
                            analysis_type="product_overview",
                            prompt_template="test_template",
                            prompt_vars_class=MockPromptVars,
                            response_model=MockResponseModel,
                        )

                        assert result == mock_response

    @pytest.mark.asyncio
    async def test_resolve_context_deprecated(self):
        """Test that _resolve_context raises NotImplementedError."""
        service = ContextOrchestratorService()

        with pytest.raises(NotImplementedError) as exc_info:
            await service._resolve_context(None, "test")

        assert "_resolve_context is no longer used" in str(exc_info.value)
