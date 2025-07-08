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
    id VARCHAR PRIMARY KEY,  -- Stack Auth user ID (no separate UUID needed)
    email VARCHAR NOT NULL,
    name VARCHAR,
    tier VARCHAR DEFAULT 'free',
    rate_limit_exempt BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
)

-- API key management (optional, for power users who need programmatic access)
api_keys (
    id UUID PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),  -- References Stack Auth user ID
    key_hash VARCHAR NOT NULL,
    key_prefix VARCHAR NOT NULL,
    tier VARCHAR DEFAULT 'free',
    name VARCHAR DEFAULT 'API Key',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP
)

-- Usage analytics and rate limiting
api_usage (
    id UUID PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),  -- Track usage per Stack Auth user
    endpoint VARCHAR NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN,
    error_code VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
)
```

#### **Data Storage Strategy**
- **Minimal database usage**: Only authentication and usage tracking
- **No campaign/analysis persistence**: Results stored in frontend localStorage
- **Development caching**: File-based cache for website scrapes (dev_cache/)
- **Future schema**: Planned for user data, campaigns, and persistent sessions

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

### **Hybrid Authentication System**

The system uses a **two-layer authentication architecture** combining OAuth identity verification with business logic controls:

#### **Layer 1: User Identity (Stack Auth)**
- **OAuth Providers**: Google sign-in with potential for GitHub, Microsoft, etc.
- **JWT Tokens**: Short-lived access tokens (1 hour) with automatic refresh
- **User Management**: Built-in user profiles, password reset, account linking
- **Frontend Integration**: Seamless React hooks for authentication state
- **Token Caching**: The frontend fetches the Stack Auth JWT token once after login and caches it in React state. The token is exposed as `useAuthState().token` and is available synchronously to all components for authenticated API calls.

#### **Layer 2: Business Controls (Database)**
- **User Records**: Local database links Stack Auth user IDs to business data
- **Rate Limiting**: Per-user limits based on tier (free/paid/enterprise)
- **Usage Tracking**: Detailed analytics and billing metrics
- **Feature Gates**: Tier-based access to advanced features

### **Authentication Flow**
```
1. User → Google OAuth → Stack Auth JWT token
2. Frontend → API request with Bearer token
3. Backend → Validates JWT → Extracts user ID
4. Backend → Database lookup → User tier/limits
5. Backend → Applies rate limits → Processes request
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