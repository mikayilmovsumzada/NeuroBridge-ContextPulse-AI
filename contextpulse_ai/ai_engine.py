"""ContextPulse AI Copilot mühərriki.

Axın:
1. Mock IDE kontekstini Master System Prompt ilə Gemini-yə göndərir.
2. Cavabı JSON kimi parse edir.
3. Anti-halüsinasiya yoxlaması: cavabdakı hər `backtick` ifadəsi və hər rəqəm
   kontekstdə mövcud olmalıdır. Olmadıqda cavab atılır.
4. Hər hansı xəta (API açarı yox, şəbəkə, parse, yoxlama) olarsa, kontekstdən
   deterministik şəkildə qurulan fallback mesajı qaytarılır, demo heç vaxt sınmır.
"""
import json
import os
import re
from typing import Any, Dict

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

MASTER_SYSTEM_PROMPT = """\
ROLE
You are ContextPulse Copilot, a re-engagement assistant for software developers who are returning to work after a break.

GROUND TRUTH
The ONLY source of truth is the JSON placed between <CONTEXT> and </CONTEXT>. It contains IDE activity events and Pull Request metadata. You have no other knowledge about this developer, this codebase or this company.

HARD RULES (anti-hallucination)
1. Use ONLY facts that are explicitly present in CONTEXT. Never invent file names, function names, test names, branch names, PR numbers, error messages, numbers or times.
2. Every file path, function, test name, branch, command and PR number you mention MUST be copied character-for-character from CONTEXT and wrapped in backticks.
3. If a fact is missing or null in CONTEXT, do not mention it and do not guess.
4. Do not give generic programming advice. The next step must be derived directly from last_test_run, open_pr, todo_markers or last_meaningful_action. Priority order: failing test, then unresolved PR comments, then TODO marker, then continuing the last edit.
5. Never claim to have seen the screen, keystrokes, clipboard or file contents. Only IDE events and PR metadata exist.
6. Do not judge the developer's productivity, the length of the break or the reason for it.
7. Tone: calm, specific, encouraging. No emojis, no exclamation marks.

OUTPUT FORMAT
Return ONLY a valid JSON object (no markdown fences, no extra text) with exactly these keys:
{"headline": "...", "where_you_stopped": "...", "next_step": "..."}
- Language: Azerbaijani (Latin script).
- headline: at most 8 words.
- where_you_stopped: exactly 1 sentence, at most 30 words: which file/function was last edited and what state the work was in.
- next_step: exactly 1 sentence, at most 30 words: the single most useful first action.

INSUFFICIENT DATA
If CONTEXT does not contain enough information, return exactly:
{"headline": "Kontekst tapılmadı", "where_you_stopped": "IDE fəaliyyəti üçün kifayət qədər məlumat yoxdur.", "next_step": "Son açdığınız fayldan davam edin."}
"""

REQUIRED_KEYS = ("headline", "where_you_stopped", "next_step")


def build_user_payload(ctx: Dict[str, Any]) -> str:
    """Kontekst JSON-unu <CONTEXT> teqləri arasında LLM-ə ötürülən mətnə çevirir."""
    return (
        "<CONTEXT>\n"
        + json.dumps(ctx, ensure_ascii=False, indent=2)
        + "\n</CONTEXT>\n\n"
        "Yuxarıdakı CONTEXT əsasında developer üçün re-engagement xatırlatmasını "
        "təyin olunmuş JSON formatında qaytar."
    )


def is_grounded(parsed: Dict[str, Any], ctx: Dict[str, Any]) -> bool:
    """Cavabın kontekstə əsaslandığını yoxlayır (halüsinasiya qoruyucusu)."""
    if not all(isinstance(parsed.get(k), str) and parsed[k].strip() for k in REQUIRED_KEYS):
        return False
    ctx_text = json.dumps(ctx, ensure_ascii=False)
    for key in REQUIRED_KEYS:
        value = parsed[key]
        for token in re.findall(r"`([^`]+)`", value):
            if token not in ctx_text:
                return False
        for number in re.findall(r"\d+", value):
            if number not in ctx_text:
                return False
    return True


def fallback_message(ctx: Dict[str, Any]) -> Dict[str, str]:
    """LLM əlçatmaz olduqda kontekstdən deterministik mesaj qurur."""
    action = ctx.get("last_meaningful_action") or {}
    test = ctx.get("last_test_run") or {}
    pr = ctx.get("open_pr") or {}
    todos = ctx.get("todo_markers") or []

    file_ = action.get("file")
    func = action.get("function")
    if file_ and func:
        stopped = f"Son olaraq `{file_}` faylında `{func}` funksiyasını redaktə edirdiniz."
    elif file_:
        stopped = f"Son olaraq `{file_}` faylını redaktə edirdiniz."
    else:
        stopped = "IDE fəaliyyəti üçün kifayət qədər məlumat yoxdur."

    failed = test.get("failed_tests") or []
    if test.get("result") == "FAILED" and failed:
        step = f"`{failed[0]}` testi uğursuzdur"
        if test.get("error_summary"):
            step += f" ({test['error_summary']})"
        step += ", ondan başlayın."
    elif pr.get("unresolved_comments"):
        step = f"PR `#{pr.get('number')}` üzrə həll olunmamış {pr['unresolved_comments']} şərhdən başlayın."
    elif todos:
        step = f"`{todos[0]}` qeydindən davam edin."
    else:
        step = "Son açdığınız fayldan davam edin."

    return {
        "headline": "Qaldığınız yerə qayıdın",
        "where_you_stopped": stopped,
        "next_step": step,
    }


def _call_gemini(ctx: Dict[str, Any]) -> Dict[str, Any]:
    """Gemini API-yə sorğu göndərir və JSON cavabı qaytarır."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY təyin edilməyib")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=build_user_payload(ctx),
        config=types.GenerateContentConfig(
            system_instruction=MASTER_SYSTEM_PROMPT,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


def generate_reentry_message(ctx: Dict[str, Any]) -> Dict[str, str]:
    """Əsas giriş nöqtəsi. Həmişə 5 açarlı dict qaytarır:
    headline, where_you_stopped, next_step, source ('gemini' | 'fallback'), note.
    """
    try:
        parsed = _call_gemini(ctx)
        if not is_grounded(parsed, ctx):
            raise ValueError("Cavab kontekstə əsaslanmadığı üçün rədd edildi")
        return {
            "headline": parsed["headline"].strip(),
            "where_you_stopped": parsed["where_you_stopped"].strip(),
            "next_step": parsed["next_step"].strip(),
            "source": "gemini",
            "note": f"Model: {MODEL_NAME}, anti-halüsinasiya yoxlaması keçdi",
        }
    except Exception as exc:  # noqa: BLE001 - demo heç vaxt sınmamalıdır
        result = fallback_message(ctx)
        result["source"] = "fallback"
        result["note"] = f"Lokal şablon istifadə olundu ({type(exc).__name__}: {exc})"
        return result
