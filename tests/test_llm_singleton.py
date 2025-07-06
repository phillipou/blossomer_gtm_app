"""
Tests for the LLM singleton module.
"""

import pytest
from unittest.mock import AsyncMock, patch
from backend.app.core.llm_singleton import get_llm_client
from backend.app.services.llm_service import (
    LLMClient,
    LLMRequest,
    LLMResponse,
    OpenAIProvider,
    GeminiProvider,
    AnthropicProvider,
)


@pytest.mark.unit
def test_get_llm_client_singleton():
    """Test that get_llm_client returns the same instance each time."""
    client1 = get_llm_client()
    client2 = get_llm_client()
    assert client1 is client2
    assert isinstance(client1, LLMClient)


@pytest.mark.unit
def test_get_llm_client_force_new():
    """Test that get_llm_client(force_new=True) returns a new instance."""
    client1 = get_llm_client()
    client2 = get_llm_client(force_new=True)
    assert client1 is not client2
    assert isinstance(client1, LLMClient)
    assert isinstance(client2, LLMClient)


@pytest.mark.unit
def test_get_llm_client_providers():
    """Test that get_llm_client initializes with the correct providers."""
    client = get_llm_client(force_new=True)
    providers = client.providers
    assert len(providers) == 3
    assert any(isinstance(p, OpenAIProvider) for p in providers)
    assert any(isinstance(p, GeminiProvider) for p in providers)
    assert any(isinstance(p, AnthropicProvider) for p in providers)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_llm_client_generate():
    """Test that get_llm_client().generate works correctly."""
    client = get_llm_client(force_new=True)
    # Mock the first provider to succeed
    first_provider = client.providers[0]
    fake_response = LLMResponse(
        text="Test response",
        model="test-model",
        provider="test-provider",
        usage=None,
    )
    with patch.object(
        first_provider, "generate", AsyncMock(return_value=fake_response)
    ), patch.object(first_provider, "health_check", AsyncMock(return_value=True)):
        response = await client.generate(LLMRequest(prompt="Test prompt"))
        assert response.text == "Test response"
        assert response.model == "test-model"
        assert response.provider == "test-provider"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_llm_client_failover():
    """Test that get_llm_client() handles provider failover correctly."""
    client = get_llm_client(force_new=True)
    # Mock first provider to fail, second to succeed
    first_provider = client.providers[0]
    second_provider = client.providers[1]
    fake_response = LLMResponse(
        text="Failover response",
        model="failover-model",
        provider="failover-provider",
        usage=None,
    )
    with (
        patch.object(first_provider, "health_check", AsyncMock(return_value=False)),
        patch.object(second_provider, "health_check", AsyncMock(return_value=True)),
        patch.object(
            second_provider, "generate", AsyncMock(return_value=fake_response)
        ),
    ):
        response = await client.generate(LLMRequest(prompt="Test prompt"))
        assert response.text == "Failover response"
        assert response.model == "failover-model"
        assert response.provider == "failover-provider"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_llm_client_all_providers_fail():
    """Test that get_llm_client() raises RuntimeError when all providers fail."""
    client = get_llm_client(force_new=True)
    # Mock all providers to fail
    for provider in client.providers:
        # Create a new mock for each provider
        mock_health_check = AsyncMock(return_value=False)
        with patch.object(provider, "health_check", mock_health_check):
            with pytest.raises(RuntimeError):
                await client.generate(LLMRequest(prompt="Test prompt"))


@pytest.mark.unit
def test_get_llm_client_env_config():
    """Test that get_llm_client respects environment configuration."""
    with patch.dict("os.environ", {"LLM_PROVIDERS": "openai,gemini"}):
        client = get_llm_client(force_new=True)
        providers = client.providers
        assert len(providers) == 2
        assert any(isinstance(p, OpenAIProvider) for p in providers)
        assert any(isinstance(p, GeminiProvider) for p in providers)
        assert not any(isinstance(p, AnthropicProvider) for p in providers)


@pytest.mark.unit
def test_get_llm_client_no_providers():
    """Test that get_llm_client raises RuntimeError when no providers are enabled."""
    with patch.dict("os.environ", {"LLM_PROVIDERS": ""}):
        with pytest.raises(RuntimeError):
            get_llm_client(force_new=True)
