"""Müştəri IP-si üzrə sadə sürüşən pəncərəli sorğu limiti (əlavə asılılıq yoxdur, yaddaşdadır).

Qeyd: sayğaclar proses yaddaşındadır, ona görə server tək uvicorn worker ilə işləməlidir.
IP ünvanları yalnız limit pəncərəsi boyunca yaddaşda saxlanır, loga yazılmır.

Konfiqurasiya:
  RATE_LIMIT_ENABLED=1          (standart: 1)
  RATE_LIMIT_<BUCKET>=N/S       S saniyədə ən çox N sorğu, məsələn RATE_LIMIT_LOGIN=10/60
  TRUSTED_PROXY=0|1|N           0: X-Forwarded-For nəzərə alınmır; N: önümüzdə N etibarlı proxy var,
                                müştəri IP-si X-Forwarded-For siyahısının sondan N-ci elementidir
"""
import os
import threading
import time
from collections import deque

from fastapi import HTTPException, Request

from .config import env_flag, env_int

# bucket -> (sorğu sayı, pəncərə saniyə)
DEFAULTS = {
    "login": (10, 60),
    "reminder": (20, 60),
    "survey": (20, 60),
    "messages": (10, 60),
    "action": (30, 60),
    "stream": (30, 60),
    "reset": (3, 60),
}
MAX_KEYS = 20_000  # yaddaş sərhədi: bundan çox açar olarsa köhnələr təmizlənir


def enabled() -> bool:
    return env_flag("RATE_LIMIT_ENABLED", True)


def rule(bucket: str) -> tuple:
    default = DEFAULTS[bucket]
    raw = os.environ.get(f"RATE_LIMIT_{bucket.upper()}", "").strip()
    if not raw:
        return default
    try:
        n, _, per = raw.partition("/")
        return max(1, int(n)), max(1, int(per or 60))
    except ValueError:
        return default


def trusted_hops() -> int:
    raw = os.environ.get("TRUSTED_PROXY", "").strip().lower()
    if raw in {"true", "yes", "on"}:
        return 1
    return max(0, env_int("TRUSTED_PROXY", 0))


def client_ip(request: Request) -> str:
    hops = trusted_hops()
    if hops:
        parts = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
        if parts:
            # Sol tərəfdəki elementləri müştəri özü yaza bilər; etibarlı proxy-nin əlavə etdiyi element sondan sayılır.
            return parts[-hops] if len(parts) >= hops else parts[0]
    return request.client.host if request.client else "unknown"


class SlidingWindow:
    def __init__(self):
        self._hits: dict = {}
        self._lock = threading.Lock()

    def hit(self, key, limit: int, per: int, now: float = None):
        """(icazə, Retry-After saniyə) qaytarır."""
        now = time.monotonic() if now is None else now
        with self._lock:
            if len(self._hits) > MAX_KEYS:
                self._purge(now)
            q = self._hits.setdefault(key, deque())
            while q and q[0] <= now - per:
                q.popleft()
            if len(q) >= limit:
                return False, max(1, int(q[0] + per - now) + 1)
            q.append(now)
            return True, 0

    def _purge(self, now: float):
        longest = max(per for _, per in DEFAULTS.values())
        for k in [k for k, q in self._hits.items() if not q or q[-1] <= now - longest]:
            self._hits.pop(k, None)
        if len(self._hits) > MAX_KEYS:  # hələ də çoxdursa hamısını sıfırla (yaddaşı qorumaq daha vacibdir)
            self._hits.clear()

    def clear(self):
        with self._lock:
            self._hits.clear()


limiter = SlidingWindow()


def check(request: Request, bucket: str) -> None:
    if not enabled():
        return
    n, per = rule(bucket)
    ok, retry = limiter.hit((bucket, client_ip(request)), n, per)
    if not ok:
        raise HTTPException(429, "çox sayda sorğu, bir az sonra yenidən cəhd edin", headers={"Retry-After": str(retry)})


def limit(bucket: str):
    """FastAPI asılılığı: dependencies=[Depends(limit("login"))]."""
    if bucket not in DEFAULTS:
        raise ValueError(bucket)

    def dependency(request: Request) -> None:
        check(request, bucket)

    return dependency
