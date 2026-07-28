from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.community import Suggestion, SuggestionStatus, User, Vote, VoteTargetType
from app.models.domain import Cart, Observation, Problem, Project, ResearchRun
from app.schemas.api import (
    HomeStats,
    ObservationOut,
    ProblemDetail,
    ProblemSummary,
    ProjectDetail,
    ProjectSummary,
)
from app.services.deps import get_current_user_optional

router = APIRouter(prefix="/api", tags=["catalog"])


def _problem_ids_from_source(source: dict | None) -> list[str]:
    if not source:
        return []
    ids = source.get("problemIds") or source.get("problem_ids") or []
    return list(ids)


def _project_summary(p: Project, user: User | None, voted_ids: set[str]) -> ProjectSummary:
    costs = p.costs or {}
    return ProjectSummary(
        id=p.id,
        title=p.title,
        homepage_preview=p.homepage_preview,
        status=p.status,
        priority=p.priority,
        problem=p.problem,
        solution=p.solution,
        costs=p.costs,
        scores=p.scores,
        community_vote_count=p.community_vote_count or 0,
        parent_project_id=p.parent_project_id,
        branch_label=p.branch_label,
        problem_ids=_problem_ids_from_source(p.source),
        target_price_usd=costs.get("targetPriceUsd") or costs.get("target_price_usd"),
        user_has_voted=p.id in voted_ids,
    )


def _problem_summary(pr: Problem, voted_ids: set[str]) -> ProblemSummary:
    scores = pr.scores or {}
    rollup = pr.rollup or {}
    linked = rollup.get("linkedProjectIds") or rollup.get("linked_project_ids") or []
    return ProblemSummary(
        id=pr.id,
        title=pr.title,
        status=pr.status,
        domain=pr.domain,
        summary=pr.summary,
        scores=pr.scores,
        community_vote_count=pr.community_vote_count or 0,
        linked_project_ids=list(linked),
        need=scores.get("need"),
        opportunity=scores.get("opportunity"),
        user_has_voted=pr.id in voted_ids,
    )


def _user_voted_ids(
    db: Session, user: User | None, target_type: VoteTargetType
) -> set[str]:
    if user is None:
        return set()
    rows = (
        db.query(Vote.target_id)
        .filter(Vote.user_id == user.id, Vote.target_type == target_type)
        .all()
    )
    return {r[0] for r in rows}


@router.get("/home", response_model=HomeStats)
def home_stats(db: Session = Depends(get_db)) -> HomeStats:
    latest = db.query(func.max(ResearchRun.completed_at)).scalar()
    return HomeStats(
        project_count=db.query(func.count(Project.id)).scalar() or 0,
        problem_count=db.query(func.count(Problem.id)).scalar() or 0,
        total_project_votes=db.query(func.coalesce(func.sum(Project.community_vote_count), 0)).scalar() or 0,
        total_suggestions=db.query(func.count(Suggestion.id))
        .filter(Suggestion.status == SuggestionStatus.visible)
        .scalar()
        or 0,
        latest_research_at=latest,
    )


@router.get("/projects", response_model=list[ProjectSummary])
def list_projects(
    sort: str = Query("priority", pattern="^(priority|votes|score|title)$"),
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> list[ProjectSummary]:
    q = db.query(Project)
    if status:
        q = q.filter(Project.status == status)
    projects = q.all()
    voted = _user_voted_ids(db, user, VoteTargetType.project)

    def sort_key(p: Project):
        if sort == "votes":
            return (-(p.community_vote_count or 0), p.priority)
        if sort == "score":
            total = (p.scores or {}).get("total") or 0
            return (-total, p.priority)
        if sort == "title":
            return (p.title.lower(),)
        return (p.priority, p.title.lower())

    projects.sort(key=sort_key)
    return [_project_summary(p, user, voted) for p in projects]


@router.get("/projects/{project_id}", response_model=ProjectDetail)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> ProjectDetail:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    voted = _user_voted_ids(db, user, VoteTargetType.project)
    base = _project_summary(p, user, voted)
    suggestion_count = (
        db.query(func.count(Suggestion.id))
        .filter(
            Suggestion.project_id == p.id,
            Suggestion.status == SuggestionStatus.visible,
        )
        .scalar()
        or 0
    )
    cart = db.query(Cart).filter(Cart.project_id == p.id).one_or_none()
    return ProjectDetail(
        **base.model_dump(),
        source=p.source,
        why_widespread=p.why_widespread,
        target_user=p.target_user,
        feasibility=p.feasibility,
        market=p.market,
        software_plan=p.software_plan,
        solved=p.solved,
        unsolved=p.unsolved,
        next_actions=p.next_actions,
        notes=p.notes,
        suggestion_count=suggestion_count,
        cart_grand_total_usd=cart.grand_total_usd if cart else None,
    )


@router.get("/problems", response_model=list[ProblemSummary])
def list_problems(
    sort: str = Query("need", pattern="^(need|opportunity|votes)$"),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> list[ProblemSummary]:
    problems = db.query(Problem).all()
    voted = _user_voted_ids(db, user, VoteTargetType.problem)

    def sort_key(pr: Problem):
        scores = pr.scores or {}
        if sort == "votes":
            return -(pr.community_vote_count or 0)
        if sort == "opportunity":
            return -(scores.get("opportunity") or 0)
        return -(scores.get("need") or 0)

    problems.sort(key=sort_key)
    return [_problem_summary(pr, voted) for pr in problems]


@router.get("/problems/{problem_id}", response_model=ProblemDetail)
def get_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> ProblemDetail:
    pr = db.get(Problem, problem_id)
    if not pr:
        raise HTTPException(status_code=404, detail="Problem not found")
    voted_problems = _user_voted_ids(db, user, VoteTargetType.problem)
    voted_projects = _user_voted_ids(db, user, VoteTargetType.project)
    base = _problem_summary(pr, voted_problems)

    obs = (
        db.query(Observation)
        .filter(
            (Observation.problem_id == pr.id)
            | (Observation.problem_ids.any(pr.id))  # type: ignore[attr-defined]
        )
        .order_by(Observation.observed_at.desc().nullslast())
        .limit(20)
        .all()
    )
    # Fallback for DBs where array any is awkward
    if not obs:
        all_obs = db.query(Observation).order_by(Observation.observed_at.desc().nullslast()).limit(200).all()
        obs = [o for o in all_obs if pr.id in (o.problem_ids or []) or o.problem_id == pr.id][:20]

    linked_ids = base.linked_project_ids
    projects = db.query(Project).filter(Project.id.in_(linked_ids)).all() if linked_ids else []
    # also find projects that reference this problem in source
    for p in db.query(Project).all():
        if pr.id in _problem_ids_from_source(p.source) and p.id not in {x.id for x in projects}:
            projects.append(p)

    return ProblemDetail(
        **base.model_dump(),
        first_seen=pr.first_seen,
        last_new_signal_at=pr.last_new_signal_at,
        rollup=pr.rollup,
        notes=pr.notes,
        observations=[
            ObservationOut(
                id=o.id,
                paraphrase=o.paraphrase,
                observed_at=o.observed_at,
                severity=o.severity,
            )
            for o in obs
        ],
        linked_projects=[_project_summary(p, user, voted_projects) for p in projects],
    )
