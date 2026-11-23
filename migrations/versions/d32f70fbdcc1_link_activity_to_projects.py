"""Link new activity events to their project."""

from alembic import op
import sqlalchemy as sa

revision = "d32f70fbdcc1"
down_revision = "f2c91bd428a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("activity_events", sa.Column("project_id", sa.Integer(), nullable=True))
    op.create_index("ix_activity_events_project_id", "activity_events", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_events_project_id", table_name="activity_events")
    op.drop_column("activity_events", "project_id")
