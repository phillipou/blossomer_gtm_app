from fastapi.testclient import TestClient
from app.api.main import app

client = TestClient(app)


def test_health_check():
    """
    Test the /health endpoint of the FastAPI app.
    Ensures the endpoint returns status 200 and the expected JSON response.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
