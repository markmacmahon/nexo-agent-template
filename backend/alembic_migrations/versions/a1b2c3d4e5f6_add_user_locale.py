"""add user locale

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-02-15 12:00:00.000000

Locale: ISO 639-1 two-letter language code. Default en (English).
Future: es (Spanish), pt (Portuguese).
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("locale", sa.String(5), nullable=False, server_default="en"),
    )


def downgrade() -> None:
    op.drop_column("user", "locale")
