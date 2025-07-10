"""remove_email_and_name_from_users

Revision ID: 7fc3f1494203
Revises: 24b20636debb
Create Date: 2025-07-09 20:35:51.089984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fc3f1494203'
down_revision: Union[str, Sequence[str], None] = '24b20636debb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove email and name columns from users table."""
    # Drop the email and name columns
    op.drop_column('users', 'email')
    op.drop_column('users', 'name')


def downgrade() -> None:
    """Add back email and name columns to users table."""
    # Add back the columns (nullable since existing users won't have these values)
    op.add_column('users', sa.Column('email', sa.VARCHAR(length=255), nullable=True))
    op.add_column('users', sa.Column('name', sa.VARCHAR(length=255), nullable=True))
    
    # Create the unique constraint on email
    op.create_unique_constraint('uq_users_email', 'users', ['email'])
