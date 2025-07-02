"""
Unit tests for the CircuitBreaker class.
- Tests state transitions, thresholds, timeouts, and async locking.
- Does not test integration with LLM providers or other services.
"""

import asyncio
import time
import pytest
from backend.app.services.circuit_breaker import CircuitBreaker, CircuitState


@pytest.mark.asyncio
async def test_circuit_breaker_opens_after_threshold():
    """Test that the circuit breaker opens after the failure threshold is reached."""
    cb = CircuitBreaker("test", failure_threshold=3, recovery_timeout=1)
    for _ in range(3):
        await cb.record_failure()
    assert cb.state == CircuitState.OPEN
    assert cb.failure_count == 3


@pytest.mark.asyncio
async def test_circuit_breaker_half_open_after_timeout():
    """Test that the circuit breaker transitions to HALF_OPEN after recovery timeout."""
    cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=1)
    await cb.record_failure()
    assert cb.state == CircuitState.OPEN
    time.sleep(1)
    can_exec = await cb.can_execute()
    assert can_exec is True
    assert cb.state == CircuitState.HALF_OPEN


@pytest.mark.asyncio
async def test_circuit_breaker_closes_on_success():
    """Test that the circuit breaker closes and resets failure count on success."""
    cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=1)
    await cb.record_failure()
    time.sleep(1)
    await cb.can_execute()  # Should go HALF_OPEN
    await cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


@pytest.mark.asyncio
async def test_circuit_breaker_disable_flag():
    """Test that the circuit breaker does not open or block when disabled."""
    cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=1, disable=True)
    await cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    assert await cb.can_execute() is True
    await cb.record_success()
    assert cb.state == CircuitState.CLOSED


@pytest.mark.asyncio
async def test_circuit_breaker_lock_is_async():
    """Test that the async lock prevents race conditions (basic concurrency check)."""
    cb = CircuitBreaker("test", failure_threshold=2, recovery_timeout=1)

    async def fail():
        await cb.record_failure()

    await asyncio.gather(fail(), fail())
    assert cb.failure_count == 2
    assert cb.state == CircuitState.OPEN
