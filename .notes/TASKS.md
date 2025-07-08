# Current Tasks & Priorities

*Last synced with Linear: July 8, 2025*

---

## 🎯 MVP LAUNCH CHECKLIST (July 2025)

### 1. User Authentication & API Key Flow
- [~] Implement User Signup + API Key ([B-134](https://linear.app/blossomer/issue/B-134/implement-user-signup-api-key))
  - [~] Create `/auth/signup` endpoint ([B-135](https://linear.app/blossomer/issue/B-135/create-authsignup-endpoint))
  - [ ] Return API key on signup ([B-136](https://linear.app/blossomer/issue/B-136/return-api-key-on-signup))
  - [ ] Validate API key via `/auth/validate` ([B-137](https://linear.app/blossomer/issue/B-137/validate-api-key-via-authvalidate))
  - [ ] Integrate with frontend + localStorage ([B-138](https://linear.app/blossomer/issue/B-138/integrate-with-frontendlocalstorage))

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

*For full details and status, see your [Linear MVP Project Board](https://linear.app/blossomer/project/production-launch-mvp).*
