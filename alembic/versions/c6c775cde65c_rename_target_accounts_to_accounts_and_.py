"""Rename target_accounts to accounts and target_personas to personas

Revision ID: c6c775cde65c
Revises: 84e1e3f22ed9
Create Date: 2025-07-09 07:35:10.531126

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c6c775cde65c'
down_revision: Union[str, Sequence[str], None] = '84e1e3f22ed9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, rename tables to new names
    op.rename_table('target_accounts', 'accounts')
    op.rename_table('target_personas', 'personas')
    
    # Update column names in personas table
    op.alter_column('personas', 'target_account_id', new_column_name='account_id')
    
    # Update foreign key constraints in personas table
    op.drop_constraint('target_personas_target_account_id_fkey', 'personas', type_='foreignkey')
    op.create_foreign_key('personas_account_id_fkey', 'personas', 'accounts', ['account_id'], ['id'])
    
    # Update column names in campaigns table
    op.alter_column('campaigns', 'target_account_id', new_column_name='account_id')
    op.alter_column('campaigns', 'target_persona_id', new_column_name='persona_id')
    
    # Update foreign key constraints in campaigns table
    op.drop_constraint('campaigns_target_account_id_fkey', 'campaigns', type_='foreignkey')
    op.drop_constraint('campaigns_target_persona_id_fkey', 'campaigns', type_='foreignkey')
    op.create_foreign_key('campaigns_account_id_fkey', 'campaigns', 'accounts', ['account_id'], ['id'])
    op.create_foreign_key('campaigns_persona_id_fkey', 'campaigns', 'personas', ['persona_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Reverse the foreign key constraints in campaigns table
    op.drop_constraint('campaigns_persona_id_fkey', 'campaigns', type_='foreignkey')
    op.drop_constraint('campaigns_account_id_fkey', 'campaigns', type_='foreignkey')
    op.create_foreign_key('campaigns_target_persona_id_fkey', 'campaigns', 'personas', ['persona_id'], ['id'])
    op.create_foreign_key('campaigns_target_account_id_fkey', 'campaigns', 'accounts', ['account_id'], ['id'])
    
    # Reverse the column names in campaigns table
    op.alter_column('campaigns', 'persona_id', new_column_name='target_persona_id')
    op.alter_column('campaigns', 'account_id', new_column_name='target_account_id')
    
    # Reverse the foreign key constraints in personas table
    op.drop_constraint('personas_account_id_fkey', 'personas', type_='foreignkey')
    op.create_foreign_key('target_personas_target_account_id_fkey', 'personas', 'accounts', ['account_id'], ['id'])
    
    # Reverse the column names in personas table
    op.alter_column('personas', 'account_id', new_column_name='target_account_id')
    
    # Reverse the table renames
    op.rename_table('personas', 'target_personas')
    op.rename_table('accounts', 'target_accounts')
