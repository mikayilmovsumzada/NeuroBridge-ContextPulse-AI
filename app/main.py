import asyncio
import json
import logging
import time
from pathlib import Path
import os


def _load_env():
    """cp4/.env faylını oxuyub os.environ-a yazır (terminalda artıq təyin olunmuş dəyişənin üstündən yazmır)."""
    f = Path(__file__).resolve().parent.parent / ".env"
    if not f.exists():
        return
    for line in f.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip().strip('"').strip("'")


_load_env()  # core və ai_engine import olunmazdan ƏVVƏL çağırılmalıdır

from contextlib import asynccontextmanager

from typing import Optional

from fastapi import Depends, FastAPI, Header, Request
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import auth, core, demo, ratelimit, security
from .ai_engine import active_providers, daily_limit, fallback_text, generate_reminder, warm_up
from .config import env_int
from .ratelimit import limit
from .schemas import ActionIn, IdeEvent, LoginIn, MessageIn, ReminderIn, SurveyIn

STATIC = Path(__file__).resolve().parent.parent / "static"
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("contextpulse")
subscribers: dict = {}  # SSE növbəsi -> giriş tokeni (anonimdirsə None)
_subscriber_ip: dict = {}  # SSE növbəsi -> müştəri IP-si (yalnız yaddaşda, bir IP-nin bütün yerləri tutmaması üçün)
MAX_SUBSCRIBERS = int(os.getenv("MAX_SSE_SUBSCRIBERS", "200"))
# (event_id, lang) -> (cavab, bitmə vaxtı və ya None). Uğurlu AI cavabı daimi, fallback isə
# AI_FAILURE_COOLDOWN_SEC müddətinə keşlənir ki, uğursuz sorğular Gemini/Claude-a təkrar-təkrar getməsin.
_reminder_cache: dict = {}
_reminder_locks: dict = {}  # eyni açar üçün eyni anda yalnız bir AI sorğusu (single-flight)
MAX_REMINDER_CACHE = 1000


def _cache_get(key):
    hit = _reminder_cache.get(key)
    if not hit:
        return None
    res, expires = hit
    if expires is not None and expires <= time.monotonic():
        _reminder_cache.pop(key, None)
        return None
    return res


def _cache_put(key, res):
    if len(_reminder_cache) >= MAX_REMINDER_CACHE:
        _reminder_cache.clear()
    cooldown = max(0, env_int("AI_FAILURE_COOLDOWN_SEC", 300))
    if res["source"] != "fallback":
        _reminder_cache[key] = (res, None)
    elif cooldown:
        _reminder_cache[key] = (res, time.monotonic() + cooldown)


async def _reset_and_publish():
    core.reset_demo()
    _reminder_cache.clear()
    _reminder_locks.clear()
    await publish("team", core.team_payload())
    await publish("event", core.BASE_EVENT, developer_ref=core.BASE_EVENT["developer_ref"])
    await publish("announcement_reset", {})


async def _auto_reset_loop(minutes: int):
    """DEMO_MODE-da paylaşılan demo vəziyyətini müntəzəm başlanğıca qaytarır."""
    while True:
        await asyncio.sleep(minutes * 60)
        try:
            await _reset_and_publish()
            log.info("[DEMO]   avtomatik sıfırlama (hər %d dəq)", minutes)
        except Exception as e:  # dövr dayanmasın
            log.warning("[DEMO]   avtomatik sıfırlama alınmadı: %s", type(e).__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("ContextPulse startup başladı")

    # 1. Verilənlər bazasını hazırla
    core.init_db()
    log.info("Database hazırdır")

    # 2. AI mühərrikinin konfiqurasiyasını yoxla
    providers = active_providers()
    warm_task = None
    if providers:
        log.info("AI engine: provayderlər (sıra ilə): %s", ", ".join(providers))
        # SDK-ların ilk importu yavaşdır: fonda edilir ki, ilk xatırlatma gözləməsin və startup bloklanmasın
        warm_task = asyncio.create_task(asyncio.to_thread(warm_up))
    else:
        log.warning(
            "AI engine: GEMINI_API_KEY və ANTHROPIC_API_KEY yoxdur; "
            "fallback cavablarından istifadə ediləcək"
        )

    if not os.getenv("INGEST_KEY"):
        log.warning("INGEST_KEY yoxdur; IDE hadisələri (/api/events) və simulyator sorğuları rədd ediləcək")

    log.info("AI gündəlik limit: %d model çağırışı (AI_DAILY_LIMIT), uğursuzluqdan sonra gözləmə %d s",
             daily_limit(), env_int("AI_FAILURE_COOLDOWN_SEC", 300))
    if not ratelimit.enabled():
        log.warning("RATE_LIMIT_ENABLED=0: sorğu limiti söndürülüb (ictimai serverdə aktiv saxlayın)")

    # 3. İctimai demo rejimi: şablonlu elanlar və avtomatik sıfırlama
    reset_task = None
    if demo.enabled():
        minutes = demo.reset_minutes()
        log.info("DEMO_MODE aktivdir: elan/qeyd yalnız şablonlardan; avtomatik sıfırlama: %s",
                 f"hər {minutes} dəq" if minutes else "söndürülüb")
        if minutes:
            reset_task = asyncio.create_task(_auto_reset_loop(minutes))

    # 4. Tətbiq sorğuları qəbul etməyə hazırdır
    log.info("ContextPulse startup tamamlandı")

    yield

    # 5. Server bağlanarkən təmizləmə mərhələsi
    log.info("ContextPulse shutdown başladı")
    if reset_task:
        reset_task.cancel()
    if warm_task and not warm_task.done():
        warm_task.cancel()

app = FastAPI(title="ContextPulse AI 2.0", lifespan=lifespan, **security.docs_kwargs())


@app.middleware("http")
async def security_headers(request, call_next):
    """CSP, nosniff, Referrer-Policy, frame-ancestors və s. (SECURITY_HEADERS=0 ilə söndürülür)."""
    resp = await call_next(request)
    for k, v in security.headers_for(request.url.path).items():
        resp.headers.setdefault(k, v)
    return resp


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


def _stream_ref(token: Optional[str]) -> Optional[str]:
    s = auth.session_of("Bearer " + token) if token else None
    return s.get("developer_ref") if s else None


async def publish(event: str, data: dict, developer_ref: Optional[str] = None):
    """developer_ref verilibsə (şəxsi IDE hadisəsi) mesaj yalnız həmin işçinin açıq pəncərələrinə gedir."""
    msg = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
    for q, token in list(subscribers.items()):
        if developer_ref is None or _stream_ref(token) == developer_ref:
            q.put_nowait(msg)


@app.post("/api/auth/login", dependencies=[Depends(limit("login"))])
async def auth_login(body: LoginIn):
    """Rola görə giriş: səhv məlumat 401, rol uyğunsuzluğu 403. Cavabda Bearer token qaytarılır (cookie qoyulmur)."""
    return auth.login(body.email, body.password, body.role)


@app.get("/api/auth/session")
async def auth_session(authorization: Optional[str] = Header(default=None)):
    s = auth.session_of(authorization)
    return {"authenticated": bool(s), "role": s["role"] if s else None}


@app.post("/api/auth/logout")
async def auth_logout(authorization: Optional[str] = Header(default=None)):
    auth.logout(authorization)
    return {"ok": True}


@app.get("/api/health")
async def health():
    return {"status": "ok", "subscribers": len(subscribers)}


@app.get("/api/bootstrap")
async def bootstrap(session=Depends(auth.optional_session)):
    """IDE hadisəsi şəxsi məlumatdır: yalnız daxil olmuş işçiyə və yalnız onun özününkü qaytarılır."""
    ev = None
    if session and session["role"] == "employee":
        ev = core.latest_event(session["developer_ref"])
    return {"event": ev, "team": core.team_payload(), "announcements": core.latest_messages(),
            "demo": demo.public_config()}


@app.post("/api/events", status_code=202, dependencies=[Depends(auth.require_ingest)])
async def ingest(event: IdeEvent):
    payload = event.model_dump(by_alias=True)
    core.add_event(payload)
    await publish("event", payload, developer_ref=payload["developer_ref"])
    log.info("[EVENT]  dev=%s file=%s errors=%d failed_tests=%d pr=#%d -> %d brauzer", payload["developer_ref"],
             payload["last_meaningful_action"]["file"].split("/")[-1], payload["diagnostics"]["errors"],
             payload["test_state"]["failed"], payload["pull_request"]["id"], len(subscribers))
    return {"accepted": True}


@app.get("/api/snapshot/{developer_ref}")
async def snapshot(developer_ref: str, c=Depends(auth.caller)):
    ev = core.latest_event(auth.developer_ref(c, developer_ref))
    if not ev:
        return JSONResponse({"detail": "hadisə tapılmadı"}, status_code=404)
    return ev


@app.post("/api/reminder", dependencies=[Depends(limit("reminder"))])
async def reminder(body: ReminderIn, c=Depends(auth.caller)):
    ev = core.latest_event(auth.developer_ref(c, body.developer_ref))
    if not ev:
        return JSONResponse({"detail": "hadisə tapılmadı"}, status_code=404)
    key = (ev["event_id"], body.lang)
    hit = _cache_get(key)
    if hit:
        return hit
    lock = _reminder_locks.setdefault(key, asyncio.Lock())
    async with lock:  # eyni anda gələn eyni sorğular AI-ya bir dəfə gedir
        hit = _cache_get(key)
        if hit:
            return hit
        try:
            res = await asyncio.wait_for(asyncio.to_thread(generate_reminder, ev, body.lang), timeout=25)
        except asyncio.TimeoutError:
            res = {"text": fallback_text(ev, body.lang), "source": "fallback", "code": "timeout", "validated": True,
                   "badge": "fallback (AI timeout)", "reason": "timeout"}
        log.info("[AI]     lang=%s source=%s validated=%s badge=%s%s", body.lang, res["source"], res["validated"],
                 res["badge"], f" reason={res['reason']}" if res.get("reason") else "")
        _cache_put(key, res)  # uğurlu cavab daimi, fallback AI_FAILURE_COOLDOWN_SEC müddətinə
    return res


@app.post("/api/survey", status_code=201, dependencies=[Depends(limit("survey"))])
async def survey(body: SurveyIn, c=Depends(auth.caller)):
    core.add_survey(auth.developer_ref(c, body.developer_ref), body.reason_id, body.category)
    payload = core.team_payload()
    await publish("team", payload)
    log.info("[SURVEY] category=%s -> respondents=%d, gorunen qrup=%d, gizli qrup=%d, brauzer=%d", body.category,
             payload["population"]["respondents"], len([b for b in payload["blockers"] if not b["suppressed"]]),
             payload["suppressed_groups"], len(subscribers))
    return {"recorded": True}


@app.get("/api/team/blockers")
async def team():
    return core.team_payload()


@app.put("/api/team/blockers/{category}/action", dependencies=[Depends(limit("action"))])
async def set_blocker_action(category: str, body: ActionIn, _session=Depends(auth.require_manager)):
    """Menecer görünən tıxanmaya status, məsul və qeyd yazır. K həddindən aşağı (gizli) qrup üçün rədd edilir."""
    if category not in core.META:
        return JSONResponse({"detail": "naməlum kateqoriya"}, status_code=404)
    if category not in core.visible_categories():
        return JSONResponse({"detail": "qrup K həddindən azdır, üzərində tədbir qeydi aça bilməzsiniz"}, status_code=409)
    if not demo.allowed_action(body.note, body.owner):
        return JSONResponse({"detail": "demo rejimində qeyd və məsul yalnız hazır şablonlardan seçilir"}, status_code=422)
    core.set_action(category, body.status, body.note, body.owner)
    payload = core.team_payload()
    await publish("team", payload)
    log.info("[ACTION] category=%s status=%s owner=%s note_uzunluq=%d -> brauzer=%d", category, body.status,
             body.owner or "-", len(body.note), len(subscribers))
    return {"saved": True}


@app.post("/api/team/messages", status_code=201, dependencies=[Depends(limit("messages"))])
async def post_team_message(body: MessageIn, _session=Depends(auth.require_manager)):
    """Menecerin bütün komandaya elanı (fərdi işçiyə ünvanlanmır). Mövzu seçilibsə, qrup görünən olmalıdır."""
    if body.category and body.category not in core.visible_categories():
        return JSONResponse({"detail": "qrup K həddindən azdır"}, status_code=409)
    if not demo.allowed_announcement(body.text):
        return JSONResponse({"detail": "demo rejimində elan yalnız hazır şablonlardan seçilir"}, status_code=422)
    msg = core.add_message(body.category, body.text)
    await publish("announcement", msg)
    log.info("[MESSAGE] category=%s uzunluq=%d -> brauzer=%d", body.category or "-", len(body.text), len(subscribers))
    return msg


@app.get("/api/announcements")
async def announcements():
    return core.latest_messages()


@app.post("/api/demo/reset", dependencies=[Depends(limit("reset")), Depends(auth.require_manager_or_ingest)])
async def reset():
    await _reset_and_publish()
    return {"reset": True}


@app.get("/api/stream", dependencies=[Depends(limit("stream"))])
async def stream(request: Request, token: Optional[str] = None):
    """EventSource başlıq göndərə bilmədiyi üçün işçi tokeni ?token= ilə gəlir; tokensiz yalnız komanda məlumatı alınır."""
    if len(subscribers) >= MAX_SUBSCRIBERS:
        return JSONResponse({"detail": "çox sayda açıq bağlantı"}, status_code=503)
    ip = ratelimit.client_ip(request)
    per_ip = env_int("MAX_SSE_PER_IP", 10)
    if ratelimit.enabled() and per_ip > 0 and sum(1 for v in _subscriber_ip.values() if v == ip) >= per_ip:
        return JSONResponse({"detail": "bu ünvandan çox sayda açıq bağlantı"}, status_code=429,
                            headers={"Retry-After": "30"})
    q: asyncio.Queue = asyncio.Queue()
    subscribers[q] = token
    _subscriber_ip[q] = ip

    async def gen():
        try:
            yield "retry: 2000\n\n"
            while True:
                try:
                    yield await asyncio.wait_for(q.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            subscribers.pop(q, None)
            _subscriber_ip.pop(q, None)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# Frontend marşrutları: brauzerdə birbaşa açılanda (və ya yenilənəndə) index.html qaytarılır, yolu isə app.js oxuyur.
# Eyni yollar static/app.js-dəki ROUTE_PATHS ilə uyğun saxlanmalıdır. Naməlum yollar 404 qaytarır.
SPA_PATHS = ["/portal", "/developer-login", "/manager-login", "/developer", "/manager",
             "/privacy-policy", "/terms-and-conditions", "/cookie-policy"]


async def _spa_index():
    return FileResponse(STATIC / "index.html", media_type="text/html")


for _path in SPA_PATHS:
    app.add_api_route(_path, _spa_index, methods=["GET"], include_in_schema=False)


@app.exception_handler(StarletteHTTPException)
async def _not_found_page(request: Request, exc: StarletteHTTPException):
    # Brauzerdə naməlum səhifə açılanda xam JSON əvəzinə tətbiqin öz 404 səhifəsi göstərilir (status yenə 404).
    # API sorğuları və digər xətalar əvvəlki kimi JSON qaytarır.
    if (exc.status_code == 404 and request.method == "GET"
            and not request.url.path.startswith("/api/")
            and "text/html" in request.headers.get("accept", "")):
        return FileResponse(STATIC / "index.html", media_type="text/html", status_code=404)
    return await http_exception_handler(request, exc)


# API marşrutlarından SONRA qoşulur: /, /app.js, /styles.css
app.mount("/", StaticFiles(directory=STATIC, html=True), name="static")
