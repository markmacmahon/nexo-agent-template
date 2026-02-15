"""add subscribers table and subscriber_id to threads

Revision ID: a27da95f3137
Revises: a1b2c3d4e5f6
Create Date: 2026-02-15 15:32:21.593507

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a27da95f3137'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create subscribers table
    op.create_table(
        "subscribers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("app_id", sa.UUID(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["app_id"], ["apps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("app_id", "customer_id", name="uq_subscriber_app_customer"),
    )
    # Create indexes for subscribers
    op.create_index("ix_subscribers_app_last_seen", "subscribers", ["app_id", "last_seen_at"], unique=False)
    op.create_index("ix_subscribers_app_last_message", "subscribers", ["app_id", "last_message_at"], unique=False)

    # Add subscriber_id column to threads table
    op.add_column("threads", sa.Column("subscriber_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_thread_subscriber", "threads", "subscribers", ["subscriber_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_threads_subscriber", "threads", ["subscriber_id"], unique=False)


def downgrade() -> None:
    # Remove subscriber_id from threads
    op.drop_index("ix_threads_subscriber", table_name="threads")
    op.drop_constraint("fk_thread_subscriber", "threads", type_="foreignkey")
    op.drop_column("threads", "subscriber_id")

    # Drop subscribers table
    op.drop_index("ix_subscribers_app_last_message", table_name="subscribers")
    op.drop_index("ix_subscribers_app_last_seen", table_name="subscribers")
    op.drop_table("subscribers")
