from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.schemas.api import AuthResponse, MagicLinkRequest, MagicLinkResponse, UserOut, VerifyRequest
from app.services.auth import consume_magic_link, create_access_token, create_magic_link
from app.services.deps import get_current_user, get_current_user_optional
from app.models.community import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/magic-link", response_model=MagicLinkResponse)
def request_magic_link(body: MagicLinkRequest, db: Session = Depends(get_db)) -> MagicLinkResponse:
    _, raw = create_magic_link(db, body.email, body.redirect_path)
    db.commit()
    verify_url = f"{settings.APP_PUBLIC_URL}/auth/verify?token={raw}"
    print(f"[dtech magic-link] {body.email} → {verify_url}")
    resp = MagicLinkResponse(
        message="Check your email for a sign-in link. (In local dev, the link is also logged to the API console.)"
    )
    if settings.DEV_RETURN_MAGIC_LINK:
        resp.dev_token = raw
        resp.dev_verify_url = verify_url
    return resp


@router.post("/verify", response_model=AuthResponse)
def verify_magic_link(
    body: VerifyRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    from fastapi import HTTPException

    # Need redirect path from token before consume clears it — re-query after
    from app.services.auth import hash_token
    from app.models.community import MagicLinkToken

    stored = (
        db.query(MagicLinkToken)
        .filter(MagicLinkToken.token_hash == hash_token(body.token))
        .one_or_none()
    )
    redirect = stored.redirect_path if stored else None
    user = consume_magic_link(db, body.token)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired sign-in link")
    if user.banned_at is not None:
        raise HTTPException(status_code=403, detail="Account suspended")
    token = create_access_token(user.id)
    db.commit()
    response.set_cookie(
        key="dtech_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=not settings.DEBUG,
    )
    return AuthResponse(
        access_token=token,
        user=UserOut.model_validate(user),
        redirect_path=redirect,
    )


@router.get("/me", response_model=UserOut | None)
def me(user: User | None = Depends(get_current_user_optional)) -> UserOut | None:
    if user is None:
        return None
    return UserOut.model_validate(user)


@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie("dtech_token")
    return {"ok": True}
