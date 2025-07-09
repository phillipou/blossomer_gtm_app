# Database Migration Implementation - Handoff Document

*Created: July 8, 2025*
*Status: In Progress - Database Models Completed*

---

**UPDATE (July 8, 2025):**
- ✅ All authentication is now via Stack Auth JWT tokens. Legacy API key authentication and rate limiting have been fully removed from the backend and frontend.
- ✅ All user linkage in the database is via Stack Auth user IDs (not API keys).
- ✅ API endpoints have been refactored to RESTful conventions and split into `/accounts`, `/personas`, `/company`, and `/campaigns` routes. See `/backend/app/api/routes/accounts.py`, `/personas.py`, `/company.py`, `/campaigns.py`.
- ✅ All endpoints require JWT authentication. Ensure the frontend passes the token from `useAuthState().token`.
- ✅ All documentation and code references have been updated to reflect these changes.

---

## 🎯 What We're Trying to Do

**Goal**: Migrate from localStorage-based data persistence to a proper database-backed system with RESTful CRUD endpoints.

**Why**: 
- Current architecture stores all user data (companies, accounts, personas, campaigns) in browser localStorage
- This prevents data sync across devices, collaboration, and scalability
- Need proper user data isolation and persistence for production MVP

**Approach**: API-first design with normalized database models, then frontend integration

## 🏗️ What We've Accomplished

### ✅ Database Models Created (Simplified JSON Schema)

Created simple, flexible database schema optimized for AI-generated content:

#### **Core Models** (5 tables total)
1. **User** - Stack Auth user management
   - Stack Auth user ID as primary key
   - Email, name, timestamps
   - One-to-many with Company

2. **Company** - Analyzed company data
   - Basic info: name, url
   - **analysis_data (JSONB)** - All website analysis data
   - Links to User via `user_id`

3. **TargetAccount** - Ideal customer profiles
   - Basic info: name
   - **account_data (JSONB)** - All account data (firmographics, buying signals, etc.)
   - Links to Company via `company_id`

4. **TargetPersona** - Buyer personas
   - Basic info: name
   - **persona_data (JSONB)** - All persona data (demographics, use cases, etc.)
   - Links to TargetAccount via `target_account_id`

5. **Campaign** - Generated campaigns
   - Basic info: name, campaign_type
   - **campaign_data (JSONB)** - All campaign content and configuration
   - Links to both TargetAccount and TargetPersona

#### **Key Design Decisions**
- **JSONB columns** - Flexible storage for AI-generated content
- **Mirrors localStorage** - Direct mapping for easy migration
- **PostgreSQL JSONB** - Fast queries with indexing support
- **Minimal normalization** - Only essential relationships

#### **Enums for Application Logic Only**
- `PriorityLevel` (Low, Medium, High) - Used in business logic
- `SeniorityLevel` (junior, mid, senior, director, vp, c_level) - Used in business logic
- Database uses flexible String fields for AI-generated content

### ✅ Benefits of Simplified Approach
- **Easy migration** - Direct localStorage → JSONB mapping
- **AI flexibility** - No schema changes needed for prompt evolution
- **Performance** - PostgreSQL JSONB with indexing
- **Maintainability** - 5 tables instead of 27+
- **User isolation** - All data linked to Stack Auth user ID for Row-Level Security

### ✅ Files Modified
- `/backend/app/models/__init__.py` - All database models added
- Database models are ready for Alembic migration generation

## 🚧 What's Left to Complete

### **1. ✅ Complete Campaign Model** (DONE)
All models implemented with flexible schema:
- ✅ `Campaign` - Main campaign entity with flexible type/status fields
- ✅ `CampaignSegment` - Email segments with styling
- ✅ `CampaignAlternative` - Subject line alternatives
- ✅ Updated User model to use Stack Auth user ID as primary key
- ✅ Removed rigid enums, kept only PriorityLevel/SeniorityLevel for business logic
- ✅ All foreign keys updated for User → Company relationship (one-to-many)

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
- `company.py` - GET, POST, PUT, DELETE `/company`
- `accounts.py` - CRUD for `/accounts`
- `personas.py` - CRUD for `/personas`  
- `campaigns.py` - CRUD for `/campaigns`

**Critical**: Implement Row-Level Security to ensure users only access their own data (using Stack Auth user ID).

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

**LocalStorage Sync Strategy:**
- **Current localStorage keys**: `dashboard_overview`, `target_accounts`, `emailHistory`
- **Mapping**: `dashboard_overview` → Company, `target_accounts[]` → TargetAccount/TargetPersona, `emailHistory[]` → Campaign
- **Approach**: Progressive migration (hybrid → DB-first → DB-only)
- **Rate limiting**: JWT-based using Stack Auth user ID (not API keys)

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

1. **Row-Level Security is critical** - Users must only see their own data (Stack Auth user ID)
2. **Migration strategy needed** - Plan for importing existing localStorage data  
3. **API authentication** - All endpoints require valid Stack Auth JWT token
4. **Error handling** - Proper validation and error responses for all endpoints
5. **Database constraints** - Foreign keys enforce data integrity

## 🚀 Ready to Resume

When resuming, start with completing the Campaign model in `/backend/app/models/__init__.py` around line 526, then generate the Alembic migration to get the database schema in place.