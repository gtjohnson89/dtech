from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: uuid.UUID
    email: str | None
    display_name: str | None
    role: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class MagicLinkRequest(BaseModel):
    email: EmailStr
    redirect_path: str | None = None


class MagicLinkResponse(BaseModel):
    message: str
    # Only present when DEV_RETURN_MAGIC_LINK is true
    dev_token: str | None = None
    dev_verify_url: str | None = None


class VerifyRequest(BaseModel):
    token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    redirect_path: str | None = None


class ProjectSummary(BaseModel):
    id: str
    title: str
    homepage_preview: str | None
    status: str
    priority: int
    problem: str | None
    solution: str | None
    costs: dict[str, Any] | None
    scores: dict[str, Any] | None
    community_vote_count: int
    parent_project_id: str | None = None
    branch_label: str | None = None
    problem_ids: list[str] = []
    target_price_usd: float | None = None
    user_has_voted: bool = False

    model_config = {"from_attributes": True}


class ProjectDetail(ProjectSummary):
    source: dict[str, Any] | None
    why_widespread: str | None
    target_user: str | None
    feasibility: dict[str, Any] | None
    market: dict[str, Any] | None
    software_plan: dict[str, Any] | None
    solved: list[Any] | None
    unsolved: list[Any] | None
    next_actions: list[Any] | None
    notes: str | None
    suggestion_count: int = 0
    cart_grand_total_usd: float | None = None


class ProblemSummary(BaseModel):
    id: str
    title: str
    status: str
    domain: str | None
    summary: str
    scores: dict[str, Any] | None
    community_vote_count: int
    linked_project_ids: list[str] = []
    need: float | None = None
    opportunity: float | None = None
    user_has_voted: bool = False

    model_config = {"from_attributes": True}


class ObservationOut(BaseModel):
    id: uuid.UUID
    paraphrase: str
    observed_at: datetime | None
    severity: float | None = None

    model_config = {"from_attributes": True}


class ProblemDetail(ProblemSummary):
    first_seen: date | None
    last_new_signal_at: date | None
    rollup: dict[str, Any] | None
    notes: str | None
    observations: list[ObservationOut] = []
    linked_projects: list[ProjectSummary] = []


class SuggestionCreate(BaseModel):
    project_id: str
    body: str = Field(min_length=3, max_length=500)
    tag: Literal["must_have", "nice_to_have", "worry"] | None = None


class SuggestionOut(BaseModel):
    id: uuid.UUID
    project_id: str
    body: str
    tag: str | None
    status: str
    vote_count: int
    created_at: datetime
    author_display_name: str | None = None
    user_has_voted: bool = False

    model_config = {"from_attributes": True}


class VoteRequest(BaseModel):
    target_type: Literal["project", "problem", "suggestion"]
    target_id: str


class VoteResponse(BaseModel):
    target_type: str
    target_id: str
    voted: bool
    vote_count: int


class ReportCreate(BaseModel):
    suggestion_id: uuid.UUID
    reason: str = Field(min_length=3, max_length=500)


class AdminSuggestionPatch(BaseModel):
    status: Literal["pending", "visible", "hidden", "spam", "accepted_into_proposal"]


class HomeStats(BaseModel):
    project_count: int
    problem_count: int
    total_project_votes: int
    total_suggestions: int
    latest_research_at: datetime | None = None


class BotObservationIn(BaseModel):
    paraphrase: str
    problem_ids: list[str] = []
    severity: float | None = None
    engagement: float | None = None
    content_hash: str | None = None
    run_id: str | None = None
    observed_at: datetime | None = None


class BotProblemUpsert(BaseModel):
    id: str
    title: str
    status: str = "active"
    domain: str | None = None
    summary: str
    first_seen: date | None = None
    last_new_signal_at: date | None = None
    aliases: list[str] | None = None
    evidence_dates: list[str] | None = None
    rollup: dict[str, Any] | None = None
    scores: dict[str, Any] | None = None
    notes: str | None = None


class BotProjectUpsert(BaseModel):
    id: str
    title: str
    status: str = "research"
    priority: int = 99
    homepage_preview: str | None = None
    problem: str | None = None
    solution: str | None = None
    source: dict[str, Any] | None = None
    costs: dict[str, Any] | None = None
    scores: dict[str, Any] | None = None
    notes: str | None = None
    data: dict[str, Any] | None = None


class BotRunIn(BaseModel):
    id: str
    kind: str | None = None
    window_days: int | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    source: str | None = None
    group_url: str | None = None
    access_ok: bool | None = None
    method: str | None = None
    new_observations: int | None = None
    problems_touched: list[str] | None = None
    raw: dict[str, Any] | None = None
