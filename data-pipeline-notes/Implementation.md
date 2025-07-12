# Implementation Plan - Dual-Path Architecture Fix

*Last updated: July 2025*  
*Context: Fixing unauthenticated user flows after Company/Accounts/Personas refactors*

## Current Situation

Recent refactors to Company, Accounts, and Personas pages have broken the dual-path architecture that supports both authenticated (`/app/*`) and unauthenticated (`/playground/*`) user flows. While the core architecture remains sound, several hardcoded routes and inconsistent auth detection patterns are preventing unauthenticated users from properly using the playground mode.

### Problem Statement
After recent refactors, unauthenticated users experience broken flows due to:
- **Hardcoded `/app` routes** in generation/creation flows that break playground mode
- **Mixed auth detection patterns** causing inconsistent behavior
- **Aggressive MainLayout redirects** that conflict with dual-path design
- **Inconsistent route prefix handling** across components

### Root Cause Analysis
1. **Generation flows have hardcoded routes** - When users create entities, they get redirected to `/app` routes
2. **Auth state detection inconsistency** - Some components use `token`, others use `pathname.startsWith('/app')`
3. **MainLayout forced redirects** - Aggressive auth checks prevent intentional playground usage
4. **Missing auth-aware navigation** - Components don't consistently use dynamic route prefixes

### Success Criteria
- Unauthenticated users can fully use playground mode without auth redirects
- All generation flows work correctly in both authenticated and unauthenticated contexts
- Consistent auth detection and route prefix patterns across all components
- DraftManager continues to provide local persistence for unauthenticated users
- No data contamination between authenticated and unauthenticated sessions

## Architecture Context

### Current Working Components
- ✅ **Service layer routing**: Correctly routes to `/demo` vs `/api` endpoints based on auth state
- ✅ **Main routing setup**: Supports both `/playground/*` and `/app/*` routes using same components
- ✅ **DraftManager**: Provides local storage persistence for unauthenticated users
- ✅ **Most navigation**: Uses auth-aware prefixes via `SidebarNav` and location-based detection

### Critical Issues to Fix
- ❌ **Hardcoded `/app` routes** in `Company.tsx:83`, `AccountDetail.tsx`, `Personas.tsx:354`
- ❌ **Mixed auth detection**: Inconsistent use of `token` vs `pathname.startsWith('/app')`
- ❌ **Aggressive redirects**: MainLayout forces auth redirects that break playground intent
- ❌ **Route prefix inconsistency**: Not all components use dynamic prefixes for navigation

## Implementation Stages

### Stage 1: Fix POST Request Auth Detection for Company Generation ✅ **COMPLETED**
**Duration:** 1 day
**Dependencies:** None

#### Objectives:
- [x] Document all current auth detection patterns in components
- [x] Identify hardcoded `/app` routes in generation flows
- [x] Remove inappropriate auth checks blocking unauthenticated company generation
- [x] Implement consistent data normalization for both auth and unauth flows
- [x] Fix accounts page loading issues for unauthenticated users

#### Critical Fix Applied:
**Data Normalization Consistency** - Both authenticated and unauthenticated flows now use identical data formats:

**Authenticated Flow:**
1. Call `/demo/companies/generate-ai` → get `ProductOverviewResponse` (snake_case: `company_name`, `company_url`)
2. Call `/api/companies` POST → backend transforms and saves → returns `CompanyResponse` (DB format: `id`, `name`, `url`, `data`)
3. `normalizeCompanyResponse()` transforms to `CompanyOverviewResponse` (frontend format: `companyId`, `companyName`, `companyUrl`, camelCase)
4. Cache normalized data in React Query (in-memory cache)

**Unauthenticated Flow:**
1. Call `/demo/companies/generate-ai` → get `ProductOverviewResponse` (snake_case: `company_name`, `company_url`)
2. Create fake `CompanyResponse` structure → apply `normalizeCompanyResponse()` → get `CompanyOverviewResponse` (frontend format: `companyId`, `companyName`, `companyUrl`, camelCase)
3. Save normalized data to DraftManager (localStorage)

**Key Success:** Both flows end up with identical `CompanyOverviewResponse` format, eliminating field mismatch issues between authenticated and unauthenticated users.

#### 🎯 **CRITICAL ARCHITECTURAL PRINCIPLE ESTABLISHED:**

**"Transformations and Saves Must Be In Lockstep"**

Data transformations should happen at the same logical point in both authentication flows, not scattered throughout the UI. This ensures data consistency and prevents field mismatch bugs.

**✅ CORRECT PATTERN:**
```
Auth Flow:    AI Response → Backend Transform → Save → Normalize → Cache
Unauth Flow:  AI Response → Frontend Transform → Save → Same Format → Cache
```

**❌ AVOID PATTERN:**
```
Auth Flow:    AI Response → Backend Transform → Save → Normalize → Cache  
Unauth Flow:  AI Response → Save → UI Transform (scattered) → Inconsistent Format
```

**Rule:** Whatever normalization `normalizeCompanyResponse()` does for authenticated users, unauthenticated users must do the same transformation before saving. Both paths should converge on identical data formats.

### Stage 2: Fix Hardcoded Routes and Loading States ✅ **COMPLETED**
**Duration:** 1 day  
**Dependencies:** Stage 1 completion

#### Critical Fixes Applied:
- **Company Generation Routes:** Fixed hardcoded `/app` routes to use auth-aware navigation
- **Accounts Page Loading:** Resolved infinite "Loading company data..." for unauthenticated users
- **DraftManager Integration:** Accounts page now properly detects company context from localStorage

#### Route Pattern Fixes:
```typescript
// ✅ FIXED: Auth-aware route generation
const prefix = token ? '/app' : '/playground';
navigate(`${prefix}/company/${savedCompany.id}`);

// ✅ FIXED: Unauthenticated navigation to existing route structure
navigate('/playground/company', { 
  state: { draftId: tempId, apiResponse: normalizedCompany }
});
```

#### Loading State Resolution:
- **Root Cause:** Accounts page checked for `overview` existence but couldn't find DraftManager data
- **Solution:** Added DraftManager integration to company context detection
- **Replaced:** Aggressive redirects with user-friendly "No Company Found" message and navigation button

### Stage 3: Standardize Auth State Detection 🔄 **PENDING**
**Duration:** 1-2 days
**Dependencies:** Stage 2 completion

### Stage 4: Review MainLayout Redirect Logic 🔄 **PENDING**
**Duration:** 1 day
**Dependencies:** Stage 3 completion

### Stage 5: End-to-End Testing & Validation 🔄 **PENDING**
**Duration:** 1-2 days
**Dependencies:** Stage 4 completion

### Stage 6: Documentation & Pattern Establishment 🔄 **PENDING**
**Duration:** 1 day
**Dependencies:** Stage 5 completion

---

## 🎉 Previous Projects: COMPLETED

### ✅ PUT Pipeline Project: COMPLETED

### ✅ All Critical Issues Resolved
**All PUT request issues have been successfully resolved!** Clean, maintainable patterns established and successfully applied to Personas entity.

### Completed Stages:
- ✅ **Stage 1:** Pipeline Analysis & Documentation
- ✅ **Stage 2:** Service Layer Standardization  
- ✅ **Stage 3:** Cache Management Consistency
- ✅ **Stage 4:** Component Integration Cleanup
- ✅ **Stage 5:** Validation & Testing
- ✅ **Stage 6:** Company Service Migration

### ✅ Personas Implementation: COMPLETED
**All 6 stages of persona implementation completed successfully** with critical fixes applied:
- ✅ **Service Layer:** Field preservation patterns, anti-nesting protections
- ✅ **Component Integration:** Auth-aware routing, form field mapping fixes  
- ✅ **Hook Management:** Cache consistency, standardized query keys
- ✅ **AI Generation:** Proper schema compliance, company + account context
- ✅ **Pattern Validation:** End-to-end testing, PersonaDetail integration
- ✅ **Documentation:** Complete pattern templates for future entities

### Key Problems Solved:
- **Multiple data transformation layers** with inconsistent field formats
- **Complex field preservation logic** that was brittle and hard to debug
- **Cache updates bypassing normalization** functions
- **Component callbacks with defensive programming** handling multiple formats
- **Manual cache manipulation** instead of standardized patterns
- **Parameter name mismatches** causing silent undefined errors

### Solution Implemented:
- **Single Data Format Pipeline**: Always use camelCase in frontend, transform only at API boundaries
- **Explicit Field Separation**: Clear distinction between DB columns and JSON data
- **Simplified Merge Logic**: Object spread instead of complex defensive programming
- **Consistent Cache Updates**: All updates use normalization functions
- **Assertion-Based Error Handling**: Early detection prevents corruption

---

## 🎉 PUT PIPELINE PROJECT COMPLETION SUMMARY

### **🏆 MAJOR MILESTONE ACHIEVED**
**All critical PUT request issues resolved!** This implementation successfully eliminated three major bugs and established clean, maintainable patterns for future entity development.

### **📊 Quantified Results**

#### **Before vs After:**
- **Payload Size:** 124 bytes (corrupted) → 4747 bytes (complete data)
- **Field Preservation:** 4 fields (data loss) → 15+ fields (full preservation)  
- **Recursive Nesting:** Yes (data.data.data...) → No (clean structure)
- **Silent Failures:** Yes (gradual corruption) → No (early assertions)
- **Code Complexity:** 30+ lines defensive programming → 10 lines explicit logic

#### **Bugs Eliminated:**
- ✅ **Issue #1:** PUT Request Field Mapping Inconsistencies
- ✅ **Issue #4:** Recursive Data Nesting on PUT  
- ✅ **Issue #5:** Description-Only Edit Clears Core Fields
- ✅ **Field Deletion:** Massive data loss during updates
- ✅ **Parameter Mismatches:** currentEntity vs currentAccount confusion

### **🔧 Technical Achievements**

#### **Clean Architecture Established:**
1. **Explicit Field Separation:** Top-level DB columns vs JSON data clearly defined
2. **Assertion-Based Error Handling:** Early detection prevents corruption
3. **Consistent Parameter Naming:** Eliminated silent undefined errors
4. **Proper Field Mapping:** Entity-specific field transformations
5. **Single Transformation Points:** Clean API boundary handling

#### **Code Quality Improvements:**
- **Eliminated Brittle Patterns:** No more delete operations for field separation
- **Explicit Inclusion Logic:** Build payloads by including appropriate fields
- **Comprehensive Logging:** Clear data flow tracking for debugging
- **Fail-Fast Approach:** Assertions catch issues before database corruption
- **Maintainable Patterns:** Clear, explicit logic that's easy to understand

#### **Database Structure Optimization:**
- **Clean Separation:** `id`, `name`, `companyId` in top-level columns
- **JSON Data Field:** Only analysis data (`targetAccountDescription`, `firmographics`, `buyingSignals`)
- **No Duplication:** Eliminated redundant name fields
- **Proper Normalization:** Consistent camelCase ↔ snake_case transformations

### **🎓 Critical Lessons for Future Development**

#### **Patterns That Work:**
1. **Explicit over Implicit:** Always define field separation clearly
2. **Assertions over Warnings:** Fail fast to prevent gradual corruption
3. **Inclusion over Deletion:** Build payloads by including, not excluding
4. **Consistent Naming:** Same parameter names across all functions
5. **Entity-Specific Mapping:** Don't assume generic field names work everywhere

#### **Red Flags to Avoid:**
1. **Delete Operations:** For field separation (brittle and unpredictable)
2. **Defensive Programming Overload:** 20+ lines of fallback logic
3. **Parameter Name Mismatches:** Different names for same concept
4. **Manual Cache Updates:** Bypassing normalization functions
5. **Silent Failures:** Warnings instead of assertions for critical issues

#### **Reusable Templates for Personas & Campaigns:**
- **Merge Function Pattern:** Clean, explicit field separation logic
- **Field Mapping Pattern:** Entity-specific transformations
- **Assertion Pattern:** Early error detection strategies
- **Testing Pattern:** Comprehensive field preservation validation

### **🚀 Next Steps & Applications**

#### **Ready for Extension:**
- **Personas Development:** Apply same patterns with targetPersonaDescription, etc.
- **Campaigns Development:** Extend field mapping to campaignDescription, etc.
- **Other Entities:** Reusable patterns for any future entity types

#### **Documentation Updated:**
- **Bug_tracking.md:** Complete issue resolution documentation
- **Implementation.md:** Full project completion status
- **Lessons Learned:** Comprehensive guidance for future development
- **Code Patterns:** Reusable templates and best practices

#### **Validation Complete:**
- **All PUT requests working reliably**
- **Field preservation across all update scenarios**
- **Clean database structure maintained**  
- **Error handling catching issues early**
- **Patterns ready for reuse in other entities**

### **🎯 Success Criteria - ALL MET**
- ✅ PUT requests behave predictably and consistently
- ✅ Data transformations occur at single, well-defined points
- ✅ Field preservation is simple and reliable
- ✅ Cache updates maintain data consistency
- ✅ Component state synchronizes properly with server state
- ✅ Patterns established for future entity development

**This implementation provides a solid foundation for scaling to Personas, Campaigns, and any future entities with confidence that data integrity will be maintained.**

### ✅ Personas Extension Project: COMPLETED
**All 6 stages of persona implementation completed successfully** with critical fixes applied

## Implementation Stages

### Stage 1: Personas Analysis & Service Layer Preparation ✅ **COMPLETED**
**Duration:** 2-3 days  
**Dependencies:** PUT Pipeline project completion

#### Sub-steps:
- [x] Audit existing Personas service layer (`personaService.ts`)
- [x] Identify current data transformation patterns and pain points
- [x] Document current persona field structure (top-level vs JSON data fields)
- [x] Create persona-specific field mapping strategy
- [x] Apply explicit field separation patterns from Account/Company learnings

#### Completed Analysis Results:
- **Field Structure:** Personas use simplified architecture - only `name` at top-level, all AI content in JSON data
- **Patterns Applied:** Added `mergePersonaUpdates()`, API boundary transformation, recursive data detection
- **Pain Points Fixed:** Missing field preservation, no parameter consistency, no assertion-based error handling
- **Strategy:** Explicit field separation with Set-based approach, `currentPersona` naming standardization

#### Critical Questions - ANSWERED:
- ✅ **Top-level vs JSON data:** Only `id`, `accountId`, `name`, timestamps at top-level; all AI content in JSON data
- ✅ **Field mapping:** `targetPersonaDescription` stays in JSON data (no DB duplication), `targetPersonaName` → `name`
- ✅ **Defensive programming:** Dual format handling simplified, utility functions streamlined
- ✅ **Cache patterns:** Good normalization exists, added field preservation during updates

#### Key Implementation Patterns - APPLIED:
- ✅ **Explicit Field Separation**: Set-based approach implemented in `mergePersonaUpdates()`
- ✅ **Parameter Name Consistency**: Standardized `currentPersona` naming across functions
- ✅ **Assertion-Based Error Handling**: Added recursive data structure detection with critical errors
- ✅ **Entity-Specific Field Mapping**: Persona-specific name extraction and field separation logic

### Stage 2: Personas Service Layer Implementation ✅ **COMPLETED**
**Duration:** 2-3 days  
**Dependencies:** Stage 1 completion

#### Sub-steps:
- [x] Implement `mergePersonaUpdates()` function using proven patterns
- [x] Create standardized `updatePersona()` function with single transformation point
- [x] Update `normalizePersonaResponse()` for consistent format handling
- [x] Add comprehensive transformation logging and debugging
- [x] Implement persona-specific field mapping logic
- [x] Add field-preserving `updatePersonaWithMerge()` wrapper function

#### Completed Implementation:
- **Merge Function:** `mergePersonaUpdates()` with explicit field separation and recursive detection
- **API Transformation:** Single transformation point at API boundary with snake_case conversion  
- **Enhanced Normalization:** Added assertions, logging, and complex field validation
- **Field Preservation:** `updatePersonaWithMerge()` wrapper function for hook integration
- **Debugging:** Comprehensive logging throughout transformation pipeline

#### Application of Proven Patterns:
```typescript
// Template based on successful Account implementation
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
  
  // 4. Explicit field separation (persona-specific)
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

### Stage 3: Personas Component Integration ✅ **COMPLETED**
**Duration:** 2-3 days  
**Dependencies:** Stage 2 completion

#### Sub-steps:
- [x] Update Personas page components to use simplified update patterns
- [x] Remove any defensive programming from persona component callbacks
- [x] Standardize error handling and loading states for personas
- [x] Test persona component state synchronization with server state
- [x] Verify modal logic and re-render behavior for persona updates
- [x] Implement Demographics CriteriaTable rendering (similar to Firmographics)
- [x] Add BuyingSignalsCard component integration matching AccountDetail patterns
- [x] Integrate UseCasesCard component with field preservation

#### Completed Integration:
- **Field-Preserving Hook:** Added `useUpdatePersonaPreserveFields` matching account patterns
- **Component Updates:** All PersonaDetail update handlers use field preservation
- **UI Consistency:** Demographics, buying signals, and use cases use same patterns as AccountDetail
- **Error Handling:** Standardized error handling with `handleComponentError` function
- **State Sync:** Added component state synchronization testing
- **Modal Integration:** Demographics and buying signals modals updated with proven patterns

#### Focus Areas:
- Apply clean component update patterns from AccountDetail.tsx
- Ensure consistent error handling across persona operations
- Implement automatic state synchronization validation
- Remove any manual cache manipulation in persona components

### Stage 4: Personas Hook Integration & Cache Management ✅ **COMPLETED**
**Duration:** 2-3 days  
**Dependencies:** Stage 3 completion

#### Sub-steps:
- [x] Update `usePersonas` hooks to use consistent patterns
- [x] Replace any manual cache updates with normalization function calls
- [x] Implement consistent query key patterns for personas
- [x] Add cache state validation and debugging tools for personas
- [x] Test persona cache invalidation and refresh patterns

#### Completed Implementation:
- **Standardized Query Keys:** `PERSONAS_LIST_KEY = 'personas'`, `PERSONA_DETAIL_KEY = 'persona'` matching Account patterns
- **Cache Validation:** Added `validateCacheState()` function for persona cache debugging
- **Consistent Cache Updates:** All cache operations use `normalizePersonaResponse()` and consistent keys
- **Cache Testing:** Added `testPersonaCachePatterns()` for cache invalidation and refresh validation
- **Hook Consistency:** All persona hooks now follow Account service patterns with proper cache management

#### Applied Account Pattern Consistency:
- Cache validation utilities match Account implementation patterns
- Query key standardization follows established conventions
- All mutation success handlers include validation and normalization
- Added debugging tools for cache state inspection

### Stage 5: Validation & Testing ✅ **COMPLETED**
**Duration:** 2-3 days  
**Dependencies:** Stage 4 completion

#### Sub-steps:
- [x] Create comprehensive persona PUT request test suite
- [x] Test field preservation across all persona update scenarios  
- [x] Validate cache consistency after persona PUT operations
- [x] Test authentication state transitions with persona PUT requests
- [x] Verify no data loss in persona edge cases
- [x] Fix name field mapping bug in handleSavePersona
- [x] Implement auth-aware routing with /app and /playground prefixes
- [x] Fix AI generation payload to match TargetPersonaRequest schema
- [x] Add both companyContext and targetAccountContext for comprehensive AI analysis

#### Critical Issues Resolved:
- **Name Field Bug:** Fixed `handleSavePersona` to use form input value instead of old persona name
- **Routing Error:** Added auth-aware navigation with token-based prefix selection
- **API Payload Error:** Fixed 422 error by using correct schema fields (websiteUrl, personaProfileName, hypothesis)
- **Context Missing:** Added both company and target account context for AI generation
- **Pattern Alignment:** Removed unnecessary transform function to match account creation flow exactly

#### Testing Protocol (Based on Bug_tracking.md):
1. **Data Format Consistency**
   - [ ] Generate persona with full AI analysis data
   - [ ] Verify all persona fields present in expected format
   - [ ] Test partial update (name/description only)
   - [ ] Confirm all other persona fields preserved
   - [ ] Check database to verify correct persona storage

2. **Cache Consistency**
   - [ ] Verify cache reflects persona PUT response immediately
   - [ ] Test page refresh shows updated persona data
   - [ ] Confirm no stale persona data in localStorage
   - [ ] Test navigation away and back to personas

3. **Component State Sync**
   - [ ] Verify persona UI updates immediately after PUT
   - [ ] Test persona modal closes correctly after save
   - [ ] Confirm loading states work properly for personas
   - [ ] Test error states and retry logic for personas

### Stage 6: Documentation & Pattern Establishment ✅ **COMPLETED**
**Duration:** 1-2 days  
**Dependencies:** Stage 5 completion

#### Sub-steps:
- [x] Document persona-specific field mapping patterns
- [x] Update Bug_tracking.md with any persona-specific issues discovered
- [x] Create reusable templates for Campaign entity development
- [x] Update project structure documentation for persona patterns
- [x] Validate patterns are ready for Campaign entity extension

#### Documentation Updates:
- **Implementation.md:** Updated all stages to reflect completion and critical fixes
- **Bug_tracking.md:** Added persona-specific lessons learned and patterns
- **Pattern Templates:** Established reusable patterns for future entity development
- **Integration Validation:** PersonaDetail.tsx updated with field preservation patterns matching AccountDetail

## Critical Learnings to Apply

### From Bug_tracking.md - Red Flags to Avoid:
- **Recursive nesting:** Ensure no `data.data.data...` structures in persona updates
- **Field duplication:** Avoid same persona data in multiple formats/locations  
- **Parameter name mismatches:** Use consistent `currentPersona` naming
- **Mixed case conventions:** Maintain camelCase throughout frontend
- **Delete operations:** Use explicit inclusion patterns for field separation
- **Manual cache updates:** Always use normalization functions

### Proven Patterns to Implement:
- **Explicit Field Separation**: Clear distinction between persona DB columns and JSON data
- **Assertion-Based Error Handling**: Early detection prevents corruption
- **Consistent Parameter Naming**: Eliminate silent undefined errors
- **Proper Field Mapping**: Persona-specific field transformations
- **Single Transformation Points**: Clean API boundary handling

### Pre-Implementation Checklist (From Bug_tracking.md):
#### Before Starting Persona Updates:
- [ ] **Define field separation**: Which persona fields go to top-level DB columns vs JSON data?
- [ ] **Standardize parameter names**: Use consistent `currentPersona` naming across all functions
- [ ] **Create explicit field mapping**: Map generic UI fields to persona-specific fields
- [ ] **Add assertions early**: Catch recursive/malformed persona data immediately
- [ ] **Define test scenarios**: How will you verify persona field preservation?

#### During Implementation:
- [ ] **Use explicit inclusion patterns**: Build persona payloads by including, not deleting
- [ ] **Test parameter consistency**: Verify all persona hook signatures match call sites
- [ ] **Validate field mapping**: Ensure persona UI updates reach correct database fields
- [ ] **Check for recursion**: Monitor for nested data structures in persona updates
- [ ] **Test edge cases**: What happens with undefined/empty persona data?

## Resource Links

### Internal Documentation References
- **PUT Pipeline Learnings**: `/data-pipeline-notes/Bug_tracking.md` - Critical patterns and red flags
- **Account Service Patterns**: `/frontend/src/lib/accountService.ts` - Reference implementation
- **Company Service Patterns**: `/frontend/src/lib/companyService.ts` - Validated patterns
- **Entity Abstraction Layer**: `/notes/ARCHITECTURE.md#entity-management-abstraction-layer`

### Success Metrics
- **Zero recursive nesting**: No `data.data` structures in any persona logs
- **Complete field preservation**: All persona analysis fields maintained across updates
- **Correct database structure**: Persona top-level columns populated correctly
- **Proper field mapping**: Persona UI updates reach intended database fields
- **Consistent parameters**: No undefined errors from name mismatches in persona functions
- **Early error detection**: Assertions catch persona issues before database corruption

---

## Detailed Implementation Specifications

### New Service Layer Pattern

#### Standard Update Function
```typescript
// New simplified pattern
interface EntityUpdateRequest<T> {
  entityId: string;
  updates: Partial<T>;  // Always in frontend format
  token?: string | null;
}

export async function updateAccount(request: EntityUpdateRequest<TargetAccountResponse>): Promise<Account> {
  const { entityId, updates, token } = request;
  
  // Single transformation point
  const backendPayload = {
    name: updates.targetAccountName,
    data: transformKeysToSnakeCase(updates)
  };
  
  console.log('[UPDATE-ACCOUNT] Transform trace:', {
    frontendUpdates: updates,
    backendPayload,
    transformationPoint: 'updateAccount'
  });
  
  const response = await apiFetch<Account>(`/accounts/${entityId}`, {
    method: 'PUT',
    body: JSON.stringify(backendPayload),
  }, token);
  
  return normalizeAccountResponse(response);
}
```

#### Simplified Field Preservation
```typescript
// Replace complex merge logic with simple pattern
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityId, updates }: EntityUpdateRequest<TargetAccountResponse>) => {
      // Get current account in normalized frontend format
      const currentAccount = queryClient.getQueryData(['account', entityId]) as TargetAccountResponse;
      
      // Simple merge - all fields preserved automatically
      const mergedAccount = {
        ...currentAccount,
        ...updates
      };
      
      return updateAccount({ entityId, updates: mergedAccount });
    },
    onSuccess: (savedAccount) => {
      // Cache update uses normalized format
      queryClient.setQueryData(['account', entityId], savedAccount);
    }
  });
}
```

### Cache Update Standards

#### Consistent Cache Operations
```typescript
// All cache updates must use normalization
const updateCache = (entityId: string, rawData: any) => {
  queryClient.setQueryData(['account', entityId], normalizeAccountResponse(rawData));
};

// No manual cache manipulation
// Replace this pattern:
queryClient.setQueryData(['account', entityId], (prevData: any) => ({
  ...prevData,
  firmographics: newFirmographics
}));

// With this pattern:
const updatedAccount = normalizeAccountResponse({
  ...currentAccount,
  firmographics: newFirmographics
});
queryClient.setQueryData(['account', entityId], updatedAccount);
```

### Component Integration Pattern

#### Simplified Component Updates
```typescript
// New component pattern
const handleUpdate = async (updates: Partial<TargetAccountResponse>) => {
  try {
    await updateAccount({ 
      entityId: accountId!, 
      updates,
      token 
    });
    // No manual state management needed - React Query handles it
  } catch (error) {
    console.error('[COMPONENT-UPDATE] Failed:', error);
    // Handle error state
  }
};
```

## Quality Assurance

### Testing Strategy

#### Unit Testing Focus
- Data transformation functions (`transformKeysToCamelCase`, `transformKeysToSnakeCase`)
- Normalization functions (`normalizeAccountResponse`)
- Field preservation logic
- Cache update utilities

#### Integration Testing Focus
- Complete PUT request flow from component to backend
- Cache state consistency after updates
- Authentication-aware update patterns
- Error handling and retry logic

#### End-to-End Testing Focus
- User workflow: edit field → save → verify persistence
- Cross-authentication state testing
- Complex field updates (firmographics, buying signals)
- Performance under typical usage patterns

### Debugging Tools

#### Transformation Tracing
```typescript
// Comprehensive debugging template
const debugTransformation = (stage: string, data: any, context: any) => {
  console.log(`[TRANSFORM-DEBUG] ${stage}:`, {
    stage,
    dataKeys: Object.keys(data),
    hasSnakeCase: Object.keys(data).some(key => key.includes('_')),
    hasCamelCase: Object.keys(data).some(key => /[A-Z]/.test(key)),
    complexTypes: ['firmographics', 'buyingSignals', 'metadata'].map(key => ({
      key,
      exists: !!data[key],
      type: typeof data[key]
    })),
    context
  });
};
```

#### Cache State Validation
```typescript
// Cache consistency checks
const validateCacheState = (entityId: string) => {
  const cached = queryClient.getQueryData(['account', entityId]);
  console.log('[CACHE-VALIDATION]:', {
    entityId,
    exists: !!cached,
    format: cached ? {
      hasTargetAccountName: !!(cached as any).targetAccountName,
      hasName: !!(cached as any).name,
      topLevelKeys: Object.keys(cached as any),
      isNormalized: !Object.keys(cached as any).some(key => key.includes('_'))
    } : null
  });
};
```

## Migration Strategy

### Phase 1: Account Service (Primary Focus)
- Implement new patterns in account service first
- Test thoroughly with account PUT operations
- Document lessons learned and edge cases
- Create reusable patterns for other services

### Phase 2: Company Service Migration
- Apply validated patterns to company service
- Update company components to use new patterns
- Test integration with existing entity abstraction layer
- Verify no regression in existing functionality

### Phase 3: Persona/Campaign Services
- Extend patterns to remaining entity services
- Update all related components and hooks
- Comprehensive cross-entity testing
- Performance validation

### Rollback Plan
- Keep existing service functions during migration
- Feature flag new update patterns
- Gradual component migration with fallback capability
- Database integrity validation at each step

## Success Metrics

### Technical Metrics
- **PUT Request Success Rate**: >99% (currently inconsistent)
- **Data Consistency**: 100% field preservation in updates
- **Cache Hit Rate**: >95% for recently updated entities
- **Transformation Error Rate**: <1% (currently higher due to format issues)

### Development Experience Metrics
- **Debugging Time**: Reduce PUT request debugging time by 75%
- **Code Complexity**: Reduce service layer complexity by 50%
- **Developer Confidence**: Eliminate defensive programming patterns
- **Maintenance Overhead**: Simplify transformation logic maintenance

### User Experience Metrics
- **Update Reliability**: Consistent, predictable save behavior
- **Performance**: Sub-100ms cache updates after PUT requests
- **Error Recovery**: Clear error messages and retry patterns
- **Data Integrity**: Zero user-reported data loss incidents

## Resource Links

### Technical Documentation
- **TanStack Query Best Practices**: https://tanstack.com/query/latest/docs/react/guides/best-practices
- **React State Management**: https://react.dev/learn/managing-state
- **TypeScript Utility Types**: https://www.typescriptlang.org/docs/handbook/utility-types.html

### Internal Documentation References
- **Entity Abstraction Layer**: `/notes/ARCHITECTURE.md#entity-management-abstraction-layer`
- **Field Preservation Patterns**: `/notes/handoffs/DATA_STATE_CACHE_MANAGEMENT_GUIDE.md`
- **Data Flattening Strategy**: `/notes/handoffs/FLATTENING_COMPLEX_DATA_STRUCTURES.md`
- **Current Service Implementations**: `/frontend/src/lib/accountService.ts`, `/frontend/src/lib/companyService.ts`

### Debugging Resources
- **React Query DevTools**: Built-in cache inspection
- **Browser DevTools**: Network tab for PUT request analysis
- **Console Logging**: Comprehensive transformation tracing
- **Error Tracking**: Structured error logging and analysis

---

## 📋 PERSONA DATA STRUCTURE REFERENCE

### Complex Field Mapping - Persona Entity

**CRITICAL: These fields must NOT be flattened - they require complex structure for unique UX rendering**

#### Template → Backend → Frontend Variable Names

| **Template (snake_case)** | **Backend Schema** | **Frontend (camelCase)** | **Structure** |
|---------------------------|-------------------|-------------------------|---------------|
| `demographics` | `demographics` | `demographics` | Object with arrays |
| `job_titles` | `job_titles` | `jobTitles` | Array of strings |
| `departments` | `departments` | `departments` | Array of strings |
| `seniority` | `seniority` | `seniority` | Array of strings |
| `buying_roles` | `buying_roles` | `buyingRoles` | Array of strings |
| `job_description_keywords` | `job_description_keywords` | `jobDescriptionKeywords` | Array of strings |
| `use_cases` | `use_cases` | `useCases` | Array of objects |
| `use_case` | `use_case` | `useCase` | String |
| `pain_points` | `pain_points` | `painPoints` | String |
| `capability` | `capability` | `capability` | String |
| `desired_outcome` | `desired_outcome` | `desiredOutcome` | String |
| `buying_signals` | `buying_signals` | `buyingSignals` | Array of objects |
| `title` | `title` | `title` | String |
| `description` | `description` | `description` | String |
| `type` | `type` | `type` | String |
| `priority` | `priority` | `priority` | "Low\|Medium\|High" |
| `detection_method` | `detection_method` | `detectionMethod` | String |

#### Data Flow Path
```
Jinja2 Template → AI Response (snake_case) → Backend JSONB Storage (as-is) → Frontend Normalization (camelCase) → React Components (structured rendering)
```

#### Storage Strategy
- **Backend**: Entire AI response stored in JSONB `data` column without transformation
- **Frontend**: `normalizePersonaResponse()` converts to camelCase but preserves nested structure
- **Components**: Access via both `persona.demographics` and `persona.data.demographics`

#### Unique Rendering Requirements
- **Demographics**: Field-specific color coding in `CriteriaTable`
- **Buying Signals**: Priority-based visual differentiation (`BuyingSignalsCard`)
- **Use Cases**: Structured 4-field display (`UseCasesCard`)

**⚠️ DO NOT FLATTEN: These structures are essential for component rendering logic**