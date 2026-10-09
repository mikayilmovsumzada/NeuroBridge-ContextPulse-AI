"""SQLite saxlama, seed data və K-anonim agreqasiya."""
import json
import os
import sqlite3
import threading
from datetime import datetime, timezone

DB_PATH = os.getenv("DB_PATH", "contextpulse.db")
K = 5
TEAM_SIZE = 40
ORG_UNIT = "Platform Engineering"

META = {
    "PR_REVIEW_WAIT": {"label": "PR review gözləməsi", "avg": 74, "trend": "+18%", "signal": "Median PR gözləməsi 26,4 saat"},
    "CI_FLAKY": {"label": "Qeyri-sabit CI testləri", "avg": 52, "trend": "+6%", "signal": "7 flaky test, 3 pipeline təkrar işə düşüb"},
    "MEETING_LOAD": {"label": "Görüşlər arası parçalanma", "avg": 38, "trend": "-4%", "signal": "Gündə orta 3,1 görüş"},
    "UNCLEAR_REQUIREMENTS": {"label": "Aydın olmayan tələb", "avg": 61, "trend": "+2%", "signal": "2 task açıq sualla bağlanıb"},
    "TOOLING": {"label": "Mühit / alət problemləri", "avg": 45, "trend": "+3%", "signal": "Lokal mühit qurulumu və asılılıq xətaları"},
}
SEED_COUNTS = {"PR_REVIEW_WAIT": 8, "CI_FLAKY": 6, "MEETING_LOAD": 5, "UNCLEAR_REQUIREMENTS": 5, "TOOLING": 2}

BASE_EVENT = {
    "schema": "contextpulse.ide_event.v1",
    "event_id": "evt_8f31c2a7",
    "source": {"client": "vscode-extension", "version": "0.4.2"},
    "developer_ref": "dev_a91f",
    "emitted_at": "2026-10-09T11:42:42+04:00",
    "session": {"state": "idle", "last_activity_at": "2026-10-09T11:19:42+04:00", "idle_duration_sec": 1380},
    "workspace": {"repo": "payments-service", "branch": "feature/refund-idempotency"},
    "last_meaningful_action": {
        "type": "EDIT_FUNCTION", "file": "src/refunds/processRefund.ts", "symbol": "processRefund",
        "line_range": [48, 71], "lines_added": 14, "lines_removed": 3, "language": "typescript",
    },
    "diagnostics": {"errors": 2, "warnings": 1, "first_error": {"code": "TS2345", "line": 63}},
    "test_state": {"runner": "jest", "passed": 18, "failed": 1, "failing_test": "rejects duplicate idempotency key"},
    "pull_request": {"id": 412, "title": "Refund idempotency keys", "status": "changes_requested", "unresolved_comments": 3},
    "privacy": {"screen_capture": False, "keystroke_content": False, "source_code_content": False},
}

_lock = threading.Lock()
_conn = None


def _db():
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events(
              id INTEGER PRIMARY KEY AUTOINCREMENT, developer_ref TEXT NOT NULL,
              emitted_at TEXT NOT NULL, payload_json TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS idx_events_dev ON events(developer_ref, id);
            CREATE TABLE IF NOT EXISTS survey_responses(
              id INTEGER PRIMARY KEY AUTOINCREMENT, developer_ref TEXT NOT NULL,
              reason_id TEXT NOT NULL, category TEXT, created_at TEXT NOT NULL);
            """
        )
    return _conn


def _now():
    return datetime.now(timezone.utc).isoformat()


def add_event(payload: dict) -> int:
    with _lock:
        c = _db()
        cur = c.execute(
            "INSERT INTO events(developer_ref, emitted_at, payload_json) VALUES (?,?,?)",
            (payload["developer_ref"], payload["emitted_at"], json.dumps(payload, ensure_ascii=False)),
        )
        c.commit()
        return cur.lastrowid


def latest_event(developer_ref: str):
    with _lock:
        row = _db().execute(
            "SELECT payload_json FROM events WHERE developer_ref=? ORDER BY id DESC LIMIT 1", (developer_ref,)
        ).fetchone()
    return json.loads(row[0]) if row else None


def add_survey(developer_ref: str, reason_id: str, category):
    with _lock:
        c = _db()
        c.execute(
            "INSERT INTO survey_responses(developer_ref, reason_id, category, created_at) VALUES (?,?,?,?)",
            (developer_ref, reason_id, category, _now()),
        )
        c.commit()


def counts():
    with _lock:
        rows = _db().execute("SELECT category, COUNT(*) FROM survey_responses GROUP BY category").fetchall()
        total = _db().execute("SELECT COUNT(*) FROM survey_responses").fetchone()[0]
    return {cat: n for cat, n in rows if cat}, total


def reset_demo():
    """Bütün məlumatı silib başlanğıc vəziyyəti qaytarır (demoları təkrarlamaq üçün)."""
    with _lock:
        c = _db()
        c.execute("DELETE FROM events")
        c.execute("DELETE FROM survey_responses")
        c.commit()
    add_event(BASE_EVENT)
    for cat, n in SEED_COUNTS.items():
        for i in range(n):
            add_survey(f"seed_{cat.lower()}_{i}", "seed", cat)


def init_db():
    with _lock:
        empty = _db().execute("SELECT COUNT(*) FROM events").fetchone()[0] == 0
    if empty:
        reset_demo()


def team_payload() -> dict:
    """K-anonim menecer məlumatı. Burada fərdi identifikator və xam say gizlədilmiş qruplar üçün yoxdur."""
    cnt, respondents = counts()
    insufficient = respondents < K  # cavab verən sayı özü k-dan azdırsa heç nə göstərilmir
    shown, hidden = [], 0
    for cat, m in META.items():
        n = cnt.get(cat, 0)
        if insufficient or n < K:
            hidden += 1
            continue
        shown.append({
            "category": cat, "label": m["label"], "affected_count": n,
            "share": round(n / respondents, 2), "avg_stall_minutes": m["avg"],
            "trend_7d": m["trend"], "signal": m["signal"], "suppressed": False,
        })
    shown.sort(key=lambda b: -b["affected_count"])
    blockers = shown + [{"group": f"suppressed_{i + 1}", "suppressed": True, "reason": "n<k"} for i in range(hidden)]
    return {
        "schema": "contextpulse.team_blockers.v1", "org_unit": ORG_UNIT, "period": "last_7_days",
        "k_threshold": K, "population": {"team_size": TEAM_SIZE, "respondents": respondents},
        "blockers": blockers, "suppressed_groups": hidden, "insufficient_data": insufficient,
        "privacy": {"individual_identifiers": False, "free_text": False, "min_group_size_enforced": True},
    }
