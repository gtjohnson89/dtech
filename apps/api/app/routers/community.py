from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.community import (
    ContentReport,
    Suggestion,
    SuggestionStatus,
    SuggestionTag,
    User,
    Vote,
    VoteTargetType,
)
from app.models.domain import Problem, Project
from app.schemas.api import (
    ReportCreate,
    SuggestionCreate,
    SuggestionOut,
    VoteRequest,
    VoteResponse,
)
from app.services.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api", tags=["community"])


def _recount_target(db: Session, target_type: VoteTargetType, target_id: str) -> int:
    count = (
        db.query(Vote)
        .filter(Vote.target_type == target_type, Vote.target_id == target_id)
        .count()
    )
    if target_type == VoteTargetType.project:
        obj = db.get(Project, target_id)
        if obj:
            obj.community_vote_count = count
    elif target_type == VoteTargetType.problem:
        obj = db.get(Problem, target_id)
        if obj:
            obj.community_vote_count = count
    elif target_type == VoteTargetType.suggestion:
        obj = db.get(Suggestion, target_id)
        if obj:
            obj.vote_count = count
    return count


@router.post("/votes", response_model=VoteResponse)
def cast_vote(
    body: VoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> VoteResponse:
    target_type = VoteTargetType(body.target_type)
    target_id = body.target_id

    if target_type == VoteTargetType.project and not db.get(Project, target_id):
        raise HTTPException(status_code=404, detail="Project not found")
    if target_type == VoteTargetType.problem and not db.get(Problem, target_id):
        raise HTTPException(status_code=404, detail="Problem not found")
    if target_type == VoteTargetType.suggestion:
        s = db.get(Suggestion, target_id)
        if not s or s.status != SuggestionStatus.visible:
            raise HTTPException(status_code=404, detail="Suggestion not found")

    existing = (
        db.query(Vote)
        .filter(
            Vote.user_id == user.id,
            Vote.target_type == target_type,
            Vote.target_id == target_id,
        )
        .one_or_none()
    )
    if existing:
        db.delete(existing)
        db.flush()
        count = _recount_target(db, target_type, target_id)
        db.commit()
        return VoteResponse(target_type=body.target_type, target_id=target_id, voted=False, vote_count=count)

    db.add(Vote(user_id=user.id, target_type=target_type, target_id=target_id))
    db.flush()
    count = _recount_target(db, target_type, target_id)
    db.commit()
    return VoteResponse(target_type=body.target_type, target_id=target_id, voted=True, vote_count=count)


@router.get("/projects/{project_id}/suggestions", response_model=list[SuggestionOut])
def list_suggestions(
    project_id: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> list[SuggestionOut]:
    if not db.get(Project, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(Suggestion)
        .filter(
            Suggestion.project_id == project_id,
            Suggestion.status == SuggestionStatus.visible,
        )
        .order_by(Suggestion.vote_count.desc(), Suggestion.created_at.desc())
        .all()
    )
    voted: set[str] = set()
    if user:
        voted = {
            str(v.target_id)
            for v in db.query(Vote)
            .filter(
                Vote.user_id == user.id,
                Vote.target_type == VoteTargetType.suggestion,
            )
            .all()
        }
    out: list[SuggestionOut] = []
    for s in rows:
        out.append(
            SuggestionOut(
                id=s.id,
                project_id=s.project_id,
                body=s.body,
                tag=s.tag.value if s.tag else None,
                status=s.status.value,
                vote_count=s.vote_count,
                created_at=s.created_at,
                author_display_name=s.author.display_name if s.author else None,
                user_has_voted=str(s.id) in voted,
            )
        )
    return out


@router.post("/suggestions", response_model=SuggestionOut)
def create_suggestion(
    body: SuggestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SuggestionOut:
    if not db.get(Project, body.project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    text = body.body.strip()
    if len(text) > settings.SUGGESTION_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Suggestion too long")
    tag = SuggestionTag(body.tag) if body.tag else None
    s = Suggestion(
        project_id=body.project_id,
        author_id=user.id,
        body=text,
        tag=tag,
        status=SuggestionStatus.visible,
        vote_count=0,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return SuggestionOut(
        id=s.id,
        project_id=s.project_id,
        body=s.body,
        tag=s.tag.value if s.tag else None,
        status=s.status.value,
        vote_count=s.vote_count,
        created_at=s.created_at,
        author_display_name=user.display_name,
        user_has_voted=False,
    )


@router.post("/reports")
def report_suggestion(
    body: ReportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    s = db.get(Suggestion, body.suggestion_id)
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    db.add(
        ContentReport(
            suggestion_id=body.suggestion_id,
            reporter_id=user.id,
            reason=body.reason.strip(),
        )
    )
    db.commit()
    return {"ok": True, "message": "Thanks — we'll review this."}
