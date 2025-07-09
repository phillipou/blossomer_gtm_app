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
- **Local Component State**: React useState/useReducer for UI state
- **Global State**: Custom hooks for cross-component data
- **Persistent Storage**: localStorage for analysis results and session data
- **API Integration**: Custom hooks for data fetching with error handling
- **Auth Token Access**: The Stack Auth JWT token is cached after login and available via `useAuthState().token` for all authenticated requests.

### **Data Flow**
1. **User Input** → Landing page form
2. **API Calls** → Backend analysis endpoints  
3. **localStorage Storage** → Cache results for session persistence
4. **Component Updates** → React state updates from localStorage
5. **User Edits** → Local storage updates (no backend sync)

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