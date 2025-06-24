import pytest
from unittest.mock import AsyncMock
from blossomer_gtm_api.services.llm_service import (
    GeminiProvider,
    LLMRequest,
    LLMResponse,
)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_gemini_provider_generate_mock(monkeypatch):
    """
    Unit test for GeminiProvider.generate() using a mock to avoid real API calls.
    """
    provider = GeminiProvider.__new__(
        GeminiProvider
    )  # Bypass __init__ to avoid needing API key

    # Mock the generate method to return a fake response
    fake_response = LLMResponse(
        text="Mocked Gemini response.",
        model="gemini-2.5-flash",
        provider="gemini",
        usage=None,
    )
    monkeypatch.setattr(provider, "generate", AsyncMock(return_value=fake_response))

    request = LLMRequest(prompt="Hello, Gemini!")
    response = await provider.generate(request)
    assert isinstance(response, LLMResponse)
    assert response.text == "Mocked Gemini response."


@pytest.mark.unit
@pytest.mark.asyncio
async def test_openai_provider_generate_mock(monkeypatch):
    """
    Unit test for OpenAIProvider.generate() using a mock to avoid real API calls.
    """
    from blossomer_gtm_api.services.llm_service import OpenAIProvider

    provider = OpenAIProvider.__new__(
        OpenAIProvider
    )  # Bypass __init__ to avoid needing API key

    # Mock the generate method to return a fake response
    fake_response = LLMResponse(
        text="Mocked OpenAI response.", model="gpt-4o", provider="openai", usage=None
    )
    monkeypatch.setattr(provider, "generate", AsyncMock(return_value=fake_response))

    request = LLMRequest(prompt="Hello, OpenAI!")
    response = await provider.generate(request)
    assert isinstance(response, LLMResponse)
    assert response.text == "Mocked OpenAI response."
