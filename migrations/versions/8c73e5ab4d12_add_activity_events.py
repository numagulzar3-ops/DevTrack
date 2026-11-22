"""Persist project and task activity.

Revision ID: 8c73e5ab4d12
Revises: 44f2dd99df24
"""

from alembic import op
import sqlalchemy as sa

revision = "8c73e5ab4d12"
down_revision = "44f2dd99df24"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "activity_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_activity_events_owner_id", "activity_events", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_events_owner_id", table_name="activity_events")
    op.drop_table("activity_events")
