import asyncio

from fastapi.testclient import TestClient

from app import core, main
from app.main import app


def setup_function(_):
    core.init_db()
    core.reset_demo()


def _blocker(client, cat):
    for b in client.get("/api/team/blockers").json()["blockers"]:
        if b.get("category") == cat:
            return b
    return None


def test_action_on_visible_group_is_saved_and_shown():
    c = TestClient(app)
    r = c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "planned", "note": "Flaky testləri karantinə alırıq", "owner": "DevOps"})
    assert r.status_code == 200
    a = _blocker(c, "CI_FLAKY")["action"]
    assert a["status"] == "planned" and a["owner"] == "DevOps" and "karantin" in a["note"]
    # yenidən yazmaq (update) olur
    c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "resolved"})
    assert _blocker(c, "CI_FLAKY")["action"]["status"] == "resolved"
    assert _blocker(c, "PR_REVIEW_WAIT")["action"] is None


def test_action_on_hidden_group_is_rejected():
    c = TestClient(app)
    assert _blocker(c, "TOOLING") is None  # n=2 < K, gizlidir
    r = c.put("/api/team/blockers/TOOLING/action", json={"status": "investigating"})
    assert r.status_code == 409
    for i in range(3):  # 2 -> 5: görünən olur
        core.add_survey(f"x_{i}", "tool", "TOOLING")
    assert c.put("/api/team/blockers/TOOLING/action", json={"status": "investigating"}).status_code == 200


def test_action_validation():
    c = TestClient(app)
    assert c.put("/api/team/blockers/NOPE/action", json={"status": "planned"}).status_code == 404
    assert c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "fired"}).status_code == 422
    assert c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "planned", "developer_ref": "dev_a91f"}).status_code == 422
    assert c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "planned", "note": "x" * 201}).status_code == 422


def test_team_message_flow():
    c = TestClient(app)
    r = c.post("/api/team/messages", json={"text": "  PR review üçün 24 saatlıq qayda  ", "category": "PR_REVIEW_WAIT"})
    assert r.status_code == 201 and r.json()["text"] == "PR review üçün 24 saatlıq qayda"
    assert c.get("/api/announcements").json()[0]["category"] == "PR_REVIEW_WAIT"
    assert c.get("/api/bootstrap").json()["announcements"][0]["id"] == r.json()["id"]
    assert c.post("/api/team/messages", json={"text": "Ümumi elan"}).status_code == 201


def test_team_message_validation():
    c = TestClient(app)
    assert c.post("/api/team/messages", json={"text": "   "}).status_code == 422
    assert c.post("/api/team/messages", json={"text": "x" * 281}).status_code == 422
    assert c.post("/api/team/messages", json={"text": "salam", "category": "TOOLING"}).status_code == 409  # gizli qrup


def test_reset_clears_actions_and_messages():
    c = TestClient(app)
    c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "planned"})
    c.post("/api/team/messages", json={"text": "salam"})
    c.post("/api/demo/reset")
    assert _blocker(c, "CI_FLAKY")["action"] is None
    assert c.get("/api/announcements").json() == []


def test_changes_are_published_live():
    c = TestClient(app)
    q = asyncio.Queue()
    main.subscribers.add(q)
    try:
        c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "investigating"})
        assert q.get_nowait().startswith("event: team")
        c.post("/api/team/messages", json={"text": "salam"})
        assert q.get_nowait().startswith("event: announcement")
    finally:
        main.subscribers.discard(q)
