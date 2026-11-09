"""İctimai demo rejimi (DEMO_MODE=1).

Açıq demoda bütün ziyarətçilər eyni demo işçi/menecer hesabını və eyni bazanı paylaşır. Ona görə:
  * menecerin elanları, tədbir qeydi və məsul sahəsi sərbəst mətn deyil, yalnız aşağıdakı hazır şablonlardan biri ola bilər
    (heç kim başqa ziyarətçilərin ekranına öz mətnini yaya bilməsin);
  * demo məlumatı DEMO_RESET_MINUTES dəqiqədən bir avtomatik sıfırlanır (core.reset_demo()).
Şablonların AZ və EN variantı var; server hər ikisini qəbul edir, interfeys oxuyanın dilində göstərir.
"""
from .config import env_flag, env_int

ANNOUNCEMENTS = [
    {"az": "PR review üçün 24 saatlıq qayda tətbiq edirik.", "en": "We are introducing a 24-hour PR review rule."},
    {"az": "Qeyri-sabit (flaky) testlər bu həftə karantinə alınır.", "en": "Flaky tests are being quarantined this week."},
    {"az": "Çərşənbə günləri görüşsüz fokus günüdür.", "en": "Wednesdays are now meeting-free focus days."},
    {"az": "Tələblərlə bağlı suallar üçün gündəlik 15 dəqiqəlik vaxt ayırırıq.",
     "en": "We are adding a daily 15-minute slot for questions about requirements."},
    {"az": "Lokal mühit qurulumu üçün yeni bələdçi hazırlanır.", "en": "A new local environment setup guide is in progress."},
]
NOTES = [
    {"az": "Səbəbi araşdırırıq.", "en": "We are investigating the root cause."},
    {"az": "Həll növbəti sprintə planlaşdırılıb.", "en": "A fix is planned for the next sprint."},
    {"az": "Məsul komandaya ötürülüb.", "en": "Handed over to the owning team."},
    {"az": "Həll olunub, nəticəni izləyirik.", "en": "Resolved, we are monitoring the outcome."},
]
OWNERS = [
    {"az": "DevOps komandası", "en": "DevOps team"},
    {"az": "QA komandası", "en": "QA team"},
    {"az": "Platforma komandası", "en": "Platform team"},
    {"az": "Komanda rəhbəri", "en": "Team lead"},
]


def enabled() -> bool:
    return env_flag("DEMO_MODE", False)


def reset_minutes() -> int:
    """Avtomatik sıfırlama intervalı (dəqiqə). Yalnız DEMO_MODE-da işləyir; 0 söndürür."""
    return max(0, env_int("DEMO_RESET_MINUTES", 30)) if enabled() else 0


def _texts(templates) -> set:
    return {t[lang] for t in templates for lang in ("az", "en")}


def allowed_announcement(text: str) -> bool:
    return not enabled() or text in _texts(ANNOUNCEMENTS)


def allowed_action(note: str, owner: str) -> bool:
    if not enabled():
        return True
    return (not note or note in _texts(NOTES)) and (not owner or owner in _texts(OWNERS))


def public_config() -> dict:
    """/api/bootstrap-a əlavə olunur: interfeys demo rejimində mətn sahələri əvəzinə şablon seçimi göstərir."""
    if not enabled():
        return {"enabled": False}
    return {"enabled": True, "reset_minutes": reset_minutes(),
            "announcements": ANNOUNCEMENTS, "notes": NOTES, "owners": OWNERS}
