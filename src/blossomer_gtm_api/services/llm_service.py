"""
llm_service.py - LLM Provider Abstraction Layer

This module provides a unified, extensible interface for integrating multiple Large Language Model
(LLM) providers (e.g., OpenAI, Anthropic/Claude) into the Blossomer GTM API.

Purpose:
- Abstracts away provider-specific APIs, request/response formats, and error handling.
- Enables seamless failover and reliability by trying multiple providers in order of priority.
- Supports easy extensibility: add new providers by implementing the BaseLLMProvider interface.
- Keeps LLM logic separate from business logic and API layers for maintainability and testability.

Key Components:
- LLMRequest, LLMResponse: Pydantic models for standardized input/output.
- BaseLLMProvider: Abstract base class for all LLM provider adapters.
- OpenAIProvider, AnthropicProvider: Example provider stubs.
- LLMClient: Orchestrator that manages provider selection, failover, and exposes a unified API.

See PRD.md and ARCHITECTURE.md for requirements and design rationale.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


# -----------------------------
# Pydantic Models
# -----------------------------


class LLMRequest(BaseModel):
    """
    Standardized input model for LLM requests.

    Attributes:
        prompt (str): The prompt to send to the LLM.
        parameters (Optional[Dict[str, Any]]): Optional provider-specific parameters
            (e.g., temperature, max_tokens).
    """

    prompt: str
    parameters: Optional[Dict[str, Any]] = None


class LLMResponse(BaseModel):
    """
    Standardized output model for LLM responses.

    Attributes:
        text (str): The generated text from the LLM.
        model (Optional[str]): The model name used.
        usage (Optional[Dict[str, Any]]): Usage statistics or metadata.
        provider (Optional[str]): The provider that generated the response.
    """

    text: str
    model: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None
    provider: Optional[str] = None
    # Add more fields as needed (e.g., finish_reason, raw_response)


# -----------------------------
# LLM Provider Abstraction
# -----------------------------


class BaseLLMProvider(ABC):
    """
    Abstract base class for all LLM provider adapters.

    All providers must implement this interface to be used with LLMClient.

    Attributes:
        name (str): Provider name identifier.
        priority (int): Priority for failover ordering (lower = higher priority).
    """

    name: str
    priority: int

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Generate a response from the LLM provider.

        Args:
            request (LLMRequest): The standardized request object.

        Returns:
            LLMResponse: The standardized response object.

        Raises:
            NotImplementedError: If not implemented by subclass.
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the provider is healthy/available.

        Returns:
            bool: True if provider is healthy, False otherwise.
        """
        pass


# -----------------------------
# Example Provider Stubs
# -----------------------------


class OpenAIProvider(BaseLLMProvider):
    """
    Adapter for the OpenAI LLM provider.
    Implements the BaseLLMProvider interface.
    """

    name = "openai"
    priority = 1

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Stub for OpenAI LLM generation.
        Replace with actual OpenAI API integration.
        """
        raise NotImplementedError

    async def health_check(self) -> bool:
        """
        Stub for OpenAI health check.
        Replace with actual health check logic.
        """
        return True


class AnthropicProvider(BaseLLMProvider):
    """
    Adapter for the Anthropic (Claude) LLM provider.
    Implements the BaseLLMProvider interface.
    """

    name = "anthropic"
    priority = 2

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Stub for Anthropic LLM generation.
        Replace with actual Anthropic API integration.
        """
        raise NotImplementedError

    async def health_check(self) -> bool:
        """
        Stub for Anthropic health check.
        Replace with actual health check logic.
        """
        return True


class GeminiProvider(BaseLLMProvider):
    """
    Adapter for the Gemini (Google) LLM provider.
    Implements the BaseLLMProvider interface.
    """

    name = "gemini"
    priority = 3

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Stub for Gemini LLM generation.
        Replace with actual Gemini API integration.
        """
        raise NotImplementedError

    async def health_check(self) -> bool:
        """
        Stub for Gemini health check.
        Replace with actual health check logic.
        """
        return True


# -----------------------------
# LLM Client Orchestrator
# -----------------------------


class LLMClient:
    """
    Orchestrates LLM provider selection, failover, and exposes a unified API.

    Usage:
        llm_client = LLMClient([OpenAIProvider(), AnthropicProvider()])
        response = await llm_client.generate(request)

    Attributes:
        providers (List[BaseLLMProvider]): List of registered providers, sorted by priority.
    """

    def __init__(self, providers: Optional[List[BaseLLMProvider]] = None):
        """
        Initialize the LLMClient with a list of providers.

        Args:
            providers (Optional[List[BaseLLMProvider]]): Providers to register (default: empty list)
        """
        self.providers = providers or []

    def register_provider(self, provider: BaseLLMProvider):
        """
        Register a new LLM provider and sort by priority.

        Args:
            provider (BaseLLMProvider): The provider to register.
        """
        self.providers.append(provider)
        self.providers.sort(key=lambda p: p.priority)

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Try providers in order of priority, with failover on error.

        Args:
            request (LLMRequest): The standardized request object.

        Returns:
            LLMResponse: The standardized response object from the first available provider.

        Raises:
            RuntimeError: If all providers fail or are unavailable.
        """
        for provider in self.providers:
            try:
                if await provider.health_check():
                    return await provider.generate(request)
            except Exception:
                # Log the error and try the next provider
                continue
        raise RuntimeError("All LLM providers failed or are unavailable.")
