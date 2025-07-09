#!/usr/bin/env python3
"""
Interactive schema demo for Blossomer GTM App
Run with: python interactive_schema_demo.py
"""

from backend.app.schemas import (
    CompanyCreate, AccountCreate, PersonaCreate, CampaignCreate,
    CompanyResponse, AccountResponse, PersonaResponse, CampaignResponse,
    CompanyWithRelations, AccountWithRelations, PersonaWithRelations
)
from uuid import uuid4
from datetime import datetime
import json


def demo_realistic_data_flow():
    """Demonstrate a realistic data flow through the schemas"""
    print("🎯 Realistic Data Flow Demo")
    print("=" * 50)
    
    # 1. Create a company
    print("1️⃣ Creating a company...")
    company_input = CompanyCreate(
        name="TechFlow Solutions",
        url="https://techflowsolutions.com",
        analysis_data={
            "description": "AI-powered workflow automation platform for software teams",
            "business_profile": {
                "category": "B2B SaaS workflow automation",
                "business_model": "Monthly/annual subscriptions with tiered pricing",
                "existing_customers": "50+ software companies using the platform"
            },
            "capabilities": [
                "Automated code review workflows",
                "CI/CD pipeline optimization",
                "Team collaboration tools",
                "Performance analytics dashboard"
            ],
            "positioning": {
                "key_market_belief": "Manual dev processes are the biggest bottleneck in software delivery",
                "unique_approach": "AI-driven automation that learns from team patterns"
            }
        }
    )
    
    # Simulate database save - convert to response
    company_id = uuid4()
    user_id = uuid4()
    company = CompanyResponse(
        id=company_id,
        user_id=user_id,
        name=company_input.name,
        url=company_input.url,
        analysis_data=company_input.analysis_data,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Company created: {company.name}")
    print(f"   URL: {company.url}")
    print(f"   Analysis data keys: {list(company.analysis_data.keys())}")
    print()
    
    # 2. Create an account (target customer profile)
    print("2️⃣ Creating target account profile...")
    account_input = AccountCreate(
        name="Mid-market SaaS Companies",
        account_data={
            "firmographics": {
                "industry": ["Software", "SaaS", "Technology"],
                "employees": "50-500",
                "revenue": "$5M-$50M",
                "geography": ["North America", "Europe"],
                "funding_stage": ["Series A", "Series B", "Series C"],
                "keywords": ["rapid growth", "scaling team", "CI/CD", "automation", "developer productivity"]
            },
            "buying_signals": [
                {
                    "title": "Recent engineering hiring",
                    "description": "Companies actively hiring developers indicating growth",
                    "type": "Company Data",
                    "priority": "High",
                    "detection_method": "LinkedIn job postings, company announcements"
                },
                {
                    "title": "DevOps tool adoption",
                    "description": "Recent adoption of modern development tools",
                    "type": "Tech Stack",
                    "priority": "Medium",
                    "detection_method": "GitHub repos, job descriptions, tech stack data"
                }
            ],
            "rationale": [
                "Mid-market companies have complex workflows but limited resources",
                "Growing teams need better automation to maintain velocity",
                "Budget available for tools that improve developer productivity"
            ]
        }
    )
    
    # Simulate database save
    account_id = uuid4()
    account = AccountResponse(
        id=account_id,
        company_id=company_id,
        name=account_input.name,
        account_data=account_input.account_data,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Account created: {account.name}")
    print(f"   Industries: {account.account_data['firmographics']['industry']}")
    print(f"   Company size: {account.account_data['firmographics']['employees']}")
    print(f"   Buying signals: {len(account.account_data['buying_signals'])}")
    print()
    
    # 3. Create a persona (target buyer)
    print("3️⃣ Creating target persona...")
    persona_input = PersonaCreate(
        name="VP of Engineering",
        persona_data={
            "demographics": {
                "job_titles": ["VP Engineering", "Head of Engineering", "Engineering Director"],
                "departments": ["Engineering", "Technology"],
                "seniority": ["VP", "Director", "Senior Manager"],
                "buying_roles": ["Decision Maker", "Technical Buyer", "Economic Buyer"],
                "job_description_keywords": ["team leadership", "technical strategy", "developer productivity", "scaling", "automation"]
            },
            "use_cases": [
                {
                    "use_case": "Code review automation",
                    "pain_points": "Manual code reviews slow down development cycles and create bottlenecks",
                    "capability": "AI-powered code review that catches issues early and provides instant feedback",
                    "desired_outcome": "Faster development cycles with maintained code quality"
                },
                {
                    "use_case": "CI/CD optimization",
                    "pain_points": "Build pipelines are slow and unreliable, causing deployment delays",
                    "capability": "Intelligent pipeline optimization that reduces build times by 40%",
                    "desired_outcome": "Reliable, fast deployments that don't block development"
                }
            ],
            "goals": [
                "Improve team productivity and delivery speed",
                "Reduce technical debt and improve code quality",
                "Scale engineering processes as team grows",
                "Minimize time spent on manual, repetitive tasks"
            ],
            "objections": [
                "Concerned about integration complexity with existing tools",
                "Budget approval process may be lengthy",
                "Team resistance to changing established workflows"
            ],
            "buying_signals": [
                {
                    "title": "Team scaling challenges",
                    "description": "Posts about managing growing engineering teams",
                    "type": "Social Media",
                    "priority": "High",
                    "detection_method": "LinkedIn posts, conference talks, blog posts"
                }
            ]
        }
    )
    
    # Simulate database save
    persona_id = uuid4()
    persona = PersonaResponse(
        id=persona_id,
        account_id=account_id,
        name=persona_input.name,
        persona_data=persona_input.persona_data,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Persona created: {persona.name}")
    print(f"   Job titles: {persona.persona_data['demographics']['job_titles']}")
    print(f"   Use cases: {len(persona.persona_data['use_cases'])}")
    print(f"   Goals: {len(persona.persona_data['goals'])}")
    print()
    
    # 4. Create a campaign
    print("4️⃣ Creating email campaign...")
    campaign_input = CampaignCreate(
        name="Q4 VP Engineering Outreach",
        campaign_type="email",
        campaign_data={
            "subject_line": "Quick question about your development workflow",
            "content": "Hi {{name}}, I noticed {{company}} has been growing rapidly...",
            "segments": [
                {
                    "type": "greeting",
                    "text": "Hi {{name}}"
                },
                {
                    "type": "opening",
                    "text": "I noticed {{company}} has been growing rapidly and hiring more developers"
                },
                {
                    "type": "pain-point",
                    "text": "As teams scale, manual code reviews and slow CI/CD pipelines often become major bottlenecks"
                },
                {
                    "type": "solution",
                    "text": "TechFlow's AI-powered automation platform helps engineering teams like yours maintain velocity while improving code quality"
                },
                {
                    "type": "evidence",
                    "text": "We've helped 50+ similar companies reduce their build times by 40% and speed up code reviews by 60%"
                },
                {
                    "type": "cta",
                    "text": "Would you be open to a 15-minute demo to see how this could work for your team?"
                }
            ],
            "alternatives": {
                "subject_lines": [
                    "Scaling your engineering team at {{company}}?",
                    "How {{company}} can ship code 40% faster"
                ]
            },
            "configuration": {
                "personalization": "high",
                "tone": "professional",
                "length": "short"
            }
        }
    )
    
    # Simulate database save
    campaign_id = uuid4()
    campaign = CampaignResponse(
        id=campaign_id,
        account_id=account_id,
        persona_id=persona_id,
        name=campaign_input.name,
        campaign_type=campaign_input.campaign_type,
        campaign_data=campaign_input.campaign_data,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Campaign created: {campaign.name}")
    print(f"   Type: {campaign.campaign_type}")
    print(f"   Subject: {campaign.campaign_data['subject_line']}")
    print(f"   Segments: {len(campaign.campaign_data['segments'])}")
    print()
    
    # 5. Demonstrate relationships
    print("5️⃣ Demonstrating relationships...")
    
    # Company with accounts
    company_with_accounts = CompanyWithRelations(
        id=company.id,
        user_id=company.user_id,
        name=company.name,
        url=company.url,
        analysis_data=company.analysis_data,
        created_at=company.created_at,
        updated_at=company.updated_at,
        accounts=[account]
    )
    
    # Account with personas and campaigns
    account_with_relations = AccountWithRelations(
        id=account.id,
        company_id=account.company_id,
        name=account.name,
        account_data=account.account_data,
        created_at=account.created_at,
        updated_at=account.updated_at,
        personas=[persona],
        campaigns=[campaign]
    )
    
    print(f"✅ Company '{company_with_accounts.name}' has {len(company_with_accounts.accounts)} account profiles")
    print(f"✅ Account '{account_with_relations.name}' has {len(account_with_relations.personas)} personas and {len(account_with_relations.campaigns)} campaigns")
    
    return {
        "company": company,
        "account": account,
        "persona": persona,
        "campaign": campaign,
        "company_with_relations": company_with_accounts,
        "account_with_relations": account_with_relations
    }


def demo_json_serialization(data):
    """Demonstrate JSON serialization capabilities"""
    print("\n📄 JSON Serialization Demo")
    print("=" * 50)
    
    # Test JSON serialization
    company_json = data["company"].model_dump()
    account_json = data["account"].model_dump()
    
    print("Company JSON structure:")
    print(json.dumps({
        "id": str(company_json["id"]),
        "name": company_json["name"],
        "url": company_json["url"],
        "analysis_data_keys": list(company_json["analysis_data"].keys()),
        "created_at": company_json["created_at"].isoformat()
    }, indent=2))
    
    print("\nAccount JSON structure:")
    print(json.dumps({
        "id": str(account_json["id"]),
        "company_id": str(account_json["company_id"]),
        "name": account_json["name"],
        "firmographics": account_json["account_data"]["firmographics"],
        "buying_signals_count": len(account_json["account_data"]["buying_signals"])
    }, indent=2))


def demo_update_operations():
    """Demonstrate update operations"""
    print("\n🔄 Update Operations Demo")
    print("=" * 50)
    
    # Test partial updates
    from backend.app.schemas import CompanyUpdate, AccountUpdate
    
    # Company update
    company_update = CompanyUpdate(
        name="TechFlow Solutions (Updated)",
        analysis_data={
            "description": "Updated: AI-powered workflow automation platform for software teams",
            "last_updated": "2024-Q4"
        }
    )
    
    print("Company update schema:")
    print(json.dumps(company_update.model_dump(), indent=2))
    
    # Account update
    account_update = AccountUpdate(
        name="Updated: Mid-market SaaS Companies",
        account_data={
            "firmographics": {
                "industry": ["Software", "SaaS", "Technology", "AI"],  # Added AI
                "employees": "50-500",
                "revenue": "$5M-$50M"
            }
        }
    )
    
    print("\nAccount update schema:")
    print(json.dumps(account_update.model_dump(), indent=2))


def main():
    """Run the interactive demo"""
    print("🚀 Interactive Schema Demo - Blossomer GTM App")
    print("=" * 60)
    
    try:
        # Run the realistic data flow demo
        data = demo_realistic_data_flow()
        
        # Show JSON serialization
        demo_json_serialization(data)
        
        # Show update operations
        demo_update_operations()
        
        print("\n🎉 Schema demo completed successfully!")
        print("✅ All schemas are working correctly and ready for CRUD implementation")
        print("\n💡 Next steps:")
        print("   1. Implement database CRUD operations")
        print("   2. Create FastAPI endpoints")
        print("   3. Add authentication middleware")
        print("   4. Implement row-level security")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()