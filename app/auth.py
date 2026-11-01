"""Server tərəfli rol əsaslı giriş (demo): hesab yoxlaması, yaddaşda token sessiyaları və rol asılılıqları.

Qeyd: sessiyalar proses yaddaşındadır (server yenidən başlayanda silinir, bir proses üçündür).
Hesablar .env-dən dəyişdirilə bilər (DEMO_EMPLOYEE_*, DEMO_MANAGER_*); verilməyibsə README-dəki demo dəyərlər işləyir.
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
    _sessions[token] = {"role": found[0], "email": found[1], "exp": time.time() + TOKEN_TTL}
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


def reject_manager(session: Optional[dict] = Depends(optional_session)) -> Optional[dict]:
    """Sorğu menecer sessiyası ilə gəlirsə rədd edir (anonim IDE/işçi sorğuları keçir)."""
    if session and session["role"] == "manager":
        raise HTTPException(403, "menecer bu əməliyyatı edə bilməz")
    return session
