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
- **Authentication**: API key system with SHA-256 hashing
- **Deployment**: Docker containers on Render

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot reload
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + localStorage
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
- **Dual Endpoint Structure**: `/demo/*` (IP rate limited) and `/api/*` (API key required)
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
-- User management
users (id UUID, email, name, created_at, last_login, rate_limit_exempt, role)

-- API authentication  
api_keys (id UUID, user_id, key_hash, key_prefix, tier, created_at, last_used)

-- Usage analytics
api_usage (id UUID, api_key_id, endpoint, status_code, response_time, created_at)
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

### **Data Flow**
1. **User Input** → Landing page form
2. **API Calls** → Backend analysis endpoints  
3. **localStorage Storage** → Cache results for session persistence
4. **Component Updates** → React state updates from localStorage
5. **User Edits** → Local storage updates (no backend sync)

## AI Processing Architecture

### **Prompt System**
- **Jinja2 Templates**: Structured prompt templates with variable injection
- **Template Registry**: Centralized management of prompt templates
- **Context Injection**: Dynamic context based on available data sources
- **Output Schemas**: Pydantic models for type-safe AI responses

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

## Security Architecture

### **Authentication**
- **API Key System**: SHA-256 hashed keys with display prefixes
- **Tiered Access**: Free, paid, enterprise tiers with different rate limits
- **Rate Limiting**: Per-API-key and IP-based rate limiting
- **Usage Tracking**: Comprehensive logging for analytics and security

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