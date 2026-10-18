from fastapi.testclient import TestClient

from app import core
from app.main import app


def setup_function(_):
    core.init_db()
    core.reset_demo()


def test_spa_and_legal_routes_return_200():
    c = TestClient(app)
    routes = [
        "/",
        "/portal",
        "/login",
        "/login/developer",
        "/login/manager",
        "/developer",
        "/dev-portal",
        "/manager",
        "/manager-portal",
        "/privacy-policy",
        "/terms-and-conditions",
        "/cookie-policy",
    ]
    for r in routes:
        resp = c.get(r)
        assert resp.status_code == 200, f"Route {r} returned {resp.status_code}"
        assert "ContextPulse AI" in resp.text


def test_favicon_routes():
    c = TestClient(app)
    ico = c.get("/favicon.ico")
    assert ico.status_code == 200
    assert len(ico.content) > 100

    svg = c.get("/favicon.svg")
    assert svg.status_code == 200
    assert "<svg" in svg.text


def test_auth_login_and_role_separation():
    c = TestClient(app)
    # Invalid password
    r_bad = c.post("/api/auth/login", json={"email": "dev@company.com", "password": "wrong", "role": "employee"})
    assert r_bad.status_code == 401

    # Role mismatch (developer trying to log in via manager portal)
    r_mismatch = c.post("/api/auth/login", json={"email": "dev@company.com", "password": "emp123", "role": "manager"})
    assert r_mismatch.status_code == 403

    # Valid developer login
    r_dev = c.post("/api/auth/login", json={"email": "dev@company.com", "password": "emp123", "role": "employee"})
    assert r_dev.status_code == 200
    dev_token = r_dev.json()["token"]
    assert r_dev.json()["role"] == "employee"

    # Session check
    s_dev = c.get("/api/auth/session", headers={"Authorization": f"Bearer {dev_token}"})
    assert s_dev.json()["authenticated"] is True
    assert s_dev.json()["role"] == "employee"

    # Developer cannot call manager endpoints when authenticated as employee
    r_forbid = c.put(
        "/api/team/blockers/CI_FLAKY/action",
        json={"status": "planned"},
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert r_forbid.status_code == 403

    r_forbid_msg = c.post(
        "/api/team/messages",
        json={"text": "test"},
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert r_forbid_msg.status_code == 403

    # Logout clears session
    c.post("/api/auth/logout", headers={"Authorization": f"Bearer {dev_token}"})
    s_after = c.get("/api/auth/session", headers={"Authorization": f"Bearer {dev_token}"})
    assert s_after.json()["authenticated"] is False


def test_manager_login_and_role_separation():
    c = TestClient(app)
    r_mgr = c.post("/api/auth/login", json={"email": "manager@company.com", "password": "admin123", "role": "manager"})
    assert r_mgr.status_code == 200
    mgr_token = r_mgr.json()["token"]

    # Manager can update visible blocker action
    r_ok = c.put(
        "/api/team/blockers/CI_FLAKY/action",
        json={"status": "investigating", "owner": "SRE", "note": "Checking"},
        headers={"Authorization": f"Bearer {mgr_token}"},
    )
    assert r_ok.status_code == 200

    # Manager cannot submit employee survey when authenticated as manager
    r_forbid_survey = c.post(
        "/api/survey",
        json={"developer_ref": "dev_a91f", "reason_id": "ci", "category": "CI_FLAKY"},
        headers={"Authorization": f"Bearer {mgr_token}"},
    )
    assert r_forbid_survey.status_code == 403
