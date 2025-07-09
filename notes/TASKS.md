# Current Tasks & Priorities

*Last synced with Linear: July 8, 2025*

---

## 🚀 IMMEDIATE PRIORITIES (Next Session)

### **1. Authentication System Testing & Refinement** - HIGHEST PRIORITY
- [ ] **Test API key creation and management** - Test the complete API key lifecycle (create, view, delete)
- [ ] **Test API calls with Bearer token authentication** - Verify API endpoints work with generated keys
- [ ] **Fix Neon Auth token validation** - Replace mock validation with real Stack Auth token verification  
- [ ] **Fix Stack Auth OAuth account linking** - Resolve Google OAuth signup conflicts
- [ ] **Test user sync** - Verify Neon Auth users properly sync to local database
- [ ] **Verify API key rate limiting** - Ensure existing rate limiting works with new auth

### **2. localStorage to Database Migration** - HIGH PRIORITY  
- [x] **Design user data persistence** - ✅ DONE - Plan migration from localStorage to database
- [x] **Create database models** - ✅ DONE - Simple JSONB schema (5 tables vs 27+ normalized)
- [x] **Simplify schema** - ✅ DONE - JSONB columns mirror localStorage structure exactly
- [x] **Update User model** - ✅ DONE - Stack Auth user ID as primary key, one-to-many with Company, added UserRole enum for admin access
- [x] **Plan localStorage sync** - ✅ DONE - Progressive migration strategy (hybrid → DB-first → DB-only)
- [x] **Update documentation** - ✅ DONE - Updated ARCHITECTURE.md, DECISIONS.md, handoffs with simplified schema
- [x] **Generate Alembic migration** - ✅ DONE - Created migration for user role column and admin access
- [x] **Run database migration** - Apply migration to add role column: `poetry run alembic upgrade head`
- [ ] **Create CRUD endpoints** - Build APIs for companies, accounts, personas, campaigns
- [ ] **Implement Row-Level Security** - Ensure users only see their own data
- [ ] **Build migration utilities** - Tools to import existing localStorage data (now trivial with JSONB)
- [ ] **Update frontend data services** - Replace localStorage with API calls

**📋 HANDOFF DOCUMENT**: See [@notes/DATABASE_MIGRATION_HANDOFF.md](@notes/DATABASE_MIGRATION_HANDOFF.md) for complete implementation status and next steps.

---

### 3. API Rate Limiting & Error Handling
- [x] **Design API rate limiting architecture** - Complete design document with admin bypass functionality
- [ ] Implement UserRateLimiter class based on existing DemoRateLimiter pattern
- [ ] Add JWT-based rate limiting dependencies to production endpoints
- [ ] Set up Redis infrastructure for rate limiting (or use in-memory fallback)
- [ ] Configure rate limiting environment variables and tier limits
- [ ] Test admin bypass functionality and rate limit enforcement
- [ ] Implement and enforce API rate limiting ([B-133](https://linear.app/blossomer/issue/B-133/implement-and-enforce-api-rate-limiting-across-all-endpoints))
- [ ] Error Handling and Rate Limit UX ([B-140](https://linear.app/blossomer/issue/B-140/error-handling-and-rate-limit-ux))
  - [ ] Test end-to-end authenticated flow with rate limiting

---

## 🚨 Deployment/Production Readiness
- [x] **TODO: Configure a separate Stack Auth project for production**
  - [x] Create a new Stack Auth project for production use
  - [ ] Set production environment variables (e.g., STACK_PROJECT_ID, STACK_SECRET_SERVER_KEY)
  - [ ] Add your production domain(s) to the allowed origins in the Stack Auth dashboard
  - [ ] Double-check OAuth provider settings for production

---
## 🟡 Post-MVP / Future Features
- [ ] A/B variant generation
- [ ] Campaign templates system
- [ ] Export functionality
- [ ] Save analysis to user account
- [ ] Shareable links, export, integrations
- [ ] AI refinement system
- [ ] Data export & integration (PDF, CSV, CRM, webhooks)
- [ ] Usage analytics, onboarding, help, etc.

---

## 🎉 RECENTLY COMPLETED (January 9, 2025)

### ✅ **Account Settings Page & Admin Role System**
**What was built**:
- **Account Settings page** - Professional UI with user profile display, sign out, and account deletion
- **Admin role system** - UserRole enum (user/admin/super_admin) with database migration
- **Rate limiting architecture** - Complete design document with admin bypass functionality  
- **Security setup** - Private documentation for sensitive admin instructions
- **Route integration** - Account Settings accessible from Stack Auth UserButton navigation

**Key features**:
- Stack Auth integration with `user.signOut()` and `user.delete()` methods
- Responsive UI matching app design with navbar layout
- Database schema updates for role-based access control
- Comprehensive rate limiting design with multi-tier strategy
- Admin bypass system for unlimited API access

### ✅ **Simplified Database Schema with JSONB**
**Major Achievement**: Dramatically simplified database architecture from 27 tables to 5 with JSONB columns

**What was built**:
- **JSONB schema** - 5 core tables with flexible AI-content storage
- **Direct localStorage mapping** - JSONB mirrors localStorage structure exactly
- **User model refinement** - Stack Auth user ID as primary key, added UserRole enum
- **Documentation updates** - Complete refresh of ARCHITECTURE.md, DECISIONS.md, handoffs
- **Migration strategy** - Progressive sync approach (hybrid → DB-first → DB-only)

**Key decisions**:
- Chose JSONB over normalized for AI flexibility
- Removed 22+ supporting tables (over-engineered)
- Maintained essential relationships and Row-Level Security
- Rate limiting via JWT user ID (no API keys needed)


---

*For full details and status, see your [Linear MVP Project Board](https://linear.app/blossomer/project/production-launch-mvp).*
