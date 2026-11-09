import types as _t

from app import ai_engine
from app.core import BASE_EVENT

GOOD = ("Sonuncu dəfə `processRefund` funksiyasını dəyişirdin (`processRefund.ts:48–71`). "
        "Sətir 63-də `TS2345` xətası açıqdır.")


def _fake_genai(monkeypatch, fail_models):
    import google.genai as genai
    calls = []

    class FakeModels:
        def generate_content(self, model, contents, config):
            calls.append(model)
            if model in fail_models:
                raise RuntimeError("503 UNAVAILABLE")
            return _t.SimpleNamespace(text=GOOD)

    class FakeClient:
        def __init__(self, **kw):
            self.models = FakeModels()

    monkeypatch.setattr(genai, "Client", FakeClient)
    return calls


def test_falls_back_to_next_model(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.setenv("GEMINI_MODEL", "model-a, model-b, ")
    calls = _fake_genai(monkeypatch, {"model-a"})
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert calls == ["model-a", "model-b"]
    assert res["source"] == "gemini" and res["model"] == "model-b" and res["validated"]


def test_all_models_fail_uses_fallback(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.setenv("GEMINI_MODEL", "model-a,model-b")
    # siyahıdakı modellərə əlavə olaraq DEFAULT_MODELS da sınanır, hamısı uğursuz olmalıdır
    _fake_genai(monkeypatch, {"model-a", "model-b"} | set(ai_engine.DEFAULT_MODELS.split(",")))
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert res["source"] == "fallback" and res["code"] == "error" and "`processRefund`" in res["text"]


def test_default_models_is_a_comma_separated_string():
    """DEFAULT_MODELS tuple olarsa .split() xəta verir və Gemini heç vaxt işləmir."""
    assert isinstance(ai_engine.DEFAULT_MODELS, str)
    assert [m for m in ai_engine.DEFAULT_MODELS.split(",") if m.strip()]


def test_uses_default_models_when_env_not_set(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    first = ai_engine.DEFAULT_MODELS.split(",")[0]
    calls = _fake_genai(monkeypatch, {first})
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert calls[0] == first and len(calls) >= 2
    assert res["source"] == "gemini" and res["model"] != first


def _fake_anthropic(monkeypatch, fail_models, refuse_models=()):
    import anthropic
    calls = []

    class FakeMessages:
        def create(self, model, **kw):
            calls.append(model)
            if model in fail_models:
                raise RuntimeError("529 overloaded")
            if model in refuse_models:
                return _t.SimpleNamespace(stop_reason="refusal", content=[])
            return _t.SimpleNamespace(stop_reason="end_turn", content=[
                _t.SimpleNamespace(type="thinking", thinking=""),
                _t.SimpleNamespace(type="text", text=GOOD),
            ])

    class FakeClient:
        def __init__(self, **kw):
            self.messages = FakeMessages()

    monkeypatch.setattr(anthropic, "Anthropic", FakeClient)
    return calls


def test_claude_only(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-a,claude-b")
    calls = _fake_anthropic(monkeypatch, {"claude-a"})
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert calls == ["claude-a", "claude-b"]
    assert res["source"] == "claude" and res["code"] == "claude" and res["model"] == "claude-b"


def test_claude_refusal_tries_next_model(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-a,claude-b")
    calls = _fake_anthropic(monkeypatch, set(), refuse_models={"claude-a"})
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert calls == ["claude-a", "claude-b"] and res["model"] == "claude-b"


def test_gemini_down_falls_back_to_claude(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.delenv("AI_PROVIDERS", raising=False)
    _fake_genai(monkeypatch, set(ai_engine.DEFAULT_MODELS.split(",")))
    _fake_anthropic(monkeypatch, set())
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert res["source"] == "claude" and res["validated"]


def test_ai_providers_order(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setenv("AI_PROVIDERS", "claude,gemini")
    gemini_calls = _fake_genai(monkeypatch, set())
    _fake_anthropic(monkeypatch, set())
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert res["source"] == "claude" and gemini_calls == []


def test_warm_up_imports_only_active_sdks_without_calling_ai(monkeypatch):
    """İlk xatırlatmanın gecikməməsi üçün SDK-lar startup-da import olunur, amma heç bir model çağırılmır."""
    import importlib
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.delenv("AI_PROVIDERS", raising=False)
    imported = []
    real = importlib.import_module
    monkeypatch.setattr(importlib, "import_module", lambda name, *a: imported.append(name) or real(name, *a))
    calls = _fake_anthropic(monkeypatch, set())
    assert ai_engine.warm_up() == ["claude"]
    assert imported == ["anthropic"] and calls == []


def test_warm_up_without_keys_does_nothing(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")
    assert ai_engine.warm_up() == []


def test_startup_runs_warm_up_when_a_provider_is_active(monkeypatch):
    from fastapi.testclient import TestClient
    from app import main
    ran = []
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setattr(main, "warm_up", lambda: ran.append(True) or [])
    with TestClient(main.app) as c:
        assert c.get("/api/health").status_code == 200
    assert ran == [True]
