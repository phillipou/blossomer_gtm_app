from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from blossomer_gtm_api.main import app
import pytest
import jsonschema
from blossomer_gtm_api.schemas import ICP_SCHEMA

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


def test_icp_endpoint_success():
    """
    Test the /campaigns/icp endpoint for a successful response.
    Mocks website scraping and LLM response to ensure the endpoint returns valid JSON
    and status 200.
    """
    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_content = "Fake company info."
    fake_llm_response = MagicMock()
    fake_llm_response.text = '{"target_company": {"hypothesis": "Test"}}'
    with patch(
        "blossomer_gtm_api.main.extract_website_content",
        return_value={"content": fake_content},
    ), patch(
        "blossomer_gtm_api.main.llm_client.generate",
        return_value=fake_llm_response,
    ):
        response = client.post("/campaigns/icp", json=payload)
        if response.status_code != 200:
            print("ICP endpoint success test error:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "target_company" in data
        assert "hypothesis" in data["target_company"]


def test_icp_endpoint_no_provider(monkeypatch):
    """
    Test the /campaigns/icp endpoint when no LLM provider is available.
    Mocks website scraping and simulates a provider error to ensure the endpoint returns
    a 500/502 error.
    """
    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_content = "Fake company info."
    with patch(
        "blossomer_gtm_api.main.extract_website_content",
        return_value={"content": fake_content},
    ):
        # Patch llm_client.generate to raise RuntimeError (simulating no provider)
        monkeypatch.setattr(
            "blossomer_gtm_api.main.llm_client.generate",
            lambda *a, **kw: (_ for _ in ()).throw(
                RuntimeError("All LLM providers failed or are unavailable.")
            ),
        )
        response = client.post("/campaigns/icp", json=payload)
        if response.status_code not in (500, 502):
            print("ICP endpoint provider error test:", response.json())
        assert response.status_code in (500, 502)
        assert (
            "LLM provider error" in response.text
            or "All LLM providers failed" in response.text
        )


def test_icp_schema_is_valid():
    """Test that the ICP_SCHEMA itself is a valid JSON schema."""
    jsonschema.Draft7Validator.check_schema(ICP_SCHEMA)


def test_icp_schema_accepts_valid_data():
    """Test that valid ICP data passes the schema validation."""
    jsonschema.validate(instance=VALID_ICP, schema=ICP_SCHEMA)


def test_icp_schema_rejects_missing_required():
    """Test that missing required fields are rejected."""
    invalid = VALID_ICP.copy()
    del invalid["persona"]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=invalid, schema=ICP_SCHEMA)


def test_icp_schema_rejects_wrong_type():
    """Test that wrong types are rejected (e.g., persona as list)."""
    invalid = VALID_ICP.copy()
    invalid["persona"] = ["CTO"]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=invalid, schema=ICP_SCHEMA)


def test_product_overview_endpoint_success(monkeypatch):
    """
    Test the /campaigns/product_overview endpoint for a successful response.
    Mocks website scraping and LLM response to ensure the endpoint returns valid JSON
    and status 200.
    """
    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_content = "Fake company info."
    # Minimal valid ProductOverviewResponse JSON
    fake_llm_json = (
        '{"product_description": "desc", "key_features": ["f1"], "company_profiles": ["c1"], '
        '"persona_profiles": ["p1"], "use_cases": ["u1"], "pain_points": ["pp1"], "pricing": "", '
        '"confidence_scores": {"product_description": 1, "key_features": 1, "company_profiles": 1, '
        '"persona_profiles": 1, "use_cases": 1, "pain_points": 1, "pricing": 1}, "metadata": {}}'
    )
    fake_llm_response = MagicMock()
    fake_llm_response.text = fake_llm_json
    # Patch orchestrator to return ready assessment
    from blossomer_gtm_api.prompts.models import (
        ContextAssessmentResult,
        ContextQuality,
        EndpointReadiness,
    )

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
    fake_orchestration_result = {
        "assessment": ready_assessment,
        "enriched_content": {"initial": MagicMock(website_content=fake_content)},
        "sources_used": ["website_scraper"],
        "enrichment_performed": [],
        "final_quality": "high",
        "enrichment_successful": True,
    }
    monkeypatch.setattr(
        "blossomer_gtm_api.main.ContextOrchestrator.orchestrate_context",
        AsyncMock(return_value=fake_orchestration_result),
    )
    with patch(
        "blossomer_gtm_api.main.extract_website_content",
        return_value={"content": fake_content},
    ), patch(
        "blossomer_gtm_api.main.llm_client.generate",
        return_value=fake_llm_response,
    ):
        response = client.post("/campaigns/product_overview", json=payload)
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
    import pytest

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
    Test the /campaigns/target_company endpoint for a successful response.
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
    response = client.post("/campaigns/target_company", json=payload)
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
    Test the /campaigns/target_persona endpoint for a successful response.
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
    response = client.post("/campaigns/target_persona", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "persona" in data
    assert "persona_attributes" in data
    assert "persona_buying_signals" in data
    assert "rationale" in data
    assert "confidence_scores" in data
    assert "metadata" in data
