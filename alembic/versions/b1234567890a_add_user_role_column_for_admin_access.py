"""add_user_role_column_for_admin_access

Revision ID: b1234567890a
Revises: a73936ff25f9
Create Date: 2025-01-09 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1234567890a"
down_revision: Union[str, Sequence[str], None] = "a73936ff25f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role column to users table
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='user'))
    
    # Create index for faster role lookups
    op.create_index('idx_users_role', 'users', ['role'])


def downgrade() -> None:
    # Remove index and column
    op.drop_index('idx_users_role', table_name='users')
    op.drop_column('users', 'role')