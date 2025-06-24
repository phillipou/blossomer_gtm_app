from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from blossomer_gtm_api.main import app

client = TestClient(app)


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
