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


def test_skill_tree_compatibility_endpoint():
    response = client.get("/api/v1/skill-tree/admin/all")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 0


def test_admin_forbidden_for_regular_user():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    res = client.get("/api/v1/users/admin", headers=headers)
    assert res.status_code == 403


def test_admin_endpoints_authorized():
    admin_token = create_access_token({"sub": "admin-001", "role": "ADMIN"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Users Admin
    res_users = client.get("/api/v1/users/admin?page=1&limit=20", headers=headers)
    assert res_users.status_code == 200
    d_users = res_users.json()
    assert d_users["success"] is True
    assert "data" in d_users["data"]
    assert "total" in d_users["data"]

    # 2. Badges Admin
    res_badges = client.get("/api/v1/badges/admin/all", headers=headers)
    assert res_badges.status_code == 200
    d_badges = res_badges.json()
    assert d_badges["success"] is True
    assert isinstance(d_badges["data"], list)

    # 3. Fears Admin
    res_fears = client.get("/api/v1/fears/admin/all", headers=headers)
    assert res_fears.status_code == 200
    d_fears = res_fears.json()
    assert d_fears["success"] is True
    assert isinstance(d_fears["data"], list)

    # 4. Missions Admin
    res_missions = client.get("/api/v1/missions/admin/all?limit=100", headers=headers)
    assert res_missions.status_code == 200
    d_missions = res_missions.json()
    assert d_missions["success"] is True
    assert isinstance(d_missions["data"], list)

    # 5. Challenges Admin
    res_challenges = client.get("/api/v1/challenges/admin/all?limit=100", headers=headers)
    assert res_challenges.status_code == 200
    d_challenges = res_challenges.json()
    assert d_challenges["success"] is True
    assert isinstance(d_challenges["data"], list)

    # 6. Devices / App Versions Admin
    res_versions = client.get("/api/v1/devices/admin/versions", headers=headers)
    assert res_versions.status_code == 200
    d_versions = res_versions.json()
    assert d_versions["success"] is True
    assert isinstance(d_versions["data"], list)

    # 7. Audit Logs
    res_audit = client.get("/api/v1/audit/logs?page=1&limit=25", headers=headers)
    assert res_audit.status_code == 200
    d_audit = res_audit.json()
    assert d_audit["success"] is True
    assert "items" in d_audit["data"]

    # 8. Admin Dashboard Analytics
    res_dash = client.get("/api/v1/analytics/admin/dashboard", headers=headers)
    assert res_dash.status_code == 200
    d_dash = res_dash.json()
    assert d_dash["success"] is True
    assert "avgConfidenceScore" in d_dash["data"]
    assert "userGrowth" in d_dash["data"]


def test_coach_chat_endpoint():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    payload = {
        "messages": [{"role": "user", "content": "I feel nervous before my presentation."}],
        "context": {"userName": "Alex", "streak": 5, "confidenceScore": 75.0}
    }
    res = client.post("/api/v1/coach/chat", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "reply" in data["data"]
    assert len(data["data"]["reply"]) > 0


def test_cron_daily_mission():
    res = client.post("/api/v1/cron/daily-mission")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True


def test_cron_reset_streaks():
    res = client.post("/api/v1/cron/reset-streaks")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "streaksReset" in data


def test_coach_chat_single_message_format():
    token = create_access_token(data={"sub": "test-user-id", "email": "coach-test2@truefluent.ai", "role": "USER"})
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "message": "Hello Coach Atlas, test single message!"
    }
    res = client.post("/api/v1/coach/chat", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "reply" in data["data"]


def test_user_analytics_summary():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    res = client.get("/api/v1/analytics/me/summary?period=week", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "xpEarned" in data["data"]
    assert "badgesEarned" in data["data"]
    assert "streakDays" in data["data"]


def test_user_analytics_progress():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    res = client.get("/api/v1/analytics/me/progress", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "growthMetrics" in data["data"]
    gm = data["data"]["growthMetrics"]
    # Verify structured growth metrics for mobile and web
    assert "confidence" in gm
    assert "best" in gm["confidence"]
    assert "average" in gm["confidence"]
    assert "growthPercent" in gm["confidence"]
    assert "vocabulary" in gm
    assert "wpm" in gm
    assert "fillers" in gm
    assert "pauses" in gm
    assert "consistency" in gm
    # Verify backward compatible flat fields
    assert "baselineConfidence" in gm
    assert "currentConfidence" in gm
    assert "confidenceTimeline" in data["data"]


def test_feedback_submission_with_feature_area():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    res = client.post("/api/v1/feedback", headers=headers, json={
        "rating": 5,
        "comment": "Amazing speech analysis accuracy!",
        "featureArea": "app"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["rating"] == 5
    assert data["data"]["page"] == "app"


def test_google_mobile_auth_payload():
    import jwt
    mock_id_token = jwt.encode(
        {"email": "mobile_tester@truefluent.ai", "name": "Mobile Tester", "sub": "google-12345"},
        "dummy-secret",
        algorithm="HS256"
    )
    res = client.post("/api/v1/auth/google/mobile", json={
        "idToken": mock_id_token,
        "platform": "ANDROID"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "accessToken" in data["data"]
    assert data["data"]["user"]["email"] == "mobile_tester@truefluent.ai"


def test_speech_session_sync_payload():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    res = client.post("/api/v1/speech/sync-session", headers=headers, json={
        "transcript": "Hello world, testing speech session sync.",
        "topic": "General Speaking",
        "overallConfidenceScore": 85.0,
        "durationSeconds": 30,
        "wordCount": 10,
        "fillerCount": 0,
        "vocabularyRichness": 75.0,
        "averageVolume": 70.0,
        "speechSpeedWpm": 130.0,
        "fluencyScore": 88.0,
        "topicRelevanceScore": 90.0,
        "personalizedSuggestions": ["Keep practicing clear vowel sounds."]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "sessionId" in data


def test_referral_code_retrieval():
    user_token = create_access_token({"sub": "user-001", "role": "USER"})
    headers = {"Authorization": f"Bearer {user_token}"}
    res = client.get("/api/v1/referral/me/code", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "referralCode" in data["data"]




