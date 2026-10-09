from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["PR_REVIEW_WAIT", "CI_FLAKY", "MEETING_LOAD", "UNCLEAR_REQUIREMENTS", "TOOLING"]


class Strict(BaseModel):
    # Naməlum sahə (məsələn "source_code") gəlsə hadisə rədd olunur
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class Source(Strict):
    client: str
    version: str


class Session(Strict):
    state: str
    last_activity_at: str
    idle_duration_sec: int = Field(ge=0)


class Workspace(Strict):
    repo: str
    branch: str


class Action(Strict):
    type: str
    file: str
    symbol: str
    line_range: list[int] = Field(min_length=2, max_length=2)
    lines_added: int = Field(ge=0)
    lines_removed: int = Field(ge=0)
    language: str


class FirstError(Strict):
    code: str
    line: int


class Diagnostics(Strict):
    errors: int = Field(ge=0)
    warnings: int = Field(ge=0)
    first_error: FirstError


class TestState(Strict):
    runner: str
    passed: int = Field(ge=0)
    failed: int = Field(ge=0)
    failing_test: str


class PullRequest(Strict):
    id: int
    title: str
    status: str
    unresolved_comments: int = Field(ge=0)


class Privacy(Strict):
    # Literal[False]: true gələrsə 422 qaytarılır, hadisə saxlanmır
    screen_capture: Literal[False]
    keystroke_content: Literal[False]
    source_code_content: Literal[False]


class IdeEvent(Strict):
    schema_id: str = Field(alias="schema")
    event_id: str
    source: Source
    developer_ref: str = Field(min_length=3, max_length=64)
    emitted_at: str
    session: Session
    workspace: Workspace
    last_meaningful_action: Action
    diagnostics: Diagnostics
    test_state: TestState
    pull_request: PullRequest
    privacy: Privacy


class SurveyIn(Strict):
    developer_ref: str = Field(min_length=3, max_length=64)
    reason_id: str = Field(max_length=20)
    category: Optional[Category] = None


class ReminderIn(Strict):
    developer_ref: str = Field(min_length=3, max_length=64)
    lang: Literal["az", "en"] = "az"
