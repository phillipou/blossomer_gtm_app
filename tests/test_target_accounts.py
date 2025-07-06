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
