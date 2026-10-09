"""IDE simulyatoru: real HTTP sorğuları ilə backend-ə hadisə və sorğu cavabı göndərir.
İstifadə:
  python simulator.py events  [--url URL] [--interval 5]   # hadisə axını (işçi paneli canlı yenilənir)
  python simulator.py answer MEETING_LOAD [--url URL]      # menecer panelinə 1 anonim cavab
  python simulator.py reset   [--url URL]                  # demo məlumatını sıfırla
"""
import argparse
import copy
import json
import random
import time
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

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
    req = urllib.request.Request(url + path, data=json.dumps(body or {}).encode(), method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return f"{e.code} {e.read().decode()[:200]}"


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
    p.add_argument("cmd", choices=["events", "answer", "reset"])
    p.add_argument("category", nargs="?", default="MEETING_LOAD")
    p.add_argument("--url", default="http://localhost:8000")
    p.add_argument("--interval", type=float, default=5)
    a = p.parse_args()
    if a.cmd == "reset":
        print("reset:", post(a.url, "/api/demo/reset"))
    elif a.cmd == "answer":
        print("answer:", post(a.url, "/api/survey", {"developer_ref": "sim_" + uuid.uuid4().hex[:6],
                                                      "reason_id": "sim", "category": a.category}))
    else:
        while True:
            print("event:", post(a.url, "/api/events", make_event()))
            time.sleep(a.interval)


if __name__ == "__main__":
    main()
