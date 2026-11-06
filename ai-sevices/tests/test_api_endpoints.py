import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["confidence_engine_version"] == "1.0"


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "whisper" in data["services"]


def test_progress_timeline_empty():
    token = create_access_token({"sub": "test-user-001", "role": "USER"})
    response = client.get("/api/v1/progress/timeline", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "timeline" in data


def test_auth_unauthorized_endpoints():
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_public_announcements():
    response = client.get("/api/v1/announcements/active")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


