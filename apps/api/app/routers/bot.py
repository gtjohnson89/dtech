from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.domain import Observation, Problem, Project, ResearchRun
from app.schemas.api import BotObservationIn, BotProblemUpsert, BotProjectUpsert, BotRunIn
from app.services.deps import require_bot

router = APIRouter(prefix="/api/bot", tags=["bot"], dependencies=[Depends(require_bot)])


@router.post("/observations")
def upsert_observation(body: BotObservationIn, db: Session = Depends(get_db)) -> dict:
    if body.content_hash:
        existing = (
            db.query(Observation)
            .filter(Observation.content_hash == body.content_hash)
            .one_or_none()
        )
        if existing:
            return {"ok": True, "id": str(existing.id), "duplicate": True}

    primary = body.problem_ids[0] if body.problem_ids else None
    obs = Observation(
        problem_id=primary,
        problem_ids=body.problem_ids or None,
        paraphrase=body.paraphrase,
        severity=body.severity,
        engagement=body.engagement,
        content_hash=body.content_hash,
        run_id=body.run_id,
        observed_at=body.observed_at,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return {"ok": True, "id": str(obs.id), "duplicate": False}


@router.put("/problems/{problem_id}")
def upsert_problem(problem_id: str, body: BotProblemUpsert, db: Session = Depends(get_db)) -> dict:
    if body.id != problem_id:
        body.id = problem_id
    pr = db.get(Problem, problem_id)
    if pr is None:
        pr = Problem(id=problem_id, title=body.title, summary=body.summary)
        db.add(pr)
    pr.title = body.title
    pr.status = body.status
    pr.domain = body.domain
    pr.summary = body.summary
    pr.first_seen = body.first_seen
    pr.last_new_signal_at = body.last_new_signal_at
    pr.aliases = body.aliases
    pr.evidence_dates = body.evidence_dates
    pr.rollup = body.rollup
    pr.scores = body.scores
    pr.notes = body.notes
    db.commit()
    return {"ok": True, "id": problem_id}


@router.put("/projects/{project_id}")
def upsert_project(project_id: str, body: BotProjectUpsert, db: Session = Depends(get_db)) -> dict:
    p = db.get(Project, project_id)
    extra = body.data or {}
    if p is None:
        p = Project(id=project_id, title=body.title)
        db.add(p)
    p.title = body.title
    p.status = body.status
    p.priority = body.priority
    p.homepage_preview = body.homepage_preview or extra.get("homepagePreview")
    p.problem = body.problem or extra.get("problem")
    p.solution = body.solution or extra.get("solution")
    p.source = body.source or extra.get("source")
    p.costs = body.costs or extra.get("costs")
    p.scores = body.scores or extra.get("scores")
    p.notes = body.notes or extra.get("notes")
    for field, attr in [
        ("whyWidespread", "why_widespread"),
        ("targetUser", "target_user"),
        ("fitForGeorge", "fit_for_george"),
        ("feasibility", "feasibility"),
        ("market", "market"),
        ("softwarePlan", "software_plan"),
        ("solved", "solved"),
        ("unsolved", "unsolved"),
        ("nextActions", "next_actions"),
        ("artifacts", "artifacts"),
        ("bomCartId", "bom_cart_id"),
    ]:
        if field in extra:
            setattr(p, attr, extra[field])
    db.commit()
    return {"ok": True, "id": project_id}


@router.post("/runs")
def upsert_run(body: BotRunIn, db: Session = Depends(get_db)) -> dict:
    run = db.get(ResearchRun, body.id)
    if run is None:
        run = ResearchRun(id=body.id)
        db.add(run)
    run.kind = body.kind
    run.window_days = body.window_days
    run.started_at = body.started_at
    run.completed_at = body.completed_at
    run.source = body.source
    run.group_url = body.group_url
    run.access_ok = body.access_ok
    run.method = body.method
    run.new_observations = body.new_observations
    run.problems_touched = body.problems_touched
    run.raw = body.raw
    db.commit()
    return {"ok": True, "id": body.id}
