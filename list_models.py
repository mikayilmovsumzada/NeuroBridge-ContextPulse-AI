"""Hesabınızda mövcud Gemini modellərini göstərir: python list_models.py"""
import os
from pathlib import Path

f = Path(__file__).parent / ".env"
if f.exists():
    for line in f.read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
for m in client.models.list():
    actions = getattr(m, "supported_actions", None) or []
    if "gemini" in m.name and (not actions or "generateContent" in actions):
        print(m.name.replace("models/", ""))
