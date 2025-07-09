# Blossomer GTM API - System Architecture

*Last updated: July 5, 2025*

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
- **Authentication**: Hybrid Stack Auth (OAuth) + API key system
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
│ Website Scraper            │  │ User/API Key Tables │
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
- **LocalStorage transition**: Currently migrating from localStorage to database with progressive sync strategy
- **Row-level security**: All data isolated by Stack Auth user ID
- **JSONB schema**: Flexible storage for AI-generated content using PostgreSQL JSONB
- **Direct localStorage mapping**: JSONB columns mirror localStorage structure for easy migration
- **Development caching**: File-based cache for website scrapes (dev_cache/)
- **Rate limiting**: JWT-based using Stack Auth user ID (no API keys)

## Frontend Architecture

### **Routing Structure**

#### **Route Prefixes (July 2025 Migration)**
- **Authenticated Users**: All authenticated, database-backed routes are now under `/app/*`.
  - Example: `/app/company/:id`, `/app/target-accounts`, `/app/campaigns`, etc.
- **Unauthenticated/Demo Users**: All unauthenticated, localStorage/demo routes are now under `/playground/*`.
  - Example: `/playground/company`, `/playground/target-accounts`, etc.
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
  <Route path="target-accounts" element={<Accounts />} />
  <Route path="target-accounts/:id" element={<AccountDetail />} />
  <Route path="target-accounts/:id/personas/:personaId" element={<PersonaDetail />} />
  <Route path="target-personas" element={<Personas />} />
  <Route path="campaigns" element={<Campaigns />} />
  <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
</Route>
{/* Authenticated routes */}
<Route path="app" element={<MainLayout />}>
  <Route path="company/:id" element={<Company />} />
  <Route path="target-accounts" element={<Accounts />} />
  <Route path="target-accounts/:id" element={<AccountDetail />} />
  <Route path="target-accounts/:id/personas/:personaId" element={<PersonaDetail />} />
  <Route path="target-personas" element={<Personas />} />
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

#### **TanStack Query Integration**
- **Primary Data Layer**: TanStack Query manages all server state, caching, and synchronization
- **Optimistic Updates**: Immediate UI feedback while API calls process in background
- **Background Sync**: Automatic refetching, invalidation, and error recovery
- **Query Hooks**: Custom hooks for each entity type (useGetCompany, useGetAccounts, etc.)
- **Mutation Hooks**: Separate hooks for create, update, delete operations with cache updates

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
- **Draft Storage**: `localStorage['draft_company']`, `localStorage['draft_account']`, etc.
- **Auto-Save Triggers**: Field blur, typing pause (500ms), navigation, timeout (30s)
- **Conflict Resolution**: Last-write-wins with optimistic updates
- **Error Handling**: Retry logic, fallback to draft state, user notification

### **Data Flow**
1. **User Input** → Landing page or generation forms
2. **AI Generation** → Backend `/generate-ai` endpoints
3. **Draft Storage** → localStorage temporary storage for immediate UI
4. **Auto-Save Trigger** → User interaction or timeout
5. **API Persistence** → POST/PUT to backend with TanStack Query
6. **Cache Updates** → TanStack Query invalidation and refetch
7. **UI Sync** → Components re-render from updated cache

### **Company-Specific Data Flow**
#### **Authenticated Users**
```
1. User navigates to /company → Check auth state and companies
2. If has companies: Auto-redirect to /company/{last_company_id}
3. If no companies: Stay on /company (will show empty state)
4. TanStack Query fetches company data by ID
5. Component renders with database-backed data
6. All edits persist to database via API
```

#### **Unauthenticated Users**
```
1. User navigates to /company → Check auth state
2. Component uses localStorage-only mode
3. All data reads/writes use localStorage
4. No API calls for company data (demo endpoints for generation)
5. If somehow on /company/:id → Auto-redirect to /company
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
- **`/auth/*` endpoints**: Stack Auth token management (create API keys, etc.)

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
- **No sensitive data storage**: Analysis results not persisted in database
- **Environment separation**: Separate configs for dev/staging/production  
- **Secrets management**: Environment variables for API keys and database URLs
- **HTTPS enforcement**: All API communication over secure connections

### **Data Security**
- **No sensitive data storage**: Analysis results not persisted in database
- **Environment separation**: Separate configs for dev/staging/production  
- **Secrets management**: Environment variables for API keys and database URLs
- **HTTPS enforcement**: All API communication over secure connections

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
- **Authentication Service**: API key validation and user management

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

This architecture provides a solid foundation for an AI-powered B2B platform with room for growth into microservices as the system scales.