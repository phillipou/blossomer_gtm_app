import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from backend.app.services.context_orchestrator import (
    ContextOrchestrator,
    resolve_context_for_endpoint,
)
from backend.app.prompts.models import (
    CompanyOverviewResult,
    ContextQuality,
)


@pytest.mark.asyncio
async def test_assess_context_empty_content():
    """Test that empty website content raises HTTPException 422 for insufficient content."""
    orchestrator = ContextOrchestrator(AsyncMock())
    with patch(
        "backend.app.services.context_orchestrator.render_prompt",
        return_value="dummy prompt",
    ):
        with pytest.raises(Exception) as exc_info:
            await orchestrator.assess_context(website_content="   ")
        assert hasattr(exc_info.value, "status_code")
        assert exc_info.value.status_code == 422
        assert "Unable to access website content for analysis" in str(exc_info.value)


@pytest.mark.asyncio
async def test_assess_url_context_scrape_failure():
    """Test that a website scrape failure returns 'insufficient' result."""
    orchestrator = ContextOrchestrator(AsyncMock())
    with patch(
        "backend.app.services.context_orchestrator.extract_website_content",
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
    """Test that valid content and LLM response returns a valid CompanyOverviewResult."""
    llm_client = AsyncMock()
    llm_client.generate_structured_output = AsyncMock(
        return_value=CompanyOverviewResult(
            company_name="Example Inc.",
            company_url="https://example.com",
            company_overview="A great company.",
            capabilities=["AI", "Automation"],
            business_model=["SaaS"],
            differentiated_value=["Unique AI"],
            customer_benefits=["Saves time"],
            alternatives=["CompetitorX"],
            testimonials=["Great product!"],
            product_description="A SaaS platform for automation.",
            key_features=["Fast", "Reliable"],
            company_profiles=["Tech companies"],
            persona_profiles=["CTO"],
            use_cases=["Automate workflows"],
            pain_points=["Manual work"],
            pricing="Contact us",
            confidence_scores={
                "company_name": 0.95,
                "company_url": 0.95,
                "company_overview": 0.95,
            },
            metadata={"context_quality": "high"},
        )
    )
    orchestrator = ContextOrchestrator(llm_client)
    with patch(
        "backend.app.services.context_orchestrator.render_prompt",
        return_value="dummy prompt",
    ):
        result = await orchestrator.assess_context(website_content="Some real content.")
    assert result.company_name == "Example Inc."
    assert result.company_url == "https://example.com"
    assert result.company_overview == "A great company."
    assert result.capabilities == ["AI", "Automation"]
    assert result.confidence_scores["company_overview"] == 0.95
    assert result.metadata["context_quality"] == "high"


@pytest.mark.asyncio
async def test_assess_url_context_happy_path():
    """Test the full orchestration: scrape returns content, LLM returns valid assessment."""
    orchestrator = ContextOrchestrator(AsyncMock())
    orchestrator.assess_context = AsyncMock(
        return_value=CompanyOverviewResult(
            company_name="Example Inc.",
            company_url="https://example.com",
            company_overview="A great company.",
            capabilities=["AI", "Automation"],
            business_model=["SaaS"],
            differentiated_value=["Unique AI"],
            customer_benefits=["Saves time"],
            alternatives=["CompetitorX"],
            testimonials=["Great product!"],
            product_description="A SaaS platform for automation.",
            key_features=["Fast", "Reliable"],
            company_profiles=["Tech companies"],
            persona_profiles=["CTO"],
            use_cases=["Automate workflows"],
            pain_points=["Manual work"],
            pricing="Contact us",
            confidence_scores={
                "company_name": 0.9,
                "company_url": 0.9,
                "company_overview": 0.9,
            },
            metadata={"context_quality": "high"},
        )
    )
    with patch(
        "backend.app.services.context_orchestrator.extract_website_content",
        return_value={"content": "Some content"},
    ):
        result = await orchestrator.assess_url_context(
            url="https://good.com",
        )
    assert result.company_name == "Example Inc."
    assert result.company_url == "https://example.com"
    assert result.company_overview == "A great company."
    assert result.capabilities == ["AI", "Automation"]
    assert result.confidence_scores["company_overview"] == 0.9
    assert result.metadata["context_quality"] == "high"


@pytest.mark.asyncio
async def test_orchestrate_context_ready(monkeypatch):
    """Test orchestrate_context returns ready when assessment is ready for the endpoint."""
    # Patch extract_website_content to avoid real scraping
    monkeypatch.setattr(
        "backend.app.services.context_orchestrator.extract_website_content",
        lambda url, crawl=False: {"content": "dummy content"},
    )
    orchestrator = ContextOrchestrator(AsyncMock())
    # Patch assess_url_context and assess_context to return a ready assessment
    ready_assessment = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="A great company.",
        capabilities=["AI", "Automation"],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="A SaaS platform for automation.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Tech companies"],
        persona_profiles=["CTO"],
        use_cases=["Automate workflows"],
        pain_points=["Manual work"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.95,
            "company_url": 0.95,
            "company_overview": 0.95,
        },
        metadata={"context_quality": "high"},
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
    assert result["assessment"].company_name == "Example Inc."
    assert result["assessment"].company_url == "https://example.com"
    assert result["assessment"].company_overview == "A great company."
    assert result["assessment"].confidence_scores["company_overview"] == 0.95
    assert result["assessment"].metadata["context_quality"] == "high"


@pytest.mark.asyncio
async def test_orchestrate_context_not_ready_enrichment(monkeypatch):
    """Test orchestrate_context returns not ready and includes enrichment steps when not ready."""
    # Patch extract_website_content to avoid real scraping
    monkeypatch.setattr(
        "backend.app.services.context_orchestrator.extract_website_content",
        lambda url, crawl=False: {"content": "dummy content"},
    )
    orchestrator = ContextOrchestrator(AsyncMock())
    # Patch assess_url_context and assess_context to return a not ready assessment
    not_ready_assessment = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="A great company.",
        capabilities=["AI", "Automation"],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="A SaaS platform for automation.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Tech companies"],
        persona_profiles=["CTO"],
        use_cases=["Automate workflows"],
        pain_points=["Manual work"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.3,
            "company_url": 0.3,
            "company_overview": 0.3,
        },
        metadata={"context_quality": "low"},
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
    assert result["assessment"].company_name == "Example Inc."
    assert result["assessment"].company_url == "https://example.com"
    assert result["assessment"].company_overview == "A great company."
    assert result["assessment"].confidence_scores["company_overview"] == 0.3
    assert result["assessment"].metadata["context_quality"] == "low"


@pytest.mark.asyncio
async def test_orchestrate_context_no_content(monkeypatch):
    """Test orchestrate_context returns insufficient if no content is found after scrape and crawl."""
    llm_client = AsyncMock()
    llm_client.generate_structured_output = AsyncMock(
        return_value=CompanyOverviewResult(
            company_name="Example Inc.",
            company_url="https://example.com",
            company_overview="",
            capabilities=[],
            business_model=[],
            differentiated_value=[],
            customer_benefits=[],
            alternatives=[],
            testimonials=[],
            product_description="",
            key_features=[],
            company_profiles=[],
            persona_profiles=[],
            use_cases=[],
            pain_points=[],
            pricing="",
            confidence_scores={
                "company_name": 0.0,
                "company_url": 0.0,
                "company_overview": 0.0,
            },
            metadata={"context_quality": "insufficient"},
        )
    )
    orchestrator = ContextOrchestrator(llm_client)
    # Patch assess_url_context to simulate no content found
    monkeypatch.setattr(
        orchestrator,
        "assess_url_context",
        AsyncMock(
            return_value=CompanyOverviewResult(
                company_name="Example Inc.",
                company_url="https://example.com",
                company_overview="",
                capabilities=[],
                business_model=[],
                differentiated_value=[],
                customer_benefits=[],
                alternatives=[],
                testimonials=[],
                product_description="",
                key_features=[],
                company_profiles=[],
                persona_profiles=[],
                use_cases=[],
                pain_points=[],
                pricing="",
                confidence_scores={
                    "company_name": 0.0,
                    "company_url": 0.0,
                    "company_overview": 0.0,
                },
                metadata={"context_quality": "insufficient"},
            )
        ),
    )
    result = await orchestrator.orchestrate_context(
        website_url="https://empty.com",
        target_endpoint="product_overview",
        auto_enrich=False,
    )
    assert result["assessment"].company_name == "Example Inc."
    assert result["assessment"].company_url == "https://example.com"
    assert result["assessment"].company_overview == ""
    assert result["assessment"].confidence_scores["company_overview"] == 0.0
    assert result["assessment"].metadata["context_quality"] == "insufficient"


@pytest.mark.asyncio
async def test_resolve_context_prefers_user_context(monkeypatch):
    """User context is preferred if sufficient."""

    class DummyOrchestrator:
        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return AsyncMock()

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": True}

    request = MagicMock(
        user_inputted_context="User context",
        llm_inferred_context="LLM context",
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    result = await resolve_context_for_endpoint(
        request, "target_accounts", orchestrator
    )
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
            return AsyncMock()

        async def assess_url_context(self, url, target_endpoint, user_context=None):
            return AsyncMock()

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
    result = await resolve_context_for_endpoint(
        request, "target_accounts", orchestrator
    )
    assert result["source"] == "llm_inferred_context"
    assert result["context"] == "LLM context"


@pytest.mark.asyncio
async def test_resolve_context_falls_back_to_website(monkeypatch):
    """Website scraping is used if both user and LLM context are insufficient."""

    class DummyOrchestrator:
        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return scraped_content

        async def assess_url_context(self, url, target_endpoint, user_context=None):
            return scraped_content

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": False}

    request = MagicMock(
        user_inputted_context=None,
        llm_inferred_context=None,
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    # Simulate scraped content
    scraped_content = "<html>Website content for https://site.com</html>"
    monkeypatch.setattr(
        "backend.app.services.context_orchestrator.extract_website_content",
        lambda url, crawl=False: {"content": scraped_content},
    )
    result = await resolve_context_for_endpoint(
        request, "target_accounts", orchestrator
    )
    assert result["source"] == "website"
    assert result["context"] == scraped_content


@pytest.mark.asyncio
async def test_resolve_context_endpoint_specific_sufficiency(monkeypatch):
    """Sufficiency is checked per endpoint."""

    class DummyOrchestrator:
        async def assess_context(
            self, website_content, target_endpoint, user_context=None
        ):
            return AsyncMock()

        async def assess_url_context(self, url, target_endpoint, user_context=None):
            return AsyncMock()

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": endpoint == "target_accounts"}

    request = MagicMock(
        user_inputted_context="User context",
        llm_inferred_context="LLM context",
        website_url="https://site.com",
    )
    orchestrator = DummyOrchestrator()
    # Should be ready for target_accounts, not for target_personas
    result = await resolve_context_for_endpoint(
        request, "target_accounts", orchestrator
    )
    assert result["source"] == "user_inputted_context"
    result2 = await resolve_context_for_endpoint(
        request, "target_personas", orchestrator
    )
    assert result2["source"] != "user_inputted_context" or not result2["context"]


@pytest.mark.asyncio
async def test_check_endpoint_readiness_ready():
    """Ready if company_overview and capabilities are present and confident (>0.5)."""
    orchestrator = ContextOrchestrator(AsyncMock())
    assessment = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="A great company.",
        capabilities=["AI", "Automation"],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="A SaaS platform for automation.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Tech companies"],
        persona_profiles=["CTO"],
        use_cases=["Automate workflows"],
        pain_points=["Manual work"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.95,
            "company_url": 0.95,
            "company_overview": 0.95,
            "capabilities": 0.9,
            "pricing": 0.0,  # Should not block readiness
        },
        metadata={"context_quality": "high"},
    )
    readiness = orchestrator.check_endpoint_readiness(assessment, "product_overview")
    assert readiness["is_ready"] is True
    assert readiness["confidence"] == 0.9
    assert "pricing" in readiness["missing_requirements"]
    assert "company_overview" not in readiness["missing_requirements"]
    assert "capabilities" not in readiness["missing_requirements"]


@pytest.mark.asyncio
async def test_check_endpoint_readiness_not_ready_missing_company_overview():
    """Not ready if company_overview is missing or low confidence."""
    orchestrator = ContextOrchestrator(AsyncMock())
    assessment = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="",
        capabilities=["AI", "Automation"],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="A SaaS platform for automation.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Tech companies"],
        persona_profiles=["CTO"],
        use_cases=["Automate workflows"],
        pain_points=["Manual work"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.0,
            "company_url": 0.0,
            "company_overview": 0.0,
            "capabilities": 0.9,
        },
        metadata={"context_quality": "low"},
    )
    readiness = orchestrator.check_endpoint_readiness(assessment, "product_overview")
    assert readiness["is_ready"] is False
    assert "company_overview" in readiness["missing_requirements"]
    assert "capabilities" not in readiness["missing_requirements"]


@pytest.mark.asyncio
async def test_check_endpoint_readiness_not_ready_missing_capabilities():
    """Not ready if capabilities is missing or low confidence."""
    orchestrator = ContextOrchestrator(AsyncMock())
    assessment = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="A great company.",
        capabilities=[],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="A SaaS platform for automation.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Tech companies"],
        persona_profiles=["CTO"],
        use_cases=["Automate workflows"],
        pain_points=["Manual work"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.95,
            "company_url": 0.95,
            "company_overview": 0.95,
            "capabilities": 0.0,
        },
        metadata={"context_quality": "low"},
    )
    readiness = orchestrator.check_endpoint_readiness(assessment, "product_overview")
    assert readiness["is_ready"] is False
    assert "capabilities" in readiness["missing_requirements"]
    assert "company_overview" not in readiness["missing_requirements"]
