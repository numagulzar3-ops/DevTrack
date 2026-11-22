"""Persist Kanban task status and preserve completed tasks."""

from alembic import op
import sqlalchemy as sa

revision = "f2c91bd428a7"
down_revision = "8c73e5ab4d12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("status", sa.String(20), server_default="todo", nullable=False),
    )
    tasks = sa.table("tasks", sa.column("completed", sa.Boolean), sa.column("status", sa.String))
    op.execute(tasks.update().where(tasks.c.completed.is_(True)).values(status=op.inline_literal("done")))


def downgrade() -> None:
    op.drop_column("tasks", "status")
