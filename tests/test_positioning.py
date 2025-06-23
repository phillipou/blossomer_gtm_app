from fastapi.testclient import TestClient
from blossomer_gtm_api.main import app

client = TestClient(app)


def test_positioning_endpoint():
    payload = {
        "website_url": "https://example.com",
        "description": "AI-powered marketing automation for SMBs",
        "icp": "B2B SaaS startups",
    }
    response = client.post("/campaigns/positioning", json=payload)
    assert response.status_code == 200
    data = response.json()
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
