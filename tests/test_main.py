from fastapi.testclient import TestClient
from unittest.mock import patch
from blossomer_gtm_api.main import app, rate_limit_dependency
import pytest
from blossomer_gtm_api.auth import authenticate_api_key
import json

client = TestClient(app)

# Example of valid ICP data
VALID_ICP = {
    "target_company": "Mid to large-sized software development firms",
    "company_attributes": [
        "Works on large-scale software projects",
        "Requires collaboration on complex tasks",
        "Interested in integrating AI to improve coding efficiency",
        "Uses large files and requires advanced token management",
        "Prefers open source solutions for customization and transparency",
    ],
    "buying_signals": [
        "Exploring AI tools for software development",
        "Looking to improve codebase management with AI",
        "Seeking integration with multiple AI models",
        "Interest in open source, customizable coding tools",
        "Desire to manage development tasks efficiently",
    ],
    "persona": "CTO or Head of Engineering",
    "persona_attributes": [
        "Responsible for technological innovation",
        "Seeks cost-effective ways to enhance development processes",
        "Values open-source solutions for flexibility",
        "Prioritizes tools that aid in managing large development teams",
        "Focuses on productivity and efficiency improvements",
    ],
    "persona_buying_signals": [
        "Interest in utilizing AI for coding",
        "Focus on avoiding model-specific lock-in",
        "Need for tools that support complex and large-scale project development",
        "Exploring solutions that allow granular control over coding tasks",
        "Evaluating options to leverage multiple AI models effectively",
    ],
    "rationale": (
        "Plandex is ideal for companies that manage large and complex software projects "
        "and are interested in leveraging AI to streamline coding tasks. The platform's "
        "capabilities, such as handling large files, collaboration, and integration with "
        "multiple AI models, align well with the needs of these firms. The personas targeted, "
        "such as CTOs or Heads of Engineering, play a crucial role in adopting new technologies "
        "that improve productivity while ensuring flexibility and cost-effectiveness, making "
        "Plandex's open-source approach and customizable features attractive to them."
    ),
}

# Patch rate_limit_dependency globally for all tests
app.dependency_overrides[rate_limit_dependency] = lambda x: lambda: None


class DummyAPIKey:
    id = "test-id"
    tier = "free"
    key_prefix = "bloss_test_sk_..."
    is_active = True
    user = type("User", (), {"rate_limit_exempt": True})()


app.dependency_overrides[authenticate_api_key] = lambda: DummyAPIKey()


def test_product_overview_endpoint_success(monkeypatch):
    """
    Test the /company/generate endpoint for a successful response.
    Mocks website scraping and LLM response to ensure the endpoint returns valid JSON
    and status 200.
    """
    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_content = "Fake company info."
    # First call: context assessment, second call: product overview
    context_assessment = {
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
    product_overview = {
        "product_description": "desc",
        "key_features": ["f1"],
        "company_profiles": ["c1"],
        "persona_profiles": ["p1"],
        "use_cases": ["u1"],
        "pain_points": ["pp1"],
        "pricing": "",
        "confidence_scores": {
            "product_description": 1,
            "key_features": 1,
            "company_profiles": 1,
            "persona_profiles": 1,
            "use_cases": 1,
            "pain_points": 1,
            "pricing": 1,
        },
        "metadata": {},
    }
    monkeypatch.setattr(
        "blossomer_gtm_api.services.context_orchestrator.extract_website_content",
        lambda *args, **kwargs: {"content": fake_content},
    )

    def llm_side_effect(request):
        if "analyze the provided website content and assess" in request.prompt:
            return type("FakeResp", (), {"text": json.dumps(context_assessment)})()
        else:
            return type("FakeResp", (), {"text": json.dumps(product_overview)})()

    with patch(
        "blossomer_gtm_api.main.llm_client.generate",
        side_effect=llm_side_effect,
    ):
        response = client.post("/company/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "product_description" in data
        assert "key_features" in data
        assert "company_profiles" in data
        assert "persona_profiles" in data
        assert "use_cases" in data
        assert "pain_points" in data
        assert "confidence_scores" in data
        assert "metadata" in data


def test_product_overview_llm_refusal(monkeypatch):
    """Test that the API returns a 422 error with a user-friendly message when the LLM refuses to answer."""
    from blossomer_gtm_api.services.product_overview_service import (
        generate_product_overview_service,
    )
    from blossomer_gtm_api.schemas import ProductOverviewRequest
    from fastapi import HTTPException

    class FakeLLMResponse:
        text = (
            "I'm sorry, but I am unable to extract the required product overview information from the "
            "provided content. If you can provide more explicit product details or additional context, "
            "I can assist you further."
        )

    class FakeLLMClient:
        async def generate(self, request):
            return FakeLLMResponse()

    class FakeAssessment:
        def __init__(self):
            class Quality:
                value = "low"

            self.overall_quality = Quality()
            self.summary = "Not enough info."

    class FakeOrchestrator:
        async def orchestrate_context(self, *args, **kwargs):
            return {
                "assessment": FakeAssessment(),
                "enriched_content": {
                    "initial": type("Fake", (), {"website_content": "Fake content"})()
                },
                "sources_used": ["website_scraper"],
                "enrichment_performed": [],
                "final_quality": "medium",
                "enrichment_successful": False,
            }

        def check_endpoint_readiness(self, assessment, endpoint):
            return {
                "confidence": 0.0,
                "missing_requirements": ["product_description"],
                "recommendations": ["Add more product details"],
            }

    data = ProductOverviewRequest(website_url="https://intryc.com")
    orchestrator = FakeOrchestrator()
    llm_client = FakeLLMClient()

    with pytest.raises(HTTPException) as exc_info:
        import asyncio

        asyncio.run(generate_product_overview_service(data, orchestrator, llm_client))
    assert exc_info.value.status_code == 422
    detail = exc_info.value.detail
    for key in [
        "error",
        "quality_assessment",
        "confidence",
        "missing_requirements",
        "recommendations",
        "assessment_summary",
    ]:
        assert key in detail


def test_target_company_endpoint_success(monkeypatch):
    """
    Test the /customers/target_accounts endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
    from blossomer_gtm_api.schemas import TargetCompanyResponse

    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_content = "Fake company info."
    fake_response = TargetCompanyResponse(
        target_company="Tech-forward SaaS companies",
        company_attributes=["SaaS", "Tech-forward", "100-500 employees"],
        buying_signals=["Hiring AI engineers", "Investing in automation"],
        rationale="These companies are ideal due to their innovation focus.",
        confidence_scores={"target_company": 0.95},
        metadata={"source": "test"},
    )

    async def fake_generate_structured_output(prompt, response_model):
        return fake_response

    async def fake_resolve_context_for_endpoint(req, endpoint, orchestrator):
        return {"context": fake_content, "source": "website"}

    monkeypatch.setattr(
        "blossomer_gtm_api.services.target_company_service.resolve_context_for_endpoint",
        fake_resolve_context_for_endpoint,
    )
    monkeypatch.setattr(
        "blossomer_gtm_api.services.target_company_service.render_prompt",
        lambda template, vars: "prompt",
    )
    monkeypatch.setattr(
        "blossomer_gtm_api.services.target_company_service.TargetCompanyPromptVars",
        lambda **kwargs: kwargs,
    )
    monkeypatch.setattr(
        "blossomer_gtm_api.main.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )
    response = client.post(
        "/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert "target_company" in data
    assert "company_attributes" in data
    assert "buying_signals" in data
    assert "rationale" in data
    assert "confidence_scores" in data
    assert "metadata" in data


def test_target_persona_endpoint_success(monkeypatch):
    """
    Test the /customers/target_personas endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
    from blossomer_gtm_api.schemas import TargetPersonaResponse

    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_content = "Fake company info."
    fake_response = TargetPersonaResponse(
        persona="Head of Operations",
        persona_attributes=["Decision maker", "Process-oriented"],
        persona_buying_signals=["Seeking efficiency", "Evaluating automation"],
        rationale="This persona drives operational improvements.",
        confidence_scores={"persona": 0.92},
        metadata={"source": "test"},
    )

    async def fake_generate_structured_output(prompt, response_model):
        return fake_response

    async def fake_resolve_context_for_endpoint(req, endpoint, orchestrator):
        return {"context": fake_content, "source": "website"}

    monkeypatch.setattr(
        "blossomer_gtm_api.services.target_persona_service.resolve_context_for_endpoint",
        fake_resolve_context_for_endpoint,
    )
    monkeypatch.setattr(
        "blossomer_gtm_api.services.target_persona_service.render_prompt",
        lambda template, vars: "prompt",
    )
    monkeypatch.setattr(
        "blossomer_gtm_api.services.target_persona_service.TargetPersonaPromptVars",
        lambda **kwargs: kwargs,
    )
    monkeypatch.setattr(
        "blossomer_gtm_api.main.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )
    response = client.post(
        "/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert "persona" in data
    assert "persona_attributes" in data
    assert "persona_buying_signals" in data
    assert "rationale" in data
    assert "confidence_scores" in data
    assert "metadata" in data
