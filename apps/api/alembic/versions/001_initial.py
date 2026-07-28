"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-07-27

Note: for local bootstrap we also use Base.metadata.create_all in app.seed.
This revision documents the intended schema for Alembic-managed environments.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Prefer create_all via seed for greenfield local; production can stamp this.
    # Full autogenerate can replace this later once the schema stabilizes.
    pass


def downgrade() -> None:
    pass
