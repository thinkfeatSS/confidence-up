import pytest
from fastapi.testclient import TestClient
from app.main import app

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
    response = client.get("/api/v1/progress/timeline")
    assert response.status_code == 200
    data = response.json()
    assert "timeline" in data
