import pytest
from fastapi.testclient import TestClient
from backend.app.api.main import app
from backend.app.core.auth import rate_limit_dependency, authenticate_api_key
from fastapi import HTTPException

client = TestClient(app)


# Canonical definition for all tests
async def fake_generate_structured_output(prompt, response_model):
    from backend.app.schemas import TargetAccountResponse

    return TargetAccountResponse(
        target_account_name="SaaS Innovators",
        target_account_description="Tech-forward SaaS companies",
        target_account_rationale=["Rationale 1", "Rationale 2"],
        firmographics={
            "industry": ["SaaS", "Tech"],
            "employees": "100-500",
            "revenue": "$10M-$50M",
            "geography": ["US", "EU"],
            "business_model": ["Subscription"],
            "funding_stage": ["Series A"],
            "keywords": ["keyword1", "keyword2"],
        },
        buying_signals=[
            {
                "title": "Signal 1",
                "description": "Description 1",
                "type": "Company Data",
                "priority": "High",
                "detection_method": "Clay",
            }
        ],
        buying_signals_rationale=["Rationale 1", "Rationale 2"],
        metadata={
            "primary_context_source": "user",
            "sources_used": [
                "user input",
                "company context",
            ],
            "confidence_assessment": {
                "overall_confidence": "high",
                "data_quality": "high",
                "inference_level": "minimal",
                "recommended_improvements": ["improvement 1"],
            },
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


def test_target_account_endpoint_success(monkeypatch):
    """
    Test the /customers/target_accounts endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
    from backend.app.schemas import TargetAccountResponse

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
        "additional_context": "More context here",
    }
    fake_response = TargetAccountResponse(
        target_account_name="SaaS Innovators",
        target_account_description="Tech-forward SaaS companies",
        target_account_rationale=["Rationale 1", "Rationale 2"],
        firmographics={
            "industry": ["SaaS", "Tech"],
            "employees": "100-500",
            "revenue": "$10M-$50M",
            "geography": ["US", "EU"],
            "business_model": ["Subscription"],
            "funding_stage": ["Series A"],
            "keywords": ["keyword1", "keyword2"],
        },
        buying_signals=[
            {
                "title": "Signal 1",
                "description": "Description 1",
                "type": "Company Data",
                "priority": "High",
                "detection_method": "Clay",
            }
        ],
        buying_signals_rationale=["Rationale 1", "Rationale 2"],
        metadata={
            "primary_context_source": "user",
            "sources_used": [
                "user input",
                "company context",
            ],
            "confidence_assessment": {
                "overall_confidence": "high",
                "data_quality": "high",
                "inference_level": "minimal",
                "recommended_improvements": ["improvement 1"],
            },
        },
    ).model_dump()

    async def fake_generate_target_account_profile(request):
        return fake_response

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert "target_account_name" in data
    assert "target_account_description" in data
    assert "firmographics" in data
    assert "buying_signals" in data
    assert "buying_signals_rationale" in data
    assert "metadata" in data
    assert data["metadata"]["sources_used"] == [
        "user input",
        "company context",
    ]


from backend.app.prompts.models import TargetAccountPromptVars
from backend.app.prompts.registry import render_prompt


def test_target_account_endpoint_value_error(monkeypatch):
    """
    Test the /customers/target_accounts endpoint for a ValueError.
    """

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
        "additional_context": "More context here",
    }

    async def fake_generate_target_account_profile(request):
        raise ValueError("Invalid input")

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid input"}


def test_target_account_endpoint_http_exception(monkeypatch):
    """
    Test the /customers/target_accounts endpoint for an HTTPException.
    """

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
        "additional_context": "More context here",
    }

    async def fake_generate_target_account_profile(request):
        raise HTTPException(status_code=400, detail="Bad request")

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Bad request"}


# --- Prompt Rendering Tests ---


def test_target_account_prompt_rendering_only_website_url():
    """
    Test rendering when only website_url is provided.
    """
    vars = TargetAccountPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        account_profile_name="Test Account",
        hypothesis="Test Hypothesis",
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "Test Account" in prompt
    assert "Test Hypothesis" in prompt
    assert "Additional Context:" not in prompt
    assert "Company Context:" not in prompt


def test_target_account_prompt_rendering_with_user_context():
    """
    Test rendering with website_url and user_inputted_context.
    """
    vars = TargetAccountPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        account_profile_name="Test Account",
        hypothesis="Test Hypothesis",
        user_inputted_context={"key": "User context here."},
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "User context here." in prompt
    assert "Test Account" in prompt
    assert "Test Hypothesis" in prompt
    assert "Company Context:" not in prompt


def test_target_account_prompt_rendering_with_company_context():
    """
    Test rendering with website_url and company_context.
    """
    vars = TargetAccountPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        account_profile_name="Test Account",
        hypothesis="Test Hypothesis",
        company_context={"key": "Company context here."},
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "Company context here." in prompt
    assert "Test Account" in prompt
    assert "Test Hypothesis" in prompt
    assert "Additional Context:" not in prompt


def test_target_account_prompt_rendering_with_target_account_context():
    """
    Test rendering with website_url and target_account_context.
    """
    vars = TargetAccountPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        account_profile_name="Test Account",
        hypothesis="Test Hypothesis",
        target_account_context={"key": "Target account context here."},
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "Target account context here." in prompt
    assert "Test Account" in prompt
    assert "Test Hypothesis" in prompt
    assert "Additional Context:" not in prompt


def test_target_account_prompt_rendering_all_contexts():
    """
    Test rendering with all available contexts.
    """
    vars = TargetAccountPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        account_profile_name="Test Account",
        hypothesis="Test Hypothesis",
        user_inputted_context={"key": "User context here."},
        company_context={"key": "Company context here."},
        target_account_context={"key": "Target account context here."},
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "User context here." in prompt
    assert "Company context here." in prompt
    assert "Target account context here." in prompt
    assert "Test Account" in prompt
    assert "Test Hypothesis" in prompt


def test_target_account_prompt_rendering_with_quality_assessment():
    """
    Test rendering when context_quality and assessment_summary are passed.
    """
    vars = TargetAccountPromptVars(
        website_url="https://example.com",
        website_content="Website content here.",
        account_profile_name="Test Account",
        hypothesis="Test Hypothesis",
        context_quality="high",
        assessment_summary="Summary of assessment.",
    )
    prompt = render_prompt("target_account", vars)
    assert "Website content here." in prompt
    assert "Test Account" in prompt
    assert "Test Hypothesis" in prompt
    # These fields are part of the metadata in the output schema, not directly rendered in the prompt.
    # So, we don't assert their presence in the prompt string.
    assert "high" not in prompt
    assert "Summary of assessment." not in prompt


# --- API Endpoint Tests (LLM Response Edge Cases) ---
def test_target_account_endpoint_llm_response_empty_lists(monkeypatch):
    """
    Test with a valid LLM JSON response where firmographics or buying_signals are empty lists.
    """
    from backend.app.schemas import TargetAccountResponse

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
    }
    fake_response = TargetAccountResponse(
        target_account_name="SaaS Innovators",
        target_account_description="Tech-forward SaaS companies",
        target_account_rationale=["Rationale 1"],
        firmographics={
            "industry": [],
            "employees": "",
            "revenue": "",
            "geography": [],
            "business_model": [],
            "funding_stage": [],
            "keywords": [],
        },
        buying_signals=[],
        buying_signals_rationale=["Rationale 1"],
        metadata={
            "primary_context_source": "user",
            "sources_used": ["user input"],
            "confidence_assessment": {
                "overall_confidence": "high",
                "data_quality": "high",
                "inference_level": "minimal",
                "recommended_improvements": [],
            },
        },
    ).model_dump()

    async def fake_generate_target_account_profile(request):
        return fake_response

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["firmographics"]["industry"] == []
    assert data["buying_signals"] == []


def test_target_account_endpoint_llm_response_missing_optional_fields(monkeypatch):
    """
    Test with a valid LLM JSON response that omits optional fields (e.g., metadata).
    """
    from backend.app.schemas import TargetAccountResponse

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
    }
    # Create a response dict that intentionally omits 'metadata'
    fake_response_dict = {
        "target_account_name": "SaaS Innovators",
        "target_account_description": "Tech-forward SaaS companies",
        "target_account_rationale": ["Rationale 1"],
        "firmographics": {
            "industry": ["SaaS"],
            "employees": "100-500",
            "revenue": "$10M-$50M",
            "geography": ["US"],
            "business_model": ["Subscription"],
            "funding_stage": ["Series A"],
            "keywords": ["keyword1"],
        },
        "buying_signals": [
            {
                "title": "Signal 1",
                "description": "Description 1",
                "type": "Company Data",
                "priority": "High",
                "detection_method": "Clay",
            }
        ],
        "buying_signals_rationale": ["Rationale 1"],
    }

    async def fake_generate_target_account_profile(request):
        # Return a Pydantic model created from the dict to ensure validation
        return TargetAccountResponse(**fake_response_dict).model_dump()

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert (
        "metadata" in data
    )  # Pydantic will add default empty metadata if not provided
    assert data["metadata"] == {
        "primary_context_source": None,
        "sources_used": [],
        "confidence_assessment": {
            "overall_confidence": None,
            "data_quality": None,
            "inference_level": None,
            "recommended_improvements": [],
        },
        "processing_notes": None,
    }


def test_target_account_endpoint_llm_response_semantically_incorrect(monkeypatch):
    """
    Test with a valid LLM JSON response that contains semantically incorrect but syntactically valid data.
    This tests Pydantic's ability to handle valid but unexpected values.
    """
    from backend.app.schemas import TargetAccountResponse

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
    }
    fake_response = TargetAccountResponse(
        target_account_name="SaaS Innovators",
        target_account_description="Tech-forward SaaS companies",
        target_account_rationale=["Rationale 1"],
        firmographics={
            "industry": ["NotARealIndustry"],  # Semantically incorrect
            "employees": "InvalidRange",  # Semantically incorrect
            "revenue": "N/A",  # Semantically incorrect
            "geography": ["Nowhere"],  # Semantically incorrect
            "business_model": ["NotABusinessModel"],  # Semantically incorrect
            "funding_stage": ["Pre-Seed"],  # Valid, but might be unexpected
            "keywords": ["random", "words"],
        },
        buying_signals=[
            {
                "title": "Bad Signal",
                "description": "This signal is bad.",
                "type": "InvalidType",  # Semantically incorrect
                "priority": "NotAPriority",  # Semantically incorrect
                "detection_method": "NoMethod",  # Semantically incorrect
            }
        ],
        buying_signals_rationale=["Rationale 1"],
        metadata={
            "primary_context_source": "user",
            "sources_used": ["user input"],
            "confidence_assessment": {
                "overall_confidence": "low",  # Semantically incorrect
                "data_quality": "poor",  # Semantically incorrect
                "inference_level": "very high",  # Semantically incorrect
                "recommended_improvements": ["Improve LLM output"],
            },
        },
    ).model_dump()

    async def fake_generate_target_account_profile(request):
        return fake_response

    monkeypatch.setattr(
        "backend.app.api.routes.customers.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    # Assert that the semantically incorrect values are still present, as Pydantic won't validate content
    assert data["firmographics"]["industry"] == ["NotARealIndustry"]
    assert data["firmographics"]["employees"] == "InvalidRange"
    assert data["buying_signals"][0]["type"] == "InvalidType"
    assert data["metadata"]["confidence_assessment"]["overall_confidence"] == "low"


# --- API Endpoint Tests (Input Validation) ---
def test_target_account_endpoint_invalid_input_data_types(monkeypatch):
    """
    Test with incorrect data types in the request body (e.g., website_url as an integer).
    """
    payload = {
        "website_url": 12345,  # Invalid type
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
    }

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "value_error.url" in response.json()["detail"][0]["type"]
    assert "website_url" in response.json()["detail"][0]["loc"]

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": 123,  # Invalid type
        "hypothesis": "These are good companies",
    }

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "string_type" in response.json()["detail"][0]["type"]
    assert "account_profile_name" in response.json()["detail"][0]["loc"]

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": {"not": "a string"},  # Invalid type
    }

    response = client.post(
        "/api/customers/target_accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "string_type" in response.json()["detail"][0]["type"]
    assert "hypothesis" in response.json()["detail"][0]["loc"]
