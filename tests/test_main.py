from fastapi.testclient import TestClient
from backend.app.api.main import app
from backend.app.core.auth import rate_limit_dependency, authenticate_api_key
import pytest
import json
from backend.app.prompts.models import CompanyOverviewResult

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


# Canonical definition for all tests
async def fake_generate_structured_output(prompt, response_model):
    from backend.app.schemas import TargetAccountResponse

    return TargetAccountResponse(
        target_company_name="SaaS Innovators",
        target_company_description="Tech-forward SaaS companies",
        firmographics={
            "industry": ["SaaS", "Tech"],
            "company_size": {"employees": "100-500", "revenue": "$10M-$50M"},
            "geography": ["US", "EU"],
            "business_model": ["Subscription"],
            "funding_stage": ["Series A"],
        },
        buying_signals={
            "growth_indicators": ["Hiring AI engineers", "Investing in automation"],
            "technology_signals": ["Adopting cloud"],
            "organizational_signals": ["New CTO"],
            "market_signals": ["Industry expansion"],
        },
        rationale="These accounts are ideal due to their innovation focus.",
        metadata={
            "context_quality": "high",
            "primary_context_source": "user",
            "inference_level": "low",
            "assessment_summary": ("Sufficient context provided by user."),
        },
    ).model_dump()


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
    monkeypatch.setattr(
        "backend.app.services.context_orchestrator_agent.extract_website_content",
        lambda *args, **kwargs: {"content": fake_content},
    )

    # Patch llm_client.generate_structured_output in the actual endpoint module
    async def fake_generate_structured_output(prompt, response_model):
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
                "capabilities": 0.95,
                "business_model": 0.95,
                "differentiated_value": 0.95,
                "customer_benefits": 0.95,
                "alternatives": 0.95,
                "testimonials": 0.95,
                "product_description": 0.95,
                "key_features": 0.95,
                "company_profiles": 0.95,
                "persona_profiles": 0.95,
                "use_cases": 0.95,
                "pain_points": 0.95,
                "pricing": 0.95,
            },
            metadata={"context_quality": "high"},
        ).model_dump()

    monkeypatch.setattr(
        "backend.app.api.routes.company.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )

    # Patch llm_client.generate in the actual endpoint module
    async def fake_generate(request):
        class FakeResp:
            text = json.dumps(
                {
                    "company_name": "Example Inc.",
                    "company_url": "https://example.com",
                    "company_overview": "A great company.",
                    "capabilities": ["AI", "Automation"],
                    "business_model": ["SaaS"],
                    "differentiated_value": ["Unique AI"],
                    "customer_benefits": ["Saves time"],
                    "alternatives": ["CompetitorX"],
                    "testimonials": ["Great product!"],
                    "product_description": "A SaaS platform for automation.",
                    "key_features": ["Fast", "Reliable"],
                    "company_profiles": ["Tech companies"],
                    "persona_profiles": ["CTO"],
                    "use_cases": ["Automate workflows"],
                    "pain_points": ["Manual work"],
                    "pricing": "Contact us",
                    "confidence_scores": {
                        "company_name": 0.95,
                        "company_url": 0.95,
                        "company_overview": 0.95,
                        "capabilities": 0.95,
                        "business_model": 0.95,
                        "differentiated_value": 0.95,
                        "customer_benefits": 0.95,
                        "alternatives": 0.95,
                        "testimonials": 0.95,
                        "product_description": 0.95,
                        "key_features": 0.95,
                        "company_profiles": 0.95,
                        "persona_profiles": 0.95,
                        "use_cases": 0.95,
                        "pain_points": 0.95,
                        "pricing": 0.95,
                    },
                    "metadata": {"context_quality": "high"},
                }
            )

        return FakeResp()

    monkeypatch.setattr(
        "backend.app.api.routes.company.llm_client.generate",
        fake_generate,
    )

    response = client.post("/api/company/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Example Inc."
    assert data["company_url"] == "https://example.com"
    assert data["company_overview"] == "A great company."
    assert data["capabilities"] == ["AI", "Automation"]
    assert data["metadata"]["context_quality"] == "high"


@pytest.mark.skip(reason="type: ignore for test mocks")
def test_product_overview_llm_refusal(monkeypatch):
    """Test that the API returns a 422 error with a user-friendly message when the LLM refuses to answer."""
    from backend.app.services.context_orchestrator_service import (
        generate_product_overview_service,
    )
    from backend.app.schemas import ProductOverviewRequest
    from fastapi import HTTPException

    class FakeLLMResponse:
        text = (
            "I'm sorry, but I am unable to extract the required product overview "
            "information from the provided content. If you can provide more explicit product "
            "details or additional context, I can assist you further."
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


def test_target_account_endpoint_success(monkeypatch):
    """
    Test the /customers/target_accounts endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
    from backend.app.schemas import TargetAccountResponse

    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "Test context",
        "llm_inferred_context": "Test inferred context",
        "context_quality": "high",
        "assessment_summary": "Summary of context assessment.",
    }
    fake_response = TargetAccountResponse(
        target_company_name="SaaS Innovators",
        target_company_description="Tech-forward SaaS companies",
        firmographics={
            "industry": ["SaaS", "Tech"],
            "company_size": {"employees": "100-500", "revenue": "$10M-$50M"},
            "geography": ["US", "EU"],
            "business_model": ["Subscription"],
            "funding_stage": ["Series A"],
        },
        buying_signals={
            "growth_indicators": ["Hiring AI engineers", "Investing in automation"],
            "technology_signals": ["Adopting cloud"],
            "organizational_signals": ["New CTO"],
            "market_signals": ["Industry expansion"],
        },
        rationale="These accounts are ideal due to their innovation focus.",
        metadata={
            "context_quality": "high",
            "primary_context_source": "user",
            "inference_level": "low",
            "assessment_summary": ("Sufficient context provided by user."),
        },
    ).model_dump()

    # Patch ContextOrchestrator to always return is_ready True
    class MockOrchestrator:
        async def assess_context(self, *args, **kwargs):
            class DummyAssessment:
                endpoint_readiness = [
                    type(
                        "ER",
                        (),
                        {
                            "endpoint": "target_account",
                            "is_ready": True,
                            "confidence": 1.0,
                            "missing_requirements": [],
                            "recommendations": [],
                        },
                    )()
                ]
                overall_quality = "high"
                overall_confidence = 1.0
                content_sections = []
                company_clarity = {}
                data_quality_metrics = {}
                recommendations = {}
                summary = "Ready"

            return DummyAssessment()

        async def assess_url_context(self, *args, **kwargs):
            return await self.assess_context()

        def check_endpoint_readiness(self, assessment, endpoint):
            return {
                "is_ready": True,
                "confidence": 1.0,
                "missing_requirements": [],
                "recommendations": [],
            }

    monkeypatch.setattr(
        "backend.app.api.routes.customers.ContextOrchestrator",
        lambda llm_client: MockOrchestrator(),
    )

    async def fake_generate_structured_output(prompt, response_model):
        return fake_response

    monkeypatch.setattr(
        "backend.app.api.routes.customers.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )

    async def fake_generate(request):
        class FakeResp:
            text = fake_response

        return FakeResp()

    monkeypatch.setattr(
        "backend.app.api.routes.customers.llm_client.generate",
        fake_generate,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert "target_company_name" in data
    assert "target_company_description" in data
    assert "firmographics" in data
    assert "buying_signals" in data
    assert "rationale" in data
    assert "metadata" in data


def test_target_account_prompt_vars_render(monkeypatch):
    """
    Test that TargetAccountPromptVars can be instantiated and rendered
    with all fields, including context_quality and assessment_summary.
    Also test that the correct context is rendered depending on which
    context is provided.
    """
    from backend.app.prompts.models import TargetAccountPromptVars
    from backend.app.prompts.registry import render_prompt

    # Case 1: Both user_inputted_context and llm_inferred_context provided
    vars = TargetAccountPromptVars(
        website_content="Website content here.",
        user_inputted_context="User context here.",
        llm_inferred_context="LLM context here.",
        context_quality="high",
        assessment_summary="Assessment summary here.",
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "User context here." in prompt
    assert "LLM context here." in prompt
    assert "high" in prompt or "context_quality" in prompt
    assert "assessment_summary" in prompt or "Assessment summary" in prompt

    # Case 2: Only llm_inferred_context provided
    vars2 = TargetAccountPromptVars(
        website_content="Website content here.",
        user_inputted_context=None,
        llm_inferred_context="LLM context here.",
        context_quality="high",
        assessment_summary="Assessment summary here.",
    )
    prompt2 = render_prompt("target_account", vars2)
    assert "Website content here." in prompt2
    assert "LLM context here." in prompt2
    assert "User context here." not in prompt2
    assert "context_quality" in prompt2
    assert "assessment_summary" in prompt2 or "Assessment summary" in prompt2


def test_target_persona_endpoint_success(monkeypatch):
    """
    Test the /customers/target_personas endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
    payload = {
        "website_url": "https://example.com",
        "user_inputted_context": "",
        "llm_inferred_context": "",
    }
    fake_response = {
        "persona_name": "Growth Marketing Manager",
        "persona_description": (
            "Responsible for driving pipeline and revenue growth through digital channels."
        ),
        "likely_job_titles": [
            "Marketing Manager",
            "Senior Marketing Manager",
            "Director of Marketing",
        ],
        "primary_responsibilities": [
            "Develop and execute digital marketing campaigns",
            "Oversee lead generation initiatives",
            "Analyze campaign performance metrics",
        ],
        "status_quo": (
            "Currently uses spreadsheets and basic analytics tools to track campaigns."
        ),
        "use_cases": [
            "Automate lead scoring",
            "Personalize outreach",
            "Analyze campaign ROI",
        ],
        "pain_points": [
            "Manual data entry",
            "Lack of attribution",
            "Slow reporting",
        ],
        "desired_outcomes": [
            "Increase qualified leads",
            "Shorten sales cycle",
            "Improve ROI",
        ],
        "key_concerns": [
            "Implementation time",
            "Cost",
            "Learning curve",
        ],
        "why_we_matter": [
            "Faster onboarding",
            "Deeper analytics",
            "Better integrations",
        ],
        "persona_buying_signals": [
            "Evaluating new tools",
            "Attending marketing webinars",
            "Requesting demos",
        ],
        "rationale": (
            "This persona is the primary decision maker for marketing technology purchases, "
            "as evidenced by the website's focus on digital growth."
        ),
        "confidence_scores": {
            "persona_name": 0.95,
            "persona_description": 0.9,
            "likely_job_titles": 0.9,
            "primary_responsibilities": 0.9,
            "status_quo": 0.85,
            "use_cases": 0.9,
            "pain_points": 0.9,
            "desired_outcomes": 0.9,
            "key_concerns": 0.85,
            "why_we_matter": 0.9,
            "persona_buying_signals": 0.9,
            "rationale": 0.9,
        },
        "metadata": {
            "sources_used": ["website"],
            "context_quality": "high",
            "assessment_summary": (
                "Context is strong; persona is well-supported by evidence."
            ),
        },
    }

    async def fake_generate_structured_output(prompt, response_model):
        return fake_response

    async def fake_resolve_context_for_endpoint(req, endpoint, orchestrator):
        return {"context": "Fake content", "source": "website", "is_ready": True}

    monkeypatch.setattr(
        "backend.app.services.context_orchestrator_service.resolve_context_for_endpoint",
        fake_resolve_context_for_endpoint,
    )
    monkeypatch.setattr(
        "backend.app.services.target_persona_service.TargetPersonaPromptVars",
        lambda **kwargs: kwargs,
    )
    monkeypatch.setattr(
        "backend.app.api.main.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )

    async def fake_analyze(self, **kwargs):
        return fake_response

    monkeypatch.setattr(
        "backend.app.services.context_orchestrator_service.ContextOrchestratorService.analyze",
        fake_analyze,
    )
    monkeypatch.setattr(
        "backend.app.api.routes.customers.llm_client.generate_structured_output",
        fake_generate_structured_output,
    )

    async def fake_generate(request):
        class FakeResp:
            text = fake_response

        return FakeResp()

    monkeypatch.setattr(
        "backend.app.api.routes.customers.llm_client.generate",
        fake_generate,
    )

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["persona_name"] == "Growth Marketing Manager"
    assert (
        data["persona_description"]
        == "Responsible for driving pipeline and revenue growth through digital channels."
    )
    assert data["likely_job_titles"] == [
        "Marketing Manager",
        "Senior Marketing Manager",
        "Director of Marketing",
    ]
    assert data["primary_responsibilities"] == [
        "Develop and execute digital marketing campaigns",
        "Oversee lead generation initiatives",
        "Analyze campaign performance metrics",
    ]
    assert (
        data["status_quo"]
        == "Currently uses spreadsheets and basic analytics tools to track campaigns."
    )
    assert data["use_cases"] == [
        "Automate lead scoring",
        "Personalize outreach",
        "Analyze campaign ROI",
    ]
    assert data["pain_points"] == [
        "Manual data entry",
        "Lack of attribution",
        "Slow reporting",
    ]
    assert data["desired_outcomes"] == [
        "Increase qualified leads",
        "Shorten sales cycle",
        "Improve ROI",
    ]
    assert data["key_concerns"] == [
        "Implementation time",
        "Cost",
        "Learning curve",
    ]
    assert data["why_we_matter"] == [
        "Faster onboarding",
        "Deeper analytics",
        "Better integrations",
    ]
    assert data["persona_buying_signals"] == [
        "Evaluating new tools",
        "Attending marketing webinars",
        "Requesting demos",
    ]
    assert (
        data["rationale"]
        == "This persona is the primary decision maker for marketing technology purchases, "
        "as evidenced by the website's focus on digital growth."
    )
    # Assert confidence_scores for all fields
    for field in [
        "persona_name",
        "persona_description",
        "likely_job_titles",
        "primary_responsibilities",
        "status_quo",
        "use_cases",
        "pain_points",
        "desired_outcomes",
        "key_concerns",
        "why_we_matter",
        "persona_buying_signals",
        "rationale",
    ]:
        assert field in data["confidence_scores"]
        assert 0.0 <= data["confidence_scores"][field] <= 1.0
    assert data["metadata"]["sources_used"] == ["website"]
    assert data["metadata"]["context_quality"] == "high"
    assert "assessment_summary" in data["metadata"]
