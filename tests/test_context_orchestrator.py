import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from blossomer_gtm_api.services.context_orchestrator import (
    ContextOrchestrator,
    resolve_context_for_endpoint,
)
from blossomer_gtm_api.prompts.models import (
    ContextAssessmentResult,
    ContextQuality,
    EndpointReadiness,
)


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
async def test_assess_url_context_scrape_failure():
    """Test that a website scrape failure returns 'insufficient' result."""
    orchestrator = ContextOrchestrator(MagicMock())
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content",
        side_effect=Exception("scrape failed"),
    ):
        result = await orchestrator.assess_url_context(
            url="https://fail.com",
        )
    assert result.overall_quality == ContextQuality.INSUFFICIENT
    assert result.summary.startswith(
        "No website content could be extracted after scraping and crawling."
    )


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
async def test_assess_url_context_happy_path():
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
        result = await orchestrator.assess_url_context(
            url="https://good.com",
        )
    assert result.overall_quality == ContextQuality.HIGH
    assert result.summary == "Looks great."


@pytest.mark.asyncio
async def test_orchestrate_context_ready(monkeypatch):
    """Test orchestrate_context returns ready when assessment is ready for the endpoint."""
    # Patch extract_website_content to avoid real scraping
    monkeypatch.setattr(
        "blossomer_gtm_api.services.website_scraper.extract_website_content",
        lambda url, crawl=False: {"content": "dummy content"},
    )
    mock_llm = MagicMock()
    orchestrator = ContextOrchestrator(mock_llm)
    # Patch assess_url_context and assess_context to return a ready assessment
    ready_assessment = ContextAssessmentResult(
        overall_quality=ContextQuality.HIGH,
        overall_confidence=0.95,
        content_sections=[],
        company_clarity={},
        endpoint_readiness=[
            EndpointReadiness(
                endpoint="product_overview",
                is_ready=True,
                confidence=0.95,
                missing_requirements=[],
                recommendations=[],
            )
        ],
        data_quality_metrics={},
        recommendations={},
        summary="Ready for product overview.",
    )
    monkeypatch.setattr(
        orchestrator, "assess_url_context", AsyncMock(return_value=ready_assessment)
    )
    monkeypatch.setattr(
        orchestrator, "assess_context", AsyncMock(return_value=ready_assessment)
    )
    result = await orchestrator.orchestrate_context(
        website_url="https://good.com",
        target_endpoint="product_overview",
        auto_enrich=False,
    )
    assert result["assessment"].overall_quality == ContextQuality.HIGH


@pytest.mark.asyncio
async def test_orchestrate_context_not_ready_enrichment(monkeypatch):
    """Test orchestrate_context returns not ready and includes enrichment steps when not ready."""
    # Patch extract_website_content to avoid real scraping
    monkeypatch.setattr(
        "blossomer_gtm_api.services.website_scraper.extract_website_content",
        lambda url, crawl=False: {"content": "dummy content"},
    )
    mock_llm = MagicMock()
    orchestrator = ContextOrchestrator(mock_llm)
    # Patch assess_url_context and assess_context to return a not ready assessment
    not_ready_assessment = ContextAssessmentResult(
        overall_quality=ContextQuality.LOW,
        overall_confidence=0.3,
        content_sections=[],
        company_clarity={},
        endpoint_readiness=[
            EndpointReadiness(
                endpoint="product_overview",
                is_ready=False,
                confidence=0.3,
                missing_requirements=["Product features"],
                recommendations=["Add product features section"],
            )
        ],
        data_quality_metrics={},
        recommendations={},
        summary="Not ready for product overview.",
    )
    monkeypatch.setattr(
        orchestrator, "assess_url_context", AsyncMock(return_value=not_ready_assessment)
    )
    monkeypatch.setattr(
        orchestrator, "assess_context", AsyncMock(return_value=not_ready_assessment)
    )
    monkeypatch.setattr(
        orchestrator,
        "_create_enrichment_plan",
        MagicMock(return_value={"plan": "fetch /features"}),
    )
    monkeypatch.setattr(
        orchestrator, "_execute_enrichment", MagicMock(return_value={"enriched": True})
    )
    result = await orchestrator.orchestrate_context(
        website_url="https://bad.com",
        target_endpoint="product_overview",
        auto_enrich=True,
        max_steps=1,
    )
    assert result["assessment"].overall_quality == ContextQuality.LOW


@pytest.mark.asyncio
async def test_orchestrate_context_no_content(monkeypatch):
    """Test orchestrate_context returns insufficient if no content is found after scrape and crawl."""
    mock_llm = MagicMock()
    orchestrator = ContextOrchestrator(mock_llm)
    # Patch assess_url_context to simulate no content found
    insufficient_assessment = ContextAssessmentResult(
        overall_quality=ContextQuality.INSUFFICIENT,
        overall_confidence=0.0,
        content_sections=[],
        company_clarity={},
        endpoint_readiness=[],
        data_quality_metrics={},
        recommendations={},
        summary="No website content could be extracted after scraping and crawling.",
    )
    monkeypatch.setattr(
        orchestrator,
        "assess_url_context",
        AsyncMock(return_value=insufficient_assessment),
    )
    result = await orchestrator.orchestrate_context(
        website_url="https://empty.com",
        target_endpoint="product_overview",
        auto_enrich=False,
    )
    assert result["assessment"].overall_quality == ContextQuality.INSUFFICIENT
    assert result["final_quality"] == "insufficient"
    assert not result["enrichment_performed"]


@pytest.mark.asyncio
async def test_resolve_context_prefers_user_context(monkeypatch):
    """User context is preferred if sufficient."""

    class DummyOrchestrator:
        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return MagicMock()

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": True}

    request = MagicMock(
        user_inputted_context="User context",
        llm_inferred_context="LLM context",
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    result = await resolve_context_for_endpoint(request, "target_company", orchestrator)
    assert result["source"] == "user_inputted_context"
    assert result["context"] == "User context"


@pytest.mark.asyncio
async def test_resolve_context_uses_llm_context_if_user_insufficient(monkeypatch):
    """LLM context is used if user context is missing or insufficient."""

    class DummyOrchestrator:
        def __init__(self):
            self.call_count = 0

        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return MagicMock()

        async def assess_url_context(self, url, target_endpoint, user_context=None):
            return MagicMock()

        def check_endpoint_readiness(self, assessment, endpoint):
            # First call (user) returns not ready, second call (llm) returns ready
            self.call_count += 1
            if self.call_count == 1:
                return {"is_ready": False}  # user context
            if self.call_count == 2:
                return {"is_ready": True}  # llm context
            # Should never reach website context in this test
            assert False, "Should not fall through to website context"

    request = MagicMock(
        user_inputted_context="User context",
        llm_inferred_context="LLM context",
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    result = await resolve_context_for_endpoint(request, "target_company", orchestrator)
    assert result["source"] == "llm_inferred_context"
    assert result["context"] == "LLM context"


@pytest.mark.asyncio
async def test_resolve_context_falls_back_to_website(monkeypatch):
    """Website scraping is used if both user and LLM context are insufficient."""

    class DummyOrchestrator:
        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return MagicMock()

        async def assess_url_context(self, url, target_endpoint, user_context=None):
            return MagicMock()

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": False}

    request = MagicMock(
        user_inputted_context=None,
        llm_inferred_context=None,
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    result = await resolve_context_for_endpoint(request, "target_company", orchestrator)
    assert result["source"] == "website"
    assert result["context"] == "https://site.com"


@pytest.mark.asyncio
async def test_resolve_context_endpoint_specific_sufficiency(monkeypatch):
    """Sufficiency is checked per endpoint."""

    class DummyOrchestrator:
        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return MagicMock()

        async def assess_url_context(self, url, target_endpoint, user_context=None):
            return MagicMock()

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": endpoint == "target_company"}

    request = MagicMock(
        user_inputted_context="User context",
        llm_inferred_context="LLM context",
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    # Should be ready for target_company, not for target_persona
    result = await resolve_context_for_endpoint(request, "target_company", orchestrator)
    assert result["source"] == "user_inputted_context"
    result2 = await resolve_context_for_endpoint(
        request, "target_persona", orchestrator
    )
    assert result2["source"] != "user_inputted_context" or not result2["context"]
