#!/usr/bin/env python3
"""
Test schemas with actual database models
Run with: python test_schemas_with_models.py
"""

from backend.app.models import User, Company, Account, Persona, Campaign
from backend.app.schemas import (
    CompanyCreate, CompanyResponse,
    AccountCreate, AccountResponse,
    PersonaCreate, PersonaResponse,
    CampaignCreate, CampaignResponse
)
from uuid import uuid4
from datetime import datetime


def test_model_to_schema_conversion():
    """Test converting database models to Pydantic schemas"""
    print("🔄 Testing Model to Schema Conversion")
    print("=" * 50)
    
    # Create mock database model instances
    user_id = uuid4()
    company_id = uuid4()
    account_id = uuid4()
    persona_id = uuid4()
    
    # Create User model instance
    user = User(
        id=user_id,
        email="test@example.com",
        name="Test User",
        role="user",
        created_at=datetime.now(),
        last_login=datetime.now()
    )
    
    # Create Company model instance
    company = Company(
        id=company_id,
        user_id=user_id,
        name="Test Company",
        url="https://testcompany.com",
        analysis_data={"description": "Test company description"},
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Create Account model instance
    account = Account(
        id=account_id,
        company_id=company_id,
        name="Test Account",
        account_data={
            "firmographics": {"industry": ["Software"]},
            "buying_signals": [],
            "rationale": ["Test rationale"]
        },
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Create Persona model instance
    persona = Persona(
        id=persona_id,
        account_id=account_id,
        name="Test Persona",
        persona_data={
            "demographics": {"job_titles": ["Engineer"]},
            "use_cases": [],
            "goals": ["Test goal"]
        },
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Create Campaign model instance
    campaign = Campaign(
        id=uuid4(),
        account_id=account_id,
        persona_id=persona_id,
        name="Test Campaign",
        campaign_type="email",
        campaign_data={
            "subject_line": "Test Subject",
            "content": "Test content",
            "segments": []
        },
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    try:
        # Convert models to schemas using from_attributes
        company_schema = CompanyResponse.model_validate(company)
        account_schema = AccountResponse.model_validate(account)
        persona_schema = PersonaResponse.model_validate(persona)
        campaign_schema = CampaignResponse.model_validate(campaign)
        
        print("✅ Company model -> schema conversion successful")
        print(f"   Company: {company_schema.name} (ID: {company_schema.id})")
        
        print("✅ Account model -> schema conversion successful")
        print(f"   Account: {account_schema.name} (ID: {account_schema.id})")
        
        print("✅ Persona model -> schema conversion successful")
        print(f"   Persona: {persona_schema.name} (ID: {persona_schema.id})")
        
        print("✅ Campaign model -> schema conversion successful")
        print(f"   Campaign: {campaign_schema.name} (ID: {campaign_schema.id})")
        
        return True
        
    except Exception as e:
        print(f"❌ Model to schema conversion failed: {e}")
        return False


def test_schema_to_model_conversion():
    """Test converting Pydantic schemas to database models"""
    print("\n🔄 Testing Schema to Model Conversion")
    print("=" * 50)
    
    user_id = uuid4()
    company_id = uuid4()
    account_id = uuid4()
    persona_id = uuid4()
    
    try:
        # Create schema instances
        company_create = CompanyCreate(
            name="Schema Test Company",
            url="https://schematest.com",
            analysis_data={"test": "data"}
        )
        
        account_create = AccountCreate(
            name="Schema Test Account",
            account_data={"firmographics": {"industry": ["Tech"]}}
        )
        
        persona_create = PersonaCreate(
            name="Schema Test Persona",
            persona_data={"demographics": {"job_titles": ["Developer"]}}
        )
        
        campaign_create = CampaignCreate(
            name="Schema Test Campaign",
            campaign_type="email",
            campaign_data={"subject_line": "Test", "content": "Test content"}
        )
        
        # Convert schemas to models
        company_model = Company(
            id=company_id,
            user_id=user_id,
            **company_create.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        account_model = Account(
            id=account_id,
            company_id=company_id,
            **account_create.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        persona_model = Persona(
            id=persona_id,
            account_id=account_id,
            **persona_create.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        campaign_model = Campaign(
            id=uuid4(),
            account_id=account_id,
            persona_id=persona_id,
            **campaign_create.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        print("✅ Company schema -> model conversion successful")
        print(f"   Company: {company_model.name}")
        
        print("✅ Account schema -> model conversion successful")
        print(f"   Account: {account_model.name}")
        
        print("✅ Persona schema -> model conversion successful")
        print(f"   Persona: {persona_model.name}")
        
        print("✅ Campaign schema -> model conversion successful")
        print(f"   Campaign: {campaign_model.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Schema to model conversion failed: {e}")
        return False


def test_field_compatibility():
    """Test field compatibility between models and schemas"""
    print("\n🔍 Testing Field Compatibility")
    print("=" * 50)
    
    # Check if all model fields are covered by schemas
    model_fields = {
        "Company": ["id", "user_id", "name", "url", "analysis_data", "created_at", "updated_at"],
        "Account": ["id", "company_id", "name", "account_data", "created_at", "updated_at"],
        "Persona": ["id", "account_id", "name", "persona_data", "created_at", "updated_at"],
        "Campaign": ["id", "account_id", "persona_id", "name", "campaign_type", "campaign_data", "created_at", "updated_at"]
    }
    
    schema_fields = {
        "Company": list(CompanyResponse.model_fields.keys()),
        "Account": list(AccountResponse.model_fields.keys()),
        "Persona": list(PersonaResponse.model_fields.keys()),
        "Campaign": list(CampaignResponse.model_fields.keys())
    }
    
    all_compatible = True
    
    for model_name, expected_fields in model_fields.items():
        actual_fields = schema_fields[model_name]
        
        missing_fields = set(expected_fields) - set(actual_fields)
        extra_fields = set(actual_fields) - set(expected_fields)
        
        if missing_fields or extra_fields:
            all_compatible = False
            print(f"❌ {model_name} field mismatch:")
            if missing_fields:
                print(f"   Missing in schema: {missing_fields}")
            if extra_fields:
                print(f"   Extra in schema: {extra_fields}")
        else:
            print(f"✅ {model_name} fields perfectly aligned")
    
    return all_compatible


def main():
    """Run all compatibility tests"""
    print("🧪 Schema-Model Compatibility Test")
    print("=" * 60)
    
    try:
        test1_passed = test_model_to_schema_conversion()
        test2_passed = test_schema_to_model_conversion()
        test3_passed = test_field_compatibility()
        
        if test1_passed and test2_passed and test3_passed:
            print("\n🎉 All compatibility tests passed!")
            print("✅ Schemas are fully compatible with database models")
            print("✅ Ready for CRUD implementation")
        else:
            print("\n❌ Some compatibility tests failed")
            print("🔧 Review schema-model alignment before proceeding")
            
    except Exception as e:
        print(f"❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()