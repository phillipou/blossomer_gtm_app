"""make_email_and_name_required_in_users

Revision ID: 24b20636debb
Revises: 1dfbe24996e0
Create Date: 2025-07-09 20:00:18.338387

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "24b20636debb"
down_revision: Union[str, Sequence[str], None] = "1dfbe24996e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make email and name required fields in users table."""
    # Update any existing NULL values to empty string before making NOT NULL
    # This ensures the migration doesn't fail if there are existing users with NULL values
    op.execute("UPDATE users SET email = '' WHERE email IS NULL")
    op.execute("UPDATE users SET name = '' WHERE name IS NULL")

    # Make email and name columns NOT NULL
    op.alter_column(
        "users", "email", existing_type=sa.VARCHAR(length=255), nullable=False
    )
    op.alter_column(
        "users", "name", existing_type=sa.VARCHAR(length=255), nullable=False
    )


def downgrade() -> None:
    """Revert email and name to optional fields in users table."""
    # Make email and name columns nullable again
    op.alter_column(
        "users", "email", existing_type=sa.VARCHAR(length=255), nullable=True
    )
    op.alter_column(
        "users", "name", existing_type=sa.VARCHAR(length=255), nullable=True
    )
