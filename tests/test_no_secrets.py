"""Təsadüfən API açarını Git-ə atmağın qarşısını alan yoxlama (lokal pytest və CI-da işləyir)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY_LIKE = re.compile(r"(AIza|AQ\.)[A-Za-z0-9_\-]{20,}")
SCANNED = {".py", ".md", ".js", ".html", ".yml", ".txt", ".json", ".example", ".toml", ".css"}


def test_env_example_has_empty_key():
    """.env.example Git-də izlənir, ona görə açar sahəsi boş olmalıdır. Real açar yalnız .env-də olmalıdır."""
    for line in (ROOT / ".env.example").read_text(encoding="utf-8").splitlines():
        if line.startswith("GEMINI_API_KEY="):
            assert line.split("=", 1)[1].strip() == "", ".env.example faylında açar var! Onu silin, açarı yalnız .env-də saxlayın."


def test_no_key_like_strings_in_source_files():
    bad = []
    for p in ROOT.rglob("*"):
        if not p.is_file() or p.suffix not in SCANNED or p.name == "test_no_secrets.py":
            continue
        if any(part in {".git", ".venv", "venv", "node_modules", "__pycache__"} for part in p.parts):
            continue
        if KEY_LIKE.search(p.read_text(encoding="utf-8", errors="ignore")):
            bad.append(str(p.relative_to(ROOT)))
    assert not bad, "Açara bənzər mətn tapıldı: " + ", ".join(bad)