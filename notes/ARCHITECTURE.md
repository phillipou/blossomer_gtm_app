# Blossomer GTM API - System Architecture

*Last updated: July 11, 2025*

## Overview

Blossomer GTM API is an AI-powered B2B go-to-market intelligence platform built as a modular monolith with sophisticated LLM orchestration. The system analyzes company websites to generate detailed target accounts, personas, and campaign assets.

## Tech Stack

### **Backend**
- **Language**: Python 3.11+
- **Framework**: FastAPI with Uvicorn ASGI server
- **Database**: Neon PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic for schema versioning
- **AI/LLM**: Multi-provider (OpenAI, Anthropic, Google Generative AI)
- **Content Processing**: Custom pipeline with LangChain integration
- **Authentication**: Stack Auth (OAuth) with JWT validation
- **Deployment**: Docker containers on Render

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot reload
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + localStorage
- **Authentication**: Stack Auth (Google OAuth integration)
- **Icons**: Lucide React
- **Routing**: React Router

### **Infrastructure**
- **Database Hosting**: Neon (serverless PostgreSQL)
- **Backend Hosting**: Render (containerized deployment)
- **Frontend Hosting**: Ready for Render static site
- **CI/CD**: GitHub Actions for database migrations

## System Architecture

### **High-Level Components**

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                       │
├─────────────────────────────────────────────────────────────┤
│  Landing Page │ Dashboard │ Accounts │ Personas │ Campaigns │
│  localStorage Cache │ API Client │ Component Library       │
└─────────────────────────────────────────────────────────────┘
                                │
                          HTTPS/JSON API
                                │
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                          │
├─────────────────────────────────────────────────────────────┤
│  Demo Endpoints │ Production Endpoints │ Authentication     │
│  Rate Limiting │ Error Handling │ Response Validation      │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
┌───────────────────▼────────┐  ┌──────────▼──────────┐
│    AI Orchestration        │  │    Data Layer       │
├────────────────────────────┤  ├─────────────────────┤
│ Context Orchestrator       │  │ Neon PostgreSQL     │
│ LLM Service (Multi-provider)│  │ SQLAlchemy ORM     │
│ Content Preprocessing      │  │ Alembic Migrations  │
│ Website Scraper            │  │ User Data Tables    │
│ Circuit Breakers           │  │                     │
└────────────────────────────┘  └─────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│OpenAI  │ │Anthropic│ │Google  │
│GPT-4   │ │Claude   │ │Gemini  │
└────────┘ └────────┘ └────────┘
```

## Backend Architecture

### **API Layer**
- **Dual Endpoint Structure**: `/demo/*` (unauthenticated, IP rate limited) and `/api/*` (Stack Auth token required)
- **Hybrid Authentication**: Stack Auth JWT tokens for user identity + database-linked permissions/rate limits
- **JWT Validation**: The backend now performs real JWT validation using python-jose and the Stack Auth JWKS endpoint. The project ID is read from the `STACK_PROJECT_ID` environment variable. **For development, use your dev project ID; for production, update to your production project ID before deploying.**
- **Environment Variables**: See `.env.example` for required variables and usage instructions, including how to set `STACK_PROJECT_ID` for different environments.
- **FastAPI Router**: Automatic OpenAPI documentation generation
- **Middleware Stack**: Authentication, rate limiting, CORS, request logging
- **Error Handling**: Standardized error responses with actionable guidance

### **Business Logic Layer**

#### **Context Orchestrator Service**
- Central coordinator for all AI analysis workflows
- Manages context resolution, preprocessing, and LLM orchestration
- Handles data source prioritization and quality assessment
- Performance optimization with timing measurements

#### **LLM Service**
- **Multi-provider abstraction** with unified interface
- **Circuit breaker pattern** prevents cascading failures
- **Automatic failover** between providers on failures
- **Structured output parsing** with Pydantic model validation
- **Error recovery** with retry logic and graceful degradation

#### **Content Processing Pipeline**
- **Website scraping** via Firecrawl.dev integration
- **Section-based chunking** for analyzable content pieces
- **Advanced summarization** using LangChain
- **Boilerplate filtering** removes navigation, footer, etc.
- **Content quality assessment** with confidence scoring

### **Data Layer**

#### **Database Schema**
```sql
-- User management with Stack Auth integration
users (
    id VARCHAR PRIMARY KEY,  -- Stack Auth user ID as primary key
    email VARCHAR UNIQUE,
    name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
)

-- Company data from website analysis
companies (
    id UUID PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),  -- One user can have multiple companies
    name VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    analysis_data JSONB,  -- All website analysis data (flexible)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Target accounts (ideal customer profiles)
target_accounts (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    name VARCHAR NOT NULL,
    account_data JSONB NOT NULL,  -- All account data (firmographics, buying signals, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Target personas (buyers within accounts)
target_personas (
    id UUID PRIMARY KEY,
    target_account_id UUID REFERENCES target_accounts(id),
    name VARCHAR NOT NULL,
    persona_data JSONB NOT NULL,  -- All persona data (demographics, use cases, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Generated campaigns (emails, LinkedIn, etc.)
campaigns (
    id UUID PRIMARY KEY,
    target_account_id UUID REFERENCES target_accounts(id),
    target_persona_id UUID REFERENCES target_personas(id),
    name VARCHAR NOT NULL,
    campaign_type VARCHAR NOT NULL,  -- flexible: email, linkedin, cold_call, ad
    campaign_data JSONB NOT NULL,  -- All campaign content and configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Rate limiting by JWT user ID (replaces API key system)
-- Counters stored in Redis/memory keyed by Stack Auth user ID
```

#### **Data Storage Strategy**
- **Database-first persistence**: All user data (companies, accounts, personas, campaigns) stored in Neon PostgreSQL
- **Row-level security**: All data isolated by Stack Auth user ID
- **JSONB schema**: Flexible storage for AI-generated content using PostgreSQL JSONB
- **Development caching**: File-based cache for website scrapes (dev_cache/)
- **Rate limiting**: JWT-based using Stack Auth user ID

## Frontend Architecture

### **Routing Structure**

#### **Route Prefixes (July 2025 Migration)**
- **Authenticated Users**: All authenticated, database-backed routes are now under `/app/*`.
  - Example: `/app/company/:id`, `/app/accounts`, `/app/campaigns`, etc.
- **Unauthenticated/Demo Users**: All unauthenticated, localStorage/demo routes are now under `/playground/*`.
  - Example: `/playground/company`, `/playground/accounts`, etc.
- **Public/Landing**: Marketing and landing routes (e.g., `/`) remain at the root.

#### **Route Guards and Access Control (July 2025)**
- **Authenticated user accesses `/playground`**: Immediately redirected to `/app/company` (or their most relevant `/app` subroute).
- **Unauthenticated user accesses `/app`**: Immediately redirected to `/auth?mode=signin`.

**Implementation:**
- This is enforced in the `MainLayout` component using `useAuthState`, `useLocation`, and `useNavigate`.
- Example:
```typescript
useEffect(() => {
  const isAppRoute = location.pathname.startsWith('/app');
  const isPlaygroundRoute = location.pathname.startsWith('/playground');
  if (isAppRoute && !authState.token) {
    navigate('/auth?mode=signin', { replace: true });
  } else if (isPlaygroundRoute && authState.token) {
    navigate('/app/company', { replace: true });
  }
}, [authState.token, location.pathname, navigate]);
```

**Rationale:**
- Prevents authenticated users from using demo/localStorage flows.
- Prevents unauthenticated users from accessing database-backed, persistent routes.
- Ensures a clear, secure, and consistent user experience.

#### **Route Configuration**
```typescript
// Main route structure
<Route path="/" element={<LandingPage />} />
<Route element={<NavbarOnlyLayout />}>
  <Route path="auth" element={<Auth />} />
  <Route path="handler/error" element={<AuthError />} />
  <Route path="handler/oauth-callback" element={<OAuthCallback />} />
  <Route path="account-settings" element={<AccountSettings />} />
</Route>
{/* Unauthenticated/demo routes */}
<Route path="playground" element={<MainLayout />}>
  <Route path="company" element={<Company />} />
  <Route path="accounts" element={<Accounts />} />
  <Route path="accounts/:id" element={<AccountDetail />} />
  <Route path="accounts/:id/personas/:personaId" element={<PersonaDetail />} />
  <Route path="personas" element={<Personas />} />
  <Route path="campaigns" element={<Campaigns />} />
  <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
</Route>
{/* Authenticated routes */}
<Route path="app" element={<MainLayout />}>
  <Route path="company/:id" element={<Company />} />
  <Route path="accounts" element={<Accounts />} />
  <Route path="accounts/:id" element={<AccountDetail />} />
  <Route path="accounts/:id/personas/:personaId" element={<PersonaDetail />} />
  <Route path="personas" element={<Personas />} />
  <Route path="campaigns" element={<Campaigns />} />
  <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
</Route>
```

#### **Navigation Logic**
```typescript
// Authenticated users - redirect to last company (most recent)
const handleAuthenticatedNavigation = () => {
  if (token && companies.length > 0) {
    navigate(`/app/company/${companies[companies.length - 1].id}`);
  } else if (token) {
    navigate('/app/company');
  }
};

// Unauthenticated users - use playground mode
const handleUnauthenticatedNavigation = () => {
  navigate('/playground/company');
};

// Company component - handle /company redirect for authenticated users
useEffect(() => {
  if (token && !companyId && companies && companies.length > 0) {
    // Authenticated user on /company - redirect to most recent company
    navigate(`/app/company/${companies[companies.length - 1].id}`, { replace: true });
  } else if (!token && companyId) {
    // Unauthenticated user on /company/:id - redirect to /playground/company
    navigate('/playground/company', { replace: true });
  }
}, [token, companyId, companies, navigate]);
```

#### **Rationale for Route Prefixes**
- **Separation of concerns**: Clear distinction between authenticated (database-backed) and unauthenticated (localStorage/demo) experiences.
- **Scalability**: Enables future expansion (e.g., /admin, /public, /api) without route collisions.
- **Consistent navigation**: Simplifies route guards, layouts, and navigation logic.
- **Migration clarity**: Makes it easy to identify and migrate legacy/demo code to production flows.

#### **Migration Notes**
- All navigation, redirects, and deep links must be updated to use the new prefixes.
- Stack Auth and all authentication flows now redirect to `/app/company` after login.
- Demo/unauthenticated flows are now consistently under `/playground/*`.

### **Component Structure**
```
src/
├── components/
│   ├── ui/                    # Atomic UI primitives (Button, Card, Input)
│   ├── cards/                 # Business logic cards (InfoCard, etc.)
│   ├── modals/                # Modal dialogs
│   ├── headers/               # Navigation components  
│   ├── tables/                # Data display components
│   └── dashboard/             # Dashboard-specific components
├── pages/                     # Route-level views
├── lib/                       # API clients and utilities
├── services/                  # Data fetching services
└── types/                     # TypeScript definitions
```

### **State Management**

#### **Data Model & UI Integration (July 2025 Refactoring)**

**Field Preservation Pattern (CRITICAL)**:
Implemented comprehensive field preservation for all entity updates to prevent data loss:

```typescript
// Service Layer - Field-preserving updates
function mergeEntityUpdates(
  currentEntity: EntityOverviewResponse,
  updates: { name?: string; description?: string; [key: string]: any }
): EntityUpdate {
  const frontendData = {
    description: updates.description || currentEntity.description,
    entityName: updates.name || currentEntity.entityName,
    // Preserve ALL existing analysis data
    businessProfile: currentEntity.businessProfile,
    capabilities: currentEntity.capabilities,
    useCaseAnalysis: currentEntity.useCaseAnalysis,
    // ... all other fields preserved
  };
  
  const backendData = transformKeysToSnakeCase(frontendData);
  return { entityId: currentEntity.entityId, name: updates.name, data: backendData };
}
```

**Data Model Flattening Strategy**:
Flattened AI-generated fields from complex objects to `List[str]` format:

- **Before**: `business_profile: { "category": "...", "business_model": "..." }`
- **After**: `business_profile_insights: ["Category: ...", "Business Model: ..."]`

**Benefits**:
- Aligns data structure with UI editing capabilities (ListInfoCard)
- Eliminates risky string-parsing logic
- Prevents data corruption during edits
- Moves formatting responsibility to LLM

**Preserved Complex Types** (have dedicated UIs):
- `Firmographics` (TargetAccount) - structured editing UI
- `Demographics` (TargetPersona) - dedicated demographics UI  
- `BuyingSignals` (all entities) - specialized signal structure

**Modal Logic Centralization**:
Refactored modal management to prevent duplicate state and UI bugs:

```typescript
// BEFORE: Duplicate modal logic in ListInfoCard + parent
// AFTER: Centralized in parent component
<ListInfoCard 
  onEditRequest={(field) => {
    setEditingField(field);
    setIsModalOpen(true);
  }}
/>

// All modal state, rendering, and save logic in parent
<ListInfoCardEditModal 
  isOpen={isModalOpen}
  onSave={handleSave} // Unified save handler
  onClose={() => setIsModalOpen(false)}
/>
```

**Result**: Fixed double-click bug, simplified state management, unified update patterns.

#### **TanStack Query Integration**
- **Primary Data Layer**: TanStack Query manages all server state, caching, and synchronization
- **Optimistic Updates**: Immediate UI feedback while API calls process in background
- **Background Sync**: Automatic refetching, invalidation, and error recovery
- **Query Hooks**: Custom hooks for each entity type (useGetCompany, useGetAccounts, etc.)
- **Mutation Hooks**: Separate hooks for create, update, delete operations with cache updates
- **Cache Invalidation**: Automatic cache clearing on authentication state changes to prevent data contamination between demo and authenticated modes
- **Field-Preserving Hooks**: Specialized hooks for safe partial updates (`useUpdateEntityPreserveFields`)

#### **Hybrid State Architecture**
- **Server State**: TanStack Query for all persisted data (companies, accounts, personas, campaigns)
- **UI State**: React useState/useReducer for component-specific state (modals, forms, etc.)
- **Draft State**: localStorage for temporary drafts during AI generation flow
- **Auth State**: Stack Auth JWT token cached and available via `useAuthState().token`

#### **Draft/Auto-Save Pattern (Core UX Flow)**

**Current Implementation Status**:
- ✅ **Company**: Implemented - generates draft, auto-navigates to Company page
- ⚠️ **Account**: Partially implemented - has `/generate-ai` endpoint but no draft pattern
- ❌ **Persona**: Not implemented - needs full draft/auto-save pattern
- ❌ **Email**: Not implemented - needs full draft/auto-save pattern

**Pattern Workflow**:
```
1. User clicks "Generate" → POST /api/{entity}/generate-ai
2. Response stored as draft_* in localStorage (no backend save yet)
3. UI renders immediately from draft data
4. First user interaction triggers auto-save:
   - POST /api/{entity} → creates entity with ID
   - Remove draft_* from localStorage
   - Add to TanStack Query cache
5. Subsequent edits → debounced PUT /api/{entity}/{id}
6. All changes sync to TanStack Query cache
```

**Entity-Specific Patterns**:
- **Company**: Draft → navigate to Company page → auto-save on first edit
- **Account**: Draft → render in list → auto-save on first edit or timeout
- **Persona**: Draft → render in persona list → auto-save on first edit
- **Email**: Draft → render in campaign view → auto-save on first edit

**Technical Implementation**:
- **Draft Storage**: `localStorage['draft_company_${tempId}']` with unique IDs
- **Auto-Save Triggers**: Field blur, typing pause (500ms), navigation, timeout (30s)
- **Auth-Aware Fallbacks**: Never use drafts as fallback for authenticated users
- **Conflict Resolution**: Last-write-wins with optimistic updates
- **Error Handling**: Retry logic, fallback to draft state only for unauthenticated users
- **Field Preservation**: Both backend and localStorage updates use field-preserving merge patterns

**DraftManager Field Preservation**:
Extended field preservation to localStorage operations:

```typescript
// DraftManager.updateDraftPreserveFields() - preserves all existing analysis data
static updateDraftPreserveFields(
  entityType: EntityType, 
  tempId: string, 
  updates: { name?: string; description?: string; [key: string]: any }
): boolean {
  const currentDraft = this.getDraft(entityType, tempId);
  const preservedData = {
    ...currentDraft.data, // Preserve all existing fields
    ...updates, // Apply updates
  };
  const updatedDraft = { ...currentDraft, data: preservedData };
  localStorage.setItem(key, JSON.stringify(updatedDraft));
  return true;
}
```

### **Data Flow**
1. **User Input** → Landing page or generation forms
2. **AI Generation** → Backend `/generate-ai` endpoints
3. **Draft Storage** → localStorage temporary storage for immediate UI
4. **Auto-Save Trigger** → User interaction or timeout
5. **API Persistence** → POST/PUT to backend with TanStack Query
6. **Cache Updates** → TanStack Query invalidation and refetch
7. **UI Sync** → Components re-render from updated cache

### **Cache Management & Data Isolation (CRITICAL)**

#### **Authentication-Based Data Separation**
- **Authenticated Users (`/app/*`)**: ONLY use backend database data via React Query
- **Unauthenticated Users (`/playground/*`)**: ONLY use localStorage drafts for generation flow
- **Zero Cross-Contamination**: Authenticated users never see localStorage data, even as fallback

#### **Implementation Pattern**
```typescript
// CORRECT: Auth-aware data source selection
const displayOverview = token ? overview : (overview || draftOverview);

// WRONG: Can show corrupted drafts to authenticated users
const displayOverview = overview || draftOverview;
```

#### **Field-Preserving Update Hooks**
Implemented specialized hooks for safe partial updates:

```typescript
// Standard update (full replacement)
const { mutate: updateEntity } = useUpdateEntity(token, entityId);

// Field-preserving update (partial merge)
const { mutate: updateEntityPreserving } = useUpdateEntityPreserveFields(token, entityId);

// Usage in components
handleEdit({ name: newName, description: newDescription }) {
  updateEntityPreserving({
    currentEntity, // Current complete entity data
    updates: { name: newName, description: newDescription }
  });
}
```

#### **Cache Clearing Strategy**
- **React Query cache clears** on authentication state changes
- **localStorage drafts clear** when transitioning between auth states
- **Component state resets** prevent stale data persistence
- **Standard PLG pattern**: Follows Linear, Notion, Figma for clean auth transitions

### **Company-Specific Data Flow**

#### **Authenticated Users (`/app/company/:id`)**
```
1. User navigates → Check auth state and companies
2. If has companies: Auto-redirect to /app/company/{last_company_id}
3. If no companies: Show empty state with "Generate" option
4. React Query fetches company data by ID from database
5. Component renders ONLY with database-backed data
6. localStorage drafts NEVER used as fallback (prevents corruption)
7. All edits persist to database via PUT /api/companies/{id}
```

#### **Unauthenticated Users (`/playground/company`)**
```
1. User navigates → Check auth state
2. Component uses localStorage-only mode for drafts
3. Generation creates localStorage draft → immediate UI render
4. No database calls (uses /demo/* endpoints for generation)
5. localStorage drafts cleared when user authenticates
```

## AI Processing Architecture

### **Prompt System**
- **Jinja2 Templates**: Structured prompt templates with variable injection
- **System/User Prompt Separation**: Clear separation between role definition (system) and task-specific instructions (user) using a `{# User Prompt #}` delimiter in the Jinja2 templates.
- **Template Registry**: Centralized management of prompt templates
- **Context Injection**: Dynamic context based on available data sources
- **Output Schemas**: Pydantic models for type-safe AI responses
- **Prompt Organization**: System prompts define AI behavior and output standards, user prompts contain specific tasks and data

### **Content Processing Flow**
```
Website URL → Firecrawl Scraping → Content Preprocessing → Context Assessment → 
LLM Processing → Structured Output → Validation → API Response
```

### **Quality Assurance**
- **Confidence Scoring**: AI-generated confidence levels for each response section
- **Content Validation**: Schema validation and data quality checks
- **Error Recovery**: Automatic retry with different prompts on failures
- **Fallback Strategies**: Graceful degradation when data is insufficient
- **Data Integrity**: Field preservation patterns prevent data loss during updates
- **UI Robustness**: Centralized modal logic prevents duplicate state bugs
- **Comprehensive Testing**: Manual testing checklist for partial update integrity

## Authentication Architecture

### **JWT-Only Authentication System**

The system uses **Stack Auth JWT tokens** for all authentication and authorization:

#### **Stack Auth Integration**
- **OAuth Providers**: Google sign-in with potential for GitHub, Microsoft, etc.
- **JWT Tokens**: Short-lived access tokens (1 hour) with automatic refresh
- **User Management**: Built-in user profiles, password reset, account linking
- **Frontend Integration**: Seamless React hooks for authentication state
- **Token Caching**: The frontend fetches the Stack Auth JWT token once after login and caches it in React state. The token is exposed as `useAuthState().token` and is available synchronously to all components for authenticated API calls.

#### **Database Integration**
- **User Records**: Stack Auth user ID as primary key, no separate UUID needed
- **Rate Limiting**: Per-user limits based on JWT user ID (no API keys)
- **Row-Level Security**: All data isolated by Stack Auth user ID
- **One-to-Many**: User can have multiple companies (future-proofing)

### **Authentication Flow**
```
1. User → Google OAuth → Stack Auth JWT token
2. Frontend → API request with Bearer token
3. Backend → Validates JWT → Extracts Stack Auth user ID
4. Backend → Rate limiting by user ID → Processes request
5. Backend → All data queries filtered by user ID (Row-Level Security)
```

### **Endpoint Structure**
- **`/demo/*` endpoints**: Unauthenticated access with IP-based rate limiting
- **`/api/*` endpoints**: Requires Stack Auth token with user-specific rate limiting
- **`/auth/*` endpoints**: Stack Auth token management

### **Rate Limiting Strategy**
```python
# IP-based (demo endpoints)
- Anonymous users: 5 requests/hour per IP
- Basic protection against abuse

# User-based (authenticated endpoints)  
- Free tier: 10 requests/hour per user
- Paid tier: 100 requests/hour per user
- Enterprise: 1000+ requests/hour per user
```

### **Security Benefits**
- ✅ **No password management**: OAuth providers handle credentials
- ✅ **Short-lived tokens**: Automatic expiration reduces risk
- ✅ **Fine-grained control**: Business logic separate from authentication
- ✅ **Usage analytics**: Track individual user behavior
- ✅ **Scalable**: Can add new OAuth providers easily

## Security Architecture

### **Data Security**
- **Row-level data isolation**: All user data strictly separated by Stack Auth user ID
- **Environment separation**: Separate configs for dev/staging/production  
- **Secrets management**: Environment variables for API keys and database URLs
- **HTTPS enforcement**: All API communication over secure connections
- **JWT validation**: Real-time token validation with Stack Auth JWKS endpoint

## Performance Architecture

### **Backend Performance**
- **Response Time Targets**: Individual endpoints under 30 seconds
- **Concurrent Processing**: AsyncIO for non-blocking operations
- **Caching Strategy**: Development file cache for website scrapes
- **Database Optimization**: Connection pooling and query optimization

### **Frontend Performance**  
- **Vite Build Optimization**: Fast builds and hot reload in development
- **Component Optimization**: React.memo and useMemo for expensive operations
- **localStorage Caching**: Instant data access for repeated views
- **Lazy Loading**: Code splitting for route-based loading

## Deployment Architecture

### **Backend Deployment (Render)**
- **Docker Container**: Production Dockerfile with multi-stage build
- **Environment Variables**: Database URL, API keys, feature flags
- **Health Checks**: `/health` endpoint for service monitoring
- **Auto-scaling**: Render managed scaling based on load

### **Database (Neon)**
- **Serverless PostgreSQL**: Automatic scaling and maintenance
- **Connection String**: Standard PostgreSQL connection via SQLAlchemy
- **Migrations**: Alembic with GitHub Actions automation
- **Backup Strategy**: Neon managed backups and point-in-time recovery

### **Frontend Deployment (Planned)**
- **Static Site**: Vite build output to Render static hosting
- **Environment Config**: Production API base URL and feature flags
- **CDN**: Render managed CDN for global distribution
- **Build Process**: `npm run build` with TypeScript compilation

## Integration Points

### **External Services**
- **Firecrawl.dev**: Website content extraction and preprocessing
- **OpenAI API**: Primary LLM provider for content generation
- **Anthropic API**: Secondary LLM provider for failover
- **Google Generative AI**: Tertiary provider for redundancy

### **Internal Services**
- **Context Orchestrator**: Central coordination of AI workflows
- **Website Scraper**: Content extraction and caching
- **LLM Service**: Multi-provider AI integration
- **Authentication Service**: JWT validation and user management

## Monitoring & Observability

### **Logging**
- **Structured Logging**: JSON format with request IDs and timestamps
- **API Usage Tracking**: Endpoint calls, response times, error rates
- **Error Monitoring**: Detailed error logs with stack traces
- **Performance Metrics**: Response times and throughput monitoring

### **Health Monitoring**
- **Health Check Endpoint**: `/health` with service status
- **Database Connectivity**: Connection pool monitoring
- **External API Status**: LLM provider availability checks
- **Circuit Breaker Metrics**: Failure rates and recovery times

## Entity Management Abstraction Layer (July 2025)

### **Problem Statement**

The original `Company.tsx` component grew to 700+ lines with complex, bespoke logic for:
- Route/auth management
- Data source selection (backend vs localStorage)
- Field editing with modal management
- Auto-save and generation flows
- Cache management
- Error handling

This pattern would need to be duplicated for Accounts, Personas, and Campaigns, creating maintainability issues.

### **Solution: Configuration-Driven Entity Management**

#### **Core Architecture**

```typescript
// Single hook handles 80% of entity page logic
const entityPageState = useEntityPage({
  config: companyConfig,    // Configuration object
  hooks: companyHooks       // Entity-specific hooks
});

// Render with standardized layout
<EntityPageLayout
  config={companyConfig}
  entityPageState={entityPageState}
  onGenerate={handleGenerate}
  generateModalProps={generationModalConfigs.company}
/>
```

#### **Key Abstractions**

**1. `useEntityPage` Hook** (`lib/hooks/useEntityPage.ts`):
- Handles route/auth logic with automatic redirects
- Manages auth-aware data source selection
- Provides field editing with modal state management
- Implements auto-save and generation flows
- Handles cache management and error states
- Returns standardized interface for all entity types

**2. `EntityPageLayout` Component** (`components/EntityPageLayout.tsx`):
- Standardized layout for all entity pages
- Handles loading, error, and empty states
- Renders overview cards and field cards
- Manages edit and generation modals
- Accepts custom child content (e.g., target accounts)

**3. Entity Configuration** (`lib/entityConfigs.ts`):
- Declarative configuration for each entity type
- Defines field cards, routes, empty states, progress stages
- Specifies preserved complex types
- Configures generation modal properties

#### **Configuration Structure**

```typescript
interface EntityPageConfig<T> {
  entityType: 'company' | 'account' | 'persona' | 'campaign';
  cardConfigs: EntityCardConfig<T>[];
  preservedComplexTypes?: string[];
  generateEndpoint: string;
  childEntities?: EntityType[];
  routePrefix: {
    authenticated: string;
    unauthenticated: string;
  };
  emptyStateConfig: {
    title: string;
    subtitle: string;
    buttonText: string;
    icon: React.ComponentType;
  };
  progressStages?: Array<{ label: string; percent: number }>;
}
```

#### **Entity Card Configuration**

```typescript
interface EntityCardConfig<T> {
  key: string;                           // Field key in entity data
  label: string;                         // Display title
  bulleted?: boolean;                    // Render as bulleted list
  getItems: (entity: T) => string[];     // Extract items from entity
  subtitle: string;                      // Edit modal subtitle
}
```

### **Implementation Benefits**

#### **Dramatic Code Reduction**
- **Company.tsx**: 700+ lines → ~100 lines (85% reduction)
- **Future entities**: ~100 lines each vs 700+ lines
- **Maintainability**: Single source of truth for common patterns

#### **Standardized Patterns**
- **Consistent UX**: All entities follow same interaction patterns
- **Unified Auth Logic**: Route guards and data source selection
- **Standardized Error Handling**: Common error states and retry logic
- **Consistent Field Preservation**: Same safe update patterns

#### **Configuration-Driven Development**
- **Rapid Development**: New entities require only configuration
- **Easy Customization**: Override specific behaviors when needed
- **Type Safety**: Full TypeScript support with generic types
- **Testability**: Isolated, reusable components

### **Entity-Specific Implementations**

#### **Company Entity** (`pages/CompanyV2.tsx`):
```typescript
const entityPageState = useEntityPage<CompanyOverviewResponse>({
  config: companyConfig,
  hooks: {
    useGet: useGetCompany,
    useGetList: useGetCompanies,
    useGenerate: useAnalyzeCompany,
    useCreate: useCreateCompany,
    useUpdate: useUpdateCompany,
    useUpdatePreserveFields: useUpdateCompanyPreserveFields,
    useUpdateListFieldsPreserveFields: useUpdateCompanyListFieldsPreserveFields,
  },
});
```

#### **Account Entity** (to be implemented):
```typescript
const entityPageState = useEntityPage<TargetAccountResponse>({
  config: accountConfig,
  hooks: {
    useGet: useGetAccount,
    useGetList: useGetAccounts,
    useGenerate: useAnalyzeAccount,
    useCreate: useCreateAccount,
    useUpdate: useUpdateAccount,
    useUpdatePreserveFields: useUpdateAccountPreserveFields,
    useUpdateListFieldsPreserveFields: useUpdateAccountListFieldsPreserveFields,
  },
});
```

### **Entity Configurations**

#### **Company Configuration**:
- **6 field cards**: Business Profile, Capabilities, Positioning, Use Case Analysis, Target Customer Insights, Objections
- **Complex types preserved**: firmographics, demographics, buyingSignals
- **Child entities**: accounts
- **4 progress stages**: Loading website → Analyzing → Researching → Finalizing

#### **Account Configuration**:
- **5 field cards**: Profile, Strengths, Challenges, Opportunities, Approach Strategy
- **Complex types preserved**: firmographics, buyingSignals
- **Child entities**: personas
- **4 progress stages**: Analyzing market → Researching → Generating → Finalizing

#### **Persona Configuration**:
- **5 field cards**: Insights, Pain Points, Motivations, Communication Style, Decision Factors
- **Complex types preserved**: demographics, buyingSignals
- **Child entities**: campaigns
- **4 progress stages**: Analyzing persona → Researching behavior → Generating → Finalizing

#### **Campaign Configuration**:
- **5 field cards**: Insights, Messaging Strategy, Channel Strategy, Content Variations, Optimization Tips
- **Complex types preserved**: emailContent, linkedinContent, callScript
- **Child entities**: none
- **4 progress stages**: Analyzing context → Crafting message → Optimizing → Finalizing

### **Migration Strategy**

#### **Phase 1: Abstraction Creation** ✅
- Created `useEntityPage` hook with comprehensive entity management
- Built `EntityPageLayout` component with standardized UI patterns
- Developed entity configurations for all entity types
- Implemented `CompanyV2.tsx` as reference implementation

#### **Phase 2: Hybrid Implementation Strategy** ✅
- **Decision**: Implement hybrid approach (list views + detail views)
- **Rationale**: Entity abstraction excels at detail views but is over-engineered for list views
- **Account Entity**: AccountDetail.tsx uses full abstraction, Accounts.tsx simplified for list view
- **Implementation**: Created AccountDetail.tsx with entity abstraction, simplified Accounts.tsx for navigation

#### **Phase 3: Hybrid Pattern Rollout** (Next)
- Apply hybrid pattern to Persona and Campaign entities
- Simplify existing list views while creating abstraction-based detail views
- Test navigation between list and detail views
- Establish hybrid pattern as standard approach

#### **Phase 4: Migration Completion** (Future)
- Replace original Company.tsx with CompanyV2.tsx
- Update routing to use new implementations
- Remove duplicate/bespoke logic
- Comprehensive testing across all entity types

### **Developer Experience**

#### **Rapid Entity Development**:
```typescript
// Adding a new entity type requires only:
1. Entity configuration object (entityConfigs.ts)
2. Generation modal configuration
3. ~100 line page component
4. Entity-specific hooks (if needed)
```

#### **Consistent Patterns**:
- **Same debugging approach**: Common console.log patterns
- **Same error handling**: Standardized error states
- **Same testing patterns**: Reusable test utilities
- **Same field preservation**: Consistent update patterns

### **Hybrid Architecture: List Views + Detail Views**

#### **Architecture Decision: Hybrid Approach**
After implementing the entity abstraction layer, we recognized that different view types have fundamentally different requirements:

**List Views:**
- **Purpose**: Browse, search, filter, navigate
- **Complexity**: Low - focus on lightweight interactions
- **Abstraction**: Minimal - over-engineering reduces performance and maintainability

**Detail Views:**
- **Purpose**: Deep editing, field management, complex state
- **Complexity**: High - complex modal logic, field preservation, generation flows
- **Abstraction**: Full - entity abstraction adds significant value

#### **Implementation Strategy**
```typescript
// List View: Simplified, focused on navigation
// frontend/src/pages/Accounts.tsx (~200-250 lines)
export default function Accounts() {
  // Simple state management
  // Search, filter, navigation logic
  // Click account → navigate to detail view
  // No complex modal logic or field editing
}

// Detail View: Full entity abstraction
// frontend/src/pages/AccountDetail.tsx (~100-150 lines)
export default function AccountDetail() {
  const entityPageState = useEntityPage<TargetAccountResponse>({
    config: accountConfig,
    hooks: accountHooks,
  });
  
  return (
    <EntityPageLayout
      config={accountConfig}
      entityPageState={entityPageState}
      // Full abstraction benefits
    />
  );
}
```

#### **Benefits of Hybrid Approach**
1. **Right Tool for Right Job**: Each view optimized for its specific purpose
2. **Performance**: List views load faster, detail views can be more sophisticated
3. **Maintainability**: Simpler list views, complex detail views handled by abstraction
4. **User Experience**: Optimized interaction patterns for each use case
5. **Developer Experience**: Faster development for list features, powerful abstraction for detail features

#### **Navigation Pattern**
```typescript
// Standard navigation flow
List View (`/app/accounts`) → Detail View (`/app/accounts/:id`)
Browse & Search              → Deep Editing & Management
```

#### **Hybrid Pattern Implementation Status**
- ✅ **Company**: Detail view uses full abstraction (Company.tsx)
- ✅ **Account**: Hybrid implemented (Accounts.tsx list + AccountDetail.tsx detail)
- ⚠️ **Persona**: Pending - will implement hybrid pattern
- ⚠️ **Campaign**: Pending - will implement hybrid pattern

This hybrid architecture provides the best of both worlds: simple, performant list views combined with powerful, abstraction-based detail views. The approach scales efficiently across all entity types while maintaining optimal user experience.

This abstraction layer transforms entity management from bespoke, error-prone implementations to a standardized, maintainable, and rapidly extensible system. The investment in abstraction pays dividends immediately and scales with future entity types.

This architecture provides a solid foundation for an AI-powered B2B platform with room for growth into microservices as the system scales.