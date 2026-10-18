"""Sayt marşrutları, favicon, şriftlər və cookie davranışı."""
from fastapi.testclient import TestClient

from app.main import SPA_PATHS, app

c = TestClient(app)


def test_every_frontend_route_serves_the_app_shell():
    for p in ["/"] + SPA_PATHS:
        r = c.get(p)
        assert r.status_code == 200, p
        assert "text/html" in r.headers["content-type"], p
        assert '<div id="root">' in r.text, p


def test_legal_pages_have_their_own_urls():
    for p in ("/privacy-policy", "/terms-and-conditions", "/cookie-policy"):
        assert c.get(p).status_code == 200


def test_unknown_path_is_404():
    assert c.get("/does-not-exist").status_code == 404


def test_favicon_assets_are_served():
    ico = c.get("/favicon.ico")
    assert ico.status_code == 200 and "icon" in ico.headers["content-type"]
    assert ico.content[:4] == b"\x00\x00\x01\x00"  # ICO imzası
    assert c.get("/favicon.svg").status_code == 200
    apple = c.get("/apple-touch-icon.png")
    assert apple.status_code == 200 and apple.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_index_declares_favicons_once_and_has_no_google_fonts():
    html = c.get("/").text
    assert html.count('rel="icon"') == 2 and html.count('rel="apple-touch-icon"') == 1
    assert "fonts.googleapis.com" not in html and "fonts.gstatic.com" not in html


def test_fonts_are_self_hosted():
    for f in ("inter-latin-wght-normal.woff2", "inter-latin-ext-wght-normal.woff2",
              "jetbrains-mono-latin-wght-normal.woff2", "jetbrains-mono-latin-ext-wght-normal.woff2"):
        r = c.get("/fonts/" + f)
        assert r.status_code == 200 and len(r.content) > 10_000, f


def test_app_sets_no_http_cookies():
    """Cookie Siyasəti bunu iddia edir: heç bir cavabda Set-Cookie olmamalıdır."""
    responses = [c.get(p) for p in ["/", "/privacy-policy", "/cookie-policy", "/api/health", "/api/bootstrap", "/api/team/blockers"]]
    responses.append(c.post("/api/survey", json={"developer_ref": "dev_cookie", "reason_id": "ci", "category": "CI_FLAKY"}))
    responses.append(c.post("/api/reminder", json={"developer_ref": "dev_a91f", "lang": "en"}))
    for r in responses:
        assert "set-cookie" not in {k.lower() for k in r.headers.keys()}, r.request.url
