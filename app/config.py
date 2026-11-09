"""Mühit dəyişənlərini oxumaq üçün kiçik köməkçilər.

Dəyərlər hər çağırışda os.environ-dan oxunur (testlərdə monkeypatch ilə dəyişmək olsun deyə).
"""
import os

_TRUE = {"1", "true", "yes", "on"}
_FALSE = {"0", "false", "no", "off", ""}


def env_flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    v = raw.strip().lower()
    if v in _TRUE:
        return True
    if v in _FALSE:
        return False
    return default


def env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    try:
        return int(raw) if raw else default
    except ValueError:
        return default
