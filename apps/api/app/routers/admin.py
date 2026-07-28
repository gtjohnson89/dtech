from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.community import Suggestion, SuggestionStatus, User, UserRole
from app.schemas.api import AdminSuggestionPatch, SuggestionOut, UserOut
from app.services.deps import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/suggestions", response_model=list[SuggestionOut])
def admin_list_suggestions(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[SuggestionOut]:
    q = db.query(Suggestion).order_by(Suggestion.vote_count.desc(), Suggestion.created_at.desc())
    if status:
        q = q.filter(Suggestion.status == SuggestionStatus(status))
    rows = q.limit(200).all()
    return [
        SuggestionOut(
            id=s.id,
            project_id=s.project_id,
            body=s.body,
            tag=s.tag.value if s.tag else None,
            status=s.status.value,
            vote_count=s.vote_count,
            created_at=s.created_at,
            author_display_name=s.author.display_name if s.author else None,
        )
        for s in rows
    ]


@router.patch("/suggestions/{suggestion_id}", response_model=SuggestionOut)
def admin_patch_suggestion(
    suggestion_id: uuid.UUID,
    body: AdminSuggestionPatch,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> SuggestionOut:
    s = db.get(Suggestion, suggestion_id)
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    s.status = SuggestionStatus(body.status)
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
        author_display_name=s.author.display_name if s.author else None,
    )


@router.get("/users", response_model=list[UserOut])
def admin_list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> list[UserOut]:
    users = db.query(User).order_by(User.created_at.desc()).limit(200).all()
    return [UserOut.model_validate(u) for u in users]


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> dict:
    from datetime import datetime, timezone

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot ban admin")
    user.banned_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}
