"""Seed Postgres from the existing dtech/ JSON snapshot.

Usage (from apps/api):
  .venv/bin/python -m app.seed
"""
from __future__ import annotations

import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path

from app.db import Base, SessionLocal, engine
from app.models import (  # noqa: F401 — register models
    Cart,
    CartItem,
    Observation,
    Problem,
    Project,
    ProjectRevision,
    ResearchRun,
)


def repo_root() -> Path:
    # apps/api/app/seed.py → repo root
    return Path(__file__).resolve().parents[3]


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def seed_problems(db, problems_dir: Path) -> int:
    count = 0
    for path in sorted(problems_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        pid = data["id"]
        existing = db.get(Problem, pid)
        if existing is None:
            existing = Problem(id=pid, title=data.get("title", pid), summary=data.get("summary", ""))
            db.add(existing)
        existing.title = data.get("title", existing.title)
        existing.status = data.get("status", "active")
        existing.domain = data.get("domain")
        existing.summary = data.get("summary", "")
        existing.first_seen = parse_date(data.get("firstSeen"))
        existing.last_new_signal_at = parse_date(data.get("lastNewSignalAt"))
        existing.aliases = data.get("aliases")
        existing.evidence_dates = data.get("evidenceDates")
        existing.rollup = data.get("rollup")
        existing.scores = data.get("scores")
        existing.notes = data.get("notes")
        count += 1
    return count


def seed_projects(db, projects_dir: Path) -> int:
    count = 0
    for path in sorted(projects_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        pid = data["id"]
        existing = db.get(Project, pid)
        if existing is None:
            existing = Project(id=pid, title=data.get("title", pid))
            db.add(existing)
        existing.title = data.get("title", existing.title)
        existing.homepage_preview = data.get("homepagePreview")
        existing.status = data.get("status", "research")
        existing.priority = int(data.get("priority") or 99)
        existing.created = parse_date(data.get("created"))
        existing.updated = parse_date(data.get("updated"))
        existing.source = data.get("source")
        existing.problem = data.get("problem")
        existing.solution = data.get("solution")
        existing.why_widespread = data.get("whyWidespread")
        existing.target_user = data.get("targetUser")
        existing.fit_for_george = data.get("fitForGeorge")
        existing.feasibility = data.get("feasibility")
        existing.market = data.get("market")
        existing.costs = data.get("costs")
        existing.bom_cart_id = data.get("bomCartId")
        existing.software_plan = data.get("softwarePlan")
        existing.solved = data.get("solved")
        existing.unsolved = data.get("unsolved")
        existing.next_actions = data.get("nextActions")
        existing.artifacts = data.get("artifacts")
        existing.scores = data.get("scores")
        existing.notes = data.get("notes")
        db.flush()
        # seed revision snapshot once if none
        if not existing.revisions:
            db.add(
                ProjectRevision(
                    project_id=pid,
                    snapshot=data,
                    source="seed",
                    note="Imported from dtech/projects JSON",
                )
            )
        count += 1
    return count


def seed_carts(db, carts_dir: Path) -> int:
    count = 0
    for path in sorted(carts_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        cid = data["id"]
        cart = db.get(Cart, cid)
        if cart is None:
            cart = Cart(id=cid)
            db.add(cart)
        cart.project_id = data.get("projectId")
        cart.title = data.get("title")
        cart.updated = parse_date(data.get("updated"))
        cart.currency = data.get("currency") or "USD"
        cart.pricing_mode = data.get("pricingMode")
        cart.vendors_preferred = data.get("vendorsPreferred")
        cart.subtotal_usd = data.get("subtotalUsd")
        cart.shipping_estimate_usd = data.get("shippingEstimateUsd")
        cart.tax_estimate_usd = data.get("taxEstimateUsd")
        cart.grand_total_usd = data.get("grandTotalUsd")
        cart.missing_items = data.get("missingItems")
        cart.notes = data.get("notes")
        cart.raw = data
        # replace items
        cart.items.clear()
        db.flush()
        for item in data.get("items") or []:
            db.add(
                CartItem(
                    cart_id=cid,
                    name=item.get("name") or "item",
                    qty=int(item.get("qty") or 1),
                    unit_usd=item.get("unitUsd"),
                    total_usd=item.get("totalUsd"),
                    vendor=item.get("vendor"),
                    url=item.get("url"),
                    sku=item.get("sku"),
                    notes=item.get("notes"),
                    required=bool(item.get("required", True)),
                )
            )
        count += 1
    return count


def seed_observations(db, obs_dir: Path) -> int:
    count = 0
    for path in sorted(obs_dir.glob("*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            content_hash = data.get("contentHash") or data.get("content_hash")
            if content_hash:
                existing = (
                    db.query(Observation)
                    .filter(Observation.content_hash == content_hash)
                    .one_or_none()
                )
                if existing:
                    continue
            problem_ids = data.get("problemIds") or data.get("problem_ids") or []
            paraphrase = (
                data.get("paraphrase")
                or data.get("text")
                or data.get("summary")
                or data.get("body")
                or ""
            )
            if not paraphrase:
                # store a compact fallback from remaining fields
                paraphrase = data.get("notes") or json.dumps(data)[:400]
            primary = problem_ids[0] if problem_ids else data.get("problemId")
            eng = data.get("engagement") or data.get("engagementProxy")
            eng_raw = eng if isinstance(eng, dict) else None
            eng_num: float | None
            if isinstance(eng, (int, float)):
                eng_num = float(eng)
            elif isinstance(eng, dict):
                eng_num = float(
                    (eng.get("reactions") or 0) + (eng.get("comments") or 0)
                )
            else:
                eng_num = None
            paraphrase = paraphrase or data.get("summary") or ""
            obs = Observation(
                problem_id=primary,
                problem_ids=problem_ids or None,
                paraphrase=paraphrase,
                severity=data.get("severity"),
                engagement=eng_num,
                engagement_raw=eng_raw,
                content_hash=content_hash,
                run_id=data.get("runId") or data.get("run_id"),
                observed_at=parse_dt(data.get("observedAt") or data.get("publishedAt")),
                published_at=parse_dt(data.get("publishedAt")),
                raw=data,
            )
            db.add(obs)
            count += 1
    return count


def seed_runs(db, runs_dir: Path) -> int:
    count = 0
    for path in sorted(runs_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        rid = data.get("id") or path.stem
        run = db.get(ResearchRun, rid)
        if run is None:
            run = ResearchRun(id=rid)
            db.add(run)
        run.kind = data.get("kind")
        run.window_days = data.get("windowDays")
        run.started_at = parse_dt(data.get("startedAt"))
        run.completed_at = parse_dt(data.get("completedAt"))
        run.source = data.get("source")
        run.group_url = data.get("group")
        run.access_ok = data.get("accessOk")
        run.method = data.get("method")
        run.new_observations = data.get("newObservations")
        run.problems_touched = data.get("problemsTouched")
        run.raw = data
        count += 1
    return count


def main() -> int:
    root = repo_root()
    dtech = root / "dtech"
    if not dtech.is_dir():
        print(f"Cannot find dtech data at {dtech}", file=sys.stderr)
        return 1

    print(f"Creating tables on {engine.url} …")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        n_problems = seed_problems(db, dtech / "research" / "problems")
        n_projects = seed_projects(db, dtech / "projects")
        n_carts = seed_carts(db, dtech / "carts")
        n_obs = seed_observations(db, dtech / "research" / "observations")
        n_runs = seed_runs(db, dtech / "research" / "runs")
        db.commit()
        print(
            f"Seeded problems={n_problems} projects={n_projects} "
            f"carts={n_carts} observations={n_obs} runs={n_runs}"
        )
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
