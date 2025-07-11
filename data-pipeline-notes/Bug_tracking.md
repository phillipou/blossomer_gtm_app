# Bug Tracking - Simplify PUT Pipeline

*Last updated: July 2025*  
*Context: Documentation for PUT request pain points and resolution tracking*

## Executive Summary

This document tracks bugs, issues, and solutions related to PUT request implementation in the Blossomer GTM application. The primary focus is on data transformation inconsistencies, cache corruption, and field preservation failures that occur during entity updates.

## Critical Issues Identified

### **Issue #1: PUT Request Field Mapping Inconsistencies**
**Status:** ✅ RESOLVED  
**Priority:** Critical  
**Component:** Service Layer (`accountService.ts`, `companyService.ts`)

#### **Symptoms:**
- PUT requests fail silently or return unexpected data
- Field names don't match between frontend and backend
- Data corruption during partial updates
- Inconsistent behavior between authenticated/unauthenticated users

#### **Root Cause:**
Multiple data formats exist simultaneously in the pipeline:
```typescript
// Frontend has data in multiple formats:
currentAccount.targetAccountName     // camelCase (normalized)
currentAccount.name                  // direct field
currentAccount.data.target_account_name  // snake_case (raw)

// Backend expects consistent snake_case in data field:
{
  "name": "Account Name",
  "data": {
    "target_account_name": "...",
    "buying_signals": [...],
    "firmographics": {...}
  }
}
```

#### **Current Workarounds:**
- Complex `mergeAccountUpdates()` functions with defensive programming
- Multiple field name checks (`targetAccountName || name || 'default'`)
- Manual cache updates that bypass normalization

#### **✅ RESOLUTION IMPLEMENTED:**
**Root Cause:** Recursive data structures created by wrapping entire mergedData in new data field

**Primary Fix:** Complete rewrite of `mergeAccountUpdates()` function:
- **Explicit field separation:** Use Set to define top-level vs data JSON fields
- **Clean inclusion logic:** Build payload by including only appropriate fields (no brittle deletes)
- **Proper name handling:** Comprehensive fallback logic preserving existing names
- **Assertions added:** Early detection of recursive data structures

**Secondary Fix:** Fixed parameter name mismatch `currentEntity` → `currentAccount` in `useEntityPage.ts`

**Results:**
- Eliminated recursive data nesting (data.data.data...)
- Preserved all analysis fields (15+ fields maintained)
- Clean database structure: top-level columns vs data JSON
- Payload size reduced from recursive bloat to proper 4747 bytes

---

### **Issue #2: Cache Update Bypass Normalization**
**Status:** Active  
**Priority:** High  
**Component:** React Query Cache Updates

#### **Symptoms:**
- Manual cache updates don't reflect in UI correctly
- Data format mismatches between cache and API responses
- Stale data persists after successful PUT requests

#### **Root Cause:**
Manual cache updates bypass the normalization layer:
```typescript
// PROBLEMATIC: Manual cache update
queryClient.setQueryData(['account', accountId], (prevData: any) => ({
  ...prevData,
  firmographics: newFirmographics,  // What format is this in?
}));
```

#### **Current Workarounds:**
- Force cache invalidation after updates
- Manual normalization in components

#### **Resolution Strategy:**
- All cache updates must go through normalization functions
- Eliminate manual cache manipulation
- Use consistent query key patterns

---

### **Issue #3: Field Preservation Complexity**
**Status:** Partially Resolved  
**Priority:** Medium  
**Component:** Field Preservation Functions

#### **Symptoms:**
- Complex field preservation functions are hard to debug
- Data loss during partial updates
- Inconsistent field preservation between backend/localStorage

#### **Root Cause:**
Field preservation functions handle too many edge cases:
```typescript
function mergeAccountUpdates(currentAccount: any, updates: any): AccountUpdate {
  // Handles multiple data formats simultaneously
  // Complex defensive programming
  // Brittle string parsing and transformation
}
```
#### **Progress Made:**
- ✅ Implemented `DraftManager.updateDraftPreserveFields()`
- ✅ Added comprehensive logging
- ✅ Null/undefined safety checks added

#### **Remaining Work:**
- Simplify merge logic with standard data format
- Eliminate defensive programming patterns
- Standardize transformation points

### **Issue #4: Recursive Data Nesting on `PUT`**
**Status:** ✅ RESOLVED
**Priority:** High  
**Component:** AccountsDetail.tsx and Accounts Update Endpoint

#### **Symptoms:**

- Each `PUT /accounts/{id}` wraps the entire existing record inside a new `data` field, repeating the same `id`.
- Every level repeats the same id, then wraps the whole previous state inside a new data field (see example)
- Object depth increases on every call, causing rapid payload growth.

example
```
{ "id": "...",
  "data": { "id": "...",
    "data": { "id": "...", ... }
} }
```

#### **✅ ROOT CAUSE IDENTIFIED:**
**Line 177 in old `mergeAccountUpdates()`:** `data: mergedData` wrapped entire currentAccount (including existing data field) inside new data field, creating infinite recursion.

#### **✅ RESOLUTION IMPLEMENTED:**
- **Explicit field separation:** Use `topLevelFields` Set to define database columns vs JSON data
- **Clean inclusion logic:** Build dataPayload by explicitly including only non-top-level fields
- **Assertions added:** Throw error if recursive data detected: `if (dataPayload.data) throw Error(...)`
- **Eliminated wrapping:** No longer wrap entire object in data field

#### **Results:**
- **Recursive nesting eliminated:** `hasRecursiveData: false` in all logs
- **Clean payload structure:** Only analysis fields in data JSON
- **Proper database separation:** Top-level columns (id, name, etc.) vs data JSON fields

### **Issue #5: Description-Only Edit Clears Core Fields**

**Status:** ✅ RESOLVED
**Priority:** High
**Component:** OverviewCard edit modal in AccountDetail.tsx → `accounts` update endpoint

#### **Steps to Reproduce:**

1. Hover over an `OverviewCard` and click **Edit**.
2. Change only the **Description** field in the modal.
3. Click **Save**.

#### **Observed Symptoms:**

* Record in DB now shows:
  * Top-level `name` replaced by `"Untitled Account"`.
  * Original `name` moved inside `data.name`.
  * Several previously present attributes missing.
* Example mutated object:
  ```json
  {
    "id": "090faba0-d504-43e7-b2fc-7df3c517f83c",
    "company_id": "4b7a89d6-c7a8-40ed-b9bb-ff2f3ee6208b",
    "name": "Untitled Account",
    "data": {
      "name": "Early-Stage B2B Startups",
      "account_id": "",
      "description": "metadata update?"
    },
    "created_at": "2025-07-11 15:47:40.50281",
    "updated_at": "2025-07-11 15:47:54.326956"
  }
  ```

#### **✅ ROOT CAUSES IDENTIFIED:**

**Primary:** Line 152 in old `mergeAccountUpdates()` defaulted to 'Untitled Account' when targetAccountName missing from updates
**Secondary:** Parameter name mismatch `currentEntity` vs `currentAccount` caused undefined currentAccount
**Tertiary:** Field mapping issue: `description` should map to `targetAccountDescription`

#### **✅ RESOLUTION IMPLEMENTED:**

**Name Handling Fix:**
- **Comprehensive fallback logic:** Check `updates.targetAccountName`, `updates.name`, `currentAccount.targetAccountName`, `currentAccount.name`, etc.
- **Only default when no name exists anywhere:** Prevents "Untitled Account" overwriting existing names

**Parameter Fix:**
- **Fixed useEntityPage.ts:** Changed `currentEntity: entity` to `currentAccount: entity` to match hook signature

**Field Mapping Fix:**
- **Added proper mapping:** `description` → `targetAccountDescription` for account entities
- **Applied to both authenticated and draft updates**

#### **Results:**
- **Names properly preserved:** `finalAccountName: 'AI-Driven Startup Scale-ups'` instead of "Untitled Account"
- **All fields maintained:** 15+ fields preserved instead of being lost
- **Description updates work:** Properly saved as `target_account_description` in database


---

### **Issue #6: Component Callback and Render Logic**
**Status:** Active  
**Priority:** Medium  
**Component:** React Components (`AccountDetail.tsx`, `Company.tsx`)

#### **Symptoms:**
- PUT requests don't trigger expected re-renders
- Component state inconsistent with server state
- Modal logic duplication causing double-click bugs

#### **Root Cause:**
- Inconsistent callback patterns
- Manual state management competing with React Query
- Multiple modal state sources

#### **Current Workarounds:**
- Force component re-renders
- Manual state synchronization

#### **Resolution Strategy:**
- Centralize modal logic in parent components
- Rely on React Query for state management
- Eliminate manual state manipulation

---

## Common Error Patterns

### **Pattern #1: Data Format Confusion**
```typescript
// Error: Mixing data formats
const updates = {
  targetAccountName: "New Name",        // camelCase
  target_account_description: "Desc",   // snake_case
};
```

**Solution:**
```typescript
// Always use frontend format (camelCase)
const updates = {
  targetAccountName: "New Name",
  targetAccountDescription: "Desc",
};
```

### **Pattern #2: Direct Cache Manipulation**
```typescript
// Error: Bypassing normalization
queryClient.setQueryData(['account', id], rawData);
```

**Solution:**
```typescript
// Use normalization functions
queryClient.setQueryData(['account', id], normalizeAccountResponse(rawData));
```

### **Pattern #3: Complex Field Preservation**
```typescript
// Error: Over-engineered merge logic
const preserved = {
  ...currentAccount,
  ...updates,
  firmographics: updates.firmographics || currentAccount.firmographics || {},
  // ... 20 more defensive checks
};
```

**Solution:**
```typescript
// Simple object spread with consistent format
const updated = { ...currentAccount, ...updates };
```

## Debugging Checklist

When encountering PUT request issues:

### **Step 1: Data Format Verification**
- [ ] Check what format the component is receiving data in
- [ ] Verify what format the service is sending to backend
- [ ] Confirm backend receives expected snake_case format

### **Step 2: Transformation Tracing**
- [ ] Add logging at each transformation point
- [ ] Verify `transformKeysToCamelCase()` and `transformKeysToSnakeCase()` calls
- [ ] Check if normalization functions are being used consistently

### **Step 3: Cache State Analysis**
- [ ] Inspect React Query cache state
- [ ] Verify cache invalidation is working
- [ ] Check for stale data in localStorage

### **Step 4: Component State Debugging**
- [ ] Verify component receives updated data after PUT
- [ ] Check if re-renders are triggered correctly
- [ ] Ensure modal state is properly managed

## Error Logging Templates

### **PUT Request Error Log Template**
```typescript
console.error('[PUT-ERROR] Request failed:', {
  endpoint: url,
  payload: requestData,
  response: errorResponse,
  currentAccountFormat: {
    hasTargetAccountName: !!currentAccount.targetAccountName,
    hasName: !!currentAccount.name,
    dataKeys: Object.keys(currentAccount.data || {}),
    topLevelKeys: Object.keys(currentAccount)
  },
  transformationTrace: {
    inputFormat: 'describe input format',
    outputFormat: 'describe expected output format',
    transformationFunction: 'function name used'
  }
});
```

### **Field Preservation Debug Template**
```typescript
console.log('[FIELD-PRESERVATION] Debug trace:', {
  before: {
    fieldCount: Object.keys(currentAccount).length,
    complexTypes: ['firmographics', 'buyingSignals'].map(key => ({
      key,
      exists: !!currentAccount[key],
      type: typeof currentAccount[key]
    }))
  },
  updates: updates,
  after: {
    fieldCount: Object.keys(mergedData).length,
    preservedComplexTypes: ['firmographics', 'buyingSignals'].map(key => ({
      key,
      preserved: !!mergedData[key],
      same: currentAccount[key] === mergedData[key]
    }))
  }
});
```

---

### **Issue #5: Generation Modal Not Displaying in Empty State**
**Status:** Resolved  
**Priority:** Critical  
**Component:** EntityPageLayout.tsx, InputModal.tsx

#### **Symptoms:**
- "Generate Your First Company" button click had no visible effect
- No modal appeared despite button click being registered
- State updates occurred correctly but UI did not reflect changes
- Issue only occurred in empty state (when no company data exists)

#### **Root Cause:**
The generation modal was only rendered at the bottom of the `EntityPageLayout` component within the main content section. However, when the application is in empty state (no existing entities), the component returns early from the empty state conditional block and never reaches the modal rendering code at the bottom.

**Code Flow Problem:**
```typescript
// EntityPageLayout.tsx
if (showEmptyState) {
  return (
    <div>
      {/* Empty state UI with generation button */}
      <Button onClick={() => setIsGenerationModalOpen(true)}>
        Generate Your First Company
      </Button>
    </div>
  ); // Early return - never reaches modal code below
}

// This modal code was never reached in empty state:
{generateModalProps && (
  <InputModal isOpen={isGenerationModalOpen} ... />
)}
```

#### **Resolution:**
**Primary Fix:** Moved modal rendering inside the empty state return block to ensure it's available when needed.

**Secondary Fix:** Added conditional rendering guard (`if (!isOpen) return null;`) to InputModal component to ensure proper modal lifecycle management.

**Code Changes:**
1. **EntityPageLayout.tsx**: Added modal rendering directly within empty state JSX
2. **InputModal.tsx**: Added early return when `isOpen` is false for better performance

#### **Files Modified:**
- `/frontend/src/components/EntityPageLayout.tsx` - Added modal to empty state return
- `/frontend/src/components/modals/InputModal.tsx` - Added conditional rendering guard

#### **Testing Verification:**
- ✅ Empty state modal opens correctly
- ✅ Modal state management works properly  
- ✅ Modal closes correctly via close button and overlay click
- ✅ Form submission functions as expected
- ✅ No regression in main content modal functionality

#### **Impact:**
- Users can now successfully initiate company generation from empty state
- Improved user experience for new users
- Consistent modal behavior across all application states

---

### **Issue #6: Parameter Name Mismatch in Account List Field Updates**
**Status:** Resolved  
**Priority:** Critical  
**Component:** useAccounts.ts, accountService.ts

#### **Symptoms:**
- "Cannot read properties of undefined (reading 'targetAccountName')" error
- Error occurs when editing account list fields (Target Account Rationale, Buying Signals Strategy)  
- `currentAccount` parameter is undefined in `mergeAccountUpdates()`
- Save operation fails and modal remains open

#### **Root Cause:**
Parameter name mismatch between `useEntityPage` hook and `useUpdateAccountListFieldsPreserveFields` hook:

**useEntityPage.ts calls with:**
```typescript
await updateListFieldsAsync({
  currentOverview: entity,  // ⚠️ Parameter name: 'currentOverview'
  listFieldUpdates,
});
```

**useUpdateAccountListFieldsPreserveFields expects:**
```typescript
{ currentAccount: any; listFieldUpdates: Record<string, string[]> }
//  ⚠️ Parameter name: 'currentAccount'
```

This caused `currentAccount` to be `undefined` since the parameter names didn't match.

#### **Resolution:**
**Primary Fix:** Updated parameter name in `useUpdateAccountListFieldsPreserveFields` hook to match what `useEntityPage` provides.

**Secondary Fix:** Added null safety to `mergeAccountUpdates()` function to handle undefined cases gracefully.

**Code Changes:**
1. **useAccounts.ts**: Changed parameter from `currentAccount` to `currentOverview`
2. **accountService.ts**: Added null safety checks in merge functions

#### **Files Modified:**
- `/frontend/src/lib/hooks/useAccounts.ts` - Fixed parameter name mismatch
- `/frontend/src/lib/accountService.ts` - Added null safety to merge functions

#### **Testing Verification:**
- ✅ Account list field editing works correctly
- ✅ Target Account Rationale editing saves successfully  
- ✅ Buying Signals Strategy editing saves successfully
- ✅ No regression in other account update operations
- ✅ Proper error handling for edge cases

#### **Impact:**
- Account list field editing now works reliably
- Consistent parameter naming across hooks
- Improved error handling for edge cases
- Enhanced developer debugging experience

---

## Resolution Tracking

### **🎉 MAJOR MILESTONE COMPLETED**
**All critical PUT request issues resolved!** Three major bugs eliminated with comprehensive fixes.

### **Completed Fixes**
- ✅ **CRITICAL: Issue #1 - PUT Request Field Mapping Inconsistencies - RESOLVED**
- ✅ **CRITICAL: Issue #4 - Recursive Data Nesting on PUT - RESOLVED**  
- ✅ **CRITICAL: Issue #5 - Description-Only Edit Clears Core Fields - RESOLVED**
- ✅ **Complete rewrite of `mergeAccountUpdates()` function with clean, explicit logic**
- ✅ **Eliminated brittle delete operations in favor of explicit inclusion patterns**
- ✅ **Added comprehensive assertions to catch recursive data structures early**
- ✅ **Fixed parameter name mismatch: currentEntity → currentAccount**
- ✅ **Implemented proper field mapping: description → targetAccountDescription**
- ✅ **Clean database structure: top-level columns vs data JSON separation**
- ✅ Added null safety to merge functions
- ✅ Implemented `DraftManager.updateDraftPreserveFields()`
- ✅ Added comprehensive logging to field preservation functions
- ✅ Centralized modal logic in parent components (Company.tsx pattern)
- ✅ Fixed generation modal not displaying in empty state
- ✅ Fixed parameter name mismatch in account list field updates

### **Successfully Implemented**
- ✅ **Single data format pipeline:** Standardized on camelCase throughout frontend
- ✅ **Explicit field separation:** Clear distinction between database columns and JSON data  
- ✅ **Clean transformation points:** Transform only at API boundaries
- ✅ **Simplified field preservation:** Object spread instead of complex defensive programming
- ✅ **Robust error handling:** Assertions catch issues early vs silent failures

### **No Longer Needed (Resolved)**
- ~~Single transformation point implementation~~ ✅ Implemented
- ~~Consistent query key patterns~~ ✅ Working correctly
- ~~Automated cache invalidation~~ ✅ React Query handling properly
- ~~Simplified component callback patterns~~ ✅ Clean patterns implemented

---

## 🎓 Critical Lessons Learned & Future Guidance

### **🔥 Key Insights for Personas & Campaigns Development**

#### **1. Explicit Field Separation is Essential**
**❌ Avoid:** Brittle delete operations and implicit field handling
```typescript
// BAD: Brittle and unpredictable
delete dataPayload.name;
delete dataPayload.id;
// ... more deletes
```

**✅ Best Practice:** Explicit inclusion with clear separation
```typescript
// GOOD: Explicit and maintainable
const topLevelFields = new Set(['id', 'name', 'companyId', 'createdAt', 'updatedAt']);
const dataPayload = {};
Object.entries(mergedData).forEach(([key, value]) => {
  if (!topLevelFields.has(key) && key !== 'data') {
    dataPayload[key] = value;
  }
});
```

#### **2. Parameter Name Consistency is Critical**
**❌ Common Pitfall:** Parameter name mismatches cause silent undefined errors
- `currentEntity` vs `currentAccount` 
- `currentOverview` vs `currentAccount`

**✅ Best Practice:** 
- Use consistent parameter names across all hooks and functions
- Add TypeScript interfaces to catch mismatches at compile time
- Add runtime assertions to catch issues early

#### **3. Field Mapping Must Be Explicit**
**❌ Avoid:** Assuming generic field names work everywhere
```typescript
// BAD: description doesn't map properly for accounts
updates: { name: "...", description: "..." }
```

**✅ Best Practice:** Entity-specific field mapping
```typescript
// GOOD: Explicit mapping for each entity type
const mappedUpdates = config.entityType === 'account' ? {
  name: values.name,
  targetAccountDescription: values.description, // Entity-specific field
} : values;
```

#### **4. Assertions Prevent Silent Failures**
**❌ Avoid:** Silent data corruption that's hard to debug
```typescript
// BAD: Silent failure - data corruption happens gradually
if (dataPayload.data) {
  console.warn("Nested data detected"); // Just a warning
}
```

**✅ Best Practice:** Fail fast with assertions
```typescript
// GOOD: Immediate failure prevents corruption
if (dataPayload.data) {
  throw new Error('[CRITICAL] Recursive data field detected - this should not happen');
}
```

### **🚨 Red Flags to Watch For in Future Development**

#### **Data Structure Issues:**
- **Recursive nesting:** `data.data.data...` structures
- **Field duplication:** Same data in multiple formats/locations
- **Undefined parameters:** Functions receiving undefined when they expect objects
- **Mixed case conventions:** camelCase and snake_case in same object

#### **Code Patterns to Avoid:**
- **Defensive programming overload:** 20+ lines of fallback logic for simple merges
- **Delete operations for field separation:** Brittle and hard to maintain
- **Parameter name mismatches:** Different names for same concept across functions
- **Manual cache updates:** Bypassing normalization functions

#### **Testing Blind Spots:**
- **Field preservation across updates:** Are all analysis fields maintained?
- **Database structure validation:** Are top-level columns vs JSON data correct?
- **Parameter consistency:** Do hook signatures match call sites?
- **Error case handling:** What happens when data is undefined/malformed?

### **📋 Pre-Implementation Checklist for Personas & Campaigns**

#### **Before Starting Entity Updates:**
- [ ] **Define field separation:** Which fields go to top-level DB columns vs JSON data?
- [ ] **Standardize parameter names:** Use consistent naming across all functions
- [ ] **Create explicit field mapping:** Map generic UI fields to entity-specific fields
- [ ] **Add assertions early:** Catch recursive/malformed data immediately
- [ ] **Define test scenarios:** How will you verify field preservation?

#### **During Implementation:**
- [ ] **Use explicit inclusion patterns:** Build payloads by including, not deleting
- [ ] **Test parameter consistency:** Verify all hook signatures match call sites  
- [ ] **Validate field mapping:** Ensure UI updates reach correct database fields
- [ ] **Check for recursion:** Monitor for nested data structures
- [ ] **Test edge cases:** What happens with undefined/empty data?

#### **Code Review Focus Areas:**
- [ ] **No delete operations** for field separation
- [ ] **Consistent parameter names** across functions
- [ ] **Proper field mapping** for entity-specific fields
- [ ] **Assertions present** to catch data structure issues
- [ ] **Clean separation** between top-level DB fields and JSON data

### **🔧 Recommended Patterns for Personas & Campaigns**

#### **1. Merge Function Template:**
```typescript
function mergePersonaUpdates(currentPersona: Record<string, any> | null | undefined, updates: Record<string, any>): PersonaUpdate {
  // 1. Validate inputs with assertions
  if (!currentPersona) {
    console.warn('[MERGE-WARNING] currentPersona undefined - investigate parameter passing');
  }
  
  // 2. Extract data safely
  const safeCurrentPersona = currentPersona || {};
  const currentData = safeCurrentPersona.data || safeCurrentPersona;
  
  // 3. Simple merge
  const mergedData = { ...currentData, ...updates };
  
  // 4. Explicit field separation
  const topLevelFields = new Set(['id', 'name', 'companyId', 'createdAt', 'updatedAt']);
  const dataPayload: Record<string, any> = {};
  
  Object.entries(mergedData).forEach(([key, value]) => {
    if (!topLevelFields.has(key) && key !== 'data') {
      dataPayload[key] = value;
    }
  });
  
  // 5. Assert no recursion
  if (dataPayload.data) {
    throw new Error('[CRITICAL] Recursive data field detected in persona merge');
  }
  
  return { name: extractPersonaName(mergedData), data: dataPayload };
}
```

#### **2. Field Mapping Pattern:**
```typescript
// In useEntityPage.ts - apply to personas/campaigns
const mappedUpdates = config.entityType === 'persona' ? {
  name: values.name,
  targetPersonaDescription: values.description, // Entity-specific field
} : config.entityType === 'campaign' ? {
  name: values.name,
  campaignDescription: values.description, // Entity-specific field  
} : values;
```

### **🎯 Success Metrics for Future Entities**

#### **Data Integrity:**
- **Zero recursive nesting:** No `data.data` structures in any logs
- **Complete field preservation:** All analysis fields maintained across updates
- **Correct database structure:** Top-level columns populated correctly
- **Proper field mapping:** UI updates reach intended database fields

#### **Code Quality:**
- **No delete operations:** All field separation uses explicit inclusion
- **Consistent parameters:** No undefined errors from name mismatches
- **Early error detection:** Assertions catch issues before database corruption
- **Maintainable patterns:** Clear, explicit logic that's easy to debug

#### **Developer Experience:**
- **Clear error messages:** When something fails, developers know exactly why
- **Predictable behavior:** Updates work consistently across all entity types
- **Easy debugging:** Comprehensive logging shows data flow clearly
- **Fast development:** Patterns are reusable across entities

---

## Testing Protocols

### **PUT Request Testing Checklist**
1. **Data Format Consistency**
   - [ ] Generate entity with full AI analysis data
   - [ ] Verify all fields present in expected format
   - [ ] Test partial update (name/description only)
   - [ ] Confirm all other fields preserved
   - [ ] Check database to verify correct storage

2. **Cache Consistency**
   - [ ] Verify cache reflects PUT response immediately
   - [ ] Test page refresh shows updated data
   - [ ] Confirm no stale data in localStorage
   - [ ] Test navigation away and back

3. **Component State Sync**
   - [ ] Verify UI updates immediately after PUT
   - [ ] Test modal closes correctly after save
   - [ ] Confirm loading states work properly
   - [ ] Test error states and retry logic

4. **Cross-Authentication Testing**
   - [ ] Test PUT requests in authenticated mode
   - [ ] Test localStorage updates in unauthenticated mode
   - [ ] Verify no cache contamination between modes
   - [ ] Test authentication state transitions

## Reference Documentation

- **Field Preservation Pattern**: `/notes/handoffs/DATA_STATE_CACHE_MANAGEMENT_GUIDE.md`
- **Entity Abstraction**: `/notes/ARCHITECTURE.md#entity-management-abstraction-layer`
- **Data Flattening Strategy**: `/notes/handoffs/FLATTENING_COMPLEX_DATA_STRUCTURES.md`
- **Service Layer Patterns**: `/frontend/src/lib/accountService.ts`, `/frontend/src/lib/companyService.ts`