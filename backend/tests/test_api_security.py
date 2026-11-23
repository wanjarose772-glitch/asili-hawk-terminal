from fastapi.testclient import TestClient

from app.main import app, settings


def test_write_routes_are_disabled_without_control_token(monkeypatch):
    monkeypatch.setattr(settings, "hawk_control_token", "")
    client = TestClient(app)
    response = client.post("/api/journal", json={"action": "watch", "address": "mint"})
    assert response.status_code == 503


def test_write_routes_reject_invalid_control_token(monkeypatch):
    monkeypatch.setattr(settings, "hawk_control_token", "configured-test-token")
    client = TestClient(app)
    response = client.post("/api/journal", json={"action": "watch", "address": "mint"})
    assert response.status_code == 401


def test_health_reports_configuration_without_exposing_credentials(monkeypatch):
    monkeypatch.setattr(settings, "helius_api_key", "helius-test-secret")
    monkeypatch.setattr(settings, "hawk_control_token", "control-test-secret")
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["helius_configured"] is True
    assert "helius-test-secret" not in response.text
    assert "control-test-secret" not in response.text
    assert set(body["providers"]) == {"pump", "dex", "gecko"}
