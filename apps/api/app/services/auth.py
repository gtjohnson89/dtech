from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.community import IdentityProvider, MagicLinkToken, User, UserIdentity, UserRole


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            return None
        return uuid.UUID(sub)
    except (JWTError, ValueError):
        return None


def ensure_admin_role(user: User) -> None:
    if user.email and user.email.lower() in settings.admin_email_set:
        user.role = UserRole.admin


def get_or_create_user_by_email(db: Session, email: str, display_name: str | None = None) -> User:
    normalized = email.strip().lower()
    user = db.query(User).filter(User.email == normalized).one_or_none()
    if user is None:
        user = User(email=normalized, display_name=display_name or normalized.split("@")[0])
        ensure_admin_role(user)
        db.add(user)
        db.flush()
        identity = UserIdentity(
            user_id=user.id,
            provider=IdentityProvider.email,
            provider_user_id=normalized,
        )
        db.add(identity)
    else:
        ensure_admin_role(user)
        existing = (
            db.query(UserIdentity)
            .filter(
                UserIdentity.user_id == user.id,
                UserIdentity.provider == IdentityProvider.email,
            )
            .one_or_none()
        )
        if existing is None:
            db.add(
                UserIdentity(
                    user_id=user.id,
                    provider=IdentityProvider.email,
                    provider_user_id=normalized,
                )
            )
    return user


def login_with_identity(
    db: Session,
    *,
    provider: IdentityProvider,
    provider_user_id: str,
    email: str | None = None,
    display_name: str | None = None,
    avatar_url: str | None = None,
) -> User:
    """Provider-agnostic login used by magic-link (email) and future Facebook Login."""
    identity = (
        db.query(UserIdentity)
        .filter(
            UserIdentity.provider == provider,
            UserIdentity.provider_user_id == provider_user_id,
        )
        .one_or_none()
    )
    if identity:
        user = identity.user
        if display_name and not user.display_name:
            user.display_name = display_name
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if email and not user.email:
            user.email = email.strip().lower()
        ensure_admin_role(user)
        return user

    user: User | None = None
    if email:
        user = db.query(User).filter(User.email == email.strip().lower()).one_or_none()

    if user is None:
        user = User(
            email=email.strip().lower() if email else None,
            display_name=display_name,
            avatar_url=avatar_url,
        )
        ensure_admin_role(user)
        db.add(user)
        db.flush()
    else:
        if display_name and not user.display_name:
            user.display_name = display_name
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        ensure_admin_role(user)

    db.add(
        UserIdentity(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
        )
    )
    return user


def create_magic_link(
    db: Session, email: str, redirect_path: str | None = None
) -> tuple[MagicLinkToken, str]:
    raw = secrets.token_urlsafe(32)
    token = MagicLinkToken(
        email=email.strip().lower(),
        token_hash=hash_token(raw),
        redirect_path=redirect_path,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.MAGIC_LINK_EXPIRE_MINUTES),
    )
    db.add(token)
    return token, raw


def consume_magic_link(db: Session, raw_token: str) -> User | None:
    token = (
        db.query(MagicLinkToken)
        .filter(MagicLinkToken.token_hash == hash_token(raw_token))
        .one_or_none()
    )
    if token is None or token.used_at is not None:
        return None
    now = datetime.now(timezone.utc)
    expires = token.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        return None
    token.used_at = now
    user = get_or_create_user_by_email(db, token.email)
    return user
