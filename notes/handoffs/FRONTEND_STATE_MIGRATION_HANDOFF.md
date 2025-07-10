# Frontend Draft/Auto-Save Pattern Implementation Plan

**Status:** In Progress  
**Last Updated:** July 2025  
**Target Pattern:** Draft → Auto-Save → Sync across Company, Account, Persona, Email

## Executive Summary

This document outlines the implementation plan for the draft/auto-save pattern across all AI-generated entities in the Blossomer GTM application. The goal is to provide a seamless, frictionless user experience where users never need to manually save their work, while maintaining data consistency between local drafts and backend persistence.

## Current State Assessment

### ✅ Already Implemented
- **TanStack Query Setup**: Fully configured with QueryClient and DevTools
- **Company Entity**: Complete draft/auto-save pattern implemented
  - AI generation → immediate auto-save attempt for authenticated users
  - localStorage fallback for unauthenticated users  
  - Auto-save on edits with proper TanStack Query integration
- **Authentication**: Stack Auth JWT integration with proper token management
- **API Infrastructure**: All CRUD endpoints exist for Company, Account, Persona, Campaign entities
- **Basic Auto-Save Hook**: Simple `useAutoSave` hook exists but needs enhancement

### ⚠️ Partially Implemented
- **Account Entity**: Has `/generate-ai` endpoint but no immediate auto-save pattern
- **TanStack Query Hooks**: All CRUD hooks exist with cache invalidation but need auto-save integration

### ❌ Not Implemented
- **Persona Entity**: No immediate auto-save pattern after generation
- **Email/Campaign Entity**: No immediate auto-save pattern after generation  
- **Enhanced Auto-Save Hook**: Current hook too basic for the target pattern
- **Draft Management Utility**: No centralized DraftManager class
- **Visual Draft Indicators**: No UI to distinguish draft vs saved states

## Target Pattern (Sequence Diagram)

```
User Interaction → AI Generation → Immediate Auto-Save → Success/Fallback Flow
     ↓                 ↓                    ↓                    ↓
1. Click "Generate" → POST /api/{entity}/generate-ai → Draft storage + immediate save attempt
   ↓
   If authenticated: → POST /api/{entity}/create → Navigate to saved entity
   If unauthenticated: → localStorage['draft_*'] → Show draft with save CTA
   If save fails: → localStorage['draft_*'] → Show retry UI
   
2. User edits field → debounce 500ms → PUT /api/{entity}/{id} → TanStack Query cache
3. Subsequent edits → debounce 500ms → PUT /api/{entity}/{id} → TanStack Query cache
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Create Auto-Save Hook
```typescript
// File: src/lib/hooks/useAutoSave.ts
interface UseAutoSaveOptions<T> {
  entity: 'company' | 'account' | 'persona' | 'email';
  draftKey: string;
  createMutation: UseMutationResult<T>;
  updateMutation: UseMutationResult<T>;
  debounceMs?: number;
}

export function useAutoSave<T>(options: UseAutoSaveOptions<T>) {
  // Auto-save logic with debouncing
  // Draft management
  // First save vs subsequent saves
}
```

#### 1.2 Create Draft Management Utilities
```typescript
// File: src/lib/draftManager.ts
export class DraftManager {
  static saveDraft(entity: string, data: any): void
  static getDraft(entity: string): any | null
  static removeDraft(entity: string): void
  static hasDraft(entity: string): boolean
}
```

#### 1.3 Update TanStack Query Hooks
- Add optimistic updates to all mutation hooks
- Implement proper cache invalidation
- Add error handling and retry logic

### Phase 2: Company Entity (Week 2)

#### 2.1 Implement Company Draft Pattern ✅ COMPLETED
- **LandingPage**: AI generation working correctly
- **Company page**: Immediate auto-save implemented for authenticated users
- **Auto-save**: POST on generation → PUT on subsequent edits working

#### 2.2 Company Auto-Save Integration
```typescript
// In Company.tsx
const { autoSave, isDraft, isSaving } = useAutoSave({
  entity: 'company',
  draftKey: 'draft_company',
  createMutation: useCreateCompany(),
  updateMutation: useUpdateCompany(),
});

// Trigger auto-save on field changes
const handleFieldChange = (field: string, value: any) => {
  autoSave({ [field]: value });
};
```

### Phase 3: Account Entity (Week 3)

#### 3.1 Implement Account Draft Pattern
- **Update Account generation**: Store in `localStorage['draft_account']`
- **Update Accounts page**: Show draft accounts in list with visual indicators
- **Add auto-save**: First edit/timeout triggers POST → subsequent edits trigger PUT

#### 3.2 Account List Integration
```typescript
// In Accounts.tsx
const { data: accounts } = useGetAccounts();
const draftAccounts = DraftManager.getDraft('accounts') || [];
const allAccounts = [...accounts, ...draftAccounts];

// Visual indicators for draft vs saved
{allAccounts.map(account => (
  <AccountCard 
    key={account.id || account.tempId}
    account={account}
    isDraft={!account.id}
    onAutoSave={handleAutoSave}
  />
))}
```

### Phase 4: Persona Entity (Week 4)

#### 4.1 Create Persona Draft Pattern
- **Add persona generation**: POST `/api/personas/generate-ai`
- **Implement draft storage**: `localStorage['draft_personas']`
- **Add auto-save**: Follow same pattern as accounts

#### 4.2 Persona List Integration
- Show draft personas in persona list
- Auto-save on first edit or timeout
- Sync with parent account relationship

### Phase 5: Email/Campaign Entity (Week 5)

#### 5.1 Create Email Draft Pattern
- **Add email generation**: POST `/api/campaigns/generate-ai`
- **Implement draft storage**: `localStorage['draft_emails']`
- **Add auto-save**: Follow same pattern as other entities

#### 5.2 Campaign View Integration
- Show draft emails in campaign view
- Auto-save on first edit or timeout
- Sync with parent persona relationship

### Phase 6: Polish & Optimization (Week 6)

#### 6.1 User Experience Enhancements
- **Loading States**: Show "Saving..." indicators
- **Error Handling**: Retry logic with user notifications
- **Conflict Resolution**: Handle concurrent edits gracefully
- **Offline Support**: Queue changes when offline

#### 6.2 Performance Optimizations
- **Debouncing**: Optimize auto-save frequency
- **Batch Updates**: Group related field changes
- **Memory Management**: Clean up unused drafts
- **Cache Optimization**: Minimize unnecessary re-renders

## Technical Implementation Details

### Auto-Save Triggers
```typescript
// Primary triggers
onFieldBlur: () => autoSave(currentData),
onTypingPause: debounce(() => autoSave(currentData), 500),
onNavigation: () => autoSave(currentData),
onTimeout: () => autoSave(currentData), // 30s fallback

// Secondary triggers
onWindowBeforeUnload: () => autoSave(currentData),
onVisibilityChange: () => autoSave(currentData),
```

### Draft State Management
```typescript
// Draft lifecycle
1. AI Generation → save to localStorage['draft_*']
2. UI Render → read from draft + show visual indicators
3. First Edit → POST /api/{entity} → remove draft → add to cache
4. Subsequent Edits → PUT /api/{entity}/{id} → update cache
5. Navigation → cleanup unused drafts
```

### Error Handling Strategy
```typescript
// Error scenarios
NetworkError: () => keep in draft state, show retry button
ValidationError: () => show inline errors, keep draft
ServerError: () => fallback to draft, show notification
ConflictError: () => show conflict resolution dialog
```

## Testing Strategy

### Unit Tests
- Draft management functions
- Auto-save hook behavior
- Error handling scenarios
- Debouncing logic

### Integration Tests
- Full entity lifecycle (draft → save → edit)
- Cross-entity relationships
- Network failure scenarios
- Cache invalidation

### E2E Tests
- User workflow from generation to final save
- Multiple entities in sequence
- Browser refresh scenarios
- Offline/online transitions

## Migration Strategy

### Data Migration
- **Existing localStorage**: One-time migration utility
- **User Communication**: Clear messaging about auto-save
- **Rollback Plan**: Ability to revert to manual save if needed

### Rollout Plan
1. **Company Entity**: Deploy and monitor
2. **Account Entity**: Deploy if Company successful
3. **Persona & Email**: Deploy together
4. **Full Rollout**: All entities with auto-save

## Success Metrics

### UX Metrics
- **Save Success Rate**: 99.5% auto-save success
- **Data Loss Events**: 0 user-reported data loss
- **User Satisfaction**: Positive feedback on auto-save experience

### Technical Metrics
- **API Response Time**: <2s for auto-save operations
- **Cache Hit Rate**: >90% for TanStack Query
- **Error Rate**: <1% for auto-save operations

## Future Considerations

### Scalability
- **Real-time Sync**: WebSocket updates for collaborative editing
- **Conflict Resolution**: Operational transforms for concurrent edits
- **Performance**: Virtualization for large entity lists

### Enhanced Features
- **Version History**: Track entity changes over time
- **Undo/Redo**: User-friendly change management
- **Collaboration**: Multiple users editing same entity

---

**Next Steps**: Begin Phase 1 implementation with core infrastructure setup. Reference this document for implementation order and technical details.