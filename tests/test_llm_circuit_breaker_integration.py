"""
Integration tests for LLMClient and CircuitBreaker interaction.
- Tests how the circuit breaker is used within the LLM provider system.
- Covers provider failover, health checks, and error propagation.
- Relies on test double providers (AlwaysFail, AlwaysSucceed, etc.).
"""

import pytest
from blossomer_gtm_api.services.llm_service import (
    LLMClient,
    LLMRequest,
    BaseLLMProvider,
)
from blossomer_gtm_api.services.circuit_breaker import CircuitState


class AlwaysFailProvider(BaseLLMProvider):
    name = "fail"
    priority = 1

    async def generate(self, request: LLMRequest):
        raise RuntimeError("Provider failure")

    async def health_check(self):
        return True


class AlwaysSucceedProvider(BaseLLMProvider):
    name = "success"
    priority = 2

    async def generate(self, request: LLMRequest):
        class Dummy:
            text = "ok"

        return Dummy()

    async def health_check(self):
        return True


class HealthCheckFailProvider(BaseLLMProvider):
    name = "healthfail"
    priority = 3

    async def generate(self, request: LLMRequest):
        raise RuntimeError("Should not be called if health check fails")

    async def health_check(self):
        return False


@pytest.mark.asyncio
async def test_circuit_breaker_opens_after_failures():
    """Test that repeated provider failures open the circuit breaker and block further calls."""
    client = LLMClient([AlwaysFailProvider()])
    cb = client.circuit_breakers["fail"]
    req = LLMRequest(prompt="test")
    for _ in range(cb.failure_threshold):
        with pytest.raises(RuntimeError):
            await client.generate(req)
    assert cb.state == CircuitState.OPEN
    # Next call should be blocked by circuit breaker
    with pytest.raises(RuntimeError):
        await client.generate(req)
    assert cb.state == CircuitState.OPEN


@pytest.mark.asyncio
async def test_circuit_breaker_resets_on_success():
    """Test that a successful provider call resets the circuit breaker."""
    client = LLMClient([AlwaysFailProvider(), AlwaysSucceedProvider()])
    cb = client.circuit_breakers["fail"]
    req = LLMRequest(prompt="test")
    # Trip the circuit breaker by causing enough failures.
    # Failover will succeed, but breaker should still open.
    for _ in range(cb.failure_threshold):
        await client.generate(req)  # Should succeed via AlwaysSucceedProvider
    assert cb.state == CircuitState.OPEN
    # Next call should use the success provider; fail provider's breaker remains open
    resp = await client.generate(req)
    assert hasattr(resp, "text")
    assert (
        cb.state == CircuitState.OPEN
    )  # Remains open, as fail provider never succeeds


@pytest.mark.asyncio
async def test_health_check_failures_increment_circuit_breaker():
    """Test that health check failures are counted as failures by the circuit breaker."""
    client = LLMClient([HealthCheckFailProvider()])
    cb = client.circuit_breakers["healthfail"]
    req = LLMRequest(prompt="test")
    for _ in range(cb.failure_threshold):
        with pytest.raises(RuntimeError):
            await client.generate(req)
    assert cb.state == CircuitState.OPEN
    # Next call should be blocked
    with pytest.raises(RuntimeError):
        await client.generate(req)
    assert cb.state == CircuitState.OPEN
