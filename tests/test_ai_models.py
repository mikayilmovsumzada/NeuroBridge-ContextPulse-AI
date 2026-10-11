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
    _fake_genai(monkeypatch, {"model-a", "model-b"})
    res = ai_engine.generate_reminder(BASE_EVENT, "az")
    assert res["source"] == "fallback" and res["code"] == "error" and "`processRefund`" in res["text"]
