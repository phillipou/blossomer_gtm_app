# Bug Tracking - Simplify PUT Pipeline

*Last updated: July 2025*  
*Context: Documentation for PUT request pain points and resolution tracking*

## Executive Summary

This document tracks bugs, issues, and solutions related to PUT request implementation in the Blossomer GTM application. The primary focus is on data transformation inconsistencies, cache corruption, and field preservation failures that occur during entity updates.

## Critical Issues Identified

### **Issue #1: PUT Request Field Mapping Inconsistencies**
**Status:** Active  
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

#### **Resolution Strategy:**
- Standardize on single data format throughout frontend
- Eliminate complex merge logic in favor of simple object spread
- Single transformation point at API boundaries

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

---

### **Issue #4: Component Callback and Render Logic**
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

## Resolution Tracking

### **Completed Fixes**
- ✅ Added null safety to `mergeAccountUpdates()` functions
- ✅ Implemented `DraftManager.updateDraftPreserveFields()`
- ✅ Added comprehensive logging to field preservation functions
- ✅ Centralized modal logic in parent components (Company.tsx pattern)
- ✅ **CRITICAL: Fixed generation modal not displaying in empty state**

### **In Progress**
- 🔄 Standardizing data format across all transformation points
- 🔄 Eliminating manual cache updates
- 🔄 Simplifying field preservation logic

### **Planned Fixes**
- 📋 Single transformation point implementation
- 📋 Consistent query key patterns
- 📋 Automated cache invalidation
- 📋 Simplified component callback patterns

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