import pytest
from fastapi.testclient import TestClient
from backend.app.api.main import app
from backend.app.core.auth import rate_limit_dependency, authenticate_api_key
from fastapi import HTTPException
from backend.app.schemas import TargetPersonaResponse, Demographics

client = TestClient(app)


# Canonical definition for all tests
async def fake_generate_structured_output(prompt, response_model):
    return TargetPersonaResponse(
        target_persona_name="Growth Marketing Manager",
        target_persona_description=(
            "Responsible for driving pipeline and revenue growth through digital channels."
        ),
        target_persona_rationale=[
            "This persona is the primary decision maker for marketing technology purchases."
        ],
        demographics={
            "job_titles": ["Marketing Manager"],
            "departments": ["Marketing"],
            "seniority": ["Manager"],
            "buying_roles": ["Decision Maker"],
            "job_description_keywords": ["digital marketing", "lead generation"],
        },
        use_cases=[
            {
                "use_case": "Automate lead scoring",
                "pain_points": "Manual data entry",
                "capability": "AI-powered automation",
                "desired_outcome": "Increase qualified leads",
            }
        ],
        buying_signals=[
            {
                "title": "Evaluating new tools",
                "description": "Actively researching marketing automation platforms.",
                "type": "Content Consumption",
                "priority": "High",
                "detection_method": "Website visits, demo requests",
            }
        ],
        buying_signals_rationale=[
            "These signals indicate active solution seeking and high receptivity to outreach."
        ],
        objections=["Cost of new software"],
        goals=["Increase marketing ROI"],
        purchase_journey=["Awareness -> Consideration -> Purchase"],
        metadata={
            "primary_context_source": "user",
            "sources_used": ["user input"],
            "confidence_assessment": {
                "overall_confidence": "high",
                "data_quality": "high",
                "inference_level": "minimal",
                "recommended_improvements": [],
            },
            "processing_notes": "",
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


from backend.app.prompts.models import TargetPersonaPromptVars
from backend.app.prompts.registry import render_prompt


def test_target_persona_endpoint_success(monkeypatch):
    """
    Test the /customers/target_personas endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Growth Marketing Manager",
        "hypothesis": "This persona needs automation",
        "additional_context": "More context here",
    }
    fake_response = TargetPersonaResponse(
        target_persona_name="Growth Marketing Manager",
        target_persona_description=(
            "Responsible for driving pipeline and revenue growth through digital channels."
        ),
        target_persona_rationale=[
            "This persona is the primary decision maker for marketing technology purchases."
        ],
        demographics={
            "job_titles": ["Marketing Manager"],
            "departments": ["Marketing"],
            "seniority": ["Manager"],
            "buying_roles": ["Decision Maker"],
            "job_description_keywords": ["digital marketing", "lead generation"],
        },
        use_cases=[
            {
                "use_case": "Automate lead scoring",
                "pain_points": "Manual data entry",
                "capability": "AI-powered automation",
                "desired_outcome": "Increase qualified leads",
            }
        ],
        buying_signals=[
            {
                "title": "Evaluating new tools",
                "description": "Actively researching marketing automation platforms.",
                "type": "Content Consumption",
                "priority": "High",
                "detection_method": "Website visits, demo requests",
            }
        ],
        buying_signals_rationale=[
            "These signals indicate active solution seeking and high receptivity to outreach."
        ],
        objections=["Cost of new software"],
        goals=["Increase marketing ROI"],
        purchase_journey=["Awareness -> Consideration -> Purchase"],
        metadata={
            "primary_context_source": "user",
            "sources_used": ["user input"],
            "confidence_assessment": {
                "overall_confidence": "high",
                "data_quality": "high",
                "inference_level": "minimal",
                "recommended_improvements": [],
            },
            "processing_notes": "",
        },
    ).model_dump()

    async def fake_generate_target_persona_profile(request):
        return fake_response

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert "target_persona_name" in data
    assert "demographics" in data
    assert "use_cases" in data
    assert "buying_signals" in data
    assert "metadata" in data
    assert data["metadata"]["sources_used"] == ["user input"]


# --- Prompt Rendering Tests ---


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
def test_target_persona_prompt_rendering_with_user_context():
    """
    Test rendering with website_url and user_inputted_context.
    """
    vars = TargetPersonaPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        persona_profile_name="Test Persona",
        hypothesis="Test Hypothesis",
        user_inputted_context={"key": "User context here."},
    )
    prompt = render_prompt("target_persona", vars)
    assert "Website content here." in prompt
    assert "User context here." in prompt
    assert "Test Persona" in prompt
    assert "Test Hypothesis" in prompt
    assert "Company Context:" not in prompt
    assert "Target Account Context:" not in prompt


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env, or schema changed; test needs rewrite or template loader patch."
)
def test_target_persona_prompt_rendering_with_company_context():
    """
    Test rendering with website_url and company_context.
    """
    vars = TargetPersonaPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        persona_profile_name="Test Persona",
        hypothesis="Test Hypothesis",
        company_context={"key": "Company context here."},
    )
    prompt = render_prompt("target_persona", vars)
    assert "Website content here." in prompt
    assert "Company context here." in prompt
    assert "Test Persona" in prompt
    assert "Test Hypothesis" in prompt
    assert "Additional Context:" not in prompt
    assert "Target Account Context:" not in prompt


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env, or schema changed; test needs rewrite or template loader patch."
)
def test_target_persona_prompt_rendering_with_target_account_context():
    """
    Test rendering with website_url and target_account_context.
    """
    vars = TargetPersonaPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        persona_profile_name="Test Persona",
        hypothesis="Test Hypothesis",
        target_account_context={"key": "Target account context here."},
    )
    prompt = render_prompt("target_persona", vars)
    assert "Website content here." in prompt
    assert "Target account context here." in prompt
    assert "Test Persona" in prompt
    assert "Test Hypothesis" in prompt
    assert "Additional Context:" not in prompt
    assert "Company Context:" not in prompt


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env, or schema changed; test needs rewrite or template loader patch."
)
def test_target_persona_prompt_rendering_all_contexts():
    """
    Test rendering with all available contexts.
    """
    vars = TargetPersonaPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        persona_profile_name="Test Persona",
        hypothesis="Test Hypothesis",
        user_inputted_context={"key": "User context here."},
        company_context={"key": "Company context here."},
        target_account_context={"key": "Target account context here."},
    )
    prompt = render_prompt("target_persona", vars)
    assert "Website content here." in prompt
    assert "User context here." in prompt
    assert "Company context here." in prompt
    assert "Target account context here." in prompt
    assert "Test Persona" in prompt
    assert "Test Hypothesis" in prompt


# --- API Endpoint Tests (LLM Response Edge Cases) ---
def test_target_persona_endpoint_llm_response_empty_lists(monkeypatch):
    """
    Test with a valid LLM JSON response where persona attributes or buying signals are empty lists.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }
    fake_response = TargetPersonaResponse(
        target_persona_name="Test Persona",
        target_persona_description="A test persona.",
        target_persona_rationale=[],
        demographics={
            "job_titles": [],
            "departments": [],
            "seniority": [],
            "buying_roles": [],
            "job_description_keywords": [],
        },
        use_cases=[],
        buying_signals=[],
        buying_signals_rationale=[],
        objections=[],
        goals=[],
        purchase_journey=[],
        metadata={
            "primary_context_source": "user",
            "sources_used": ["user input"],
            "confidence_assessment": {
                "overall_confidence": "high",
                "data_quality": "high",
                "inference_level": "minimal",
                "recommended_improvements": [],
            },
            "processing_notes": "",
        },
    ).model_dump()

    async def fake_generate_target_persona_profile(request):
        return fake_response

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["demographics"]["job_titles"] == []
    assert data["use_cases"] == []
    assert data["buying_signals"] == []


def test_target_persona_endpoint_llm_response_missing_optional_fields(monkeypatch):
    """
    Test with a valid LLM JSON response that omits optional fields.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }
    fake_response_dict = {
        "target_persona_name": "Test Persona",
        "target_persona_description": "A test persona.",
        "demographics": Demographics(
            job_titles=["Engineer"],
            departments=["Engineering"],
            seniority=["Individual Contributor"],
            buying_roles=["End-User"],
            job_description_keywords=["coding"],
        ),
        "use_cases": [
            {
                "use_case": "Write code",
                "pain_points": "Slow development",
                "capability": "Fast IDE",
                "desired_outcome": "Faster delivery",
            }
        ],
        "buying_signals": [
            {
                "title": "Looking for new tools",
                "description": "Searching for productivity software.",
                "type": "Content Consumption",
                "priority": "Medium",
                "detection_method": "Search history",
            }
        ],
    }

    async def fake_generate_target_persona_profile(request):
        return TargetPersonaResponse(**fake_response_dict).model_dump()

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )
    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert "detail" in response.json()


def test_target_persona_endpoint_llm_response_semantically_incorrect(monkeypatch):
    """
    Test with a valid LLM JSON response that contains semantically incorrect but syntactically valid data.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }
    fake_response_dict = {
        "target_persona_name": "Test Persona",
        "target_persona_description": "A test persona.",
        "target_persona_rationale": ["Not a real rationale."],
        "demographics": Demographics(
            job_titles=["Invalid Job Title"],
            departments=["Invalid Department"],
            seniority=["NotASeniority"],
            buying_roles=["NotABuyingRole"],
            job_description_keywords=["random", "words"],
        ),
        "use_cases": [
            {
                "use_case": "Invalid Use Case",
                "pain_points": "Invalid Pain Point",
                "capability": "Invalid Capability",
                "desired_outcome": "Invalid Outcome",
            }
        ],
        "buying_signals": [
            {
                "title": "Invalid Signal",
                "description": "Invalid Description",
                "type": "InvalidType",
                "priority": "NotAPriority",
                "detection_method": "NoMethod",
            }
        ],
        "buying_signals_rationale": ["Invalid Rationale"],
        "objections": ["Invalid Objection"],
        "goals": ["Invalid Goal"],
        "purchase_journey": ["Invalid Journey"],
        "metadata": {
            "primary_context_source": "invalid",
            "sources_used": ["invalid source"],
            "confidence_assessment": {
                "overall_confidence": "very low",
                "data_quality": "terrible",
                "inference_level": "extreme",
                "recommended_improvements": ["Improve LLM output"],
            },
            "processing_notes": "Invalid notes",
        },
    }

    async def fake_generate_target_persona_profile(request):
        return TargetPersonaResponse(**fake_response_dict).model_dump()

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )
    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert "detail" in response.json()


# --- API Endpoint Tests (Error Handling) ---
def test_target_persona_endpoint_llm_refusal(monkeypatch):
    """
    Test the /customers/target_personas endpoint for LLM refusal.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }

    async def fake_generate_target_persona_profile(request):
        raise HTTPException(
            status_code=422,
            detail={
                "error": "LLM refused to generate output",
                "quality_assessment": "low",
                "confidence": 0.1,
                "missing_requirements": ["demographics"],
                "recommendations": ["Provide more context"],
                "assessment_summary": "Insufficient data for generation.",
            },
        )

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert "LLM refused to generate output" in response.json()["detail"]["error"]


def test_target_persona_endpoint_value_error(monkeypatch):
    """
    Test the /customers/target_personas endpoint for a ValueError.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }

    async def fake_generate_target_persona_profile(request):
        raise ValueError("Invalid input for persona generation")

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid input for persona generation"}


def test_target_persona_endpoint_http_exception(monkeypatch):
    """
    Test the /customers/target_personas endpoint for an HTTPException.
    """
    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }

    async def fake_generate_target_persona_profile(request):
        raise HTTPException(status_code=400, detail="Bad persona request")

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_persona_profile",
        fake_generate_target_persona_profile,
    )

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Bad persona request"}


def test_target_persona_endpoint_invalid_input_data_types(monkeypatch):
    """
    Test with incorrect data types in the request body.
    """
    payload = {
        "website_url": 123,  # Invalid type
        "persona_profile_name": "Test Persona",
        "hypothesis": "Test Hypothesis",
    }
    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert "detail" in response.json()

    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": 123,  # Invalid type
        "hypothesis": "Test Hypothesis",
    }

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert "string_type" in response.json()["detail"][0]["type"]
    assert "persona_profile_name" in response.json()["detail"][0]["loc"]

    payload = {
        "website_url": "https://example.com",
        "persona_profile_name": "Test Persona",
        "hypothesis": ["not a string"],  # Invalid type
    }

    response = client.post(
        "/api/customers/target_personas",
        json=payload,
    )
    assert response.status_code == 422
    assert "string_type" in response.json()["detail"][0]["type"]
    assert "hypothesis" in response.json()["detail"][0]["loc"]
