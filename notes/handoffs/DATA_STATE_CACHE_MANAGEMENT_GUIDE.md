# Data State & Cache Management Guide

*Created: July 10, 2025*  
*Context: Debugging data corruption between localStorage drafts and authenticated database state*

## Overview

This document outlines the critical patterns and implementation details for managing data state across the authentication boundary in the Blossomer GTM application. The system uses a hybrid approach with localStorage drafts for unauthenticated users and database persistence for authenticated users, requiring careful cache management to prevent data contamination.

## Problem Statement

**Critical Issue Discovered**: Data contamination between localStorage drafts and authenticated database state can occur when:

1. Users generate content while unauthenticated (stored in localStorage)
2. Users then authenticate (should transition to database-only mode)
3. React Query cache persists stale data across auth state changes
4. Frontend fallback logic inadvertently uses corrupted localStorage data for authenticated users

## Architecture Principles

### **Data Isolation by Authentication State**

- **Authenticated Users (`/app/*` routes)**: ONLY use backend database data via React Query
- **Unauthenticated Users (`/playground/*` routes)**: ONLY use localStorage drafts for generation flow
- **Zero Cross-Contamination**: Authenticated users must never see localStorage data, even as fallback

### **Auth-Aware Data Source Selection Pattern**

```typescript
// CORRECT: Auth-aware data source selection
const displayData = token ? serverData : (serverData || draftData);

// WRONG: Can show corrupted drafts to authenticated users
const displayData = serverData || draftData;
```

## Partial Update Pattern (CRITICAL for Data Integrity)

### Problem: Field Nullification on Updates

**Critical Issue**: When updating entities, sending only partial data to the backend can overwrite the entire JSONB `data` field, nullifying all other analysis fields. This is especially dangerous for AI-generated entities with complex nested data structures.

**Example of the Problem**:
```typescript
// WRONG - This nullifies all other fields in the data JSONB column
updateCompany({
  companyId,
  name: updatedName,
  data: {
    description: updatedDescription, // Only this field survives
    // All other fields (business_profile, capabilities, etc.) are lost!
  },
});
```

### Solution: Field-Preserving Update Pattern

**Service Layer Implementation** (`lib/entityService.ts`):

```typescript
import { transformKeysToSnakeCase } from './utils';

/**
 * Merge partial updates with existing entity data, preserving all fields
 */
function mergeEntityUpdates(
  currentEntity: EntityOverviewResponse,
  updates: { name?: string; description?: string; [key: string]: any }
): EntityUpdate {
  // Reconstruct complete frontend data with updates
  const frontendData = {
    description: updates.description || currentEntity.description,
    entityName: updates.name || currentEntity.entityName,
    // Preserve ALL existing analysis data
    businessProfile: currentEntity.businessProfile,
    capabilities: currentEntity.capabilities,
    useCaseAnalysis: currentEntity.useCaseAnalysis,
    positioning: currentEntity.positioning,
    objections: currentEntity.objections,
    icpHypothesis: currentEntity.icpHypothesis,
    metadata: currentEntity.metadata,
    // Add any entity-specific fields here
  };

  // Use existing utility to convert to snake_case for backend
  const backendData = transformKeysToSnakeCase(frontendData);

  return {
    entityId: currentEntity.entityId,
    name: updates.name,
    data: backendData,
  };
}

/**
 * Update entity with field preservation - recommended for partial updates
 */
export async function updateEntityPreserveFields(
  entityId: string,
  currentEntity: EntityOverviewResponse,
  updates: { name?: string; description?: string; [key: string]: any },
  token?: string | null
): Promise<EntityOverviewResponse> {
  const mergedUpdate = mergeEntityUpdates(currentEntity, updates);
  
  console.log("Entity Service: Updating with preserved fields:", {
    entityId,
    updates,
    preservedFieldCount: Object.keys(mergedUpdate.data || {}).length
  });
  
  return updateEntity(mergedUpdate, token);
}
```

**Hook Implementation** (`lib/hooks/useEntity.ts`):

```typescript
export function useUpdateEntityPreserveFields(token?: string | null, entityId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    EntityOverviewResponse, 
    Error, 
    { currentEntity: EntityOverviewResponse; updates: { name?: string; description?: string; [key: string]: any } }
  >({
    mutationFn: ({ currentEntity, updates }) => 
      updateEntityPreserveFields(entityId!, currentEntity, updates, token),
    onSuccess: (savedEntity) => {
      console.log('[PRESERVE-FIELDS] Entity updated with field preservation:', savedEntity);
      queryClient.setQueryData([ENTITY_QUERY_KEY, entityId], savedEntity);
    },
  });
}
```

**Page Component Usage**:

```typescript
// Clean, simple component usage
const { mutate: updateEntityWithFieldPreservation } = useUpdateEntityPreserveFields(token, entityId);

const handleEntityEdit = (values: { name: string; description: string }) => {
  if (token && entityId && currentEntity) {
    updateEntityWithFieldPreservation({
      currentEntity,
      updates: {
        name: values.name,
        description: values.description,
      },
    });
  } else {
    // Handle unauthenticated draft updates...
  }
};
```

### Key Classes and Methods for Partial Updates

#### **Required Service Functions** (per entity):
- ✅ `mergeEntityUpdates()` - Private function to preserve fields
- ✅ `updateEntityPreserveFields()` - Public API for field-preserving updates
- ✅ `updateEntity()` - Standard update function (for full updates)

#### **Required Hook Functions** (per entity):
- ✅ `useUpdateEntity()` - Standard update hook
- ✅ `useUpdateEntityPreserveFields()` - Field-preserving update hook

#### **Required Utilities**:
- ✅ `transformKeysToSnakeCase()` from `lib/utils.ts` - Converts camelCase to snake_case
- ✅ `transformKeysToCamelCase()` from `lib/utils.ts` - Converts snake_case to camelCase

### Data Structure Mapping (Frontend ↔ Backend)

**Frontend (Normalized, camelCase)**:
```typescript
interface EntityOverviewResponse {
  entityId: string;
  entityName: string;
  description: string;
  businessProfile?: {
    category: string;
    businessModel: string;
    existingCustomers: string;
  };
  capabilities?: string[];
  useCaseAnalysis?: {
    processImpact: string;
    problemsAddressed: string;
    howTheyDoItToday: string;
  };
  // ... other analysis fields
}
```

**Backend (JSONB, snake_case)**:
```json
{
  "name": "Entity Name",
  "data": {
    "description": "...",
    "entity_name": "Entity Name",
    "business_profile": {
      "category": "...",
      "business_model": "...",
      "existing_customers": "..."
    },
    "capabilities": [...],
    "use_case_analysis": {
      "process_impact": "...",
      "problems_addressed": "...",
      "how_they_do_it_today": "..."
    }
  }
}
```

### Entity-Specific Field Mappings

#### **Company Fields**:
```typescript
// Frontend → Backend
businessProfile → business_profile
useCaseAnalysis → use_case_analysis
icpHypothesis → icp_hypothesis
companyName → company_name
```

#### **Account Fields** (example):
```typescript
// Frontend → Backend
targetAccountName → target_account_name
firmographics → firmographics
buyingSignals → buying_signals
decisionMakers → decision_makers
```

#### **Persona Fields** (example):
```typescript
// Frontend → Backend
personaName → persona_name
demographics → demographics
painPoints → pain_points
buyingProcess → buying_process
```

#### **Campaign Fields** (example):
```typescript
// Frontend → Backend
campaignName → campaign_name
campaignType → campaign_type
emailContent → email_content
targetingCriteria → targeting_criteria
```

## Implementation Guide

### 1. Authentication State Management (`lib/auth.ts`)

**Key Hook**: `useAuthState()`

**Critical Implementation**:
```typescript
// Clear React Query cache and localStorage drafts when authentication state changes
useEffect(() => {
  const previousAuthState = prevAuthState.current;
  const wasUnauthenticated = !previousAuthState.isAuthenticated;
  const isNowAuthenticated = authState.isAuthenticated;
  
  if (wasUnauthenticated !== !authState.isAuthenticated) {
    // Clear drafts using DraftManager
    DraftManager.clearDraftsOnAuthChange(wasUnauthenticated, isNowAuthenticated);
    
    // Clear all React Query cache to prevent contamination
    queryClient.clear();
    
    // Explicitly invalidate entity queries to force fresh data fetch
    queryClient.invalidateQueries({ queryKey: ['company'] });
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    queryClient.invalidateQueries({ queryKey: ['account'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['persona'] });
    queryClient.invalidateQueries({ queryKey: ['personas'] });
    queryClient.invalidateQueries({ queryKey: ['campaign'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }
  prevAuthState.current = authState;
}, [authState.isAuthenticated, queryClient]);
```

### 2. Draft Management (`lib/draftManager.ts`)

**Class**: `DraftManager`

**Key Methods**:
- `DraftManager.saveDraft(entityType, data, parentId?)`: Save draft to localStorage
- `DraftManager.getDrafts(entityType)`: Get all drafts for entity type
- `DraftManager.removeDraft(entityType, tempId)`: Remove specific draft
- `DraftManager.clearDraftsOnAuthChange(wasUnauthenticated, isNowAuthenticated)`: Handle auth transitions

**Critical Method for Auth Transitions**:
```typescript
static clearDraftsOnAuthChange(wasUnauthenticated: boolean, isNowAuthenticated: boolean): void {
  // Clear playground drafts when user authenticates
  if (wasUnauthenticated && isNowAuthenticated) {
    console.log('DraftManager: User authenticated - clearing all playground drafts to prevent contamination');
    this.clearAllDrafts();
    return;
  }
  
  // Clear authenticated drafts when user signs out
  if (!wasUnauthenticated && !isNowAuthenticated) {
    console.log('DraftManager: User signed out - clearing all authenticated drafts');
    this.clearAllDrafts();
    return;
  }
}
```

### 3. React Query Hook Patterns (`lib/hooks/`)

**Standard Pattern for Entity Hooks**:

```typescript
// GET Hook - Only enabled for authenticated users with entity ID
export function useGetEntity(token?: string | null, entityId?: string) {
  return useQuery<EntityResponse, Error>({
    queryKey: [ENTITY_QUERY_KEY, entityId],
    queryFn: () => getEntity(token, entityId),
    enabled: !!token && !!entityId, // Critical: Only fetch for authenticated users
  });
}

// CREATE Hook - Automatic cache updates
export function useCreateEntity(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<EntityResponse, Error, EntityOverviewResponse>({
    mutationFn: (newEntity) => createEntity(newEntity, token),
    onSuccess: (savedEntity) => {
      const normalized = normalizeEntityResponse(savedEntity);
      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] });
      // Add to cache immediately
      queryClient.setQueryData([ENTITY_QUERY_KEY, normalized.entityId], normalized);
    },
  });
}

// UPDATE Hook - Automatic cache updates
export function useUpdateEntity(token?: string | null, entityId?: string) {
  const queryClient = useQueryClient();
  return useMutation<EntityResponse, Error, EntityUpdate>({
    mutationFn: (entityData) => updateEntity(entityData, token),
    onSuccess: (savedEntity) => {
      const normalized = normalizeEntityResponse(savedEntity as any);
      queryClient.setQueryData([ENTITY_QUERY_KEY, entityId], normalized);
    },
  });
}
```

### 4. Page Component Cache Management

**Critical Pattern for Authenticated Page Components**:

```typescript
// Clear any stale cache data when authenticated user lands on entity page
useEffect(() => {
  if (token && entityId) {
    console.log("Entity: Authenticated user with entityId - ensuring fresh data by clearing stale cache");
    // Remove any stale cache entries that might have localStorage contamination
    queryClient.removeQueries({ queryKey: ['entity', entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity', entityId] });
  }
}, [token, entityId, queryClient]);
```

### 5. Data Source Selection Pattern

**In Page Components**:

```typescript
// Get draft data (localStorage)
const draftEntities = DraftManager.getDrafts('entity');
const draftEntity = draftEntities.length > 0 ? draftEntities[0].data : null;

// Auth-aware data source selection - CRITICAL PATTERN
const displayEntity = token ? serverEntity : (serverEntity || draftEntity);

// Debug logging for authenticated users
if (token) {
  console.log("Entity: AUTHENTICATED USER DATA ANALYSIS", {
    hasBackendData: !!serverEntity,
    hasLocalStorageDrafts: !!draftEntity,
    finalDisplayData: displayEntity,
    usingBackendData: displayEntity === serverEntity,
    draftCount: draftEntities.length
  });
  
  // Critical warning if localStorage data differs from backend
  if (draftEntity && serverEntity !== draftEntity) {
    console.warn("Entity: CRITICAL - Authenticated user has localStorage draft data that differs from backend!", {
      backend: serverEntity,
      localStorage: draftEntity,
      willUseBackend: displayEntity === serverEntity
    });
  }
}
```

### 6. API Client Logging (`lib/apiClient.ts`)

**Enhanced Logging for Debugging**:

```typescript
// Log outgoing requests
console.log(`🚀 API REQUEST: ${method} ${url}`, {
  endpoint,
  basePath,
  hasAuth: !!authToken,
  headers: { ...headers, Authorization: authToken ? 'Bearer [REDACTED]' : undefined },
  body: body ? JSON.parse(body) : undefined
});

// Log responses with detailed data for entity endpoints
if (endpoint.includes('/entities')) {
  console.log(`📋 RAW API RESPONSE DATA for ${endpoint}:`, {
    rawData,
    dataKeys: Object.keys(rawData),
    dataType: Array.isArray(rawData) ? 'array' : typeof rawData
  });
}
```

## Entity-Specific Implementation Checklist

When implementing this pattern for **Accounts**, **Personas**, and **Campaigns**:

### ✅ Required Components

1. **Hook Files** (`lib/hooks/useAccounts.ts`, `usePersonas.ts`, `useCampaigns.ts`):
   - `useGetEntity` / `useGetEntities`
   - `useCreateEntity`
   - `useUpdateEntity`
   - `useUpdateEntityPreserveFields` **← CRITICAL for partial updates**
   - `useDeleteEntity`
   - `useGenerateEntity` (for AI generation)

2. **Service Files** (`lib/accountService.ts`, `personaService.ts`, `campaignService.ts`):
   - `getEntity` / `getEntities`
   - `createEntity`
   - `updateEntity`
   - `updateEntityPreserveFields` **← CRITICAL for partial updates**
   - `mergeEntityUpdates` **← Private helper for field preservation**
   - `deleteEntity`
   - `generateEntity`
   - `normalizeEntityResponse`

3. **Page Components**:
   - Auth state checking
   - Cache clearing on auth user navigation
   - Auth-aware data source selection
   - Draft management integration

### ✅ Required Patterns

1. **Authentication State Management**:
   - Clear entity-specific queries in `auth.ts` useEffect
   - Handle route redirects between `/app/*` and `/playground/*`

2. **Draft Management**:
   - Use `DraftManager.getDrafts(entityType)`
   - Implement auto-save pattern with `useAutoSave` hook
   - Clear drafts on auth state changes

3. **Cache Management**:
   - Aggressive cache clearing for authenticated users
   - Cache invalidation on CRUD operations
   - Query key consistency across hooks

4. **Data Normalization**:
   - `normalizeEntityResponse` function for backend data transformation
   - Consistent camelCase/snake_case handling
   - Proper TypeScript types

## Common Pitfalls to Avoid

### ❌ Anti-Patterns

1. **Using localStorage drafts as fallback for authenticated users**:
   ```typescript
   // WRONG - can contaminate authenticated users
   const displayData = serverData || draftData;
   ```

2. **Not clearing cache on auth state changes**:
   ```typescript
   // WRONG - missing auth state effect
   // Auth state changes without cache clearing
   ```

3. **Manual cache manipulation without proper keys**:
   ```typescript
   // WRONG - inconsistent query keys
   queryClient.setQueryData(['entity'], data); // Missing entityId
   ```

4. **Not using the DraftManager for localStorage operations**:
   ```typescript
   // WRONG - direct localStorage manipulation
   localStorage.setItem('entity_data', JSON.stringify(data));
   ```

5. **Partial updates without field preservation**:
   ```typescript
   // WRONG - nullifies all other fields
   updateEntity({
     entityId,
     data: { description: newDescription } // All other analysis data lost!
   });
   ```

6. **Complex data transformation logic in page components**:
   ```typescript
   // WRONG - business logic in UI component
   const handleEdit = (values) => {
     const backendData = {
       description: values.description,
       business_profile: entity.businessProfile ? {
         category: entity.businessProfile.category,
         // ... 50 lines of transformation logic
       } : undefined
     };
     updateEntity({ entityId, data: backendData });
   };
   ```

### ✅ Best Practices

1. **Always use auth-aware data source selection**
2. **Use field-preserving updates for partial modifications**:
   ```typescript
   // CORRECT - preserves all existing fields
   updateEntityWithFieldPreservation({
     currentEntity,
     updates: { name: newName, description: newDescription }
   });
   ```
3. **Keep data transformation logic in service layer**
4. **Implement comprehensive logging for debugging**
5. **Use consistent query key patterns across all hooks**
6. **Clear cache aggressively on auth state transitions**
7. **Use TypeScript interfaces for type safety**
8. **Implement proper error handling and loading states**
9. **Leverage existing utility functions** (`transformKeysToSnakeCase`, `transformKeysToCamelCase`)
10. **Test partial updates thoroughly** to ensure no data loss

## Testing Strategy

### Manual Testing Checklist

For each entity type, test the following flow:

1. **Unauthenticated Flow**:
   - Generate entity in playground mode
   - Verify localStorage draft creation
   - Check data persistence across page refreshes
   - Verify no backend API calls

2. **Authentication Transition**:
   - Sign in while having localStorage drafts
   - Verify drafts are cleared
   - Verify cache is cleared
   - Verify redirect to authenticated routes

3. **Authenticated Flow**:
   - Create/update entities via backend
   - Verify data persistence in database
   - Verify no localStorage contamination
   - Check proper API calls with auth headers

4. **Cache Invalidation**:
   - Test page refreshes
   - Test navigation between entities
   - Test auth state changes
   - Verify clean data loading

5. **Partial Update Integrity** (**CRITICAL**):
   - Generate entity with full AI analysis data
   - Verify all fields are present (business_profile, capabilities, etc.)
   - Edit only name/description via UI
   - Check database to ensure ALL other fields are preserved
   - Log before/after field counts to verify preservation
   - Test multiple consecutive edits to ensure cumulative preservation

## Monitoring & Debugging

### Key Console Logs to Watch

1. **Auth State Changes**: `[AUTH DEBUG] Auth state changed`
2. **Draft Management**: `DraftManager: User authenticated - clearing all playground drafts`
3. **Cache Operations**: `Entity: Authenticated user with entityId - ensuring fresh data`
4. **API Requests**: `🚀 API REQUEST` and `📥 API RESPONSE`
5. **Data Source Selection**: `Entity: AUTHENTICATED USER DATA ANALYSIS`
6. **Partial Update Preservation**: `Entity Service: Updating with preserved fields`
7. **Field Preservation Success**: `[PRESERVE-FIELDS] Entity updated with field preservation`

### Common Debug Commands

```javascript
// Check localStorage state
Object.keys(localStorage).filter(key => key.includes('draft'))

// Check React Query cache
queryClient.getQueryCache().getAll()

// Clear everything for testing
localStorage.clear()
queryClient.clear()
```

## Conclusion

This data state management pattern is critical for maintaining data integrity across authentication boundaries. The key principle is **complete isolation** between authenticated and unauthenticated data sources, with aggressive cache clearing to prevent contamination.

When implementing for Accounts, Personas, and Campaigns, follow this exact pattern to ensure consistent behavior and prevent the data corruption issues we encountered with Companies.

**Remember**: Authenticated users should NEVER see localStorage data, even as a fallback. Always use auth-aware data source selection and comprehensive cache clearing.

---

## Reference Implementation: Company Entity

The Company entity serves as the reference implementation for this pattern. Review these files for concrete examples:

### **Service Layer** (`lib/companyService.ts`):
- ✅ `mergeCompanyUpdates()` - Field preservation logic
- ✅ `updateCompanyPreserveFields()` - Public API for safe partial updates
- ✅ `normalizeCompanyResponse()` - Backend→Frontend transformation
- ✅ Uses `transformKeysToSnakeCase()` utility for data conversion

### **Hook Layer** (`lib/hooks/useCompany.ts`):
- ✅ `useUpdateCompanyPreserveFields()` - Field-preserving update hook
- ✅ Proper React Query cache management
- ✅ Error handling and success callbacks

### **Component Layer** (`pages/Company.tsx`):
- ✅ Clean separation of concerns - no data transformation logic
- ✅ Simple `handleOverviewEdit()` function using field-preserving hook
- ✅ Auth-aware data source selection pattern
- ✅ Proper OverviewCard integration (hover edit button only)

### **Key Lessons Learned**:
1. **Data integrity is critical** - Always preserve existing analysis fields during partial updates
2. **Service layer is the right place** for data transformation and field preservation logic
3. **Existing utilities work well** - `transformKeysToSnakeCase()` handles the heavy lifting
4. **Comprehensive logging is essential** - Track field counts and update operations
5. **Page components should be simple** - Delegate complex logic to service/hook layers

This pattern must be replicated exactly for Accounts, Personas, and Campaigns to ensure consistent data integrity across the application.

---

## ✅ IMPLEMENTED: Field Preservation for localStorage Operations

**Solution Implemented**: Extended field preservation pattern to localStorage draft operations to ensure complete data integrity across both authenticated and unauthenticated modes.

### **Issue**: 
```typescript
// Current localStorage update pattern (in handleOverviewEdit)
const updatedDraft = {
  ...currentDraft,
  data: {
    ...currentDraft.data,
    companyName: updatedName,
    description: updatedDescription,
    // What if there are other fields in data that get lost?
  },
};
```

### **Proposed Solution**: 
Create **localStorage field-preserving utilities** similar to the backend pattern:

#### **New Utility Functions Needed** (`lib/draftManager.ts`):
```typescript
/**
 * Update draft entity with field preservation
 */
static updateDraftPreserveFields(
  entityType: EntityType, 
  tempId: string, 
  updates: { name?: string; description?: string; [key: string]: any }
): boolean {
  const currentDraft = this.getDraft(entityType, tempId);
  if (!currentDraft) return false;
  
  // Preserve all existing fields, only update specified ones
  const preservedData = {
    ...currentDraft.data,
    ...updates,
    // Ensure critical fields aren't lost
    entityName: updates.name || currentDraft.data.entityName,
    description: updates.description || currentDraft.data.description,
  };
  
  const updatedDraft = {
    ...currentDraft,
    data: preservedData,
  };
  
  const key = `${this.DRAFT_PREFIX}${entityType}_${tempId}`;
  localStorage.setItem(key, JSON.stringify(updatedDraft));
  return true;
}

/**
 * Bulk update multiple draft fields with preservation
 */
static updateDraftFields(
  entityType: EntityType,
  tempId: string,
  fieldUpdates: Record<string, any>
): boolean {
  // Similar pattern but for multiple field updates
}
```

#### **Component Integration**:
```typescript
// Clean localStorage updates in components
const handleDraftEdit = (values: { name: string; description: string }) => {
  const currentDraft = draftCompanies.find(draft => draft.tempId);
  if (currentDraft) {
    // Use field-preserving update instead of manual reconstruction
    DraftManager.updateDraftPreserveFields('company', currentDraft.tempId, {
      name: values.name,
      description: values.description,
    });
    
    // Update React Query cache
    queryClient.invalidateQueries(['company', companyId]);
  }
};
```

### **Benefits**:
1. **Consistency**: Same field preservation pattern for both backend and localStorage
2. **Data Safety**: Prevent accidental loss of draft analysis fields
3. **Code Reuse**: Standardized utilities for all entity types
4. **Maintainability**: Centralized localStorage logic in DraftManager

### **Implementation Status**: 
- ✅ **Implemented for Company** - Reference implementation complete
- 🔄 **Next**: Apply to Accounts, Personas, Campaigns
- ✅ **DraftManager.updateDraftPreserveFields()** - Added to `lib/draftManager.ts`
- ✅ **Company.tsx updated** - Using field-preserving localStorage updates

### **Reference Implementation**:

**DraftManager Utility** (`lib/draftManager.ts`):
```typescript
static updateDraftPreserveFields(
  entityType: EntityType, 
  tempId: string, 
  updates: { name?: string; description?: string; [key: string]: any }
): boolean {
  const currentDraft = this.getDraft(entityType, tempId);
  if (!currentDraft) return false;
  
  // Preserve all existing fields, only update specified ones
  const preservedData = {
    ...currentDraft.data, // Preserve all existing analysis data
    ...updates, // Apply updates
    // Ensure critical name fields are properly mapped
    ...(updates.name && { 
      [`${entityType}Name`]: updates.name,
      companyName: updates.name, // For backward compatibility
    }),
  };
  
  const updatedDraft = { ...currentDraft, data: preservedData };
  const key = `${this.DRAFT_PREFIX}${entityType}_${tempId}`;
  localStorage.setItem(key, JSON.stringify(updatedDraft));
  return true;
}
```

**Component Usage** (`pages/Company.tsx`):
```typescript
// Clean localStorage updates - no manual field reconstruction
const currentDraft = draftCompanies.find(draft => draft.tempId);
if (currentDraft) {
  const updateSuccess = DraftManager.updateDraftPreserveFields('company', currentDraft.tempId, {
    name: updatedName,
    description: updatedDescription,
  });
  
  if (updateSuccess) {
    queryClient.setQueryData(['company', companyId], (prevData: any) => ({
      ...prevData,
      companyName: updatedName,
      description: updatedDescription,
    }));
  }
}
```

### **Benefits Achieved**:
1. ✅ **Consistency**: Same field preservation pattern for both backend and localStorage
2. ✅ **Data Safety**: Prevents accidental loss of draft analysis fields
3. ✅ **Code Reuse**: Standardized utility for all entity types
4. ✅ **Maintainability**: Centralized localStorage logic in DraftManager
5. ✅ **Error Handling**: Proper success/failure feedback

This ensures **complete data integrity** across both authenticated (backend) and unauthenticated (localStorage) modes.