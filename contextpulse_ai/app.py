"""ContextPulse AI: Streamlit demo (bütün məlumatlar mock JSON-dan gəlir)."""
import pandas as pd
import streamlit as st

from CPAI.ai_engine import generate_reentry_message
from data_loader import load_json

st.set_page_config(page_title="ContextPulse AI", page_icon="⚡", layout="wide")

st.markdown(
    """
    <style>
    button[kind="primary"],
    button[data-testid="stBaseButton-primary"] {
        background-color: #E5383B !important;
        border: 1px solid #BA181B !important;
        color: #FFFFFF !important;
        font-weight: 700 !important;
    }
    button[kind="primary"]:hover,
    button[data-testid="stBaseButton-primary"]:hover {
        background-color: #BA181B !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

BREAK_REASONS = ["Toplantı", "Qısa fasilə", "Başqa tapşırıq", "Tıxanma (blocker)"]
BLOCKER_OPTIONS = [
    "Yoxdur, davam edirəm",
    "Test / CI xətası",
    "Code review gözləyirəm",
    "Sənəd / API aydın deyil",
    "Başqa komandadan asılıyam",
]

# ---------------------------------------------------------------- session state
for _key, _default in {
    "idle": False,
    "ai_result": None,
    "break_reason": None,
    "blocker_answer": None,
}.items():
    st.session_state.setdefault(_key, _default)


def start_idle() -> None:
    st.session_state.idle = True
    st.session_state.ai_result = None
    st.session_state.break_reason = None
    st.session_state.blocker_answer = None


def close_widget() -> None:
    st.session_state.idle = False
    st.session_state.ai_result = None


def set_answer(key: str, value: str) -> None:
    st.session_state[key] = value


# ---------------------------------------------------------------- İşçi paneli
def render_widget(ctx: dict, result: dict) -> None:
    idle_minutes = ctx["session"]["idle_duration_minutes"]
    with st.container(border=True):
        st.markdown("### ⚡ Re-engagement Widget")
        st.caption(f"{idle_minutes} dəqiqəlik fasilədən sonra qayıdışınız üçün hazırlandı")

        st.subheader(result["headline"])
        st.markdown(f"**Harada qaldınız:** {result['where_you_stopped']}")
        st.markdown(f"**İlk addım:** {result['next_step']}")
        st.caption(f"AI mənbəyi: {result['source']} · {result['note']}")

        with st.expander("Şəffaflıq: AI hansı məlumatı gördü?"):
            st.json(ctx)

        st.divider()
        st.markdown("**1-klikli mikro-sorğu**")

        st.write("Fasilənin səbəbi nə idi?")
        cols = st.columns(len(BREAK_REASONS))
        for i, (col, label) in enumerate(zip(cols, BREAK_REASONS)):
            col.button(
                label,
                key=f"break_{i}",
                on_click=set_answer,
                args=("break_reason", label),
            )
        if st.session_state.break_reason:
            st.success(f"Qeyd edildi: {st.session_state.break_reason}")

        st.write("Hazırda tıxanma (blocker) var?")
        cols = st.columns(len(BLOCKER_OPTIONS))
        for i, (col, label) in enumerate(zip(cols, BLOCKER_OPTIONS)):
            col.button(
                label,
                key=f"blocker_{i}",
                on_click=set_answer,
                args=("blocker_answer", label),
            )
        if st.session_state.blocker_answer:
            st.success(f"Qeyd edildi: {st.session_state.blocker_answer}")

        st.caption("Cavablar menecerə yalnız K-anonim (qrup) şəkildə ötürülür, fərdi məlumat görünmür.")
        st.button("Widget-i bağla", key="close_widget", on_click=close_widget)


def render_employee_tab() -> None:
    ctx = load_json("last_action.json")
    session = ctx["session"]

    st.subheader("İşçi Paneli")
    st.caption("Məlumat mənbəyi: yalnız IDE hadisələri və PR metadata. Ekran görüntüsü, keylogger və clipboard yoxdur.")

    c1, c2, c3 = st.columns(3)
    c1.markdown(f"**IDE**\n\n{session['ide']}")
    c2.markdown(f"**Workspace**\n\n{session['workspace']}")
    c3.markdown(f"**Branch**\n\n`{session['branch']}`")

    st.button(
        "🔴 Fasiləni Simulyasiya Et (Simulate Idle)",
        type="primary",
        key="simulate_idle",
        on_click=start_idle,
    )

    if st.session_state.idle:
        if st.session_state.ai_result is None:
            with st.spinner("Kontekst bərpa olunur..."):
                st.session_state.ai_result = generate_reentry_message(ctx)
        render_widget(ctx, st.session_state.ai_result)


# ---------------------------------------------------------------- Menecer paneli
def render_manager_tab() -> None:
    data = load_json("blockers.json")
    k = data["privacy"]["k_anonymity_threshold"]

    # K-anonimlik: qrup ölçüsü k-dan kiçik olan tıxanmalar heç vaxt göstərilmir.
    visible = [b for b in data["blockers"] if b["affected_developers"] >= k]
    suppressed = len(data["blockers"]) - len(visible)
    stats = data["reengagement_stats"]

    st.subheader("Menecer Paneli")
    st.caption(
        f"Komanda: {data['team']['team_id']} · Dövr: {data['team']['period']} · "
        f"K-anonimlik həddi: k = {k}"
    )

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Komanda ölçüsü", data["team"]["team_size"])
    m2.metric("Görünən tıxanmalar", len(visible))
    m3.metric(f"Gizlədilən qruplar (< {k})", suppressed)
    m4.metric(
        "Re-engagement vaxtı",
        f"{stats['with_contextpulse_minutes']:.0f} dəq",
        delta=f"-{stats['baseline_minutes'] - stats['with_contextpulse_minutes']:.0f} dəq",
        delta_color="inverse",
    )
    st.caption(stats["note"])

    df = pd.DataFrame(visible)
    lost_hours = (df["affected_developers"] * df["avg_stall_minutes"]).sum() / 60

    st.markdown(f"**Təxmini itirilmiş vaxt (görünən tıxanmalar üzrə): {lost_hours:.1f} saat**")
    st.bar_chart(df.set_index("category")["affected_developers"])

    table = df.rename(
        columns={
            "category": "Tıxanma kateqoriyası",
            "area": "Sahə",
            "affected_developers": "Təsirlənən developer sayı",
            "avg_stall_minutes": "Orta dayanma (dəq)",
            "trend": "Trend",
            "suggested_action": "Tövsiyə olunan addım",
        }
    )
    st.dataframe(table, hide_index=True)

    st.markdown("**Tövsiyə olunan addımlar**")
    for b in visible:
        with st.container(border=True):
            st.markdown(f"**{b['category']}** · {b['area']}")
            st.write(b["suggested_action"])

    st.info(
        f"{suppressed} tıxanma qrupu təsirlənən developer sayı {k}-dan az olduğu üçün "
        "məxfilik məqsədilə gizlədilib. Heç bir fərdi işçi məlumatı göstərilmir."
    )


# ---------------------------------------------------------------- Əsas
st.title("⚡ ContextPulse AI")
st.caption("Code of War · Fasilədən sonra işə qayıdış vaxtını sıfıra endirən B2B platforma")

tab_employee, tab_manager = st.tabs(["👩‍💻 İşçi Paneli", "📊 Menecer Paneli"])
with tab_employee:
    render_employee_tab()
with tab_manager:
    render_manager_tab()
