import asyncio
import json
import logging
import time
from pathlib import Path

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import core
from .ai_engine import fallback_text, generate_reminder
from .schemas import IdeEvent, ReminderIn, SurveyIn

STATIC = Path(__file__).resolve().parent.parent / "static"
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("contextpulse")
subscribers: set = set()
_reminder_cache: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("ContextPulse startup başladı")

    # 1. Verilənlər bazasını hazırla
    core.init_db()
    log.info("Database hazırdır")

    # 2. AI mühərrikinin konfiqurasiyasını yoxla
    import os

    if os.getenv("GEMINI_API_KEY"):
        log.info("AI engine: Gemini konfiqurasiya olunub")
    else:
        log.warning(
            "AI engine: GEMINI_API_KEY yoxdur; "
            "fallback cavablarından istifadə ediləcək"
        )

    # 3. Tətbiq sorğuları qəbul etməyə hazırdır
    log.info("ContextPulse startup tamamlandı")

    yield

    # 4. Server bağlanarkən təmizləmə mərhələsi
    log.info("ContextPulse shutdown başladı")

app = FastAPI(title="ContextPulse AI 2.0", lifespan=lifespan)


@app.middleware("http")
async def api_log(request, call_next):
    """Hər /api sorğusu terminalda: metod, yol, status, müddət."""
    t0 = time.perf_counter()
    resp = await call_next(request)
    if request.url.path.startswith("/api/"):
        note = "  (SSE axını açıldı)" if request.url.path == "/api/stream" else ""
        log.info("API  %-4s %-26s -> %s  %4.0f ms%s", request.method, request.url.path, resp.status_code,
                 (time.perf_counter() - t0) * 1000, note)
    return resp


async def publish(event: str, data: dict):
    msg = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
    for q in list(subscribers):
        q.put_nowait(msg)


@app.get("/api/health")
async def health():
    return {"status": "ok", "subscribers": len(subscribers)}


@app.get("/api/bootstrap")
async def bootstrap(developer_ref: str = "dev_a91f"):
    ev = core.latest_event(developer_ref) or core.BASE_EVENT
    return {"event": ev, "team": core.team_payload()}


@app.post("/api/events", status_code=202)
async def ingest(event: IdeEvent):
    payload = event.model_dump(by_alias=True)
    core.add_event(payload)
    await publish("event", payload)
    log.info("[EVENT]  dev=%s file=%s errors=%d failed_tests=%d pr=#%d -> %d brauzer", payload["developer_ref"],
             payload["last_meaningful_action"]["file"].split("/")[-1], payload["diagnostics"]["errors"],
             payload["test_state"]["failed"], payload["pull_request"]["id"], len(subscribers))
    return {"accepted": True}


@app.get("/api/snapshot/{developer_ref}")
async def snapshot(developer_ref: str):
    ev = core.latest_event(developer_ref)
    if not ev:
        return JSONResponse({"detail": "hadisə tapılmadı"}, status_code=404)
    return ev


@app.post("/api/reminder")
async def reminder(body: ReminderIn):
    ev = core.latest_event(body.developer_ref)
    if not ev:
        return JSONResponse({"detail": "hadisə tapılmadı"}, status_code=404)
    key = (ev["event_id"], body.lang)
    if key in _reminder_cache:
        return _reminder_cache[key]
    try:
        res = await asyncio.wait_for(asyncio.to_thread(generate_reminder, ev, body.lang), timeout=10)
    except asyncio.TimeoutError:
        res = {"text": fallback_text(ev, body.lang), "source": "fallback", "code": "timeout", "validated": True,
               "badge": "fallback (AI timeout)", "reason": "timeout"}
    log.info("[AI]     lang=%s source=%s validated=%s badge=%s%s", body.lang, res["source"], res["validated"], res["badge"],
             f" reason={res['reason']}" if res.get("reason") else "")
    if res["source"] == "gemini":  # yalnız uğurlu AI cavabı keşlənir
        _reminder_cache[key] = res
    return res


@app.post("/api/survey", status_code=201)
async def survey(body: SurveyIn):
    core.add_survey(body.developer_ref, body.reason_id, body.category)
    payload = core.team_payload()
    await publish("team", payload)
    log.info("[SURVEY] category=%s -> respondents=%d, gorunen qrup=%d, gizli qrup=%d, brauzer=%d", body.category,
             payload["population"]["respondents"], len([b for b in payload["blockers"] if not b["suppressed"]]),
             payload["suppressed_groups"], len(subscribers))
    return {"recorded": True}


@app.get("/api/team/blockers")
async def team():
    return core.team_payload()


@app.post("/api/demo/reset")
async def reset():
    core.reset_demo()
    _reminder_cache.clear()
    await publish("team", core.team_payload())
    await publish("event", core.BASE_EVENT)
    return {"reset": True}


@app.get("/api/stream")
async def stream():
    q: asyncio.Queue = asyncio.Queue()
    subscribers.add(q)

    async def gen():
        try:
            yield "retry: 2000\n\n"
            while True:
                try:
                    yield await asyncio.wait_for(q.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            subscribers.discard(q)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# API marşrutlarından SONRA qoşulur: /, /app.js, /styles.css
app.mount("/", StaticFiles(directory=STATIC, html=True), name="static")
