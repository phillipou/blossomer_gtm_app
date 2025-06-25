import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from blossomer_gtm_api.services.context_orchestrator import ContextOrchestrator
from blossomer_gtm_api.prompts.models import ContextAssessmentResult, ContextQuality


@pytest.mark.asyncio
async def test_assess_context_empty_content():
    """Test that empty website content returns 'insufficient' result without LLM call."""
    mock_llm = MagicMock()
    orchestrator = ContextOrchestrator(mock_llm)
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.render_prompt",
        return_value="dummy prompt",
    ):
        result = await orchestrator.assess_context(website_content="   ")
    assert result.overall_quality == ContextQuality.INSUFFICIENT
    assert result.overall_confidence == 0.0
    assert result.summary.startswith("No website content")


@pytest.mark.asyncio
async def test_assess_website_context_scrape_failure():
    """Test that a website scrape failure returns 'insufficient' result."""
    orchestrator = ContextOrchestrator(MagicMock())
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content",
        side_effect=Exception("scrape failed"),
    ):
        result = await ContextOrchestrator.assess_website_context(
            url="https://fail.com",
            orchestrator=orchestrator,
        )
    assert result.overall_quality == ContextQuality.INSUFFICIENT
    assert result.summary.startswith("Website scrape failed")


@pytest.mark.asyncio
async def test_assess_context_happy_path():
    """Test that valid content and LLM response returns a valid ContextAssessmentResult."""
    mock_llm = MagicMock()
    mock_llm.generate_structured_output = AsyncMock(
        return_value={
            "overall_quality": "high",
            "overall_confidence": 0.95,
            "content_sections": [],
            "company_clarity": {},
            "endpoint_readiness": [],
            "data_quality_metrics": {},
            "recommendations": {},
            "summary": "All good.",
        }
    )
    orchestrator = ContextOrchestrator(mock_llm)
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.render_prompt",
        return_value="dummy prompt",
    ):
        result = await orchestrator.assess_context(website_content="Some real content.")
    assert result.overall_quality == ContextQuality.HIGH
    assert result.overall_confidence == 0.95
    assert result.summary == "All good."


@pytest.mark.asyncio
async def test_assess_website_context_happy_path():
    """Test the full orchestration: scrape returns content, LLM returns valid assessment."""
    orchestrator = ContextOrchestrator(MagicMock())
    orchestrator.assess_context = AsyncMock(
        return_value=ContextAssessmentResult(
            overall_quality=ContextQuality.HIGH,
            overall_confidence=0.9,
            content_sections=[],
            company_clarity={},
            endpoint_readiness=[],
            data_quality_metrics={},
            recommendations={},
            summary="Looks great.",
        )
    )
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content",
        return_value={"content": "Some content"},
    ):
        result = await ContextOrchestrator.assess_website_context(
            url="https://good.com",
            orchestrator=orchestrator,
        )
    assert result.overall_quality == ContextQuality.HIGH
    assert result.summary == "Looks great."
