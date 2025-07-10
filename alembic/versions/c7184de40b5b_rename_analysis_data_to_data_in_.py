"""rename analysis_data to data in companies table

Revision ID: c7184de40b5b
Revises: 7fc3f1494203
Create Date: 2025-07-09 21:04:24.001752

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7184de40b5b'
down_revision: Union[str, Sequence[str], None] = '7fc3f1494203'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename analysis_data column to data in companies table
    op.alter_column('companies', 'analysis_data', new_column_name='data')


def downgrade() -> None:
    """Downgrade schema."""
    # Rename data column back to analysis_data in companies table
    op.alter_column('companies', 'data', new_column_name='analysis_data')
