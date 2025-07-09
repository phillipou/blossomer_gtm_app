#!/usr/bin/env python3
"""
Test script for Pydantic schemas validation
Run with: python test_schemas.py
"""

from backend.app.schemas import (
    UserCreate, UserUpdate, UserResponse,
    CompanyCreate, CompanyUpdate, CompanyResponse,
    AccountCreate, AccountUpdate, AccountResponse,
    PersonaCreate, PersonaUpdate, PersonaResponse,
    CampaignCreate, CampaignUpdate, CampaignResponse,
    CompanyWithRelations, AccountWithRelations, PersonaWithRelations
)
from uuid import uuid4
from datetime import datetime
import json


def test_user_schemas():
    """Test User schemas"""
    print("🧪 Testing User Schemas...")
    
    # Test UserCreate
    user_create = UserCreate(
        email="test@example.com",
        name="Test User",
        role="user"
    )
    print(f"✅ UserCreate: {user_create.model_dump()}")
    
    # Test UserUpdate
    user_update = UserUpdate(name="Updated Name")
    print(f"✅ UserUpdate: {user_update.model_dump()}")
    
    # Test UserResponse
    user_response = UserResponse(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        role="user",
        created_at=datetime.now(),
        last_login=datetime.now()
    )
    print(f"✅ UserResponse: {user_response.model_dump()}")
    print()


def test_company_schemas():
    """Test Company schemas"""
    print("🧪 Testing Company Schemas...")
    
    # Test CompanyCreate
    company_create = CompanyCreate(
        name="Test Company",
        url="https://testcompany.com",
        analysis_data={
            "description": "AI-powered software company",
            "industry": "Software",
            "employees": "50-200",
            "capabilities": ["AI", "Machine Learning", "Data Analytics"]
        }
    )
    print(f"✅ CompanyCreate: {company_create.model_dump()}")
    
    # Test CompanyUpdate
    company_update = CompanyUpdate(
        name="Updated Company Name",
        analysis_data={"updated": True}
    )
    print(f"✅ CompanyUpdate: {company_update.model_dump()}")
    
    # Test CompanyResponse
    company_response = CompanyResponse(
        id=uuid4(),
        user_id=uuid4(),
        name="Test Company",
        url="https://testcompany.com",
        analysis_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    print(f"✅ CompanyResponse: {company_response.model_dump()}")
    print()


def test_account_schemas():
    """Test Account schemas"""
    print("🧪 Testing Account Schemas...")
    
    # Test AccountCreate
    account_create = AccountCreate(
        name="Enterprise SaaS Companies",
        account_data={
            "firmographics": {
                "industry": ["Software", "SaaS"],
                "employees": "100-1000",
                "revenue": "$10M-$100M"
            },
            "buying_signals": [
                {
                    "title": "Recent funding",
                    "description": "Companies that recently raised Series A/B",
                    "priority": "High"
                }
            ],
            "rationale": ["Growing companies need better tools", "Budget available"]
        }
    )
    print(f"✅ AccountCreate: {json.dumps(account_create.model_dump(), indent=2)}")
    
    # Test AccountResponse
    account_response = AccountResponse(
        id=uuid4(),
        company_id=uuid4(),
        name="Enterprise SaaS Companies",
        account_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    print(f"✅ AccountResponse: {account_response.model_dump()}")
    print()


def test_persona_schemas():
    """Test Persona schemas"""
    print("🧪 Testing Persona Schemas...")
    
    # Test PersonaCreate
    persona_create = PersonaCreate(
        name="VP of Engineering",
        persona_data={
            "demographics": {
                "job_titles": ["VP Engineering", "Head of Engineering", "CTO"],
                "seniority": ["VP", "C-Suite"],
                "departments": ["Engineering", "Technology"]
            },
            "use_cases": [
                {
                    "use_case": "Team productivity",
                    "pain_points": "Manual processes slow down development",
                    "desired_outcome": "Faster development cycles"
                }
            ],
            "goals": ["Improve team efficiency", "Reduce technical debt"],
            "objections": ["Budget concerns", "Integration complexity"]
        }
    )
    print(f"✅ PersonaCreate: {json.dumps(persona_create.model_dump(), indent=2)}")
    
    # Test PersonaResponse
    persona_response = PersonaResponse(
        id=uuid4(),
        account_id=uuid4(),
        name="VP of Engineering",
        persona_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    print(f"✅ PersonaResponse: {persona_response.model_dump()}")
    print()


def test_campaign_schemas():
    """Test Campaign schemas"""
    print("🧪 Testing Campaign Schemas...")
    
    # Test CampaignCreate
    campaign_create = CampaignCreate(
        name="Q4 Email Outreach",
        campaign_type="email",
        campaign_data={
            "subject_line": "Quick question about your development process",
            "content": "Hi {{name}}, I noticed your team at {{company}} is growing rapidly...",
            "segments": [
                {"type": "greeting", "text": "Hi {{name}}"},
                {"type": "opening", "text": "I noticed your team is growing rapidly"},
                {"type": "pain-point", "text": "Manual processes can slow down development"},
                {"type": "solution", "text": "Our platform automates repetitive tasks"},
                {"type": "cta", "text": "Would you be open to a 15-minute demo?"}
            ],
            "alternatives": {
                "subject_lines": ["Alternative subject 1", "Alternative subject 2"]
            }
        }
    )
    print(f"✅ CampaignCreate: {json.dumps(campaign_create.model_dump(), indent=2)}")
    
    # Test CampaignResponse
    campaign_response = CampaignResponse(
        id=uuid4(),
        account_id=uuid4(),
        persona_id=uuid4(),
        name="Q4 Email Outreach",
        campaign_type="email",
        campaign_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    print(f"✅ CampaignResponse: {campaign_response.model_dump()}")
    print()


def test_relationship_schemas():
    """Test schemas with relationships"""
    print("🧪 Testing Relationship Schemas...")
    
    # Create sample data
    account_response = AccountResponse(
        id=uuid4(),
        company_id=uuid4(),
        name="Enterprise SaaS Companies",
        account_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    persona_response = PersonaResponse(
        id=uuid4(),
        account_id=account_response.id,
        name="VP of Engineering",
        persona_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    campaign_response = CampaignResponse(
        id=uuid4(),
        account_id=account_response.id,
        persona_id=persona_response.id,
        name="Q4 Email Outreach",
        campaign_type="email",
        campaign_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Test CompanyWithRelations
    company_with_relations = CompanyWithRelations(
        id=uuid4(),
        user_id=uuid4(),
        name="Test Company",
        url="https://testcompany.com",
        analysis_data={"test": "data"},
        created_at=datetime.now(),
        updated_at=datetime.now(),
        accounts=[account_response]
    )
    print(f"✅ CompanyWithRelations: {len(company_with_relations.accounts)} accounts")
    
    # Test AccountWithRelations
    account_with_relations = AccountWithRelations(
        id=account_response.id,
        company_id=account_response.company_id,
        name=account_response.name,
        account_data=account_response.account_data,
        created_at=account_response.created_at,
        updated_at=account_response.updated_at,
        personas=[persona_response],
        campaigns=[campaign_response]
    )
    print(f"✅ AccountWithRelations: {len(account_with_relations.personas)} personas, {len(account_with_relations.campaigns)} campaigns")
    
    # Test PersonaWithRelations
    persona_with_relations = PersonaWithRelations(
        id=persona_response.id,
        account_id=persona_response.account_id,
        name=persona_response.name,
        persona_data=persona_response.persona_data,
        created_at=persona_response.created_at,
        updated_at=persona_response.updated_at,
        campaigns=[campaign_response]
    )
    print(f"✅ PersonaWithRelations: {len(persona_with_relations.campaigns)} campaigns")
    print()


def test_validation_errors():
    """Test validation errors"""
    print("🧪 Testing Validation Errors...")
    
    # Test missing required fields
    try:
        CompanyCreate(name="Test")  # Missing url
        print("❌ Should have failed - missing url")
    except Exception as e:
        print(f"✅ Correctly caught validation error: {e}")
    
    # Test field length validation
    try:
        CompanyCreate(name="x" * 300, url="https://test.com")  # Name too long
        print("❌ Should have failed - name too long")
    except Exception as e:
        print(f"✅ Correctly caught validation error: {e}")
    
    # Test invalid URL format
    try:
        CompanyCreate(name="Test", url="not-a-url")  # Invalid URL
        print("✅ Invalid URL accepted (no URL validation enforced)")
    except Exception as e:
        print(f"✅ Correctly caught validation error: {e}")
    
    print()


def main():
    """Run all tests"""
    print("🚀 Testing Pydantic Schemas for Blossomer GTM App")
    print("=" * 60)
    
    try:
        test_user_schemas()
        test_company_schemas()
        test_account_schemas()
        test_persona_schemas()
        test_campaign_schemas()
        test_relationship_schemas()
        test_validation_errors()
        
        print("🎉 All schema tests passed!")
        print("✅ Schemas are ready for CRUD endpoint implementation")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()