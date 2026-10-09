"""AI Copilot: prompt, Gemini çağırışı, cavabın proqramla doğrulanması, fallback."""
import json
import os
import re

MASTER_PROMPT = """Sən "ContextPulse AI" adlı proqramçı köməkçisisən.
Vəzifən: proqramçı fasilədən qayıdanda ona işini davam etdirməkdə kömək edən QISA xatırlatma yazmaq.

QAYDALAR (pozulması qadağandır):
1. YALNIZ aşağıdakı JSON-da olan faktlardan istifadə et. JSON-da olmayan fayl, funksiya, xəta kodu, test adı, PR nömrəsi və ya rəqəm uydurma.
2. Məlumat çatışmırsa, həmin hissəni buraxıb keç.
3. {language} dilində, TƏK abzas, maksimum 4 qısa cümlə. Başlıq, siyahı, emoji və markdown (backtick xaric) yoxdur.
4. Fayl adı, funksiya, xəta kodu, sətir aralığı və test adını `backtick` içinə al.
5. Ardıcıllıq: (a) son dəyişdirilən funksiya və fayl, (b) açıq xəta, (c) uğursuz test, (d) PR-də həll olunmamış şərhlər, (e) "{next_label}" ilə bir konkret təklif.
6. İşçini qiymətləndirmə, irad tutma, məhsuldarlıq hökmü vermə.
7. Ekran, klaviatura və ya şəxsi məlumatdan bəhs etmə. Mənbə yalnız IDE və PR metadatasıdır.

SON MƏNALI HƏRƏKƏT (JSON):
{event_json}
"""


LANGS = {"az": ("Azərbaycan", "Ən yaxın addım:"), "en": ("İngilis (English)", "Nearest next step:")}


def build_prompt(event: dict, lang: str = "az") -> str:
    safe = {k: v for k, v in event.items() if k not in ("privacy", "source")}
    language, next_label = LANGS.get(lang, LANGS["az"])
    return MASTER_PROMPT.format(event_json=json.dumps(safe, ensure_ascii=False, indent=2),
                                language=language, next_label=next_label)


def fallback_text(ev: dict, lang: str = "az") -> str:
    a, d = ev["last_meaningful_action"], ev["diagnostics"]["first_error"]
    t, pr = ev["test_state"], ev["pull_request"]
    fname = a["file"].split("/")[-1]
    lo, hi, ln = a["line_range"][0], a["line_range"][1], d["line"]
    if lang == "en":
        parts = [f"Last time you were editing `{a['symbol']}` (`{fname}:{lo}–{hi}`).",
                 f"Error `{d['code']}` is open at line {ln}."]
        if t["failed"]:
            parts.append(f"{t['failed']} test(s) failing: `{t['failing_test']}`.")
        if pr["unresolved_comments"]:
            parts.append(f"PR #{pr['id']} has {pr['unresolved_comments']} unresolved comment(s).")
        parts.append(f"Nearest next step: check the error at line {ln}.")
        return " ".join(parts)
    parts = [f"Sonuncu dəfə `{a['symbol']}` funksiyasını dəyişirdin (`{fname}:{lo}–{hi}`).",
             f"Sətir {ln}-də `{d['code']}` xətası açıqdır."]
    if t["failed"]:
        parts.append(f"{t['failed']} test uğursuzdur: `{t['failing_test']}`.")
    if pr["unresolved_comments"]:
        parts.append(f"PR #{pr['id']} üzrə həll olunmamış {pr['unresolved_comments']} şərh var.")
    parts.append(f"Ən yaxın addım: sətir {ln}-dəki xətanı yoxlamaq.")
    return " ".join(parts)


def validate(text: str, ev: dict):
    """AI cavabındakı hər konkret iddia giriş JSON-una qarşı yoxlanır. (ok, səbəb) qaytarır."""
    a, d = ev["last_meaningful_action"], ev["diagnostics"]["first_error"]
    fname = a["file"].split("/")[-1]
    lo, hi = a["line_range"]
    allowed = {a["symbol"], a["file"], fname, d["code"], ev["test_state"]["failing_test"],
               ev["workspace"]["repo"], ev["workspace"]["branch"]}
    for sep in ("–", "-"):
        allowed.add(f"{fname}:{lo}{sep}{hi}")
        allowed.add(f"{a['file']}:{lo}{sep}{hi}")
    for token in re.findall(r"`([^`]+)`", text):
        if token.strip() not in allowed:
            return False, f"naməlum ifadə: {token}"
    for code in re.findall(r"\bTS\d{3,5}\b", text):
        if code != d["code"]:
            return False, f"naməlum xəta kodu: {code}"
    for num in re.findall(r"PR\s*#(\d+)", text):
        if int(num) != ev["pull_request"]["id"]:
            return False, f"naməlum PR: {num}"
    if not text.strip() or len(text) > 700:
        return False, "boş və ya həddən uzun cavab"
    return True, ""


def _call_gemini(prompt: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    resp = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=1024),
    )
    return (resp.text or "").strip()


def generate_reminder(ev: dict, lang: str = "az") -> dict:
    out = {"text": fallback_text(ev, lang), "source": "fallback", "code": "no_key", "validated": True,
           "badge": "fallback (no API key)", "reason": ""}
    if not os.getenv("GEMINI_API_KEY"):
        return out
    try:
        text = _call_gemini(build_prompt(ev, lang))
        ok, why = validate(text, ev)
        if ok:
            return {"text": text, "source": "gemini", "code": "gemini", "validated": True,
                    "badge": "gemini verified", "reason": ""}
        out.update(code="invalid", badge="fallback (AI answer failed verification)", reason=why)
    except Exception as e:  # şəbəkə, kvota, model adı və s.
        out.update(code="error", badge="fallback (AI unavailable)", reason=type(e).__name__)
    return out
