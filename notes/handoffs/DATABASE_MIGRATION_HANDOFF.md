# Database Migration Implementation - Handoff Document

*Created: July 8, 2025*
*Status: In Progress - Database Models Completed*

## 🎯 What We're Trying to Do

**Goal**: Migrate from localStorage-based data persistence to a proper database-backed system with RESTful CRUD endpoints.

**Why**: 
- Current architecture stores all user data (companies, accounts, personas, campaigns) in browser localStorage
- This prevents data sync across devices, collaboration, and scalability
- Need proper user data isolation and persistence for production MVP

**Approach**: API-first design with normalized database models, then frontend integration

## 🏗️ What We've Accomplished

### ✅ Database Models Created (Fully Normalized)

Created comprehensive database schema with proper relationships:

#### **Core Models**
1. **Company** - Stores analyzed company data
   - Business profile, positioning, capabilities, objections
   - Links to User via `user_id`
   - One-to-many with TargetAccount

2. **TargetAccount** - Ideal customer profiles 
   - Firmographics, confidence metrics, analysis metadata
   - Links to Company via `company_id`
   - One-to-many with TargetPersona

3. **TargetPersona** - Buyer personas within accounts
   - Demographics, use cases, buying behavior
   - Links to TargetAccount via `target_account_id`
   - One-to-many with Campaign

4. **Campaign** - Generated campaigns (emails, etc.)
   - Campaign content, configuration, status
   - Links to both TargetAccount and TargetPersona

#### **Normalized Supporting Tables** (25+ tables)
- **Company**: `company_capabilities`, `company_objections`
- **Account**: `account_rationale`, `account_keywords`, `account_buying_signals`, etc.
- **Persona**: `persona_job_titles`, `persona_departments`, `persona_use_cases`, etc.
- **Campaign**: `campaign_segments`, `campaign_alternatives`, etc.

#### **Enums for Type Safety**
- `PriorityLevel` (Low, Medium, High)
- `BuyingSignalType` (technology, behavioral, intent, contextual)
- `SeniorityLevel` (junior, mid, senior, director, vp, c_level)
- `CampaignType` (email, linkedin, cold_call, ad)
- `CampaignStatus` (draft, active, paused, completed)

### ✅ Best Practices Followed
- **Proper normalization** - No JSON columns, separate tables for arrays
- **Foreign key constraints** - Referential integrity maintained
- **Cascade deletes** - Child records auto-deleted with parents
- **Type safety** - Enums for controlled vocabularies
- **Timestamps** - Created/updated tracking on all main entities
- **User isolation** - All data linked to User for Row-Level Security

### ✅ Files Modified
- `/backend/app/models/__init__.py` - All database models added
- Database models are ready for Alembic migration generation

## 🚧 What's Left to Complete

### **1. Finish Campaign Model** (5 min remaining)
Currently interrupted mid-implementation. Need to complete:
```python
class Campaign(Base):
    # Add campaign fields: name, type, status, content, config
    # Add relationships to TargetAccount and TargetPersona
    
class CampaignSegment(Base):
    # Email segments with type and styling
    
class CampaignAlternative(Base):
    # Subject line alternatives
```

### **2. Generate Alembic Migration** (10 min)
```bash
cd /Users/phillipou/dev/active/blossomer-gtm-api
alembic revision --autogenerate -m "Add business data models (Company, TargetAccount, TargetPersona, Campaign)"
alembic upgrade head
```

### **3. Create Pydantic Schemas** (30 min)
Create `/backend/app/schemas/` files for request/response models:
- `company.py` - CompanyCreate, CompanyUpdate, CompanyResponse
- `target_account.py` - TargetAccountCreate, TargetAccountUpdate, TargetAccountResponse  
- `target_persona.py` - TargetPersonaCreate, TargetPersonaUpdate, TargetPersonaResponse
- `campaign.py` - CampaignCreate, CampaignUpdate, CampaignResponse

### **4. Implement CRUD Endpoints** (2-3 hours)
Create `/backend/app/api/routes/` endpoints:
- `companies.py` - GET, POST, PUT, DELETE /api/companies
- `target_accounts.py` - CRUD for /api/target-accounts
- `target_personas.py` - CRUD for /api/target-personas  
- `campaigns.py` - CRUD for /api/campaigns

**Critical**: Implement Row-Level Security to ensure users only access their own data.

### **5. Frontend API Integration** (3-4 hours)
Replace localStorage calls with API calls:
- Update `/frontend/src/lib/accountService.ts`
- Modify pages to use API instead of localStorage
- Add loading states, error handling
- Implement optimistic updates

### **6. Data Migration Utilities** (1-2 hours)
Build tools to import existing localStorage data:
- Create migration script to bulk import existing user data
- Add admin endpoint for one-time data migration
- Test migration with real localStorage data

## 📋 Implementation Priority

**Phase 1: Database Foundation** (TODAY)
1. ✅ Database models (DONE)
2. 🔄 Complete Campaign model (5 min)
3. ⏳ Generate Alembic migration (10 min)
4. ⏳ Test schema creation (10 min)

**Phase 2: API Layer** (NEXT SESSION)
1. Create Pydantic schemas (30 min)
2. Implement CRUD endpoints with RLS (2-3 hours)
3. Test endpoints with Postman/curl (30 min)

**Phase 3: Frontend Integration** (FOLLOWING SESSION)
1. Replace localStorage with API calls (3-4 hours)
2. Build migration utilities (1-2 hours)
3. Test complete flow (1 hour)

## 🗂️ File Locations

**Database Models**: `/backend/app/models/__init__.py`
**Schemas (to create)**: `/backend/app/schemas/`
**API Routes (to create)**: `/backend/app/api/routes/`
**Frontend Services**: `/frontend/src/lib/accountService.ts`

## 🔗 Related Documentation

- **[ARCHITECTURE.md](@notes/ARCHITECTURE.md)** - Current system architecture
- **[TASKS.md](@notes/TASKS.md)** - High-priority localStorage migration task
- **[API_REFERENCE.md](@notes/API_REFERENCE.md)** - Will need updates for new CRUD endpoints

## ⚠️ Important Notes

1. **Row-Level Security is critical** - Users must only see their own data
2. **Migration strategy needed** - Plan for importing existing localStorage data  
3. **API authentication** - All endpoints require valid API key/user token
4. **Error handling** - Proper validation and error responses for all endpoints
5. **Database constraints** - Foreign keys enforce data integrity

## 🚀 Ready to Resume

When resuming, start with completing the Campaign model in `/backend/app/models/__init__.py` around line 526, then generate the Alembic migration to get the database schema in place.