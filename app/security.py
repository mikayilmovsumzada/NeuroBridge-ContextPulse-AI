"""İstehsal konfiqurasiyası: təhlükəsizlik başlıqları və Swagger sənədlərinin söndürülməsi."""
import os

from .config import env_flag, env_int

# static/index.html bu CDN-lərdən skript yükləyir. Brauzerdə Babel ilə JSX çevrildiyi və Tailwind CDN
# üslubları runtime-da yaratdığı üçün 'unsafe-inline' və 'unsafe-eval' hələlik lazımdır.
# Əvvəlcədən yığılmış (prebuilt) JS/CSS-ə keçəndə bunlar və CDN ünvanları silinməlidir (README-də follow-up).
SCRIPT_CDNS = "https://cdn.tailwindcss.com https://unpkg.com"


def docs_kwargs() -> dict:
    """DISABLE_DOCS=1 olarsa /docs, /redoc və /openapi.json bağlanır."""
    if env_flag("DISABLE_DOCS", False):
        return {"docs_url": None, "redoc_url": None, "openapi_url": None}
    return {}


def frame_ancestors() -> str:
    return os.environ.get("CSP_FRAME_ANCESTORS", "").strip() or "'none'"


def content_security_policy() -> str:
    return "; ".join([
        "default-src 'self'",
        f"script-src 'self' 'unsafe-inline' 'unsafe-eval' {SCRIPT_CDNS}",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        f"frame-ancestors {frame_ancestors()}",
    ])


def headers_for(path: str) -> dict:
    if not env_flag("SECURITY_HEADERS", True):
        return {}
    h = {
        "Content-Security-Policy": content_security_policy(),
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        "Cross-Origin-Opener-Policy": "same-origin",
    }
    if frame_ancestors() == "'none'":
        h["X-Frame-Options"] = "DENY"  # köhnə brauzerlər üçün frame-ancestors-un ekvivalenti
    hsts = env_int("HSTS_MAX_AGE", 0)
    if hsts > 0:  # yalnız HTTPS reverse proxy arxasında aktiv edin
        h["Strict-Transport-Security"] = f"max-age={hsts}; includeSubDomains"
    if path.startswith("/api/") and path != "/api/stream":
        h["Cache-Control"] = "no-store"
    return h
