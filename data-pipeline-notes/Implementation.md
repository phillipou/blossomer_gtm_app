# Implementation Plan - Simplify PUT Pipeline

*Last updated: July 2025*  
*Context: Streamlining data transformation and PUT request handling in Blossomer GTM*

## Feature Analysis

### Problem Statement
PUT requests in the Blossomer GTM application are consistently problematic due to:
- Multiple data transformation layers with inconsistent field formats
- Complex field preservation logic that's brittle and hard to debug
- Cache updates that bypass normalization functions
- Component render/callback logic that doesn't properly handle state updates

### Root Cause Analysis
The core issue is **too many transformation layers** with **inconsistent field formats**:
1. Component receives data in multiple possible formats
2. Service attempts to normalize everything with defensive programming
3. Complex merge logic tries to handle all edge cases
4. Backend may still receive wrong format
5. Cache updates bypass transformations entirely

### Success Criteria
- PUT requests behave predictably and consistently
- Data transformations occur at single, well-defined points
- Field preservation is simple and reliable
- Cache updates maintain data consistency
- Component state synchronizes properly with server state

## Recommended Approach

### Strategy: Single Data Format Pipeline
- **Frontend Format**: Always use camelCase `TargetAccountResponse` format in components and cache
- **Transformation Points**: Only transform at API client boundaries
- **Field Preservation**: Simple object spread instead of complex merge logic
- **Cache Consistency**: All cache operations use normalized frontend format

### Technology Stack (Existing)
- **Frontend Framework**: React 18 with TypeScript - Already established
- **State Management**: TanStack Query - Already configured
- **Data Transformation**: Existing utility functions (`transformKeysToCamelCase`, `transformKeysToSnakeCase`)
- **Field Preservation**: Simplified patterns replacing complex merge logic

## Implementation Stages

### Stage 1: Pipeline Analysis & Documentation
**Duration:** 1-2 days  
**Dependencies:** None

#### Sub-steps:
- [x] Analyze current PUT request pain points and document issues
- [ ] Audit all transformation points in account and company services
- [ ] Document current data flow through the pipeline
- [ ] Identify all locations where manual cache updates occur
- [ ] Create comprehensive logging strategy for transformation debugging

### Stage 2: Service Layer Standardization
**Duration:** 3-4 days  
**Dependencies:** Stage 1 completion

#### Sub-steps:
- [ ] Implement single data format standard across account service
- [ ] Simplify `mergeAccountUpdates()` function to use object spread
- [ ] Create standardized `updateAccount()` function with single transformation point
- [ ] Update `normalizeAccountResponse()` to handle edge cases consistently
- [ ] Add comprehensive transformation logging and debugging

### Stage 3: Cache Management Consistency
**Duration:** 2-3 days  
**Dependencies:** Stage 2 completion

#### Sub-steps:
- [ ] Audit all manual `queryClient.setQueryData()` calls
- [ ] Replace manual cache updates with normalization function calls
- [ ] Implement consistent query key patterns across all hooks
- [ ] Add cache state validation and debugging tools
- [ ] Test cache invalidation and refresh patterns

### Stage 4: Component Integration Cleanup
**Duration:** 2-3 days  
**Dependencies:** Stage 3 completion

#### Sub-steps:
- [ ] Update `AccountDetail.tsx` to use simplified update patterns
- [ ] Remove defensive programming from component callbacks
- [ ] Standardize error handling and loading states
- [ ] Test component state synchronization with server state
- [ ] Verify modal logic and re-render behavior

### Stage 5: Validation & Testing
**Duration:** 2-3 days  
**Dependencies:** Stage 4 completion

#### Sub-steps:
- [ ] Create comprehensive PUT request test suite
- [ ] Test field preservation across all update scenarios
- [ ] Validate cache consistency after PUT operations
- [ ] Test authentication state transitions with PUT requests
- [ ] Verify no data loss in edge cases

### Stage 6: Company Service Migration
**Duration:** 2-3 days  
**Dependencies:** Stage 5 completion (Account validation)

#### Sub-steps:
- [ ] Apply same simplification patterns to `companyService.ts`
- [ ] Update `Company.tsx` component integration
- [ ] Test company PUT requests with new patterns
- [ ] Verify field preservation for company-specific fields
- [ ] Update documentation with lessons learned

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