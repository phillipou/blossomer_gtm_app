"""rename JSONB fields to data and campaign_type to type

Revision ID: b7adaca9c685
Revises: c7184de40b5b
Create Date: 2025-07-09 21:09:24.688287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7adaca9c685'
down_revision: Union[str, Sequence[str], None] = 'c7184de40b5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename account_data to data in accounts table
    op.alter_column('accounts', 'account_data', new_column_name='data')
    
    # Rename persona_data to data in personas table
    op.alter_column('personas', 'persona_data', new_column_name='data')
    
    # Rename campaign_type to type and campaign_data to data in campaigns table
    op.alter_column('campaigns', 'campaign_type', new_column_name='type')
    op.alter_column('campaigns', 'campaign_data', new_column_name='data')


def downgrade() -> None:
    """Downgrade schema."""
    # Reverse all column renames
    op.alter_column('campaigns', 'data', new_column_name='campaign_data')
    op.alter_column('campaigns', 'type', new_column_name='campaign_type')
    op.alter_column('personas', 'data', new_column_name='persona_data')
    op.alter_column('accounts', 'data', new_column_name='account_data')
