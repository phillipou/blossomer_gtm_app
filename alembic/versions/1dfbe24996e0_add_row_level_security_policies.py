"""add_row_level_security_policies

Revision ID: 1dfbe24996e0
Revises: c6c775cde65c
Create Date: 2025-07-09 12:52:20.977076

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1dfbe24996e0'
down_revision: Union[str, Sequence[str], None] = 'c6c775cde65c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable Row-Level Security for all tables
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE companies ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE accounts ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE personas ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY")
    
    # Create RLS policies for users table
    # Users can only access their own records
    op.execute("""
        CREATE POLICY users_policy ON users
        USING (id = current_setting('app.current_user_id')::uuid)
        WITH CHECK (id = current_setting('app.current_user_id')::uuid)
    """)
    
    # Create RLS policies for companies table
    # Users can only access companies they own
    op.execute("""
        CREATE POLICY companies_policy ON companies
        USING (user_id = current_setting('app.current_user_id')::uuid)
        WITH CHECK (user_id = current_setting('app.current_user_id')::uuid)
    """)
    
    # Create RLS policies for accounts table
    # Users can only access accounts that belong to their companies
    op.execute("""
        CREATE POLICY accounts_policy ON accounts
        USING (company_id IN (
            SELECT id FROM companies 
            WHERE user_id = current_setting('app.current_user_id')::uuid
        ))
        WITH CHECK (company_id IN (
            SELECT id FROM companies 
            WHERE user_id = current_setting('app.current_user_id')::uuid
        ))
    """)
    
    # Create RLS policies for personas table
    # Users can only access personas that belong to their accounts
    op.execute("""
        CREATE POLICY personas_policy ON personas
        USING (account_id IN (
            SELECT a.id FROM accounts a
            JOIN companies c ON a.company_id = c.id
            WHERE c.user_id = current_setting('app.current_user_id')::uuid
        ))
        WITH CHECK (account_id IN (
            SELECT a.id FROM accounts a
            JOIN companies c ON a.company_id = c.id
            WHERE c.user_id = current_setting('app.current_user_id')::uuid
        ))
    """)
    
    # Create RLS policies for campaigns table
    # Users can only access campaigns that belong to their accounts
    op.execute("""
        CREATE POLICY campaigns_policy ON campaigns
        USING (account_id IN (
            SELECT a.id FROM accounts a
            JOIN companies c ON a.company_id = c.id
            WHERE c.user_id = current_setting('app.current_user_id')::uuid
        ))
        WITH CHECK (account_id IN (
            SELECT a.id FROM accounts a
            JOIN companies c ON a.company_id = c.id
            WHERE c.user_id = current_setting('app.current_user_id')::uuid
        ))
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop RLS policies
    op.execute("DROP POLICY IF EXISTS users_policy ON users")
    op.execute("DROP POLICY IF EXISTS companies_policy ON companies")
    op.execute("DROP POLICY IF EXISTS accounts_policy ON accounts")
    op.execute("DROP POLICY IF EXISTS personas_policy ON personas")
    op.execute("DROP POLICY IF EXISTS campaigns_policy ON campaigns")
    
    # Disable Row-Level Security for all tables
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE companies DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE accounts DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE personas DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY")
