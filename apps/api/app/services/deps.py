from __future__ import annotations

import uuid

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.community import User, UserRole
from app.services.auth import decode_access_token


def get_current_user_optional(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    dtech_token: str | None = Cookie(default=None, alias="dtech_token"),
) -> User | None:
    raw = None
    if authorization and authorization.lower().startswith("bearer "):
        raw = authorization.split(" ", 1)[1].strip()
    elif dtech_token:
        raw = dtech_token
    if not raw:
        return None
    user_id = decode_access_token(raw)
    if user_id is None:
        return None
    user = db.get(User, user_id)
    if user is None or user.banned_at is not None:
        return None
    return user


def get_current_user(user: User | None = Depends(get_current_user_optional)) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in required")
    return user


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


def require_bot(
    authorization: str | None = Header(default=None),
    x_bot_token: str | None = Header(default=None, alias="X-Bot-Token"),
) -> None:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif x_bot_token:
        token = x_bot_token
    if not token or token != settings.BOT_SERVICE_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bot token")
