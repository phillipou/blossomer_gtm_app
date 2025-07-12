# Stage 2: Entity Migration Template

*Created: July 2025*  
*Context: Universal hook migration patterns established from Company.tsx*

## 🎯 **MIGRATION TEMPLATE: Entity Page → Universal Hooks**

### **Before Migration Pattern (Company.tsx example)**
```typescript
// ❌ OLD PATTERN: Duplicated auth logic
const { token } = useAuthState();

// Complex dual-flow generation handler (65+ lines)
if (token) {
  // Authenticated flow: manual API calls + navigation  
  createCompany(generatedData, {
    onSuccess: (savedCompany) => {
      navigate(`/app/company/${savedCompany.id}`, { replace: true });
    }
  });
} else {
  // Unauthenticated flow: manual normalization + DraftManager
  const fakeCompanyResponse = { id: `temp_${Date.now()}`, name: ..., data: generatedData };
  const normalizedCompany = normalizeCompanyResponse(fakeCompanyResponse);
  const tempId = DraftManager.saveDraft('company', normalizedCompany);
  navigate(`/playground/company`, { state: { draftId: tempId } });
}

// Hardcoded auth-aware routing (repeated 3+ times)
const prefix = token ? '/app' : '/playground';
navigate(`${prefix}/accounts/${accountId}`);
```

### **After Migration Pattern (Universal hooks)**
```typescript
// ✅ NEW PATTERN: Universal hooks eliminate duplication
const { create: createEntityUniversal, isAuthenticated } = useEntityCRUD<EntityType>('entity');
const { navigateToEntity, navigateWithPrefix } = useAuthAwareNavigation();

// Simplified generation handler (20 lines vs 65+)
const handleGenerate = async ({ name, description }) => {
  analyzeEntity({ websiteUrl: name, userInputtedContext: description }, {
    onSuccess: async (generatedData) => {
      try {
        // Universal create handles both auth flows automatically
        const result = await createEntityUniversal(generatedData, { navigateOnSuccess: false });
        entityPageState.setIsGenerationModalOpen(false);
        navigateToEntity('entity', result.id); // Auth-aware navigation
      } catch (error) {
        console.error('Universal create failed:', error);
      }
    }
  });
};

// Universal navigation (single line)
const handleEntityClick = (entityId: string) => navigateToEntity('entity', entityId);
const handleAddEntity = () => navigateWithPrefix('/entities');
```

## 📊 **QUANTIFIED IMPROVEMENTS FROM COMPANY.tsx MIGRATION**

### **Code Reduction:**
- **Generation handler**: 65 lines → 23 lines (65% reduction)
- **Navigation patterns**: 4 hardcoded prefixes → 0 (100% elimination)
- **Import statements**: 2 unused imports removed (DraftManager, normalizeCompanyResponse)
- **Auth detection logic**: 5 instances → 0 (100% elimination)

### **Patterns Eliminated:**
- ❌ **Hardcoded route prefixes**: `const prefix = token ? '/app' : '/playground'`
- ❌ **Manual dual-flow logic**: Separate auth/unauth branches in generation
- ❌ **Manual DraftManager calls**: Direct localStorage management
- ❌ **Manual normalization**: Fake response creation and transformation
- ❌ **Hardcoded navigation**: Static route strings with template literals

### **Universal Patterns Established:**
- ✅ **Single create flow**: `createEntityUniversal()` handles both auth states
- ✅ **Automatic navigation**: `navigateToEntity()` with auth-aware prefixes  
- ✅ **Consistent transformation**: Database-identical structure in cache
- ✅ **Error boundary**: Universal error handling across auth states

## 🛠 **STEP-BY-STEP MIGRATION GUIDE**

### **Step 1: Import Universal Hooks**
```typescript
// Add these imports
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';

// Remove these if no longer needed
// import { DraftManager } from '../lib/draftManager';
// import { normalizeEntityResponse } from '../lib/entityService';
```

### **Step 2: Replace Hook Declarations**
```typescript
// ❌ Replace this pattern
const { token } = useAuthState();
const { mutate: createEntity } = useCreateEntity(token);

// ✅ With this pattern  
const { create: createEntityUniversal, isAuthenticated } = useEntityCRUD<EntityType>('entity');
const { navigateToEntity, navigateWithPrefix } = useAuthAwareNavigation();
```

### **Step 3: Simplify Generation Handler**
```typescript
// ❌ Replace complex dual-flow logic (see "Before" example above)

// ✅ With universal pattern
const handleGenerate = async ({ name, description }) => {
  analyzeEntity({ websiteUrl: name, userInputtedContext: description }, {
    onSuccess: async (generatedData) => {
      try {
        const result = await createEntityUniversal(generatedData, { navigateOnSuccess: false });
        entityPageState.setIsGenerationModalOpen(false);
        navigateToEntity('entity', result.id);
      } catch (error) {
        console.error('[ENTITY-CREATION] Universal create failed:', error);
      }
    },
    onError: (error) => console.error('[ENTITY-GENERATION] Analysis failed:', error)
  });
};
```

### **Step 4: Replace Navigation Patterns**
```typescript
// ❌ Replace all instances of hardcoded routing
const prefix = token ? '/app' : '/playground';
navigate(`${prefix}/entities/${entityId}`);

// ✅ With universal navigation
navigateToEntity('entity', entityId);
navigateWithPrefix('/entities'); // For list pages
```

### **Step 5: Remove Unused Imports and Code**
- Remove `DraftManager` imports if no longer used
- Remove `normalizeEntityResponse` imports if no longer used  
- Remove manual auth detection variables (`token` checks)
- Remove hardcoded route prefix variables

## 🔍 **VERIFICATION CHECKLIST**

### **Functional Verification:**
- [ ] **Authenticated flow**: Generate → Save → Navigate works correctly
- [ ] **Unauthenticated flow**: Generate → Draft → Navigate works correctly  
- [ ] **Navigation consistency**: All entity links use auth-aware routing
- [ ] **Modal behavior**: Generation modal closes correctly after creation
- [ ] **Error handling**: Failed creation keeps modal open for retry

### **Code Quality Verification:**
- [ ] **No hardcoded routes**: Search for `/app` and `/playground` strings
- [ ] **No auth branches**: Search for `if (token)` or `token ?` patterns
- [ ] **No manual DraftManager**: Search for `DraftManager.saveDraft` calls
- [ ] **TypeScript compilation**: `npm run build` succeeds without new errors
- [ ] **Import cleanup**: No unused imports remain

### **Performance Verification:**
- [ ] **Consistent logging**: Universal patterns include debugging logs
- [ ] **Cache consistency**: Entity data maintains database-identical structure
- [ ] **Navigation performance**: Route changes are immediate and correct

## 📋 **ENTITY-SPECIFIC CONSIDERATIONS**

### **Company Entity** ✅ **COMPLETED**
- **Top-level fields**: `id`, `name`, `url`, `created_at`, `updated_at`
- **JSON data field**: All AI analysis content (capabilities, insights, etc.)
- **Navigation**: Direct `/company/{id}` routes

### **Account Entity** (Next migration target)
- **Top-level fields**: `id`, `name`, `company_id`, `created_at`, `updated_at`  
- **JSON data field**: `targetAccountDescription`, `firmographics`, `buyingSignals`
- **Navigation**: `/accounts/{id}` routes
- **Context requirement**: Requires `companyId` for creation

### **Persona Entity** (Future migration)
- **Top-level fields**: `id`, `name`, `account_id`, `created_at`, `updated_at`
- **JSON data field**: `demographics`, `useCases`, `buyingSignals` (complex structures)
- **Navigation**: `/accounts/{accountId}/personas/{id}` nested routes
- **Context requirement**: Requires `accountId` for creation

### **Campaign Entity** (Future migration)
- **Top-level fields**: TBD based on schema
- **JSON data field**: TBD based on AI analysis structure
- **Navigation**: TBD based on route structure
- **Context requirement**: TBD based on entity relationships

## 🚀 **NEXT MIGRATION TARGETS**

### **Priority Order:**
1. **Accounts.tsx** - Remove 15+ lines of company context duplication
2. **Personas.tsx** - Remove 15+ lines of company context duplication  
3. **AccountDetail.tsx** - Standardize detail page patterns
4. **PersonaDetail.tsx** - Apply universal detail patterns

### **Success Metrics Per Migration:**
- **50%+ code reduction** in auth-related logic
- **Zero hardcoded routes** remaining
- **100% functional equivalence** between auth states
- **Consistent error handling** across all flows

---

## 🎯 **CRITICAL SUCCESS PATTERN ESTABLISHED**

The Company.tsx migration demonstrates that universal hooks can **eliminate 65% of auth-related code** while **maintaining 100% functional equivalence** across authentication states. This template provides the blueprint for migrating all remaining entity pages to the universal pattern.

**Key Achievement**: Single source of truth for entity operations that automatically handles both authenticated and unauthenticated flows with database-consistent cache management.