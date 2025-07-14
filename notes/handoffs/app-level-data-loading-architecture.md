# App-Level Data Loading Architecture

**Date**: 2025-01-14  
**Status**: In Progress  
**Priority**: High  
**Impact**: Architectural - affects all data-dependent components  

## Problem Statement

The current data fetching architecture has several critical issues:

1. **Scattered Data Fetching**: Each component (EmailWizardModal, Campaigns, Personas, etc.) fetches its own data
2. **Inconsistent State**: API data vs DraftManager data mismatches causing bugs
3. **Complex Syncing Logic**: Manual syncing between API and DraftManager in multiple places
4. **Loading Delays**: Users wait for data in each component individually
5. **Duplicate API Calls**: Multiple components fetching the same data
6. **Dual-Path Complexity**: Every component needs `if (isAuthenticated)` logic

### Specific Example - EmailWizardModal Issues
- Shows "No Target accounts found" even when accounts exist
- Duplicate personas appearing in dropdowns  
- Use cases not loading properly
- Complex 50+ line data loading logic with auth state branching

## Architectural Decision

Implement **centralized app-level data loading** with DraftManager as the universal single source of truth.

### Core Principle: Universal Data Access
```typescript
// All components use this pattern regardless of auth state:
const accounts = DraftManager.getDrafts('account');
const personas = DraftManager.getDrafts('persona');
const campaigns = DraftManager.getDrafts('campaign');
```

## Design Architecture

### Data Flow Patterns

#### Authenticated Users
```
App Start → API Fetch → Normalize → DraftManager → Components
           ↓
    Periodic Refresh → DraftManager → Components Re-render
```

#### Unauthenticated Users (Playground Mode)
```
User Actions → DraftManager → Components
(No API calls, no syncing needed)
```

### Single Source of Truth
- **DraftManager** becomes the universal data store
- **All components** read from DraftManager only
- **No direct API calls** in individual components
- **Consistent data format** across the entire app

## Implementation Plan

### Phase 1: Core Infrastructure ✅
1. Create `DataProvider` component for app-level data management
2. Create `dataSync` service for API → DraftManager syncing
3. Wrap app in DataProvider

### Phase 2: Data Sync Service ✅
1. Implement `syncAllDataToDraftManager()`
2. Handle companies, accounts, personas, campaigns
3. Add error handling and retry logic
4. Add deduplication logic

### Phase 3: Component Refactoring 🔄
1. **Start with EmailWizardModal** (current pain point)
2. Remove all API hooks and dual-path logic
3. Simplify to DraftManager-only data access
4. Validate use cases and personas work correctly

### Phase 4: Incremental Migration 📋
1. Refactor Campaigns page
2. Refactor Personas page  
3. Refactor Accounts page
4. Remove unused API hooks

### Phase 5: Performance & UX 📋
1. Add periodic data refresh for authenticated users
2. Implement optimistic updates
3. Add WebSocket support (future)
4. Performance monitoring

## Benefits Analysis

### Developer Experience
- ✅ **Simpler Components**: No API logic needed in components
- ✅ **Consistent Patterns**: All components use same data access pattern
- ✅ **Easier Testing**: Mock DraftManager instead of multiple API endpoints
- ✅ **Better Debugging**: Single data flow to trace issues
- ✅ **Reduced Code**: Eliminate 100+ lines of dual-path logic across components

### User Experience
- ✅ **Faster UI**: Instant component rendering (no per-component loading)
- ✅ **Consistent State**: No data mismatches between components
- ✅ **Offline-Ready**: Data persists in localStorage via DraftManager
- ✅ **Better Loading**: Single app-level loading instead of scattered spinners
- ✅ **Seamless Auth Transition**: Same UX for authenticated/unauthenticated users

### Performance
- ✅ **Fewer API Calls**: Batch loading vs per-component requests
- ✅ **Better Caching**: Centralized cache management
- ✅ **Optimized Re-renders**: Components only re-render when relevant DraftManager data changes
- ✅ **Reduced Bundle Size**: Remove duplicate API logic

## Technical Specifications

### DataProvider Interface
```typescript
interface DataContextValue {
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
}
```

### Data Sync Service
```typescript
interface DataSyncService {
  syncAllDataToDraftManager(companyId: string, token: string): Promise<void>;
  syncCompanies(companyId: string, token: string): Promise<void>;
  syncAccounts(companyId: string, token: string): Promise<void>;
  syncPersonas(companyId: string, token: string): Promise<void>;
  syncCampaigns(companyId: string, token: string): Promise<void>;
}
```

### Component Simplification Example
```typescript
// Before: EmailWizardModal (50+ lines of dual-path logic)
const { data: apiAccounts, isLoading: isAccountsLoading } = useGetAccounts(companyId, token);
const { data: apiPersonas, isLoading: isPersonasLoading } = useGetAllPersonas(companyId, token);
const draftAccounts = !token ? DraftManager.getDrafts('account') : [];
const allAccounts = token ? apiAccounts : [...(apiAccounts || []), ...draftAccounts];
// + 40 more lines of complex logic...

// After: EmailWizardModal (5 lines)
const accounts = DraftManager.getDrafts('account').map(draft => draft.data);
const personas = DraftManager.getDrafts('persona').map(draft => draft.data);
const campaigns = DraftManager.getDrafts('campaign').map(draft => draft.data);
```

## Migration Strategy

### Backwards Compatibility
- ✅ **No Breaking Changes**: Existing playground users unaffected
- ✅ **Gradual Migration**: Can migrate components incrementally
- ✅ **Rollback Safe**: Can revert individual components if needed

### Testing Strategy
1. **Unit Tests**: Mock DraftManager for component testing
2. **Integration Tests**: Test DataProvider with real API calls
3. **E2E Tests**: Verify both authenticated and unauthenticated flows
4. **Performance Tests**: Measure loading time improvements

### Rollout Plan
1. **Week 1**: Core infrastructure (DataProvider, dataSync service)
2. **Week 2**: EmailWizardModal refactoring and validation
3. **Week 3**: Campaigns and Personas page migration
4. **Week 4**: Accounts page and cleanup of unused code

## Risk Mitigation

### Potential Risks
1. **Data Consistency**: API and DraftManager out of sync
2. **Performance**: Large data sets in localStorage
3. **Memory Usage**: Keeping all data in memory

### Mitigation Strategies
1. **Sync Validation**: Checksum verification between API and DraftManager
2. **Data Pagination**: Implement virtual scrolling for large datasets
3. **Memory Management**: Lazy loading and cleanup of unused data
4. **Error Recovery**: Automatic retry with exponential backoff

## Success Metrics

### Performance Metrics
- **Time to Interactive**: Reduce by 60% (components render immediately)
- **API Calls**: Reduce by 70% (batch loading vs per-component)
- **Bundle Size**: Reduce by 15% (remove duplicate API logic)

### Code Quality Metrics
- **Cyclomatic Complexity**: Reduce average component complexity by 40%
- **Lines of Code**: Remove 200+ lines of dual-path logic
- **Test Coverage**: Increase to 90% (simpler mocking)

### User Experience Metrics
- **Loading States**: Reduce from 8 different loading spinners to 1 app-level loader
- **Error States**: Centralized error handling vs scattered try-catch blocks
- **Consistency**: 100% data consistency across all components

## Current Status

### Completed ✅
- [x] Architecture documentation
- [x] Problem analysis and solution design
- [x] Technical specifications

### In Progress 🔄
- [ ] DataProvider implementation
- [ ] dataSync service creation
- [ ] EmailWizardModal refactoring

### Next Steps 📋
1. Implement DataProvider component
2. Create dataSync service with error handling
3. Integrate DataProvider into app root
4. Refactor EmailWizardModal as proof of concept
5. Validate all use cases work correctly
6. Plan incremental migration of remaining components

---

## Files to be Created/Modified

### New Files
- `/src/providers/DataProvider.tsx`
- `/src/lib/dataSync.ts`
- `/src/contexts/DataContext.tsx`

### Modified Files
- `/src/App.tsx` - Wrap in DataProvider
- `/src/components/campaigns/EmailWizardModal.tsx` - Remove API calls, use DraftManager only
- `/src/pages/Campaigns.tsx` - Simplify data access
- `/src/pages/Personas.tsx` - Remove redundant API calls
- `/src/pages/Accounts.tsx` - Remove redundant API calls

### Files to be Removed (Eventually)
- Complex dual-path logic in all components
- Redundant API hooks after migration complete

---

**Next Handoff**: After DataProvider implementation, validate EmailWizardModal works correctly for both authenticated and unauthenticated users with consistent use case loading.