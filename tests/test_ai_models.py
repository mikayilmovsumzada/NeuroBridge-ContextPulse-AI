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
