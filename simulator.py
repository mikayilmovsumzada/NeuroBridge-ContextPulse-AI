"""IDE simulyatoru: real HTTP sorğuları ilə backend-ə hadisə və sorğu cavabı göndərir.
İstifadə:
  python simulator.py events  [--url URL] [--interval 5]   # hadisə axını (işçi paneli canlı yenilənir)
  python simulator.py answer MEETING_LOAD [--url URL]      # menecer panelinə 1 anonim cavab
  python simulator.py reset   [--url URL]                  # demo məlumatını sıfırla
  python simulator.py warm    [--url URL]                  # AZ+EN Gemini cavablarını əvvəlcədən hazırla
--url verilməsə: SIMULATOR_URL (mühit və ya .env), yoxdursa localhost:8000, sonra localhost:8001.
"""
import argparse
import copy
import json
import random
import socket
import sys
import time
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _env(name):
    """Dəyişəni əvvəlcə mühitdən, yoxdursa serverin oxuduğu .env faylından götürür."""
    import os
    if os.environ.get(name):
        return os.environ[name]
    f = Path(__file__).resolve().parent / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8-sig").splitlines():
            k, _, v = line.strip().partition("=")
            if k.strip() == name:
                return v.strip().strip('"').strip("'")
    return ""


# --url verilməyəndə: SIMULATOR_URL (mühit və ya .env), yoxdursa bu portlarda işləyən server axtarılır
CANDIDATE_URLS = ("http://localhost:8000", "http://localhost:8001")


def _listening(url, timeout=0.3):
    """Ünvandakı host:port bağlantı qəbul edirmi (HTTP sorğusu göndərmir)."""
    from urllib.parse import urlsplit
    u = urlsplit(url)
    try:
        with socket.create_connection((u.hostname or "localhost", u.port or 80), timeout=timeout):
            return True
    except OSError:
        return False


def default_url():
    configured = _env("SIMULATOR_URL")
    if configured:
        return configured.rstrip("/")
    for url in CANDIDATE_URLS:
        if _listening(url):
            return url
    return CANDIDATE_URLS[0]


# Server IDE/simulyator sorğularını yalnız bu açarla qəbul edir (.env-dəki INGEST_KEY)
HEADERS = {"Content-Type": "application/json", "X-Ingest-Key": _env("INGEST_KEY")}

BASE = {
    "schema": "contextpulse.ide_event.v1", "event_id": "", "source": {"client": "vscode-extension", "version": "0.4.2"},
    "developer_ref": "dev_a91f", "emitted_at": "", "session": {"state": "idle", "last_activity_at": "", "idle_duration_sec": 1380},
    "workspace": {"repo": "payments-service", "branch": "feature/refund-idempotency"},
    "last_meaningful_action": {"type": "EDIT_FUNCTION", "file": "src/refunds/processRefund.ts", "symbol": "processRefund",
                               "line_range": [48, 71], "lines_added": 14, "lines_removed": 3, "language": "typescript"},
    "diagnostics": {"errors": 2, "warnings": 1, "first_error": {"code": "TS2345", "line": 63}},
    "test_state": {"runner": "jest", "passed": 18, "failed": 1, "failing_test": "rejects duplicate idempotency key"},
    "pull_request": {"id": 412, "title": "Refund idempotency keys", "status": "changes_requested", "unresolved_comments": 3},
    "privacy": {"screen_capture": False, "keystroke_content": False, "source_code_content": False},
}
TESTS = ["rejects duplicate idempotency key", "returns prior refund for same key", "releases ledger lock on error"]
CODES = ["TS2345", "TS2322", "TS2339"]


def post(url, path, body=None):
    req = urllib.request.Request(url + path, data=json.dumps(body or {}).encode(), method="POST", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return f"{e.code} {e.read().decode()[:200]}"


def post_json(url, path, body):
    req = urllib.request.Request(url + path, data=json.dumps(body).encode(), method="POST", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def make_event():
    ev = copy.deepcopy(BASE)
    now = datetime.now(timezone(timedelta(hours=4)))
    ev["event_id"] = "evt_" + uuid.uuid4().hex[:8]
    ev["emitted_at"] = now.isoformat(timespec="seconds")
    ev["session"]["last_activity_at"] = (now - timedelta(seconds=1380)).isoformat(timespec="seconds")
    ev["diagnostics"] = {"errors": random.randint(1, 3), "warnings": random.randint(0, 2),
                         "first_error": {"code": random.choice(CODES), "line": random.randint(50, 70)}}
    ev["test_state"].update(failed=random.randint(0, 3), passed=random.randint(15, 20), failing_test=random.choice(TESTS))
    ev["pull_request"]["unresolved_comments"] = random.randint(1, 5)
    return ev


def main():
    p = argparse.ArgumentParser()
    p.add_argument("cmd", choices=["events", "answer", "reset", "warm"])
    p.add_argument("category", nargs="?", default="MEETING_LOAD")
    p.add_argument("--url", default=None, help="server ünvanı (default: SIMULATOR_URL və ya 8000/8001-də tapılan server)")
    p.add_argument("--interval", type=float, default=5)
    a = p.parse_args()
    # Konsol UTF-8 deyilsə (məs. Windows cp1252 boru) Azərbaycan hərfləri xəta verməsin
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="replace")
        except (AttributeError, ValueError):
            pass
    a.url = (a.url or default_url()).rstrip("/")
    if not _listening(a.url, timeout=1):
        print(f"Server tapılmadı: {a.url}. Backend-i işə salın və ya ünvanı göstərin: --url http://localhost:PORT (və ya .env-də SIMULATOR_URL)")
        raise SystemExit(1)
    print("server:", a.url)
    if not HEADERS["X-Ingest-Key"]:
        print("Xəbərdarlıq: INGEST_KEY tapılmadı (.env). Server sorğuları 401 ilə rədd edəcək.")
    if a.cmd == "reset":
        print("reset:", post(a.url, "/api/demo/reset"))
    elif a.cmd == "warm":
        # Demodan əvvəl: AZ və EN AI (Gemini/Claude) cavablarını yaddaşa yazır (əvvəlcə reset edin!)
        for lang in ("az", "en"):
            try:
                r = post_json(a.url, "/api/reminder", {"developer_ref": "dev_a91f", "lang": lang})
                ok = r.get("source") not in (None, "fallback")
                print(lang, "->", r.get("source"), "| model:", r.get("model", "-"), "| OK, keşləndi" if ok else "| AI cavab vermədi, bir az sonra təkrar edin")
            except Exception as e:
                print(lang, "-> xəta:", e)
    elif a.cmd == "answer":
        print("answer:", post(a.url, "/api/survey", {"developer_ref": "sim_" + uuid.uuid4().hex[:6],
                                                      "reason_id": "sim", "category": a.category}))
    else:
        while True:
            print("event:", post(a.url, "/api/events", make_event()))
            time.sleep(a.interval)


if __name__ == "__main__":
    main()
