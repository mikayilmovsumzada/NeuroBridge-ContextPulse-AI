import asyncio
import hashlib
import hmac
import json
import logging
import secrets
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

from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import core
from .ai_engine import fallback_text, generate_reminder
from .schemas import ActionIn, IdeEvent, LoginIn, MessageIn, ReminderIn, SurveyIn

STATIC = Path(__file__).resolve().parent.parent / "static"
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("contextpulse")
subscribers: set = set()
_reminder_cache: dict = {}
_sessions: dict[str, dict] = {}

# Demo hesablar (README-də sənədləşdirilmiş demo giriş məlumatları; real parol müqayisəsi hmac.compare_digest ilə aparılır)
DEMO_ACCOUNTS = {
    "dev@company.com": {
        "password_hash": hashlib.sha256(b"emp123").hexdigest(),
        "role": "employee",
        "developer_ref": "dev_a91f",
        "name": "Developer (dev_a91f)",
    },
    "manager@company.com": {
        "password_hash": hashlib.sha256(b"admin123").hexdigest(),
        "role": "manager",
        "developer_ref": None,
        "name": "Engineering Manager",
    },
}


def _resolve_session(request: Request) -> dict | None:
    """Sorğudan sessiyanı (Bearer token və ya HttpOnly cookie) yoxlayır."""
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    if not token:
        token = request.cookies.get("cp_session")
    if not token:
        return None
    sess = _sessions.get(token)
    if not sess:
        return None
    if sess.get("expires_at", 0) < time.time():
        _sessions.pop(token, None)
        return None
    return sess


def _check_role(request: Request, required_role: str) -> JSONResponse | None:
    """Əgər sorğuda sessiya və ya X-CP-Auth-Enforce başlığı varsa, rolu server tərəfdə məcburi yoxlayır."""
    sess = _resolve_session(request)
    enforce = request.headers.get("X-CP-Auth-Enforce") == "1"
    if sess is not None:
        if sess["role"] != required_role:
            return JSONResponse({"detail": "Bu əməliyyat üçün icazəniz yoxdur (rol uyğunsuzluğu)."}, status_code=403)
        return None
    if enforce:
        return JSONResponse({"detail": "Autentifikasiya tələb olunur."}, status_code=401)
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("ContextPulse startup başladı")

    # 1. Verilənlər bazasını hazırla
    core.init_db()
    log.info("Database hazırdır")

    # 2. AI mühərrikinin konfiqurasiyasını yoxla
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


@app.post("/api/auth/login")
async def auth_login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    acct = DEMO_ACCOUNTS.get(email)
    given_hash = hashlib.sha256(body.password.encode("utf-8")).hexdigest()
    if not acct or not hmac.compare_digest(acct["password_hash"], given_hash):
        return JSONResponse({"detail": "Səhv e-poçt və ya parol"}, status_code=401)
    if body.role and acct["role"] != body.role:
        return JSONResponse({"detail": "Bu giriş pəncərəsi yalnız müvafiq rol üçündür"}, status_code=403)
    token = secrets.token_urlsafe(32)
    sess = {
        "token": token,
        "email": email,
        "role": acct["role"],
        "developer_ref": acct["developer_ref"],
        "name": acct["name"],
        "expires_at": time.time() + 86400,
    }
    _sessions[token] = sess
    response.set_cookie(
        key="cp_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400,
        path="/",
    )
    return {
        "authenticated": True,
        "role": acct["role"],
        "email": email,
        "name": acct["name"],
        "developer_ref": acct["developer_ref"],
        "token": token,
    }


@app.post("/api/auth/logout")
async def auth_logout(request: Request, response: Response):
    sess = _resolve_session(request)
    if sess:
        _sessions.pop(sess["token"], None)
    response.delete_cookie(key="cp_session", path="/")
    return {"logged_out": True}


@app.get("/api/auth/session")
async def auth_session(request: Request):
    sess = _resolve_session(request)
    if not sess:
        return {"authenticated": False, "role": None}
    return {
        "authenticated": True,
        "role": sess["role"],
        "email": sess["email"],
        "name": sess["name"],
        "developer_ref": sess["developer_ref"],
    }


@app.get("/api/bootstrap")
async def bootstrap(developer_ref: str = "dev_a91f"):
    ev = core.latest_event(developer_ref) or core.BASE_EVENT
    return {"event": ev, "team": core.team_payload(), "announcements": core.latest_messages()}


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
async def snapshot(developer_ref: str, request: Request):
    err = _check_role(request, "employee")
    if err:
        return err
    ev = core.latest_event(developer_ref)
    if not ev:
        return JSONResponse({"detail": "hadisə tapılmadı"}, status_code=404)
    return ev


@app.post("/api/reminder")
async def reminder(body: ReminderIn, request: Request):
    err = _check_role(request, "employee")
    if err:
        return err
    ev = core.latest_event(body.developer_ref)
    if not ev:
        return JSONResponse({"detail": "hadisə tapılmadı"}, status_code=404)
    key = (ev["event_id"], body.lang)
    if key in _reminder_cache:
        return _reminder_cache[key]
    try:
        res = await asyncio.wait_for(asyncio.to_thread(generate_reminder, ev, body.lang), timeout=25)
    except asyncio.TimeoutError:
        res = {"text": fallback_text(ev, body.lang), "source": "fallback", "code": "timeout", "validated": True,
               "badge": "fallback (AI timeout)", "reason": "timeout"}
    log.info("[AI]     lang=%s source=%s validated=%s badge=%s%s", body.lang, res["source"], res["validated"], res["badge"],
             f" reason={res['reason']}" if res.get("reason") else "")
    if res["source"] == "gemini":  # yalnız uğurlu AI cavabı keşlənir
        _reminder_cache[key] = res
    return res


@app.post("/api/survey", status_code=201)
async def survey(body: SurveyIn, request: Request):
    err = _check_role(request, "employee")
    if err:
        return err
    core.add_survey(body.developer_ref, body.reason_id, body.category)
    payload = core.team_payload()
    await publish("team", payload)
    log.info("[SURVEY] category=%s -> respondents=%d, gorunen qrup=%d, gizli qrup=%d, brauzer=%d", body.category,
             payload["population"]["respondents"], len([b for b in payload["blockers"] if not b["suppressed"]]),
             payload["suppressed_groups"], len(subscribers))
    return {"recorded": True}


@app.get("/api/team/blockers")
async def team(request: Request):
    err = _check_role(request, "manager")
    if err:
        return err
    return core.team_payload()


@app.put("/api/team/blockers/{category}/action")
async def set_blocker_action(category: str, body: ActionIn, request: Request):
    """Menecer görünən tıxanmaya status, məsul və qeyd yazır. K həddindən aşağı (gizli) qrup üçün rədd edilir."""
    err = _check_role(request, "manager")
    if err:
        return err
    if category not in core.META:
        return JSONResponse({"detail": "naməlum kateqoriya"}, status_code=404)
    if category not in core.visible_categories():
        return JSONResponse({"detail": "qrup K həddindən azdır, üzərində tədbir qeydi aça bilməzsiniz"}, status_code=409)
    core.set_action(category, body.status, body.note, body.owner)
    payload = core.team_payload()
    await publish("team", payload)
    log.info("[ACTION] category=%s status=%s owner=%s note_uzunluq=%d -> brauzer=%d", category, body.status,
             body.owner or "-", len(body.note), len(subscribers))
    return {"saved": True}


@app.post("/api/team/messages", status_code=201)
async def post_team_message(body: MessageIn, request: Request):
    """Menecerin bütün komandaya elanı (fərdi işçiyə ünvanlanmır). Mövzu seçilibsə, qrup görünən olmalıdır."""
    err = _check_role(request, "manager")
    if err:
        return err
    if body.category and body.category not in core.visible_categories():
        return JSONResponse({"detail": "qrup K həddindən azdır"}, status_code=409)
    msg = core.add_message(body.category, body.text)
    await publish("announcement", msg)
    log.info("[MESSAGE] category=%s uzunluq=%d -> brauzer=%d", body.category or "-", len(body.text), len(subscribers))
    return msg


@app.get("/api/announcements")
async def announcements():
    return core.latest_messages()


@app.post("/api/demo/reset")
async def reset():
    core.reset_demo()
    _reminder_cache.clear()
    await publish("team", core.team_payload())
    await publish("event", core.BASE_EVENT)
    await publish("announcement_reset", {})
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


SPA_ROUTES = {
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
    "/privacy",
    "/terms",
    "/cookies",
}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon_ico():
    ico_path = STATIC / "favicon.ico"
    if ico_path.exists():
        return FileResponse(ico_path, media_type="image/x-icon")
    return Response(status_code=404)


@app.get("/favicon.svg", include_in_schema=False)
async def favicon_svg():
    svg_path = STATIC / "favicon.svg"
    if svg_path.exists():
        return FileResponse(svg_path, media_type="image/svg+xml")
    return Response(status_code=404)


for _route in SPA_ROUTES:
    app.add_api_route(
        _route,
        endpoint=lambda: FileResponse(STATIC / "index.html", media_type="text/html"),
        methods=["GET"],
        include_in_schema=False,
    )

# API və SPA marşrutlarından SONRA qoşulur: /, /app.js, /styles.css
app.mount("/", StaticFiles(directory=STATIC, html=True), name="static")

