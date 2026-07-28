from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(40), default="active", index=True)
    domain: Mapped[str | None] = mapped_column(String(80), nullable=True)
    summary: Mapped[str] = mapped_column(Text)
    first_seen: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_new_signal_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    aliases: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    evidence_dates: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    rollup: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    scores: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    community_vote_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    observations: Mapped[list[Observation]] = relationship(back_populates="problem_ref", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    homepage_preview: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="research", index=True)
    priority: Mapped[int] = mapped_column(Integer, default=99)
    created: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated: Mapped[date | None] = mapped_column(Date, nullable=True)
    source: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_widespread: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_user: Mapped[str | None] = mapped_column(Text, nullable=True)
    fit_for_george: Mapped[str | None] = mapped_column(Text, nullable=True)
    feasibility: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    market: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    costs: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    bom_cart_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    software_plan: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    solved: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    unsolved: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    next_actions: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    artifacts: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    scores: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    community_vote_count: Mapped[int] = mapped_column(Integer, default=0)
    parent_project_id: Mapped[str | None] = mapped_column(
        String(120), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    branch_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    branch_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    suggestions: Mapped[list] = relationship("Suggestion", back_populates="project")
    revisions: Mapped[list[ProjectRevision]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    cart: Mapped[Cart | None] = relationship(back_populates="project", uselist=False)


class ProjectRevision(Base):
    __tablename__ = "project_revisions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(String(120), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB)
    source: Mapped[str] = mapped_column(String(40), default="seed")  # seed | operator | ai_proposal_accepted
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship(back_populates="revisions")


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_id: Mapped[str | None] = mapped_column(
        String(120), ForeignKey("problems.id", ondelete="SET NULL"), nullable=True, index=True
    )
    problem_ids: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    paraphrase: Mapped[str] = mapped_column(Text)
    severity: Mapped[float | None] = mapped_column(Float, nullable=True)
    engagement: Mapped[float | None] = mapped_column(Float, nullable=True)
    engagement_raw: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    run_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    problem_ref: Mapped[Problem | None] = relationship(back_populates="observations")


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    project_id: Mapped[str | None] = mapped_column(
        String(120), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    updated: Mapped[date | None] = mapped_column(Date, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    pricing_mode: Mapped[str | None] = mapped_column(String(40), nullable=True)
    vendors_preferred: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    subtotal_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    shipping_estimate_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    tax_estimate_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    grand_total_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    missing_items: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    project: Mapped[Project | None] = relationship(back_populates="cart")
    items: Mapped[list[CartItem]] = relationship(back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[str] = mapped_column(String(120), ForeignKey("carts.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(300))
    qty: Mapped[int] = mapped_column(Integer, default=1)
    unit_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    vendor: Mapped[str | None] = mapped_column(String(80), nullable=True)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=True)

    cart: Mapped[Cart] = relationship(back_populates="items")


class ResearchRun(Base):
    __tablename__ = "research_runs"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    kind: Mapped[str | None] = mapped_column(String(80), nullable=True)
    window_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str | None] = mapped_column(String(300), nullable=True)
    group_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    access_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    method: Mapped[str | None] = mapped_column(String(200), nullable=True)
    new_observations: Mapped[int | None] = mapped_column(Integer, nullable=True)
    problems_touched: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    raw: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
