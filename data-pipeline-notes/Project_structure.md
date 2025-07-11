# Project Structure - Simplify PUT Pipeline

*Last updated: July 2025*  
*Context: File organization and module structure for PUT pipeline simplification*

## Root Directory Structure

```
blossomer_gtm_app/
├── backend/app/                     # FastAPI backend
│   ├── api/routes/                  # API endpoint definitions
│   ├── core/                        # Core services (auth, database, LLM)
│   ├── models/                      # Database models (SQLAlchemy)
│   ├── schemas/                     # Pydantic schemas
│   └── services/                    # Business logic services
├── frontend/src/                    # React TypeScript frontend
│   ├── components/                  # Reusable UI components
│   ├── pages/                       # Route-level page components
│   ├── lib/                         # Core utilities and services
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API service functions (DEPRECATED)
│   │   └── utils.ts                 # Transformation utilities
│   └── types/                       # TypeScript type definitions
├── data-pipeline-notes/             # PUT pipeline simplification docs
├── notes/                           # Architecture and handoff documentation
└── tests/                           # Backend test suite
```

## Frontend Service Layer Organization

### Current Structure (During Migration)
```
frontend/src/lib/
├── accountService.ts                # Account-specific API operations
├── companyService.ts                # Company-specific API operations
├── personaService.ts                # Persona-specific API operations
├── campaignService.ts               # Campaign-specific API operations
├── apiClient.ts                     # Base API client and authentication
├── auth.ts                          # Authentication state management
├── draftManager.ts                  # localStorage draft management
├── utils.ts                         # Data transformation utilities
├── entityConfigs.ts                 # Entity page configuration
├── hooks/
│   ├── useAccounts.ts               # Account-related React Query hooks
│   ├── useCompany.ts                # Company-related React Query hooks
│   ├── usePersonas.ts               # Persona-related React Query hooks
│   ├── useCampaigns.ts              # Campaign-related React Query hooks
│   └── useEntityPage.ts             # Entity abstraction layer hook
└── services/ (DEPRECATED)           # Legacy service files - being migrated
    ├── accountService.ts            # → Moving to /lib/accountService.ts
    ├── companyService.ts            # → Moving to /lib/companyService.ts
    └── ...                          # Other legacy services
```

### Target Structure (Post-Migration)
```
frontend/src/lib/
├── api/                             # API layer (NEW)
│   ├── client.ts                    # Base API client
│   ├── accounts.ts                  # Account API operations
│   ├── companies.ts                 # Company API operations
│   ├── personas.ts                  # Persona API operations
│   ├── campaigns.ts                 # Campaign API operations
│   └── transformations.ts           # Data transformation utilities
├── hooks/                           # React Query hooks
│   ├── useAccounts.ts               # Account hooks
│   ├── useCompany.ts                # Company hooks
│   ├── usePersonas.ts               # Persona hooks
│   ├── useCampaigns.ts              # Campaign hooks
│   └── useEntityPage.ts             # Entity abstraction
├── cache/                           # Cache management (NEW)
│   ├── queryKeys.ts                 # Standardized query key patterns
│   ├── invalidation.ts              # Cache invalidation utilities
│   └── normalization.ts             # Cache normalization functions
├── auth.ts                          # Authentication state
├── draftManager.ts                  # Draft management
├── entityConfigs.ts                 # Entity configurations
└── types/                           # Service-specific types
    ├── api.ts                       # API request/response types
    ├── entities.ts                  # Entity-specific types
    └── cache.ts                     # Cache-specific types
```

## API Service Layer Architecture

### Service Function Organization

#### Account Service (`/lib/api/accounts.ts`)
```typescript
// Core CRUD operations
export async function getAccount(accountId: string, token?: string): Promise<Account>
export async function getAccounts(companyId: string, token?: string): Promise<Account[]>
export async function createAccount(accountData: AccountCreate, token?: string): Promise<Account>
export async function updateAccount(request: EntityUpdateRequest<TargetAccountResponse>): Promise<Account>
export async function deleteAccount(accountId: string, token?: string): Promise<void>

// AI generation
export async function generateAccount(request: TargetAccountAPIRequest, token?: string): Promise<TargetAccountResponse>

// Normalization (single transformation point)
export function normalizeAccountResponse(account: Account): TargetAccountResponse

// Field preservation (simplified)
function mergeAccountData(current: TargetAccountResponse, updates: Partial<TargetAccountResponse>): TargetAccountResponse
```

#### Data Transformation Module (`/lib/api/transformations.ts`)
```typescript
// Single source of truth for transformations
export function transformKeysToCamelCase<T = unknown>(obj: unknown): T
export function transformKeysToSnakeCase<T = unknown>(obj: unknown): T

// Entity-specific normalizers
export function normalizeAccountResponse(raw: Account): TargetAccountResponse
export function normalizeCompanyResponse(raw: CompanyResponse): CompanyOverviewResponse
export function normalizePersonaResponse(raw: PersonaResponse): TargetPersonaResponse

// Debugging utilities
export function debugTransformation(stage: string, data: any, context?: any): void
export function validateDataFormat(data: any, expectedFormat: 'camelCase' | 'snake_case'): boolean
```

### Hook Organization

#### Account Hooks (`/lib/hooks/useAccounts.ts`)
```typescript
// Query hooks
export function useGetAccount(accountId?: string, token?: string): UseQueryResult<TargetAccountResponse>
export function useGetAccounts(companyId: string, token?: string): UseQueryResult<TargetAccountResponse[]>

// Mutation hooks (simplified)
export function useCreateAccount(companyId: string, token?: string): UseMutationResult<Account, Error, AccountCreate>
export function useUpdateAccount(token?: string): UseMutationResult<Account, Error, EntityUpdateRequest<TargetAccountResponse>>
export function useDeleteAccount(token?: string): UseMutationResult<void, Error, string>

// AI generation
export function useGenerateAccount(companyId: string, token?: string): UseMutationResult<TargetAccountResponse, Error, TargetAccountAPIRequest>

// Entity page integration
export function useGetAccountForEntityPage(accountId?: string, token?: string): UseQueryResult<TargetAccountResponse>
export function useGetAccountsForEntityPage(companyId: string, token?: string): UseQueryResult<TargetAccountResponse[]>
```

### Cache Management Structure

#### Query Key Patterns (`/lib/cache/queryKeys.ts`)
```typescript
// Standardized query key factory
export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    byCompany: (companyId: string) => [...queryKeys.accounts.all, 'byCompany', companyId] as const,
    detail: (accountId: string) => [...queryKeys.accounts.all, 'detail', accountId] as const,
  },
  companies: {
    all: ['companies'] as const,
    detail: (companyId: string) => [...queryKeys.companies.all, 'detail', companyId] as const,
  },
  // ... other entities
};
```

#### Cache Utilities (`/lib/cache/normalization.ts`)
```typescript
// Cache normalization utilities
export function updateAccountCache(queryClient: QueryClient, accountId: string, rawData: Account): void
export function invalidateAccountCache(queryClient: QueryClient, accountId: string): void
export function validateCacheState(queryClient: QueryClient, entityType: string, entityId: string): void
```

## Component Integration Structure

### Page Component Organization
```
frontend/src/pages/
├── AccountDetail.tsx                # Detail view with entity abstraction
├── Accounts.tsx                     # List view (simplified hybrid approach)
├── CompanyDetail.tsx                # Detail view with entity abstraction
├── Company.tsx                      # List view or redirect component
├── PersonaDetail.tsx                # Detail view with entity abstraction
├── Personas.tsx                     # List view (simplified hybrid approach)
├── CampaignDetail.tsx               # Detail view with entity abstraction
└── Campaigns.tsx                    # List view (simplified hybrid approach)
```

### Component Integration Pattern
```typescript
// Standard detail page pattern
export default function AccountDetail() {
  const { id: accountId } = useParams<{ id: string }>();
  const { token } = useAuthState();
  
  // Entity abstraction layer
  const entityPageState = useEntityPage<TargetAccountResponse>({
    config: accountConfig,
    hooks: {
      useGet: useGetAccountForEntityPage,
      useGetList: useGetAccountsForEntityPage,
      useCreate: useCreateAccount,
      useUpdate: useUpdateAccount,  // Simplified hook
      // ... other hooks
    },
  });
  
  // Simplified update handler
  const handleUpdate = async (updates: Partial<TargetAccountResponse>) => {
    try {
      await updateAccount({ entityId: accountId!, updates, token });
      // React Query handles cache updates automatically
    } catch (error) {
      console.error('[ACCOUNT-UPDATE] Failed:', error);
    }
  };
  
  return (
    <EntityPageLayout
      config={accountConfig}
      entityPageState={entityPageState}
      onUpdate={handleUpdate}
    />
  );
}
```

## Configuration and Types

### Entity Configuration Structure
```
frontend/src/lib/entityConfigs.ts
```
- Contains declarative configuration for all entity types
- Defines field cards, preserved complex types, and modal configurations
- Used by entity abstraction layer for consistent behavior

### Type Definition Organization
```
frontend/src/types/
├── api.ts                           # API request/response interfaces
├── entities.ts                      # Business entity interfaces
├── cache.ts                         # Cache-specific type definitions
└── components.ts                    # Component prop interfaces
```

#### Key Type Definitions
```typescript
// Standardized update request pattern
interface EntityUpdateRequest<T> {
  entityId: string;
  updates: Partial<T>;
  token?: string | null;
}

// Cache operation interfaces
interface CacheUpdateOptions {
  invalidateRelated?: boolean;
  optimisticUpdate?: boolean;
  retryOnError?: boolean;
}
```

## Development Workflow Structure

### File Naming Conventions
- **Service files**: `{entity}Service.ts` (e.g., `accountService.ts`)
- **Hook files**: `use{Entity}.ts` (e.g., `useAccounts.ts`)
- **Component files**: `{EntityName}.tsx` (e.g., `AccountDetail.tsx`)
- **Type files**: Descriptive names in camelCase (`api.ts`, `entities.ts`)

### Import/Export Patterns
```typescript
// Service exports (explicit exports for better tree-shaking)
export {
  getAccount,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  generateAccount,
  normalizeAccountResponse
} from './api/accounts';

// Hook exports (grouped by entity)
export {
  useGetAccount,
  useGetAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useGenerateAccount
} from './hooks/useAccounts';
```

### Module Dependencies
```
API Layer (api/) → Base client, transformations
Hook Layer (hooks/) → API layer, cache utilities
Component Layer (pages/) → Hook layer, entity configs
Cache Layer (cache/) → Query client, transformations
```

## Migration Directory Structure

### During Migration Period
```
data-pipeline-notes/                # Migration documentation
├── Bug_tracking.md                 # Issue tracking and resolution
├── Implementation.md               # Implementation plan and progress
├── Project_structure.md            # This file
└── UI_UX_doc.md                    # UI/UX requirements and standards

frontend/src/lib/
├── accountService.ts               # Current implementation (being updated)
├── services/                       # Legacy files (will be removed)
│   └── accountService.ts           # Old implementation
└── api/                            # New structure (being created)
    └── accounts.ts                 # New implementation
```

### Migration Steps
1. **Create new API layer structure** in `/lib/api/`
2. **Update service functions** with simplified patterns
3. **Migrate hooks** to use new service functions
4. **Update components** to use simplified hooks
5. **Remove legacy files** from `/lib/services/`
6. **Clean up imports** throughout the application

## Testing Structure

### Test File Organization
```
tests/
├── unit/
│   ├── transformations.test.ts     # Data transformation tests
│   ├── accountService.test.ts      # Service layer tests
│   └── cache.test.ts               # Cache utility tests
├── integration/
│   ├── putRequests.test.ts         # PUT request integration tests
│   ├── cacheConsistency.test.ts    # Cache consistency tests
│   └── authFlow.test.ts            # Authentication flow tests
└── e2e/
    ├── accountUpdate.test.ts       # End-to-end update workflows
    └── fieldPreservation.test.ts   # Field preservation validation
```

### Test Utilities Structure
```
tests/utils/
├── mockData.ts                     # Mock data generators
├── testHelpers.ts                  # Common test utilities
└── apiMocks.ts                     # API response mocks
```

## Build and Deployment Structure

### Build Configuration
- **Vite Configuration**: `/vite.config.ts`
- **TypeScript Configuration**: `/tsconfig.json`
- **Package Dependencies**: `/package.json`

### Environment Configuration
```
frontend/
├── .env.local                      # Local development overrides
├── .env.example                    # Environment variable template
└── src/config/
    ├── api.ts                      # API configuration
    └── environments.ts             # Environment-specific settings
```

This project structure supports the simplified PUT pipeline by:
- **Clear separation of concerns** between API, hooks, and components
- **Single transformation points** at API boundaries
- **Consistent patterns** across all entity types
- **Simplified debugging** with clear module boundaries
- **Easy migration path** from current to target structure