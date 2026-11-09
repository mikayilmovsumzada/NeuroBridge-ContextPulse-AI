"""İctimai demo üçün qoruma testləri: demo rejimi, sorğu limiti, AI xərc nəzarəti, təhlükəsizlik başlıqları."""
import asyncio
import re
import threading
import time
import types as _t
from pathlib import Path

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import ai_engine, core, demo, main, ratelimit, security
from app.main import app

ROOT = Path(__file__).resolve().parent.parent
ANN = demo.ANNOUNCEMENTS[0]
NOTE, OWNER = demo.NOTES[0], demo.OWNERS[0]


@pytest.fixture(autouse=True)
def _fresh_state():
    core.init_db()
    core.reset_demo()
    main._reminder_cache.clear()
    main._reminder_locks.clear()
    ratelimit.limiter.clear()
    ai_engine.reset_budget()
    yield
    ratelimit.limiter.clear()
    ai_engine.reset_budget()


def _login(role, **kw):
    c = TestClient(app, **kw)
    creds = {"employee": ("dev@company.com", "emp123"), "manager": ("manager@company.com", "admin123")}[role]
    r = c.post("/api/auth/login", json={"email": creds[0], "password": creds[1], "role": role})
    assert r.status_code == 200, r.text
    c.headers["Authorization"] = "Bearer " + r.json()["token"]
    return c


# ---------------- 1. Demo rejimi: yalnız şablonlar, avtomatik sıfırlama ----------------

def test_demo_mode_off_by_default_keeps_free_text():
    assert TestClient(app).get("/api/bootstrap").json()["demo"] == {"enabled": False}
    assert _login("manager").post("/api/team/messages", json={"text": "istənilən mətn"}).status_code == 201


def test_demo_mode_exposes_templates_in_bootstrap(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    monkeypatch.setenv("DEMO_RESET_MINUTES", "20")
    d = TestClient(app).get("/api/bootstrap").json()["demo"]
    assert d["enabled"] and d["reset_minutes"] == 20
    assert d["announcements"] and d["notes"] and d["owners"]
    assert all(set(x) == {"az", "en"} for x in d["announcements"] + d["notes"] + d["owners"])


def test_demo_mode_rejects_free_text_announcements(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    c = _login("manager")
    assert c.post("/api/team/messages", json={"text": "Mənim reklamım: example.com"}).status_code == 422
    assert c.post("/api/team/messages", json={"text": ANN["az"]}).status_code == 201
    assert c.post("/api/team/messages", json={"text": "  " + ANN["en"] + "  ", "category": "CI_FLAKY"}).status_code == 201
    assert [m["text"] for m in c.get("/api/announcements").json()] == [ANN["en"], ANN["az"]]


def test_demo_mode_rejects_free_text_action_notes(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    c = _login("manager")
    url = "/api/team/blockers/CI_FLAKY/action"
    assert c.put(url, json={"status": "planned", "note": "sərbəst mətn"}).status_code == 422
    assert c.put(url, json={"status": "planned", "owner": "Hər hansı ad"}).status_code == 422
    assert c.put(url, json={"status": "planned"}).status_code == 200  # boş qeyd olar
    assert c.put(url, json={"status": "resolved", "note": NOTE["en"], "owner": OWNER["az"]}).status_code == 200
    action = next(b for b in c.get("/api/team/blockers").json()["blockers"] if b.get("category") == "CI_FLAKY")["action"]
    assert action["note"] == NOTE["en"] and action["owner"] == OWNER["az"]


def test_reset_minutes_only_in_demo_mode(monkeypatch):
    monkeypatch.setenv("DEMO_RESET_MINUTES", "15")
    monkeypatch.setenv("DEMO_MODE", "0")
    assert demo.reset_minutes() == 0
    monkeypatch.setenv("DEMO_MODE", "1")
    assert demo.reset_minutes() == 15
    monkeypatch.delenv("DEMO_RESET_MINUTES")
    assert demo.reset_minutes() == 30


def test_auto_reset_loop_restores_seed_state(monkeypatch):
    c = _login("manager")
    c.post("/api/team/messages", json={"text": "salam"})
    c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "planned"})
    main._reminder_cache[("evt", "az")] = ({"source": "gemini"}, None)
    sleeps = []

    async def fake_sleep(sec):
        sleeps.append(sec)
        if len(sleeps) > 1:
            raise asyncio.CancelledError

    monkeypatch.setattr(main.asyncio, "sleep", fake_sleep)
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(main._auto_reset_loop(7))
    assert sleeps == [420, 420]
    assert core.latest_messages() == [] and core.get_actions() == {} and main._reminder_cache == {}


def test_lifespan_starts_and_stops_reset_task(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    monkeypatch.setenv("DEMO_RESET_MINUTES", "1")
    with TestClient(app) as c:
        assert c.get("/api/health").status_code == 200


# ---------------- 2. IP üzrə sorğu limiti ----------------

@pytest.fixture
def limits_on(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "1")
    monkeypatch.delenv("TRUSTED_PROXY", raising=False)
    return monkeypatch


def _login_status(headers=None):
    return TestClient(app).post("/api/auth/login", headers=headers or {},
                                json={"email": "x@y.z", "password": "bad", "role": "manager"}).status_code


def test_login_is_rate_limited_with_retry_after(limits_on):
    limits_on.setenv("RATE_LIMIT_LOGIN", "3/60")
    assert [_login_status() for _ in range(3)] == [401, 401, 401]
    r = TestClient(app).post("/api/auth/login", json={"email": "x@y.z", "password": "bad"})
    assert r.status_code == 429 and int(r.headers["Retry-After"]) >= 1


def test_forwarded_for_is_ignored_without_trusted_proxy(limits_on):
    limits_on.setenv("RATE_LIMIT_LOGIN", "2/60")
    assert _login_status({"X-Forwarded-For": "1.1.1.1"}) == 401
    assert _login_status({"X-Forwarded-For": "2.2.2.2"}) == 401
    assert _login_status({"X-Forwarded-For": "3.3.3.3"}) == 429  # başlığı dəyişmək limiti keçmir


def test_trusted_proxy_uses_rightmost_forwarded_address(limits_on):
    limits_on.setenv("RATE_LIMIT_LOGIN", "1/60")
    limits_on.setenv("TRUSTED_PROXY", "1")
    assert _login_status({"X-Forwarded-For": "9.9.9.9"}) == 401
    assert _login_status({"X-Forwarded-For": "9.9.9.9"}) == 429
    assert _login_status({"X-Forwarded-For": "8.8.8.8"}) == 401  # başqa müştəri, ayrıca limit
    # müştərinin özünün yazdığı sol element nəzərə alınmır, proxy-nin əlavə etdiyi son element sayılır
    assert _login_status({"X-Forwarded-For": "7.7.7.7, 9.9.9.9"}) == 429


def test_trusted_proxy_hop_count(limits_on):
    limits_on.setenv("TRUSTED_PROXY", "2")
    req = _t.SimpleNamespace(headers={"x-forwarded-for": "spoof, 5.5.5.5, 10.0.0.2"}, client=_t.SimpleNamespace(host="10.0.0.3"))
    assert ratelimit.client_ip(req) == "5.5.5.5"
    limits_on.setenv("TRUSTED_PROXY", "0")
    assert ratelimit.client_ip(req) == "10.0.0.3"


@pytest.mark.parametrize("bucket,call", [
    ("reminder", lambda c: c.post("/api/reminder", json={"lang": "en"})),
    ("survey", lambda c: c.post("/api/survey", json={"reason_id": "ci", "category": "CI_FLAKY"})),
])
def test_employee_endpoints_are_rate_limited(limits_on, bucket, call):
    limits_on.setenv("RATE_LIMIT_" + bucket.upper(), "2/60")
    c = _login("employee")
    assert call(c).status_code < 400 and call(c).status_code < 400
    assert call(c).status_code == 429


@pytest.mark.parametrize("bucket,call", [
    ("messages", lambda c: c.post("/api/team/messages", json={"text": "salam"})),
    ("action", lambda c: c.put("/api/team/blockers/CI_FLAKY/action", json={"status": "planned"})),
    ("reset", lambda c: c.post("/api/demo/reset")),
])
def test_manager_endpoints_are_rate_limited(limits_on, bucket, call):
    limits_on.setenv("RATE_LIMIT_" + bucket.upper(), "1/60")
    c = _login("manager")
    assert call(c).status_code < 400
    assert call(c).status_code == 429


def test_stream_open_rate_is_limited(limits_on):
    limits_on.setenv("RATE_LIMIT_STREAM", "1/60")
    ratelimit.limiter.hit(("stream", "testclient"), 1, 60)  # bir bağlantı artıq açılıb
    r = TestClient(app).get("/api/stream")
    assert r.status_code == 429


def test_stream_concurrent_connections_per_ip(limits_on):
    limits_on.setenv("MAX_SSE_PER_IP", "2")
    held = [asyncio.Queue(), asyncio.Queue()]
    for q in held:
        main.subscribers[q] = None
        main._subscriber_ip[q] = "testclient"
    try:
        assert TestClient(app).get("/api/stream").status_code == 429
    finally:
        for q in held:
            main.subscribers.pop(q, None)
            main._subscriber_ip.pop(q, None)


def test_rate_limit_can_be_disabled(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "0")
    monkeypatch.setenv("RATE_LIMIT_LOGIN", "1/60")
    assert [_login_status() for _ in range(3)] == [401, 401, 401]


def test_rate_limit_rule_parsing(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_LOGIN", "5/30")
    assert ratelimit.rule("login") == (5, 30)
    monkeypatch.setenv("RATE_LIMIT_LOGIN", "abc")
    assert ratelimit.rule("login") == ratelimit.DEFAULTS["login"]


def test_sliding_window_expires():
    w = ratelimit.SlidingWindow()
    assert w.hit("k", 1, 10, now=100.0)[0]
    assert not w.hit("k", 1, 10, now=105.0)[0]
    assert w.hit("k", 1, 10, now=111.0)[0]


# ---------------- 3. AI xərc nəzarəti ----------------

def _counting_reminder(monkeypatch, source="fallback", delay=0.0):
    calls = []

    def fake(ev, lang):
        calls.append(lang)
        time.sleep(delay)
        return {"text": "x", "source": source, "code": "error" if source == "fallback" else source,
                "validated": True, "badge": "b", "reason": ""}

    monkeypatch.setattr(main, "generate_reminder", fake)
    return calls


def test_failed_ai_answer_is_cached_for_cooldown(monkeypatch):
    calls = _counting_reminder(monkeypatch)
    c = _login("employee")
    for _ in range(3):
        assert c.post("/api/reminder", json={"lang": "az"}).json()["code"] == "error"
    assert calls == ["az"]
    # gözləmə müddəti bitəndə yenidən cəhd edilir
    key = next(iter(main._reminder_cache))
    res, _ = main._reminder_cache[key]
    main._reminder_cache[key] = (res, time.monotonic() - 1)
    c.post("/api/reminder", json={"lang": "az"})
    assert calls == ["az", "az"]


def test_cooldown_zero_disables_negative_cache(monkeypatch):
    monkeypatch.setenv("AI_FAILURE_COOLDOWN_SEC", "0")
    calls = _counting_reminder(monkeypatch)
    c = _login("employee")
    c.post("/api/reminder", json={"lang": "en"})
    c.post("/api/reminder", json={"lang": "en"})
    assert calls == ["en", "en"]


def test_successful_ai_answer_is_cached_permanently(monkeypatch):
    calls = _counting_reminder(monkeypatch, source="gemini")
    c = _login("employee")
    c.post("/api/reminder", json={"lang": "en"})
    c.post("/api/reminder", json={"lang": "en"})
    assert calls == ["en"] and main._reminder_cache[("evt_8f31c2a7", "en")][1] is None


def test_concurrent_identical_requests_call_ai_once(monkeypatch):
    calls = _counting_reminder(monkeypatch, source="gemini", delay=0.3)
    token = _login("employee").headers["Authorization"]

    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://t", headers={"Authorization": token}) as ac:
            return await asyncio.gather(*[ac.post("/api/reminder", json={"lang": "az"}) for _ in range(4)])

    rs = asyncio.run(run())
    assert [r.status_code for r in rs] == [200] * 4
    assert calls == ["az"]


def _fake_genai(monkeypatch, fail=True):
    import google.genai as genai
    calls = []

    class FakeModels:
        def generate_content(self, model, contents, config):
            calls.append(model)
            if fail:
                raise RuntimeError("429 RESOURCE_EXHAUSTED")
            return _t.SimpleNamespace(text="Sonuncu dəfə `processRefund` funksiyasını dəyişirdin.")

    class FakeClient:
        def __init__(self, **kw):
            self.models = FakeModels()

    monkeypatch.setattr(genai, "Client", FakeClient)
    return calls


def test_daily_ai_limit_counts_every_model_attempt(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.setenv("GEMINI_MODEL", "m1,m2,m3")
    monkeypatch.setenv("AI_DAILY_LIMIT", "2")
    calls = _fake_genai(monkeypatch, fail=True)
    res = ai_engine.generate_reminder(core.BASE_EVENT, "az")
    assert calls == ["m1", "m2"] and res["code"] == "daily_limit" and res["source"] == "fallback"
    res = ai_engine.generate_reminder(core.BASE_EVENT, "en")
    assert calls == ["m1", "m2"] and res["code"] == "daily_limit" and "`processRefund`" in res["text"]
    assert ai_engine.budget_remaining() == 0


def test_daily_ai_limit_zero_never_calls_provider(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.setenv("AI_DAILY_LIMIT", "0")
    calls = _fake_genai(monkeypatch, fail=False)
    assert ai_engine.generate_reminder(core.BASE_EVENT, "az")["code"] == "daily_limit"
    assert calls == []


def test_daily_ai_limit_resets_next_day(monkeypatch):
    monkeypatch.setenv("AI_DAILY_LIMIT", "1")
    assert ai_engine.take_budget() and not ai_engine.take_budget()
    monkeypatch.setattr(ai_engine, "_today", lambda: "2999-01-01")
    assert ai_engine.take_budget()


def test_api_keys_never_reach_the_browser(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-secret-value-123")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "anthropic-secret-value-456")
    monkeypatch.setenv("DEMO_MODE", "1")
    c = _login("employee")
    bodies = [c.get(p).text for p in ("/", "/app.js", "/api/bootstrap", "/api/health", "/api/team/blockers")]
    assert not any("secret-value" in b for b in bodies)
    for f in (ROOT / "static").rglob("*"):
        if f.suffix in {".js", ".html", ".css", ".json"}:
            text = f.read_text(encoding="utf-8", errors="ignore")
            assert "GEMINI_API_KEY" not in text and "ANTHROPIC_API_KEY" not in text, f


# ---------------- 4. İstehsal konfiqurasiyası ----------------

def test_security_headers_on_pages_and_api():
    c = TestClient(app)
    for path in ("/", "/manager", "/api/health"):
        h = c.get(path).headers
        csp = h["content-security-policy"]
        assert "frame-ancestors 'none'" in csp and "default-src 'self'" in csp and "object-src 'none'" in csp
        assert h["x-content-type-options"] == "nosniff"
        assert h["referrer-policy"] == "strict-origin-when-cross-origin"
        assert h["x-frame-options"] == "DENY"
        assert "strict-transport-security" not in h
    assert c.get("/api/health").headers["cache-control"] == "no-store"


def test_csp_allows_every_external_script_in_index():
    html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
    script_src = next(d for d in security.content_security_policy().split("; ") if d.startswith("script-src"))
    hosts = set(re.findall(r'<script[^>]+src="(https://[^/"]+)', html))
    assert hosts and all(h in script_src.split() for h in hosts), hosts
    assert not re.search(r'<link[^>]+href="https?://', html)  # xarici CSS yoxdur (style-src 'self')


def test_custom_frame_ancestors_and_hsts(monkeypatch):
    monkeypatch.setenv("CSP_FRAME_ANCESTORS", "https://nexusweb.az")
    monkeypatch.setenv("HSTS_MAX_AGE", "31536000")
    h = TestClient(app).get("/").headers
    assert "frame-ancestors https://nexusweb.az" in h["content-security-policy"]
    assert "x-frame-options" not in h
    assert h["strict-transport-security"].startswith("max-age=31536000")


def test_security_headers_can_be_disabled(monkeypatch):
    monkeypatch.setenv("SECURITY_HEADERS", "0")
    assert "content-security-policy" not in TestClient(app).get("/").headers


def test_docs_enabled_by_default_and_can_be_disabled(monkeypatch):
    c = TestClient(app)
    assert c.get("/docs").status_code == 200 and c.get("/openapi.json").status_code == 200
    monkeypatch.setenv("DISABLE_DOCS", "1")
    kw = security.docs_kwargs()
    assert kw == {"docs_url": None, "redoc_url": None, "openapi_url": None}
    bare = TestClient(FastAPI(**kw))
    assert bare.get("/docs").status_code == 404 and bare.get("/openapi.json").status_code == 404


# ---------------- 5-6. CDN versiyaları və sənədləşmə ----------------

def test_cdn_scripts_are_pinned_to_exact_versions():
    html = (ROOT / "static" / "index.html").read_text(encoding="utf-8")
    srcs = re.findall(r'<script[^>]+src="(https://[^"]+)"', html)
    assert len(srcs) == 4, srcs
    for s in srcs:
        assert re.search(r"[@/]\d+\.\d+\.\d+(/|$)", s), f"versiya dəqiq deyil: {s}"
    assert any("react@18." in s for s in srcs) and any("react-dom@18." in s for s in srcs)


def test_env_example_and_readme_document_new_variables():
    names = ["DEMO_MODE", "DEMO_RESET_MINUTES", "RATE_LIMIT_ENABLED", "RATE_LIMIT_LOGIN", "RATE_LIMIT_REMINDER",
             "RATE_LIMIT_SURVEY", "RATE_LIMIT_MESSAGES", "RATE_LIMIT_ACTION", "RATE_LIMIT_STREAM", "RATE_LIMIT_RESET",
             "TRUSTED_PROXY", "MAX_SSE_PER_IP", "MAX_SSE_SUBSCRIBERS", "AI_DAILY_LIMIT", "AI_FAILURE_COOLDOWN_SEC",
             "DISABLE_DOCS", "SECURITY_HEADERS", "CSP_FRAME_ANCESTORS", "HSTS_MAX_AGE"]
    env = (ROOT / ".env.example").read_text(encoding="utf-8")
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for n in names:
        assert n in env, f".env.example: {n}"
        assert f"`{n}`" in readme, f"README: {n}"
