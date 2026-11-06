from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

def Text(n: int):
    return Annotated[str, StringConstraints(max_length=n)]


Category = Literal["PR_REVIEW_WAIT", "CI_FLAKY", "MEETING_LOAD", "UNCLEAR_REQUIREMENTS", "TOOLING"]


class Strict(BaseModel):
    # Naməlum sahə (məsələn "source_code") gəlsə hadisə rədd olunur
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class Source(Strict):
    client: Text(64)
    version: Text(32)


class Session(Strict):
    state: Text(32)
    last_activity_at: Text(40)
    idle_duration_sec: int = Field(ge=0)


class Workspace(Strict):
    repo: Text(200)
    branch: Text(200)


class Action(Strict):
    type: Text(40)
    file: Text(300)
    symbol: Text(200)
    line_range: list[int] = Field(min_length=2, max_length=2)
    lines_added: int = Field(ge=0)
    lines_removed: int = Field(ge=0)
    language: Text(40)


class FirstError(Strict):
    code: Text(32)
    line: int


class Diagnostics(Strict):
    errors: int = Field(ge=0)
    warnings: int = Field(ge=0)
    first_error: FirstError


class TestState(Strict):
    runner: Text(40)
    passed: int = Field(ge=0)
    failed: int = Field(ge=0)
    failing_test: Text(200)


class PullRequest(Strict):
    id: int
    title: Text(200)
    status: Text(40)
    unresolved_comments: int = Field(ge=0)


class Privacy(Strict):
    # Literal[False]: true gələrsə 422 qaytarılır, hadisə saxlanmır
    screen_capture: Literal[False]
    keystroke_content: Literal[False]
    source_code_content: Literal[False]


class IdeEvent(Strict):
    schema_id: Text(64) = Field(alias="schema")
    event_id: Text(64)
    source: Source
    developer_ref: str = Field(min_length=3, max_length=64)
    emitted_at: Text(40)
    session: Session
    workspace: Workspace
    last_meaningful_action: Action
    diagnostics: Diagnostics
    test_state: TestState
    pull_request: PullRequest
    privacy: Privacy


class SurveyIn(Strict):
    # İşçi üçün sessiyadan götürülür; yalnız IDE açarı ilə gələn sorğuda nəzərə alınır
    developer_ref: Optional[str] = Field(default=None, min_length=3, max_length=64)
    reason_id: str = Field(max_length=20)
    category: Optional[Category] = None


class ReminderIn(Strict):
    developer_ref: Optional[str] = Field(default=None, min_length=3, max_length=64)
    lang: Literal["az", "en"] = "az"


ActionStatus = Literal["investigating", "planned", "resolved"]


class ActionIn(Strict):
    """Menecerin görünən tıxanma üzrə tədbir qeydi (komanda səviyyəsində, işçi adı yoxdur)."""
    status: ActionStatus
    note: Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)] = ""
    owner: Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)] = ""


class MessageIn(Strict):
    """Menecerin bütün komandaya elanı. İstəyə görə görünən bir tıxanma mövzusuna bağlana bilər."""
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=280)]
    category: Optional[Category] = None


class LoginIn(Strict):
    """Rol əsaslı giriş sorğusu."""
    email: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
    password: Annotated[str, StringConstraints(min_length=1, max_length=120)]
    role: Optional[Literal["employee", "manager"]] = None

