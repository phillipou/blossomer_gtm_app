# Current Tasks & Priorities

*Last synced with Linear: July 8, 2025*

---

## 🎯 MVP LAUNCH CHECKLIST (July 2025)

### 1. User Authentication & API Key Flow ✅ COMPLETED
- [x] Implement Hybrid Neon Auth + API Key System ([B-134](https://linear.app/blossomer/issue/B-134/implement-user-signup-api-key))
  - [x] Neon Auth (Stack Auth) integration for user management
  - [x] API key generation and management system
  - [x] Frontend auth UI with signup/login flow
  - [x] API key dashboard for create/view/delete operations
  - [x] Database schema updates with migration
  - [x] Backend endpoints for auth token validation
  - [ ] **NEXT**: Test complete auth flow and fix token validation
  - [ ] **NEXT**: Replace mock Neon Auth token validation with real implementation

### 2. API Rate Limiting & Error Handling
- [ ] Implement and enforce API rate limiting ([B-133](https://linear.app/blossomer/issue/B-133/implement-and-enforce-api-rate-limiting-across-all-endpoints))
- [ ] Error Handling and Rate Limit UX ([B-140](https://linear.app/blossomer/issue/B-140/error-handling-and-rate-limit-ux))

### 3. Update/Delete Endpoints
- [ ] Update and Delete Endpoints ([B-139](https://linear.app/blossomer/issue/B-139/update-and-delete-endpoints))
  - [ ] PUT /company - update field with value ([B-144](https://linear.app/blossomer/issue/B-144/put-company-update-field-with-value))
  - [ ] DELETE /company ([B-145](https://linear.app/blossomer/issue/B-145/delete-company))
  - [ ] DELETE /customers/target_account/:id ([B-146](https://linear.app/blossomer/issue/B-146/delete-customerstarget-accountid))
  - [ ] PUT /customers/target_account - metadata ([B-147](https://linear.app/blossomer/issue/B-147/put-customerstarget-account-metadata))
  - [ ] PUT /customers/target_personas - metadata ([B-148](https://linear.app/blossomer/issue/B-148/put-customerstarget-personas-metadata))
  - [ ] PUT /customers/target_accounts - update field with values ([B-150](https://linear.app/blossomer/issue/B-150/put-customerstarget-accounts-update-field-with-values))

### 4. Email Generation & Prompt Quality
- [ ] Prompt evals for email generation (define criteria, test set, script/manual review)
- [ ] Quality validation: Ensure generated emails meet Blossomer standards

### 5. UX Polish (MVP)
- [ ] Company Overview - UX Polish ([B-152](https://linear.app/blossomer/issue/B-152/company-overview-ux-polish))
- [ ] Accounts - UX Polish ([B-153](https://linear.app/blossomer/issue/B-153/accounts-ux-polish))
- [ ] Personas - UX Polish ([B-154](https://linear.app/blossomer/issue/B-154/personas-ux-polish))
- [ ] Campaigns - UX Polish ([B-155](https://linear.app/blossomer/issue/B-155/campaigns-ux-polish))
- [ ] Landing Page - UX Polish ([B-156](https://linear.app/blossomer/issue/B-156/landing-page-ux-polish))
- [ ] Polish Animations ([B-141](https://linear.app/blossomer/issue/B-141/polish-animations))
- [ ] Save button animation ([B-151](https://linear.app/blossomer/issue/B-151/save-button-animation))
- [ ] Fix bullet size on Card ([B-168](https://linear.app/blossomer/issue/B-168/fix-bullet-size-on-card))
- [ ] Add create Target Account CTA ([B-169](https://linear.app/blossomer/issue/B-169/add-create-target-account-cta))
- [ ] Create personas CTA ([B-167](https://linear.app/blossomer/issue/B-167/create-personas-cta))
- [ ] Create Campaign CTA ([B-166](https://linear.app/blossomer/issue/B-166/create-campaign-cta))
- [ ] Show associated email campaigns ([B-165](https://linear.app/blossomer/issue/B-165/show-associated-email-campaigns))
- [ ] Update fields ([B-164](https://linear.app/blossomer/issue/B-164/update-fields))
- [ ] Company overview needs to display properly in OverviewCard ([B-163](https://linear.app/blossomer/issue/B-163/company-overview-needs-to-display-properly-in-overviewcard))
- [ ] Update cards and persist their values ([B-162](https://linear.app/blossomer/issue/B-162/update-cards-and-persist-their-values))
- [ ] Remove "Account Details" header ([B-161](https://linear.app/blossomer/issue/B-161/remove-account-details-header))
- [ ] Add ability to edit metadata (overview card) ([B-160](https://linear.app/blossomer/issue/B-160/add-ability-to-edit-metadata-overview-card))
- [ ] Updating personas need to persist ([B-159](https://linear.app/blossomer/issue/B-159/updating-personas-need-to-persist))
- [ ] Deleting personas need to persist ([B-158](https://linear.app/blossomer/issue/B-158/deleting-personas-need-to-persist))
- [ ] Increase size of bullets to match Accounts bullets ([B-157](https://linear.app/blossomer/issue/B-157/increase-size-of-bullets-to-match-accounts-bullets))

### 6. QA & Launch
- [ ] Finalize QA ([B-143](https://linear.app/blossomer/issue/B-143/finalize-qa))
  - [ ] Come up with QA Checklist ([B-171](https://linear.app/blossomer/issue/B-171/come-up-with-qa-checklist))
- [ ] Final Copy Review ([B-142](https://linear.app/blossomer/issue/B-142/final-copy-review))
  - [ ] Draft copy doc ([B-172](https://linear.app/blossomer/issue/B-172/draft-copy-doc))

---

## ✅ Completed (recent highlights)
- [x] Target account/persona improvements
- [x] Core infrastructure, Docker, Render, Neon, Alembic, etc.
- [x] Code quality cleanup, LLM singleton, error handling, etc.

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

## 🚀 IMMEDIATE PRIORITIES (Next Session)

### **1. Authentication System Testing & Refinement** - HIGHEST PRIORITY
- [ ] **Test complete auth flow** - Sign up, create API keys, test API access
- [ ] **Fix Neon Auth token validation** - Replace mock validation with real Stack Auth token verification  
- [ ] **Verify API key rate limiting** - Ensure existing rate limiting works with new auth
- [ ] **Test user sync** - Verify Neon Auth users properly sync to local database
- [ ] **Error handling** - Add proper error states and loading UX

### **2. localStorage to Database Migration** - HIGH PRIORITY  
- [ ] **Design user data persistence** - Plan migration from localStorage to database
- [ ] **Create CRUD endpoints** - Build APIs for companies, accounts, personas, campaigns
- [ ] **Implement Row-Level Security** - Ensure users only see their own data
- [ ] **Build migration utilities** - Tools to import existing localStorage data
- [ ] **Update frontend data services** - Replace localStorage with API calls

---

## 🎉 RECENTLY COMPLETED (July 8, 2025)

### ✅ **Hybrid Neon Auth + API Key System**
**Major Achievement**: Successfully implemented professional user authentication with developer-friendly API access

**What was built**:
- **Neon Auth integration** - Email/password signup via Stack Auth (stack-auth.com)
- **API key management** - Complete dashboard for creating/viewing/deleting API keys
- **Hybrid architecture** - User auth for onboarding + API keys for programmatic access
- **Database schema** - Added `neon_auth_user_id` field linking to Stack Auth users
- **Frontend components** - Auth header, API key modal, sign up/in flows
- **Backend endpoints** - `/api/neon-auth/` routes for user sync and key management

**Environment Setup**:
- Stack Auth Project ID: `2059ecbe-2154-408d-aeb5-679af7964264`
- Publishable Key: `pck_gkpmh6v4eq4wks4w230f80syjvet8rttbvdef43wgyvqr`
- Configuration: `frontend/.env` with `VITE_STACK_*` variables

**Status**: Core implementation complete, needs testing and token validation refinement

---

*For full details and status, see your [Linear MVP Project Board](https://linear.app/blossomer/project/production-launch-mvp).*
