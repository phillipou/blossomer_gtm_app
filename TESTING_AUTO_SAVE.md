# Auto-Save Testing Instructions

## 🎯 What to Test

This document provides step-by-step testing instructions for the immediate auto-save functionality across all entities (Company, Account, Persona, Campaign).

## 🔧 Setup

1. **Start the backend**: `poetry run python -m uvicorn backend.app.api.main:app --reload`
2. **Start the frontend**: `npm run dev` (from frontend/)
3. **Open browser console** (F12) to see frontend logs
4. **Check backend terminal** for backend logs with `[AUTO-SAVE]` and `[AI-GEN]` prefixes

## 📋 Test Scenarios

### 🏢 **Test 1: Company Auto-Save (Authenticated)**

**Goal**: Verify company auto-saves immediately after AI generation for logged-in users

**Steps**:
1. **Login** to the app
2. Navigate to `/app/company` (should redirect if you already have companies)
3. If you have companies, delete them or use a fresh user account
4. Click **"Generate Your First Company"**
5. Enter:
   - Website URL: `https://slack.com`
   - Additional Context: `Team collaboration platform`
6. Click **"Generate Overview"**

**Expected Logs**:
```
Frontend Console:
🤖 [AI-GEN] Generating company overview for user xxx
🚀 useAutoSave (company): Initial save attempt triggered
💾 useAutoSave (company): Attempting immediate save for authenticated user
🆕 useAutoSave (company): Creating new entity
✅ useAutoSave (company): Create successful

Backend Terminal:
🤖 [AI-GEN] Generating company overview for user xxx
🌐 [AI-GEN] Website URL: https://slack.com
✅ [AI-GEN] Company overview generated successfully
🏢 [AUTO-SAVE] Creating company for user xxx
📊 [AUTO-SAVE] Company data: name='Slack', url='https://slack.com'
✅ [AUTO-SAVE] Company created successfully: id=xxx
```

**Expected Behavior**:
- Should automatically navigate to `/app/company/{id}` 
- No "Draft" indicators should appear
- Company should appear in saved state immediately

---

### 📝 **Test 2: Company Draft (Unauthenticated)**

**Goal**: Verify company saves to draft for non-logged-in users

**Steps**:
1. **Logout** from the app
2. Navigate to `/playground/company` or home page
3. Enter:
   - Website URL: `https://notion.so`
   - Additional Context: `Note-taking app`
4. Click **"Generate GTM Strategy"**

**Expected Logs**:
```
Frontend Console:
🚀 useAutoSave (company): Initial save attempt triggered
📝 useAutoSave (company): Saving to draft for unauthenticated user
🔄 DraftManager.saveDraft: Saving company draft
✅ DraftManager: Saved draft company with tempId: temp_company_xxx
```

**Expected Behavior**:
- Should navigate to `/playground/company`
- Page subtitle should show: "Company analysis and insights (Draft - not yet saved)"
- Company data should display but not be persisted to backend

---

### 🎯 **Test 3: Account Auto-Save (Authenticated)**

**Goal**: Verify account auto-saves immediately after AI generation

**Steps**:
1. **Login** and ensure you have a company
2. Navigate to `/app/accounts`
3. Click **"Add Target Account"**
4. Enter:
   - Name: `SaaS Startups`
   - Description: `Fast-growing software companies`
5. Click **"Generate Account"**

**Expected Logs**:
```
Frontend Console:
🏢 [AI-GEN] Generating account profile for user xxx
🚀 useAutoSave (account): Initial save attempt triggered
💾 useAutoSave (account): Attempting immediate save for authenticated user
🆕 useAutoSave (account): Creating new entity
✅ useAutoSave (account): Create successful

Backend Terminal:
🏢 [AI-GEN] Generating account profile for user xxx
🎯 [AI-GEN] Account profile name: SaaS Startups
✅ [AI-GEN] Account profile generated successfully
🏢 [AUTO-SAVE] Creating account for user xxx, company xxx
✅ [AUTO-SAVE] Account created successfully: id=xxx
```

**Expected Behavior**:
- Should automatically navigate to `/accounts/{id}`
- Account should appear in accounts list immediately
- No "Draft" badge should appear

---

### 👤 **Test 4: Persona Auto-Save (Authenticated)**

**Goal**: Verify persona auto-saves immediately after AI generation

**Steps**:
1. **Ensure** you have at least one account created
2. Navigate to `/app/personas`
3. Click **"Add Target Persona"**
4. Select an account from the dropdown
5. Enter:
   - Name: `Marketing Director`
   - Description: `Head of marketing at mid-size companies`
6. Click **"Generate Persona"**

**Expected Logs**:
```
Frontend Console:
🚀 useAutoSave (persona): Initial save attempt triggered
💾 useAutoSave (persona): Attempting immediate save for authenticated user
🆕 useAutoSave (persona): Creating new entity
✅ useAutoSave (persona): Create successful
```

**Expected Behavior**:
- Should navigate to `/accounts/{accountId}/personas/{personaId}`
- Persona should appear in personas list
- No "Draft" badge should appear

---

### 📧 **Test 5: Campaign Auto-Save (Authenticated)**

**Goal**: Verify campaign auto-saves immediately after AI generation

**Steps**:
1. **Ensure** you have accounts and personas created
2. Navigate to `/app/campaigns`
3. Click **"New Email"**
4. Go through the email wizard:
   - Select a target account
   - Select a persona
   - Choose use case and preferences
5. Click **"Generate Email"**

**Expected Logs**:
```
Frontend Console:
🚀 useAutoSave (campaign): Initial save attempt triggered
💾 useAutoSave (campaign): Attempting immediate save for authenticated user
🆕 useAutoSave (campaign): Creating new entity
✅ useAutoSave (campaign): Create successful
```

**Expected Behavior**:
- Should navigate to `/campaigns/{id}`
- Campaign should appear in campaigns list
- No "Draft" badge should appear

---

### ❌ **Test 6: Auto-Save Failure (Simulated)**

**Goal**: Verify draft fallback when auto-save fails

**Steps**:
1. **Login** to the app
2. **Disconnect internet** or use browser dev tools to block network requests
3. Try to generate any entity (company, account, persona, campaign)

**Expected Logs**:
```
Frontend Console:
🚀 useAutoSave (entity): Initial save attempt triggered
💾 useAutoSave (entity): Attempting immediate save for authenticated user
🆕 useAutoSave (entity): Creating new entity
❌ useAutoSave (entity): Create failed
📝 useAutoSave (entity): Saving to draft due to create failure
🔄 DraftManager.saveDraft: Saving entity draft
✅ DraftManager: Saved draft entity with tempId: temp_entity_xxx
```

**Expected Behavior**:
- Entity should display with orange "Draft" badge
- Entity should appear in draft state
- Should be able to retry save when network returns

---

### 🔄 **Test 7: Draft Cleanup on Successful Save**

**Goal**: Verify drafts are cleaned up when save succeeds

**Steps**:
1. **Create a draft** (Test 2 or simulate failure)
2. **Login** if needed
3. **Let auto-save succeed** (restore network)

**Expected Logs**:
```
Frontend Console:
✅ useAutoSave (entity): Create successful
🧹 useAutoSave (entity): Cleaning up draft with tempId: temp_entity_xxx
🗑️ DraftManager.removeDraft: Removing entity draft with tempId: temp_entity_xxx
✅ DraftManager: Removed draft entity with tempId: temp_entity_xxx
```

**Expected Behavior**:
- Draft badge should disappear
- Entity should show as saved
- localStorage should be cleaned up

---

### 📊 **Test 8: Draft Count Display**

**Goal**: Verify UI shows draft counts correctly

**Steps**:
1. **Create several drafts** (mix of different entities)
2. **Check each entity list page**:
   - `/app/accounts`
   - `/app/personas` 
   - `/app/campaigns`

**Expected Behavior**:
- Each page should show: "X entities (Y drafts)" when drafts exist
- Orange "Draft" badges should appear on draft entities
- Drafts should be visually distinguishable from saved entities

---

## 🐛 Common Issues to Look For

### Frontend Issues:
- **Missing logs**: If you don't see useAutoSave logs, the hook might not be triggering
- **Draft not created**: If authenticated save fails but no draft appears
- **Navigation failures**: If auto-save succeeds but doesn't navigate
- **State inconsistencies**: If draft state doesn't match localStorage

### Backend Issues:
- **Missing API logs**: If you don't see `[AUTO-SAVE]` logs, requests aren't reaching the backend
- **Auth failures**: If you see 401/403 errors during auto-save
- **Data validation errors**: If auto-save fails due to schema mismatches

### Network Issues:
- **CORS errors**: If requests are blocked by browser
- **Timeout errors**: If auto-save takes too long
- **Race conditions**: If multiple saves conflict

## ✅ Success Criteria

The auto-save implementation is working correctly if:

1. **Immediate saves work** for all authenticated entity generation
2. **Draft fallbacks work** for unauthenticated users and failures  
3. **Draft cleanup works** when saves eventually succeed
4. **Visual indicators work** (draft badges, counts, status messages)
5. **Navigation works** after successful auto-saves
6. **Error handling works** with proper user feedback
7. **Performance is good** with no UI blocking or lag

## 🔍 Debugging Tips

- **Check localStorage**: Look for keys starting with `draft_` 
- **Network tab**: Monitor API calls to see what's being sent/received
- **Console errors**: Look for unhandled promise rejections or React errors
- **Backend logs**: Ensure all auto-save operations are being logged
- **State inspection**: Use React DevTools to inspect component state

---

**Happy Testing!** 🚀