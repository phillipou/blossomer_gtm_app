from fastapi.testclient import TestClient
from backend.app.api.main import app

client = TestClient(app)


def test_positioning_endpoint():
    """
    Test the /campaigns/positioning endpoint for correct response structure and content.
    Ensures the endpoint returns status 200 and the expected fields in the JSON response.
    """
    payload = {
        "website_url": "https://example.com",
        "description": "AI-powered marketing automation for SMBs",
        "icp": "B2B SaaS startups",
    }
    response = client.post("/api/campaigns/positioning", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Check for required fields and types in the response
    assert "unique_insight" in data
    assert isinstance(data["unique_insight"], str)
    assert "unique_selling_points" in data
    assert isinstance(data["unique_selling_points"], list)
    assert len(data["unique_selling_points"]) > 0
    for usp in data["unique_selling_points"]:
        assert "theme" in usp
        assert "description" in usp
        assert "evidence" in usp
        assert isinstance(usp["evidence"], list)
        assert len(usp["evidence"]) > 0
