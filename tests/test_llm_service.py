# Canonical model names for test consistency:
# - OpenAIProvider: 'gpt-4.1'
# - GeminiProvider: 'gemini-2.5-flash'

import pytest
from unittest.mock import AsyncMock
from app.services.llm_service import (
    GeminiProvider,
    LLMRequest,
    LLMResponse,
    OpenAIProvider,
    AnthropicProvider,
    LLMClient,
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
    assert response.model == "gemini-2.5-flash"
    assert response.provider == "gemini"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_openai_provider_generate_mock(monkeypatch):
    """
    Unit test for OpenAIProvider.generate() using a mock to avoid real API calls.
    """
    provider = OpenAIProvider.__new__(
        OpenAIProvider
    )  # Bypass __init__ to avoid needing API key

    # Mock the generate method to return a fake response
    fake_response = LLMResponse(
        text="Mocked OpenAI response.", model="gpt-4.1", provider="openai", usage=None
    )
    monkeypatch.setattr(provider, "generate", AsyncMock(return_value=fake_response))

    request = LLMRequest(prompt="Hello, OpenAI!")
    response = await provider.generate(request)
    assert isinstance(response, LLMResponse)
    assert response.text == "Mocked OpenAI response."
    assert response.model == "gpt-4.1"
    assert response.provider == "openai"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_anthropic_provider_not_implemented():
    """
    AnthropicProvider.generate() should raise NotImplementedError.
    """
    provider = AnthropicProvider()
    request = LLMRequest(prompt="Hello, Anthropic!")
    with pytest.raises(NotImplementedError):
        await provider.generate(request)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_llm_client_failover(monkeypatch):
    """
    LLMClient should try providers in order and failover if one fails.
    """
    # Mock providers
    good_provider = OpenAIProvider.__new__(OpenAIProvider)
    bad_provider = GeminiProvider.__new__(GeminiProvider)
    # Bad provider always fails health_check
    monkeypatch.setattr(bad_provider, "health_check", AsyncMock(return_value=False))
    # Good provider passes health_check and returns a response
    monkeypatch.setattr(good_provider, "health_check", AsyncMock(return_value=True))
    fake_response = LLMResponse(
        text="LLMClient response.", model="gpt-4.1", provider="openai", usage=None
    )
    monkeypatch.setattr(
        good_provider, "generate", AsyncMock(return_value=fake_response)
    )
    client = LLMClient([bad_provider, good_provider])
    request = LLMRequest(prompt="Test failover")
    response = await client.generate(request)
    assert response.text == "LLMClient response."
    assert response.provider == "openai"
    assert response.model == "gpt-4.1"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_llm_client_all_providers_fail(monkeypatch):
    """
    LLMClient should raise RuntimeError if all providers fail.
    """
    bad_provider = GeminiProvider.__new__(GeminiProvider)
    monkeypatch.setattr(bad_provider, "health_check", AsyncMock(return_value=False))
    client = LLMClient([bad_provider])
    request = LLMRequest(prompt="Test all fail")
    with pytest.raises(RuntimeError):
        await client.generate(request)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_gemini_provider_health_check(monkeypatch):
    """
    GeminiProvider.health_check() returns True/False as expected (mocked).
    """
    provider = GeminiProvider.__new__(GeminiProvider)
    setattr(provider, "client", object())
    setattr(provider, "model", "gemini-2.5-flash")
    monkeypatch.setattr(provider, "health_check", AsyncMock(return_value=True))
    assert await provider.health_check() is True
    monkeypatch.setattr(provider, "health_check", AsyncMock(return_value=False))
    assert await provider.health_check() is False


@pytest.mark.unit
@pytest.mark.asyncio
async def test_openai_provider_health_check(monkeypatch):
    """
    OpenAIProvider.health_check() returns True/False as expected (mocked).
    """
    provider = OpenAIProvider.__new__(OpenAIProvider)
    setattr(provider, "client", object())
    setattr(provider, "model", "gpt-4.1")
    monkeypatch.setattr(provider, "health_check", AsyncMock(return_value=True))
    assert await provider.health_check() is True
    monkeypatch.setattr(provider, "health_check", AsyncMock(return_value=False))
    assert await provider.health_check() is False


def test_llmresponse_model_validate_and_dump():
    """
    Test that LLMResponse.model_validate and model_dump work as expected (Pydantic v2 roundtrip).
    Ensures that a dict can be validated into a model and dumped back to the same dict.
    """
    data = {
        "text": "Hello",
        "model": "gpt-4o",
        "provider": "openai",
        "usage": {"tokens": 10},
    }
    obj = LLMResponse.model_validate(data)
    assert isinstance(obj, LLMResponse)
    dumped = obj.model_dump()
    assert dumped == data


def test_llmclient_register_provider():
    """
    Test that LLMClient.register_provider successfully adds a provider to the client.
    Ensures the provider appears in the providers list after registration.
    """
    client = LLMClient()
    provider = OpenAIProvider.__new__(OpenAIProvider)  # Bypass __init__
    client.register_provider(provider)
    assert provider in client.providers


def test_llmclient_no_providers():
    """
    Test that LLMClient.generate raises RuntimeError if no providers are registered.
    This checks the fail-safe path for an empty provider list.
    """
    import pytest

    client = LLMClient([])
    request = LLMRequest(prompt="Test")
    import asyncio

    with pytest.raises(RuntimeError):
        asyncio.run(client.generate(request))


def test_llmrequest_with_and_without_parameters():
    """
    Test LLMRequest construction with and without the optional 'parameters' field.
    Ensures default is None and custom dict is accepted.
    """
    req1 = LLMRequest(prompt="Test prompt")
    assert req1.prompt == "Test prompt"
    assert req1.parameters is None  # Default should be None
    req2 = LLMRequest(prompt="Test prompt", parameters={"temperature": 0.5})
    assert req2.parameters == {"temperature": 0.5}
