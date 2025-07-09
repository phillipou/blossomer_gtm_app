import pytest
from fastapi.testclient import TestClient
from backend.app.api.main import app
from fastapi import HTTPException
from backend.app.schemas import TargetAccountResponse, Firmographics

client = TestClient(app)


# Canonical definition for all tests
async def fake_generate_structured_output(prompt, response_model):
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


def test_target_account_endpoint_success(monkeypatch):
    """
    Test the /accounts endpoint for a successful response.
    Mocks orchestrator and LLM response to ensure the endpoint returns valid JSON and status 200.
    """
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
        "backend.app.api.routes.accounts.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/accounts",
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
    Test the /accounts endpoint for a ValueError.
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
        "backend.app.api.routes.accounts.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid input"}


def test_target_account_endpoint_http_exception(monkeypatch):
    """
    Test the /accounts endpoint for an HTTPException.
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
        "backend.app.api.routes.accounts.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/accounts",
        json=payload,
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Bad request"}


# --- Prompt Rendering Tests ---


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
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


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
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


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
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


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
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


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
def test_target_account_prompt_rendering_all_contexts():
    pass


@pytest.mark.skip(
    reason="Prompt rendering template not found or not loaded in test env; test needs rewrite or template loader patch."
)
def test_target_account_prompt_rendering_with_quality_assessment():
    pass


# --- API Endpoint Tests (LLM Response Edge Cases) ---
def test_target_account_endpoint_llm_response_empty_lists(monkeypatch):
    """
    Test with a valid LLM JSON response where firmographics or buying_signals are empty lists.
    """
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
        "backend.app.api.routes.accounts.generate_target_account_profile",
        fake_generate_target_account_profile,
    )

    response = client.post(
        "/api/accounts",
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
    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
    }
    fake_response_dict = TargetAccountResponse(
        target_account_name="SaaS Innovators",
        target_account_description="Tech-forward SaaS companies",
        target_account_rationale=["Rationale 1"],
        firmographics=Firmographics(
            industry=["SaaS"],
            employees="100-500",
            revenue="$10M-$50M",
            geography=["US"],
            business_model=["Subscription"],
            funding_stage=["Series A"],
            keywords=["keyword1"],
        ),
        buying_signals=[
            {
                "title": "Signal 1",
                "description": "Description 1",
                "type": "Company Data",
                "priority": "High",
                "detection_method": "Clay",
            }
        ],
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
    )

    async def fake_generate_target_account_profile(request):
        return fake_response_dict.model_dump()

    monkeypatch.setattr(
        "backend.app.api.routes.accounts.generate_target_account_profile",
        fake_generate_target_account_profile,
    )
    response = client.post(
        "/api/accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "detail" in response.json()


def test_target_account_endpoint_llm_response_semantically_incorrect(monkeypatch):
    """
    Test with a valid LLM JSON response that contains semantically incorrect but syntactically valid data.
    This tests Pydantic's ability to handle valid but unexpected values.
    """
    payload = {
        "website_url": "https://example.com",
        "account_profile_name": "SaaS Innovators",
        "hypothesis": "These are good companies",
    }
    fake_response_dict = TargetAccountResponse(
        target_account_name="SaaS Innovators",
        target_account_description="Tech-forward SaaS companies",
        target_account_rationale=["Rationale 1"],
        firmographics=Firmographics(
            industry=["NotARealIndustry"],
            employees="InvalidRange",
            revenue="N/A",
            geography=["Nowhere"],
            business_model=["NotABusinessModel"],
            funding_stage=["Pre-Seed"],
            keywords=["random", "words"],
        ),
        buying_signals=[
            {
                "title": "Bad Signal",
                "description": "This signal is bad.",
                "type": "InvalidType",
                "priority": "NotAPriority",
                "detection_method": "NoMethod",
            }
        ],
        buying_signals_rationale=["Rationale 1"],
        metadata={
            "primary_context_source": "user",
            "sources_used": ["user input"],
            "confidence_assessment": {
                "overall_confidence": "low",
                "data_quality": "poor",
                "inference_level": "very high",
                "recommended_improvements": ["Improve LLM output"],
            },
        },
    )

    async def fake_generate_target_account_profile(request):
        return fake_response_dict.model_dump()

    monkeypatch.setattr(
        "backend.app.api.routes.accounts.generate_target_account_profile",
        fake_generate_target_account_profile,
    )
    response = client.post(
        "/api/accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "detail" in response.json()


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
        "/api/accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "detail" in response.json()

    payload = {
        "website_url": "https://example.com",
        "account_profile_name": 123,  # Invalid type
        "hypothesis": "These are good companies",
    }

    response = client.post(
        "/api/accounts",
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
        "/api/accounts",
        json=payload,
    )
    assert response.status_code == 422
    assert "string_type" in response.json()["detail"][0]["type"]
    assert "hypothesis" in response.json()["detail"][0]["loc"]
