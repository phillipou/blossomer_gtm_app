# Bug Tracking - Simplify PUT Pipeline

*Last updated: July 2025*  
*Context: Documentation for PUT request pain points and resolution tracking*

## Executive Summary

This document tracks bugs, issues, and solutions related to PUT request implementation in the Blossomer GTM application. The primary focus is on data transformation inconsistencies, cache corruption, and field preservation failures that occur during entity updates.

## 📋 PUT Pipeline Project Status: COMPLETE

### **🎉 ALL CRITICAL ISSUES RESOLVED**
**Status:** ✅ COMPLETED - All 6 major PUT request issues successfully resolved  
**Project Completion Date:** July 2025  
**Next Phase:** Ready to apply proven patterns to Personas entity

### **Key Issues Resolved:**
- ✅ **Issue #1:** PUT Request Field Mapping Inconsistencies
- ✅ **Issue #2:** Cache Update Bypass Normalization  
- ✅ **Issue #3:** Field Preservation Complexity
- ✅ **Issue #4:** Recursive Data Nesting on PUT
- ✅ **Issue #5:** Description-Only Edit Clears Core Fields
- ✅ **Issue #6:** Component Callback and Render Logic

### **Root Problems Solved:**
- **Multiple data transformation layers** with inconsistent field formats
- **Recursive data nesting** (`data.data.data...` structures)
- **Parameter name mismatches** causing silent undefined errors  
- **Manual cache manipulation** bypassing normalization
- **Complex defensive programming** in merge functions
- **Field mapping inconsistencies** between frontend and backend

---

## 🔧 Current Project: Dual-Path Architecture Fixes

### **Issue #11: Hardcoded `/app` Routes in Generation Flows**

**Problem:** Generation/creation flows contain hardcoded `/app` routes that break playground mode

**Affected Files:**
- `Company.tsx:83` - `navigate('/app/company/${savedCompany.id}')`
- `Personas.tsx:354` - Hardcoded `/app` navigation after creation
- Other generation flows potentially affected

**Impact:** Unauthenticated users generating entities get redirected to `/app` routes, triggering auth redirects and breaking playground flow

**Solution Pattern:**
```typescript
// Replace hardcoded routes with auth-aware navigation
// ❌ BAD:
navigate('/app/company/${savedCompany.id}');

// ✅ GOOD:
const prefix = token ? '/app' : '/playground';
navigate(`${prefix}/company/${savedCompany.id}`);
```

**Status:** 🔄 IN PROGRESS

### **Issue #12: Mixed Auth Detection Patterns**

**Problem:** Components use inconsistent methods to detect auth state and determine route prefixes

**Current Patterns:**
- Some components: `const { token } = useAuthState()`
- Others: `location.pathname.startsWith('/app')`
- Inconsistent route prefix generation

**Impact:** Creates unpredictable behavior between authenticated/unauthenticated flows

**Solution Pattern:**
```typescript
// Standardized auth detection hook
const useRoutePrefix = () => {
  const { token } = useAuthState();
  return token ? '/app' : '/playground';
};
```

**Status:** ✅ PARTIALLY COMPLETE - `AccountDetail.tsx` and `PersonaDetail.tsx` updated

### **Issue #13: Aggressive MainLayout Redirects**

**Problem:** MainLayout forces auth redirects that conflict with dual-path design intent

**Current Behavior:**
```typescript
if (isAppRoute && !authState.token) {
  navigate('/auth?mode=signin', { replace: true });
} else if (isPlaygroundRoute && authState.token) {
  navigate('/app/company', { replace: true });
}
```

**Impact:** Prevents intentional playground usage and breaks user flow expectations

**Status:** 🔄 PENDING REVIEW

### **Issue #14: Inconsistent Route Prefix Handling**

**Problem:** Not all components consistently use dynamic route prefixes for navigation

**Examples:**
- ✅ `SidebarNav` - Uses dynamic prefix correctly
- ✅ `AccountDetail` - Recently fixed with auth-aware breadcrumbs  
- ✅ `PersonaDetail` - Recently fixed with auth-aware breadcrumbs
- ❌ Various generation flows - Still use hardcoded routes

**Status:** 🔄 IN PROGRESS

---

## Common Error Patterns

### **Pattern #1: Hardcoded Route Navigation**
```typescript
// ❌ ERROR: Breaks dual-path architecture
navigate('/app/accounts/${accountId}');
```

**Solution:**
```typescript
// ✅ CORRECT: Auth-aware navigation
const prefix = token ? '/app' : '/playground';
navigate(`${prefix}/accounts/${accountId}`);
```

### **Pattern #2: Inconsistent Auth Detection**
```typescript
// ❌ ERROR: Mixed detection patterns
const isAuth1 = !!token;
const isAuth2 = location.pathname.startsWith('/app');
```

**Solution:**
```typescript
// ✅ CORRECT: Standardized detection
const { token } = useAuthState();
const prefix = token ? '/app' : '/playground';
```

### **Pattern #3: Previous Data Format Issues (RESOLVED)**

*Note: These patterns were resolved in the PUT Pipeline project and are kept for reference*

### **Pattern #4: Data Format Confusion (LEGACY - RESOLVED)**
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

---

## 🎯 **PERSONAS EXTENSION: COMPLETED**

### **Additional Issues Resolved During Persona Implementation:**

#### **Issue #7: Form Field Mapping Bug**
**Problem:** `handleSavePersona` using `editingPersona.name` instead of form input value
**Solution:** Changed to use `name` parameter from form submission
**Location:** `Personas.tsx:152`

#### **Issue #8: Authentication-Aware Routing**
**Problem:** Hard-coded `/accounts/{id}/personas/{id}` route causing 404s
**Solution:** Added token-based prefix: `token ? '/app' : '/playground'`
**Location:** `Personas.tsx:142,348`

#### **Issue #9: AI Generation API Schema Mismatch**
**Problem:** 422 error from `/personas/generate-ai` due to incorrect payload format
**Solution:** Fixed payload to match `TargetPersonaRequest` schema:
- `targetPersonaName` → `personaProfileName`
- `targetPersonaDescription` → `hypothesis`
- Added required `websiteUrl` field
**Location:** `Personas.tsx:325-334`

#### **Issue #10: Missing Account Context for AI**
**Problem:** Only sending company context, missing specific account data
**Solution:** Added both `companyContext` and `targetAccountContext`
**Location:** `Personas.tsx:332-333`

### **Personas Success Metrics - ALL ACHIEVED:**
- ✅ **End-to-end persona creation flow** working with AI generation
- ✅ **Field preservation** across all persona update scenarios
- ✅ **Auth-aware routing** for both authenticated and demo users
- ✅ **Complete context passing** - company + account data to AI
- ✅ **Pattern consistency** with account service implementation
- ✅ **Zero data nesting** - comprehensive anti-recursion protections

### **Reusable Patterns Established for Campaigns:**
- **Auth-aware navigation:** `const prefix = token ? '/app' : '/playground'`
- **API schema compliance:** Match request interfaces exactly
- **Context passing:** Both company and entity-specific context for AI
- **Field preservation:** Use `updateEntityPreserveFields` pattern
- **Form handling:** Always use form input values, not existing entity data