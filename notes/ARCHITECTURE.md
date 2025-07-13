# Blossomer GTM API - System Architecture

*Last updated: July 12, 2025*

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
- **State Management**: TanStack Query, React Hooks, localStorage
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
    id UUID PRIMARY KEY,  -- Stack Auth user ID as primary key (UUID from SQLAlchemy)
    -- email and name are managed by Stack Auth and not directly stored here
    role VARCHAR(20) DEFAULT 'user', -- user, admin, super_admin
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
)

-- Company data from website analysis
companies (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),  -- One user can have multiple companies
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    data JSONB,  -- All website analysis data (flexible JSONB)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Target accounts (ideal customer profiles)
accounts (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,  -- All account data (firmographics, buyingSignals, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Target personas (buyers within accounts)
personas (
    id UUID PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,  -- All persona data (demographics, useCases, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Generated campaigns (emails, LinkedIn, etc.)
campaigns (
    id UUID PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    persona_id UUID REFERENCES personas(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- flexible: email, linkedin, cold_call, ad
    data JSONB NOT NULL,  -- All campaign content and configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

-- Rate limiting by JWT user ID (replaces API key system)
-- Counters stored in Redis/memory keyed by Stack Auth user ID
```

#### **Data Storage Strategy**
- **Database-first persistence**: All user data (companies, accounts, personas, campaigns) stored in Neon PostgreSQL.
- **Row-level security**: All data isolated by Stack Auth user ID.
- **JSONB schema**: Flexible storage for AI-generated content using PostgreSQL JSONB.
- **Data Model Flattening**: To simplify UI integration and prevent data corruption during edits, most complex AI-generated object fields are flattened into lists of strings (e.g., `business_profile` becomes `business_profile_insights: ["Category: ..."]`). Key structured data required for specific UI components (e.g., `Firmographics`, `Demographics`) are preserved in their complex format.
- **Development caching**: File-based cache for website scrapes (dev_cache/).
- **Rate limiting**: JWT-based using Stack Auth user ID.

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

### **Project Structure**
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

### **Data Transformation & Casing Conventions**

A critical aspect of the Blossomer GTM API's frontend and backend interaction is the consistent handling of data casing and transformations. This ensures data integrity and a predictable development experience.

-   **Backend (Python/FastAPI)**: Utilizes `snake_case` for all API request/response fields and database column names.
-   **Frontend (React/TypeScript)**: Utilizes `camelCase` for all UI state, component props, and data structures.

#### **The "Transformation Lockstep" Principle**

To bridge the `snake_case` backend and `camelCase` frontend, a strict "Transformation Lockstep" principle is enforced. This means that data transformations (between `snake_case` and `camelCase`) occur at well-defined, single points, and both authenticated and unauthenticated data flows converge on an identical data shape for the UI.

This principle is implemented through:

1.  **API Boundary Transformation**: 
    *   **Frontend to Backend**: Data sent from the frontend (camelCase) is transformed to `snake_case` just before the API call using utilities like `transformKeysToSnakeCase()`.
    *   **Backend to Frontend**: Data received from the backend (snake_case) is transformed to `camelCase` immediately upon receipt using utilities like `transformKeysToCamelCase()`.

2.  **Consistent Normalization Functions**: Dedicated normalization functions (e.g., `normalizeCompanyResponse()`, `normalizeAccountResponse()`) are used consistently across both authenticated and unauthenticated data paths. These functions ensure that regardless of the data's origin (database via API or `localStorage` draft), it conforms to the expected `camelCase` frontend format.

#### **Role of `DraftManager` in Dual Architecture**

The `DraftManager` plays a crucial role in enabling the dual-path architecture for unauthenticated users, ensuring that the "Transformation Lockstep" principle is maintained.

-   **Temporary Storage**: For unauthenticated users, AI-generated content is initially stored in `localStorage` via `DraftManager` instead of being immediately persisted to the database.
-   **Normalization Integration**: Before saving to `localStorage`, data is passed through the same normalization functions (e.g., `normalizeCompanyResponse()`) used for authenticated users. This ensures that the `localStorage` drafts are in the identical `camelCase` format expected by the frontend components.
-   **Seamless Transition**: When an unauthenticated user authenticates, their `localStorage` drafts can be seamlessly converted to database entries, as their format already aligns with the normalized frontend structure.

This approach prevents data format inconsistencies and ensures that UI components can render data identically, regardless of whether it originated from the backend database or a `localStorage` draft.

### **State Management & Frontend Data Flow**

The frontend employs a sophisticated, hybrid state management architecture centered around TanStack Query, universal hooks, and a configuration-driven abstraction layer for entity management. This ensures data consistency, maintainability, and a robust user experience across both authenticated and unauthenticated flows.

#### **Core Principles**

- **Single Source of Truth**: TanStack Query is the primary owner of server state. UI state is managed locally in components via React hooks (`useState`, `useReducer`).
- **Transformation Lockstep**: Data transformations happen at the same logical point in both authenticated and unauthenticated flows to ensure identical data shapes and prevent field-mismatch bugs.
- **Field Preservation**: All entity update operations are designed to be non-destructive. Partial updates (e.g., changing a name) merge changes with the existing data, preserving all previously generated AI analysis fields to prevent data loss.
- **Strict Data Isolation**: A critical principle is the complete separation of data between authenticated and unauthenticated states.
    - **Authenticated Users (`/app/*`)**: ONLY use data from the backend database, managed via TanStack Query.
    - **Unauthenticated Users (`/playground/*`)**: ONLY use `localStorage` drafts.
    - **No Cross-Contamination**: Authenticated users *never* see or fall back to `localStorage` data. The entire React Query cache and any relevant `localStorage` drafts are cleared upon authentication state changes.

#### **Universal Hooks Architecture**

A set of universal, composable hooks provides the foundation for all data and navigation logic, eliminating code duplication and enforcing consistent patterns.

-   **`useAuthAwareNavigation`**: A single source of truth for routing. Provides functions like `navigateWithPrefix` and `navigateToEntity` that automatically handle `/app` vs. `/playground` prefixes based on auth state.
-   **`useCompanyContext`**: Centralizes the logic for detecting the active company context, whether from the database for authenticated users or `localStorage` for unauthenticated users.
-   **`useDualPathDataFlow`**: Enforces the "Transformation Lockstep" principle. It provides `saveEntity`, `updateEntity`, and `deleteEntity` functions that automatically handle the correct data flow for both auth states (API calls vs. `DraftManager`).
-   **`useEntityCRUD`**: A high-level hook that composes the other hooks to provide a complete set of CRUD operations (`create`, `update`, `delete`, `list`) for any entity, abstracting away the complexities of auth state, data normalization, and navigation.

#### **Configuration-Driven Entity Management**

To avoid duplicating complex UI and state logic across pages for different entities (Company, Account, Persona), the application uses a powerful abstraction layer.

-   **`useEntityPage` Hook**: This is the central hook for detail pages. It takes an entity configuration and a set of entity-specific data-fetching hooks and manages all page logic: route guards, data source selection, field editing, modal state, auto-save flows, and error handling.
-   **`EntityPageLayout` Component**: A standardized layout component that renders the UI for any entity detail page based on the state provided by `useEntityPage`. It handles loading, error, and empty states consistently.
-   **Entity Configurations (`entityConfigs.ts`)**: Declarative objects that define the structure and behavior of each entity page, including the fields to display, modal configurations, and child relationships.

This abstraction reduces entity detail pages from 700+ lines of bespoke code to ~100 lines of configuration and standardized component usage.

#### **Frontend Component Rendering & Data Structure Handling**

Frontend components are designed to render data consistently, regardless of its origin (top-level database columns or flexible JSONB `data` fields). Special attention is paid to handling flattened vs. complex nested data structures to prevent rendering bugs.

-   **JSONB Data Access**: Data stored in the backend's `JSONB` `data` columns is accessed and rendered dynamically. Frontend components are built to expect this nested structure (e.g., `entity.data.firmographics`).
-   **Flattened Data**: For certain AI-generated fields that are primarily consumed as lists in the UI (e.g., insights, capabilities), the backend flattens complex objects into `List[str]` format (e.g., `business_profile_insights: ["Category: ...", "Business Model: ..."]`). Frontend components render these using generic list components (e.g., `ListInfoCard`). This simplifies UI logic and avoids complex parsing.
-   **Preserved Complex Types**: Some complex data structures (e.g., `Firmographics`, `Demographics`, `BuyingSignals`, `UseCases`) are *not* flattened. These retain their nested object/array structure because they require dedicated, structured UI components for editing and display (e.g., `CriteriaTable`, `BuyingSignalsCard`, `UseCasesCard`). Components accessing these fields are specifically designed to handle their complex structure.
-   **Centralized Modal Logic**: To prevent common rendering and state management bugs (e.g., double-click issues, inconsistent updates), modal logic for editing fields is centralized in parent components. This ensures a single source of truth for modal state, rendering, and unified save handlers.
-   **UI Feedback & Error Handling**: Components provide immediate visual feedback for save operations (loading, saved, error states) and clear error messages, as detailed in `UI_UX_doc.md`. This ensures a predictable and robust user experience.

#### **Hybrid Architecture: List Views vs. Detail Views**

A hybrid approach is used to optimize for different view types:

-   **Detail Views (`/app/accounts/:id`)**: Use the full entity abstraction layer (`useEntityPage`, `EntityPageLayout`) to manage their high complexity (deep editing, modal logic, field preservation).
-   **List Views (`/app/accounts`)**: Use a simpler, more direct implementation focused on browsing, searching, and navigation. This avoids the overhead of the abstraction layer where it's not needed, improving performance and maintainability.

This "right tool for the job" approach ensures that list views are lightweight and fast, while detail views are powerful and consistent.

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