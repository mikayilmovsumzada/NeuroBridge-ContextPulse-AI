"""Server tərəfli rol əsaslı giriş (demo): hesab yoxlaması, yaddaşda token sessiyaları və rol asılılıqları.

Qeyd: sessiyalar proses yaddaşındadır (server yenidən başlayanda silinir, bir proses üçündür).
Hesablar .env-dən dəyişdirilə bilər (DEMO_EMPLOYEE_*, DEMO_MANAGER_*); verilməyibsə README-dəki demo dəyərlər işləyir.
IDE genişləndirməsi və simulyator işçi kimi deyil, INGEST_KEY gizli açarı (X-Ingest-Key başlığı) ilə daxil olur.
"""
import hmac
import os
import secrets
import time
from typing import Optional

from fastapi import Depends, Header, HTTPException

TOKEN_TTL = 8 * 3600  # saniyə
_sessions: dict = {}  # token -> {"role", "email", "exp"}


def _accounts() -> dict:
    return {
        "employee": (os.environ.get("DEMO_EMPLOYEE_EMAIL", "dev@company.com"),
                     os.environ.get("DEMO_EMPLOYEE_PASSWORD", "emp123")),
        "manager": (os.environ.get("DEMO_MANAGER_EMAIL", "manager@company.com"),
                    os.environ.get("DEMO_MANAGER_PASSWORD", "admin123")),
    }


def employee_ref() -> str:
    """Demo işçi hesabının IDE hadisələrindəki təxəllüslü istinadı."""
    return os.environ.get("DEMO_EMPLOYEE_REF", "dev_a91f")


def _same(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def _purge() -> None:
    now = time.time()
    for t in [t for t, s in _sessions.items() if s["exp"] <= now]:
        _sessions.pop(t, None)


def login(email: str, password: str, role: Optional[str]) -> dict:
    """Doğru e-poçt+parol -> token. Səhv məlumat 401, rol uyğunsuzluğu 403 verir."""
    found = None
    for acc_role, (acc_email, acc_pass) in _accounts().items():
        ok_mail = _same(email.strip().lower(), acc_email.lower())
        ok_pass = _same(password, acc_pass)
        if ok_mail and ok_pass:
            found = (acc_role, acc_email)
    if not found:
        raise HTTPException(401, "səhv e-poçt və ya parol")
    if role and role != found[0]:
        raise HTTPException(403, "bu hesab həmin panelə aid deyil")
    _purge()
    token = secrets.token_urlsafe(32)
    _sessions[token] = {"role": found[0], "email": found[1], "exp": time.time() + TOKEN_TTL,
                        "developer_ref": employee_ref() if found[0] == "employee" else None}
    return {"token": token, "role": found[0], "email": found[1]}


def _bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, value = authorization.partition(" ")
    return value.strip() if scheme.lower() == "bearer" and value.strip() else None


def session_of(authorization: Optional[str]) -> Optional[dict]:
    token = _bearer(authorization)
    s = _sessions.get(token) if token else None
    if s and s["exp"] <= time.time():
        _sessions.pop(token, None)
        return None
    return s


def logout(authorization: Optional[str]) -> None:
    token = _bearer(authorization)
    if token:
        _sessions.pop(token, None)


def optional_session(authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    return session_of(authorization)


def require_manager(session: Optional[dict] = Depends(optional_session)) -> dict:
    if not session:
        raise HTTPException(401, "giriş tələb olunur", headers={"WWW-Authenticate": "Bearer"})
    if session["role"] != "manager":
        raise HTTPException(403, "bu əməliyyat yalnız menecer üçündür")
    return session


def has_ingest_key(value: Optional[str]) -> bool:
    """INGEST_KEY təyin olunmayıbsa heç bir açar qəbul edilmir (fail-closed)."""
    key = os.environ.get("INGEST_KEY", "")
    return bool(key and value and _same(value, key))


def require_ingest(x_ingest_key: Optional[str] = Header(default=None)) -> None:
    if not has_ingest_key(x_ingest_key):
        raise HTTPException(401, "IDE açarı (X-Ingest-Key) tələb olunur")


def caller(session: Optional[dict] = Depends(optional_session),
           x_ingest_key: Optional[str] = Header(default=None)) -> dict:
    return {"ingest": has_ingest_key(x_ingest_key), "session": session}


def developer_ref(c: dict, requested: Optional[str]) -> str:
    """Sorğunun kimin adından olduğunu müəyyən edir.

    IDE açarı ilə gələn sorğu istənilən developer_ref göstərə bilər; işçi isə yalnız öz sessiyasındakı ref ilə işləyir.
    """
    if c["ingest"]:
        if not requested:
            raise HTTPException(422, "developer_ref tələb olunur")
        return requested
    s = c["session"]
    if not s:
        raise HTTPException(401, "giriş tələb olunur", headers={"WWW-Authenticate": "Bearer"})
    if s["role"] != "employee":
        raise HTTPException(403, "bu əməliyyat yalnız işçi üçündür")
    if requested and requested != s["developer_ref"]:
        raise HTTPException(403, "başqa developerin məlumatına giriş yoxdur")
    return s["developer_ref"]


def require_manager_or_ingest(c: dict = Depends(caller)) -> dict:
    if c["ingest"]:
        return c
    return require_manager(c["session"])
