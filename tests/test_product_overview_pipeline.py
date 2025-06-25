from fastapi.testclient import TestClient
from blossomer_gtm_api.main import app
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from blossomer_gtm_api.services.context_orchestrator import ContextOrchestrator
from blossomer_gtm_api.prompts.models import ContextAssessmentResult, ContextQuality
from blossomer_gtm_api.services.product_overview_service import (
    generate_product_overview_service,
)
from blossomer_gtm_api.services.content_preprocessing import (
    ContentPreprocessingPipeline,
    SectionChunker,
    LangChainSummarizer,
    BoilerplateFilter,
)
from blossomer_gtm_api.schemas import ProductOverviewRequest
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
    fake_assessment = ContextAssessmentResult(
        overall_quality=ContextQuality.HIGH,
        overall_confidence=0.95,
        content_sections=[],
        company_clarity={},
        endpoint_readiness=[],
        data_quality_metrics={},
        recommendations={},
        summary="Looks good!",
    )
    orchestrator = ContextOrchestrator(llm_client=AsyncMock())
    orchestrator.assess_context = AsyncMock(return_value=fake_assessment)
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content"
    ) as mock_scrape:
        mock_scrape.return_value = {"content": "This is the website content."}
        result = await orchestrator.orchestrate_context(
            website_url="https://example.com",
            target_endpoint="product_overview",
        )
        assert result["assessment"].overall_quality == ContextQuality.HIGH
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
        return_value=ContextAssessmentResult(
            overall_quality=ContextQuality.INSUFFICIENT,
            overall_confidence=0.0,
            content_sections=[],
            company_clarity={},
            endpoint_readiness=[],
            data_quality_metrics={},
            recommendations={},
            summary="No content",
        )
    )
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content"
    ) as mock_scrape:
        mock_scrape.return_value = {"content": ""}
        result = await orchestrator.orchestrate_context(
            website_url="https://empty.com",
            target_endpoint="product_overview",
        )
        assert result["assessment"].overall_quality == ContextQuality.INSUFFICIENT
        assert result["enriched_content"]["raw_website_content"] == ""


@pytest.mark.asyncio
async def test_orchestrator_readiness_logic():
    """
    The orchestrator should correctly reflect endpoint readiness based on the assessment object.
    """
    from blossomer_gtm_api.prompts.models import EndpointReadiness

    assessment = ContextAssessmentResult(
        overall_quality=ContextQuality.HIGH,
        overall_confidence=0.9,
        content_sections=[],
        company_clarity={},
        endpoint_readiness=[
            EndpointReadiness(
                endpoint="product_overview",
                is_ready=True,
                confidence=0.9,
                missing_requirements=[],
                recommendations=[],
            )
        ],
        data_quality_metrics={},
        recommendations={},
        summary="Ready!",
    )
    orchestrator = ContextOrchestrator(llm_client=AsyncMock())
    readiness = orchestrator.check_endpoint_readiness(assessment, "product_overview")
    assert readiness["is_ready"] is True
    assert readiness["confidence"] == 0.9


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
                "assessment": ContextAssessmentResult(
                    overall_quality=ContextQuality.HIGH,
                    overall_confidence=0.9,
                    content_sections=[],
                    company_clarity={},
                    endpoint_readiness=[],
                    data_quality_metrics={},
                    recommendations={},
                    summary="Ready!",
                ),
                "enriched_content": {
                    "raw_website_content": "This is the real website content!"
                },
                "enrichment_successful": True,
            }

    class FakeLLMClient:
        async def generate(self, request):
            class FakeResp:
                text = """{
                        "product_description": "This is the real website content!",
                        "key_features": ["Feature1", "Feature2"],
                        "company_profiles": [
                            "Company profile string."
                        ],
                        "persona_profiles": [
                            "Persona profile string."
                        ],
                        "use_cases": ["Use case 1"],
                        "pain_points": ["Pain point 1"],
                        "confidence_scores": {"product_description": 0.95}
                    }"""

            return FakeResp()

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


@pytest.mark.asyncio
async def test_service_handles_missing_website_content(monkeypatch):
    """
    The service should raise a 422 error with a clear message if website content is missing or
    empty.
    """

    class FakeOrchestrator:
        async def orchestrate_context(self, *args, **kwargs):
            return {
                "assessment": ContextAssessmentResult(
                    overall_quality=ContextQuality.INSUFFICIENT,
                    overall_confidence=0.0,
                    content_sections=[],
                    company_clarity={},
                    endpoint_readiness=[],
                    data_quality_metrics={},
                    recommendations={},
                    summary="No content",
                ),
                "enriched_content": {"raw_website_content": ""},
                "enrichment_successful": False,
            }

        def check_endpoint_readiness(self, assessment, endpoint):
            return {
                "confidence": 0.0,
                "missing_requirements": ["content"],
                "recommendations": ["Add more content"],
                "assessment_summary": "No content",
            }

    data = ProductOverviewRequest(
        website_url="https://empty.com",
        user_inputted_context=None,
        llm_inferred_context=None,
    )
    with pytest.raises(HTTPException) as exc:
        await generate_product_overview_service(
            data=data,
            orchestrator=FakeOrchestrator(),  # type: ignore[arg-type]
            llm_client=MagicMock(),  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 422
    assert "Insufficient content quality" in str(exc.value.detail)


@pytest.mark.asyncio
async def test_service_handles_llm_refusal(monkeypatch):
    """
    The service should raise a 422 error and include the LLM's raw output if the LLM refuses or
    returns non-JSON.
    """

    class FakeOrchestrator:
        async def orchestrate_context(self, *args, **kwargs):
            return {
                "assessment": ContextAssessmentResult(
                    overall_quality=ContextQuality.HIGH,
                    overall_confidence=0.9,
                    content_sections=[],
                    company_clarity={},
                    endpoint_readiness=[],
                    data_quality_metrics={},
                    recommendations={},
                    summary="Ready!",
                ),
                "enriched_content": {"raw_website_content": "Some content"},
                "enrichment_successful": True,
            }

    class FakeLLMClient:
        async def generate(self, request):
            class FakeResp:
                text = "I'm sorry, I cannot extract the required product overview information."

            return FakeResp()

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
    assert "could not extract" in str(exc.value.detail)


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
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content"
    ) as mock_scrape:
        mock_scrape.return_value = {
            "content": "Product: Blossom. Fast, Reliable, Secure."
        }
        with patch(
            "blossomer_gtm_api.services.llm_service.LLMClient.generate"
        ) as mock_llm:
            # The first call (assessment) returns ContextAssessmentResult, the second returns ProductOverviewResponse
            def side_effect(request):
                if "analyze the provided website content and assess" in request.prompt:
                    # ContextAssessmentResult
                    assessment_dict = {
                        "overall_quality": "high",
                        "overall_confidence": 0.95,
                        "content_sections": [],
                        "company_clarity": {},
                        "endpoint_readiness": [
                            {
                                "endpoint": "product_overview",
                                "is_ready": True,
                                "confidence": 0.95,
                            }
                        ],
                        "data_quality_metrics": {},
                        "recommendations": {},
                        "summary": "Ready!",
                    }
                    return type("FakeResp", (), {"text": json.dumps(assessment_dict)})()
                else:
                    # ProductOverviewResponse
                    return type(
                        "FakeResp",
                        (),
                        {
                            "text": """{
                        "product_description": "Blossom is fast and reliable.",
                        "key_features": ["Fast", "Reliable", "Secure"],
                        "company_profiles": [
                            "Blossom Inc. is a SaaS company."
                        ],
                        "persona_profiles": [
                            "CTO: Tech decision maker"
                        ],
                        "use_cases": ["Automated workflows", "Data analytics"],
                        "pain_points": ["Manual processes", "Slow reporting"],
                        "confidence_scores": {"product_description": 0.95}
                    }"""
                        },
                    )()

            mock_llm.side_effect = side_effect
            response = client.post(
                "/campaigns/product_overview",
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
            assert isinstance(data["confidence_scores"], dict)


def test_api_insufficient_content(monkeypatch):
    """
    The API should return a 422 error and a helpful message for insufficient website content.
    """
    with patch(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content"
    ) as mock_scrape:
        mock_scrape.return_value = {"content": ""}
        response = client.post(
            "/campaigns/product_overview",
            json={"website_url": "https://empty.com"},
        )
        assert response.status_code == 422
        assert "Insufficient content" in str(response.json())
