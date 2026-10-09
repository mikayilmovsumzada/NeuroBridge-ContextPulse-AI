import copy
import os

os.environ["DB_PATH"] = ":memory:"
os.environ.pop("GEMINI_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402

from app import core  # noqa: E402
from app.ai_engine import fallback_text, validate  # noqa: E402
from app.main import app  # noqa: E402


def setup_function(_):
    core.init_db()
    core.reset_demo()


def test_seed_k_anonymity():
    t = core.team_payload()
    shown = [b["category"] for b in t["blockers"] if not b["suppressed"]]
    assert shown == ["PR_REVIEW_WAIT", "CI_FLAKY", "MEETING_LOAD", "UNCLEAR_REQUIREMENTS"]
    assert t["suppressed_groups"] == 1
    assert all("developer_ref" not in b for b in t["blockers"])


def test_group_appears_at_k():
    for i in range(3):
        core.add_survey(f"x_{i}", "tool", "TOOLING")  # 2 -> 5
    t = core.team_payload()
    assert "TOOLING" in [b.get("category") for b in t["blockers"]]
    assert t["suppressed_groups"] == 0


def test_visible_count_increases_live():
    before = {b["category"]: b["affected_count"] for b in core.team_payload()["blockers"] if not b["suppressed"]}
    core.add_survey("x_9", "ci", "CI_FLAKY")
    after = {b["category"]: b["affected_count"] for b in core.team_payload()["blockers"] if not b["suppressed"]}
    assert after["CI_FLAKY"] == before["CI_FLAKY"] + 1


def test_event_rejects_privacy_violation_and_unknown_fields():
    c = TestClient(app)
    ev = copy.deepcopy(core.BASE_EVENT)
    assert c.post("/api/events", json=ev).status_code == 202
    bad = copy.deepcopy(ev)
    bad["privacy"]["source_code_content"] = True
    assert c.post("/api/events", json=bad).status_code == 422
    extra = copy.deepcopy(ev)
    extra["source_code"] = "const a = 1"
    assert c.post("/api/events", json=extra).status_code == 422


def test_survey_and_team_endpoints():
    c = TestClient(app)
    assert c.post("/api/survey", json={"developer_ref": "dev_zzz", "reason_id": "ci", "category": "CI_FLAKY"}).status_code == 201
    assert c.post("/api/survey", json={"developer_ref": "dev_zzz", "reason_id": "x", "category": "HACK"}).status_code == 422
    assert c.get("/api/team/blockers").json()["population"]["respondents"] == 27


def test_reminder_fallback_is_valid():
    c = TestClient(app)
    r = c.post("/api/reminder", json={"developer_ref": "dev_a91f"}).json()
    assert r["source"] == "fallback" and "`processRefund`" in r["text"]
    ok, _ = validate(fallback_text(core.BASE_EVENT), core.BASE_EVENT)
    assert ok


def test_validator_rejects_hallucination():
    ev = core.BASE_EVENT
    assert not validate("Funksiya `refundAll` dəyişib.", ev)[0]
    assert not validate("Sətir 5-də `TS9999` xətası var.", ev)[0]
    assert not validate("PR #999 baxılmalıdır.", ev)[0]


def test_reminder_language():
    c = TestClient(app)
    en = c.post("/api/reminder", json={"developer_ref": "dev_a91f", "lang": "en"}).json()
    az = c.post("/api/reminder", json={"developer_ref": "dev_a91f", "lang": "az"}).json()
    assert "Nearest next step" in en["text"] and "Ən yaxın addım" in az["text"]
    assert validate(en["text"], core.BASE_EVENT)[0]
