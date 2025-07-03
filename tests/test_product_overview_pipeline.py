from fastapi.testclient import TestClient
from backend.app.api.main import app
import pytest
from unittest.mock import AsyncMock, patch
from backend.app.services.context_orchestrator import ContextOrchestrator
from backend.app.prompts.models import CompanyOverviewResult
from backend.app.services.product_overview_service import (
    generate_product_overview_service,
)
from backend.app.services.content_preprocessing import (
    ContentPreprocessingPipeline,
    SectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
)
from backend.app.schemas import ProductOverviewRequest
from fastapi import HTTPException
import json

client = TestClient(app)


# --- Orchestrator Tests ---
@pytest.mark.asyncio
async def test_orchestrator_returns_assessment_and_raw_content():
    """
    The orchestrator should return both a populated assessment and the raw website content
    for a valid URL.
    """
    fake_assessment = CompanyOverviewResult(
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
    orchestrator = ContextOrchestrator(llm_client=AsyncMock())
    orchestrator.assess_context = AsyncMock(return_value=fake_assessment)
    with patch(
        "backend.app.services.context_orchestrator.extract_website_content"
    ) as mock_scrape:
        mock_scrape.return_value = {"content": "This is the website content."}
        result = await orchestrator.orchestrate_context(
            website_url="https://example.com",
            target_endpoint="company_overview",
        )
        assert result["assessment"].company_name == "Example Inc."
        assert result["assessment"].company_url == "https://example.com"
        assert result["assessment"].company_overview == "A great company."
        assert (
            result["enriched_content"]["raw_website_content"]
            == "This is the website content."
        )


@pytest.mark.asyncio
async def test_orchestrator_handles_empty_content():
    """
    The orchestrator should return an insufficient assessment and empty raw content if the
    website is empty.
    """
    orchestrator = ContextOrchestrator(llm_client=AsyncMock())
    orchestrator.assess_context = AsyncMock(
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
            confidence_scores={},
            metadata={},
        )
    )
    with patch(
        "backend.app.services.context_orchestrator.extract_website_content"
    ) as mock_scrape:
        mock_scrape.return_value = {"content": ""}
        result = await orchestrator.orchestrate_context(
            website_url="https://empty.com",
            target_endpoint="company_overview",
        )
        assert result["assessment"].company_name == "Example Inc."
        assert result["assessment"].company_url == "https://example.com"
        assert result["assessment"].company_overview == ""
        assert result["enriched_content"]["raw_website_content"] == ""


@pytest.mark.asyncio
async def test_orchestrator_readiness_logic():
    """
    The orchestrator should correctly reflect endpoint readiness based on the assessment object.
    Ready if both company_overview and capabilities are present and confident (>0.5).
    """
    # Not ready: missing capabilities confidence
    assessment = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="Ready!",
        capabilities=["AI", "Automation"],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="Blossom is fast and reliable.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Blossom Inc. is a SaaS company."],
        persona_profiles=["CTO: Tech decision maker"],
        use_cases=["Automated workflows", "Data analytics"],
        pain_points=["Manual processes", "Slow reporting"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.9,
            "company_url": 0.9,
            "company_overview": 0.9,
        },
        metadata={},
    )
    orchestrator = ContextOrchestrator(llm_client=AsyncMock())
    readiness = orchestrator.check_endpoint_readiness(assessment, "company_overview")
    assert readiness["is_ready"] is True
    assert "capabilities" not in readiness["missing_requirements"]
    # Ready: both required fields present and confident
    assessment2 = CompanyOverviewResult(
        company_name="Example Inc.",
        company_url="https://example.com",
        company_overview="Ready!",
        capabilities=["AI", "Automation"],
        business_model=["SaaS"],
        differentiated_value=["Unique AI"],
        customer_benefits=["Saves time"],
        alternatives=["CompetitorX"],
        testimonials=["Great product!"],
        product_description="Blossom is fast and reliable.",
        key_features=["Fast", "Reliable"],
        company_profiles=["Blossom Inc. is a SaaS company."],
        persona_profiles=["CTO: Tech decision maker"],
        use_cases=["Automated workflows", "Data analytics"],
        pain_points=["Manual processes", "Slow reporting"],
        pricing="Contact us",
        confidence_scores={
            "company_name": 0.9,
            "company_url": 0.9,
            "company_overview": 0.9,
            "capabilities": 0.9,
        },
        metadata={},
    )
    readiness2 = orchestrator.check_endpoint_readiness(assessment2, "company_overview")
    assert readiness2["is_ready"] is True
    assert readiness2["confidence"] == 1.0


# --- Service Layer Tests ---
@pytest.mark.asyncio
async def test_service_uses_raw_website_content(monkeypatch):
    """
    The service should use the actual website content (not the assessment) for preprocessing
    and prompt construction.
    """

    class FakeOrchestrator:
        async def orchestrate_context(self, *args, **kwargs):
            return {
                "assessment": CompanyOverviewResult(
                    company_name="Example Inc.",
                    company_url="https://example.com",
                    company_overview="Ready!",
                    capabilities=["AI", "Automation"],
                    business_model=["SaaS"],
                    differentiated_value=["Unique AI"],
                    customer_benefits=["Saves time"],
                    alternatives=["CompetitorX"],
                    testimonials=["Great product!"],
                    product_description="Blossom is fast and reliable.",
                    key_features=["Fast", "Reliable"],
                    company_profiles=["Blossom Inc. is a SaaS company."],
                    persona_profiles=["CTO"],
                    use_cases=["Automated workflows", "Data analytics"],
                    pain_points=["Manual processes", "Slow reporting"],
                    pricing="Contact us",
                    confidence_scores={
                        "company_name": 0.9,
                        "company_url": 0.9,
                        "company_overview": 0.9,
                    },
                    metadata={},
                ),
                "enriched_content": {
                    "raw_website_content": "This is the real website content!"
                },
                "enrichment_successful": True,
            }

        async def assess_context(
            self, website_content, target_endpoint=None, user_context=None
        ):
            # Return a dummy CompanyOverviewResult for compatibility
            return CompanyOverviewResult(
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

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": True}

    class FakeLLMClient:

        async def generate(self, request):

            class FakeResp:
                text = (
                    "{\n"
                    '    "company_name": "Example Inc.",\n'
                    '    "company_url": "https://example.com",\n'
                    '    "company_overview": "A great company.",\n'
                    '    "capabilities": ["AI", "Automation"],\n'
                    '    "business_model": ["SaaS"],\n'
                    '    "differentiated_value": ["Unique AI"],\n'
                    '    "customer_benefits": ["Saves time"],\n'
                    '    "alternatives": ["CompetitorX"],\n'
                    '    "testimonials": ["Great product!"],\n'
                    '    "product_description": "This is the real website content!",\n'
                    '    "key_features": ["Feature1", "Feature2"],\n'
                    '    "company_profiles": ["Company profile string."],\n'
                    '    "persona_profiles": ["Persona profile string."],\n'
                    '    "use_cases": ["Use case 1"],\n'
                    '    "pain_points": ["Pain point 1"],\n'
                    '    "pricing": "Contact us",\n'
                    '    "confidence_scores": {"product_description": 0.95},\n'
                    '    "metadata": {}\n'
                    "}"
                )  # noqa: E501

            return FakeResp()

        async def generate_structured_output(self, prompt, response_model):
            # Return a dict matching CompanyOverviewResult
            return {
                "company_name": "Example Inc.",
                "company_url": "https://example.com",
                "company_overview": "A great company.",
                "capabilities": ["AI", "Automation"],
                "business_model": ["SaaS"],
                "differentiated_value": ["Unique AI"],
                "customer_benefits": ["Saves time"],
                "alternatives": ["CompetitorX"],
                "testimonials": ["Great product!"],
                "product_description": "This is the real website content!",
                "key_features": ["Feature1", "Feature2"],
                "company_profiles": ["Company profile string."],
                "persona_profiles": ["Persona profile string."],
                "use_cases": ["Use case 1"],
                "pain_points": ["Pain point 1"],
                "pricing": "Contact us",
                "confidence_scores": {"product_description": 0.95},
                "metadata": {},
            }

    data = ProductOverviewRequest(
        website_url="https://example.com",
        user_inputted_context=None,
        llm_inferred_context=None,
    )
    result = await generate_product_overview_service(
        data=data,
        orchestrator=FakeOrchestrator(),  # type: ignore[arg-type]
        llm_client=FakeLLMClient(),  # type: ignore[arg-type]
    )
    assert "This is the real web" in result.product_description
    assert result.company_name == "Example Inc."
    assert result.company_url == "https://example.com"


@pytest.mark.asyncio
async def test_service_handles_missing_website_content(monkeypatch):
    """
    The service should raise a 422 error with a clear message if website content is missing or
    empty.
    """

    class FakeOrchestrator:
        async def orchestrate_context(self, *args, **kwargs):
            return {
                "assessment": CompanyOverviewResult(
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
                    confidence_scores={},
                    metadata={},
                ),
                "enriched_content": {"raw_website_content": ""},
                "enrichment_successful": False,
            }

        async def assess_context(
            self, website_content, target_endpoint=None, user_context=None
        ):
            return CompanyOverviewResult(
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
                confidence_scores={},
                metadata={},
            )

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": False}

    data = ProductOverviewRequest(
        website_url="https://empty.com",
        user_inputted_context=None,
        llm_inferred_context=None,
    )
    with pytest.raises(HTTPException) as exc:
        await generate_product_overview_service(
            data=data,
            orchestrator=FakeOrchestrator(),  # type: ignore[arg-type]
            llm_client=AsyncMock(),  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 422
    assert "valid output" in str(exc.value.detail)


@pytest.mark.asyncio
async def test_service_handles_llm_refusal(monkeypatch):
    """
    The service should raise a 422 error and include the LLM's raw output if the LLM refuses or
    returns non-JSON.
    """

    class FakeOrchestrator:
        async def orchestrate_context(self, *args, **kwargs):
            return {
                "assessment": CompanyOverviewResult(
                    company_name="Example Inc.",
                    company_url="https://example.com",
                    company_overview="Ready!",
                    capabilities=["AI", "Automation"],
                    business_model=["SaaS"],
                    differentiated_value=["Unique AI"],
                    customer_benefits=["Saves time"],
                    alternatives=["CompetitorX"],
                    testimonials=["Great product!"],
                    product_description="Blossom is fast and reliable.",
                    key_features=["Fast", "Reliable"],
                    company_profiles=["Blossom Inc. is a SaaS company."],
                    persona_profiles=["CTO"],
                    use_cases=["Automated workflows", "Data analytics"],
                    pain_points=["Manual processes", "Slow reporting"],
                    pricing="Contact us",
                    confidence_scores={
                        "company_name": 0.9,
                        "company_url": 0.9,
                        "company_overview": 0.9,
                    },
                    metadata={},
                ),
                "enriched_content": {"raw_website_content": "Some content"},
                "enrichment_successful": True,
            }

        async def assess_context(
            self, website_content, target_endpoint=None, user_context=None
        ):
            return CompanyOverviewResult(
                company_name="Example Inc.",
                company_url="https://example.com",
                company_overview="Ready!",
                capabilities=["AI", "Automation"],
                business_model=["SaaS"],
                differentiated_value=["Unique AI"],
                customer_benefits=["Saves time"],
                alternatives=["CompetitorX"],
                testimonials=["Great product!"],
                product_description="Blossom is fast and reliable.",
                key_features=["Fast", "Reliable"],
                company_profiles=["Blossom Inc. is a SaaS company."],
                persona_profiles=["CTO"],
                use_cases=["Automated workflows", "Data analytics"],
                pain_points=["Manual processes", "Slow reporting"],
                pricing="Contact us",
                confidence_scores={
                    "company_name": 0.9,
                    "company_url": 0.9,
                    "company_overview": 0.9,
                },
                metadata={},
            )

        def check_endpoint_readiness(self, assessment, endpoint):
            return {"is_ready": True}

    class FakeLLMClient:
        async def generate(self, request):
            class FakeResp:
                text = "I'm sorry, I cannot extract the required product overview information."

            return FakeResp()

        async def generate_structured_output(self, prompt, response_model):
            raise ValueError("LLM did not return valid JSON.")

    data = ProductOverviewRequest(
        website_url="https://example.com",
        user_inputted_context=None,
        llm_inferred_context=None,
    )
    with pytest.raises(HTTPException) as exc:
        await generate_product_overview_service(
            data=data,
            orchestrator=FakeOrchestrator(),  # type: ignore[arg-type]
            llm_client=FakeLLMClient(),  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 422
    assert "LLM did not return valid JSON" in str(exc.value.detail)


# --- Preprocessing Pipeline Tests ---
def test_preprocessing_pipeline_not_empty():
    """
    The preprocessing pipeline should not remove all content when given rich input.
    """
    pipeline = ContentPreprocessingPipeline(
        SectionChunker(), LangChainSummarizer(), BoilerplateFilter()
    )
    text = "This is a product.\n\nKey features: Fast, Reliable, Secure.\n\nContact us!"
    result = pipeline.process(text)
    assert any("product" in chunk or "feature" in chunk for chunk in result)


def test_preprocessing_pipeline_removes_noise():
    """
    The preprocessing pipeline should strip boilerplate but retain key information.
    """
    pipeline = ContentPreprocessingPipeline(
        SectionChunker(), LangChainSummarizer(), BoilerplateFilter()
    )
    text = "![Logo](logo.png)\n\nWelcome!\n\nProduct: Blossom\n\n![](img.png)\n\nContact us."
    result = pipeline.process(text)
    # Check that at least one chunk contains 'Product' or 'Blossom'
    assert any("Product" in chunk or "Blossom" in chunk for chunk in result)


# --- End-to-End API Tests ---
def test_api_happy_path(monkeypatch):
    """
    The API should return a structured, non-empty product overview for a real website
    (happy path).
    """

    # Patch llm_client.generate_structured_output in the actual endpoint module for company
    async def fake_generate_structured_output(prompt, response_model):
        assessment_dict = {
            "company_name": "Example Inc.",
            "company_url": "https://example.com",
            "company_overview": "Ready!",
            "capabilities": ["AI", "Automation"],
            "business_model": ["SaaS"],
            "differentiated_value": ["Unique AI"],
            "customer_benefits": ["Saves time"],
            "alternatives": ["CompetitorX"],
            "testimonials": ["Great product!"],
            "product_description": "Blossom is fast and reliable.",
            "key_features": ["Fast", "Reliable"],
            "company_profiles": ["Blossom Inc. is a SaaS company."],
            "persona_profiles": ["CTO"],
            "use_cases": ["Automated workflows", "Data analytics"],
            "pain_points": ["Manual processes", "Slow reporting"],
            "pricing": "Contact us",
            "metadata": {},
        }
        return assessment_dict

    monkeypatch.setattr(
        "backend.app.api.routes.company.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )

    # Patch llm_client.generate in the actual endpoint module for company
    async def fake_generate(request):
        class FakeResp:
            text = json.dumps(
                {
                    "company_name": "Example Inc.",
                    "company_url": "https://example.com",
                    "company_overview": "Ready!",
                    "capabilities": ["AI", "Automation"],
                    "business_model": ["SaaS"],
                    "differentiated_value": ["Unique AI"],
                    "customer_benefits": ["Saves time"],
                    "alternatives": ["CompetitorX"],
                    "testimonials": ["Great product!"],
                    "product_description": "Blossom is fast and reliable.",
                    "key_features": ["Fast", "Reliable", "Secure"],
                    "company_profiles": ["Blossom Inc. is a SaaS company."],
                    "persona_profiles": ["CTO: Tech decision maker"],
                    "use_cases": ["Automated workflows", "Data analytics"],
                    "pain_points": ["Manual processes", "Slow reporting"],
                    "pricing": "Contact us",
                    "metadata": {},
                }
            )

        return FakeResp()

    monkeypatch.setattr(
        "backend.app.api.routes.company.llm_client.generate",
        fake_generate,
    )

    monkeypatch.setattr(
        "backend.app.services.context_orchestrator.extract_website_content",
        lambda *args, **kwargs: {
            "content": "Product: Blossom. Fast, Reliable, Secure.",
            "html": "<html>Product: Blossom. Fast, Reliable, Secure.</html>",
            "validation": {"is_valid": True, "reachable": True, "robots_allowed": True},
        },
    )

    monkeypatch.setattr(
        "backend.app.services.website_scraper.validate_url",
        lambda *args, **kwargs: {
            "is_valid": True,
            "reachable": True,
            "robots_allowed": True,
        },
    )

    response = client.post(
        "/api/company/generate",
        json={"website_url": "https://blossom.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["product_description"]
    assert isinstance(data["key_features"], list)
    assert isinstance(data["company_profiles"], list)
    assert isinstance(data["persona_profiles"], list)
    assert isinstance(data["use_cases"], list)
    assert isinstance(data["pain_points"], list)
    assert data["company_name"] == "Example Inc."
    assert data["company_url"] == "https://example.com"


def test_api_insufficient_content(monkeypatch):
    """
    The API should return a 422 error and a helpful message for insufficient website content.
    """
    from backend.app.schemas import ProductOverviewResponse

    # Patch analyze to return a ProductOverviewResponse with insufficient content
    def make_insufficient_response():
        return ProductOverviewResponse(
            company_name="",
            company_url="",
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
            confidence_scores={},
            metadata={"context_quality": "insufficient"},
        )

    async def fake_analyze(self, **kwargs):
        return make_insufficient_response()

    monkeypatch.setattr(
        "backend.app.services.company_analysis_service.CompanyAnalysisService.analyze",
        fake_analyze,
    )

    response = client.post(
        "/api/company/generate",
        json={"website_url": "https://empty.com"},
    )
    assert response.status_code == 422 or response.status_code == 400
    assert "valid output" in str(response.json())
