# Blossomer GTM API - Software Architecture Blueprint

## 1. Architectural Style and Pattern Selection

### Recommended Architecture: Modular Monolith with Service-Oriented Design

**Primary Choice: Modular Monolith**

For the Blossomer GTM API, I recommend starting with a **modular monolith** architecture that can evolve into microservices as the product scales.

**Justification:**

- **Early-stage appropriate**: Your pre-Series A target market aligns with a simpler deployment model
- **Team size consideration**: Small teams (1-5 people) benefit from unified codebases
- **Development velocity**: Faster iteration cycles during product-market fit discovery
- **Cost efficiency**: Single deployment reduces infrastructure complexity and costs
- **Data consistency**: Campaign generation requires strong consistency across AI workflows

**Architecture Pattern: Domain-Driven Design (DDD)**

- **Campaign Generation Domain**: Core business logic for AI-powered asset creation
- **Content Processing Domain**: Website analysis and ICP inference
- **User Management Domain**: Authentication, billing, and API key management
- **Integration Domain**: External API management and data enrichment

**Tradeoffs Analysis:**

| Aspect | Modular Monolith | Pure Microservices |
|--------|------------------|-------------------|
| **Development Speed** | ✅ Fast initial development | ❌ Slower due to distributed complexity |
| **Operational Complexity** | ✅ Simple deployment/monitoring | ❌ Complex service mesh, monitoring |
| **Team Coordination** | ✅ Easier for small teams | ❌ Requires mature DevOps practices |
| **Scaling Granularity** | ⚠️ Scale entire application | ✅ Scale individual services |
| **Technology Diversity** | ❌ Single tech stack | ✅ Technology per service |
| **Data Consistency** | ✅ ACID transactions | ❌ Eventual consistency complexity |

**Evolution Path:**

1. **Phase 1**: Modular monolith with clear domain boundaries
2. **Phase 2**: Extract compute-intensive AI processing to separate services
3. **Phase 3**: Microservices architecture for mature, high-scale operations

### Supporting Current Requirements

**API-First Design**: REST endpoints with clear separation between presentation and business logic
**AI Workflow Support**: Orchestrated agent processing within unified transaction boundaries
**External Integrations**: Adapter pattern for LLM providers and data enrichment APIs
**Frontend Preparation**: Clean separation of concerns enabling future UI development

### Stateless API Strategy

For the initial development phase, the API will remain stateless. No database models or persistent storage will be implemented until the requirements are clear. This allows for rapid iteration, easier refactoring, and a focus on API design. Endpoints will use mock or in-memory data until persistence is needed.

## 2. System Components and Services

### Core Component Architecture (Updated)

- **API Gateway Layer**: Exposes modular endpoints for each campaign asset and analysis:
  - `/campaigns/icp`
  - `/campaigns/positioning`
  - `/campaigns/valueprops`
  - `/campaigns/email`
  - `/campaigns/usecasefit`
- All endpoints require `website_url`, accept optional `user_inputted_context` and `llm_inferred_context` for chaining and agentic workflows.

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  FastAPI Router │ Auth Middleware │ Rate Limiting │ Logging  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Services                      │
├─────────────────┬─────────────────┬─────────────────┬───────┤
│   Campaign      │   Content       │   User          │ Admin │
│   Service       │   Service       │   Service       │ Service│
└─────────────────┴─────────────────┴─────────────────┴───────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Domain Logic Layer                       │
├─────────────────┬─────────────────┬─────────────────┬───────┤
│   Campaign      │   Content       │   AI Agent      │ ICP   │
│   Generator     │   Processor     │   Orchestrator  │ Engine│
└─────────────────┴─────────────────┴─────────────────┴───────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
├─────────────────┬─────────────────┬─────────────────┬───────┤
│   Database      │   Vector Store  │   External      │ Queue │
│   Repository    │   (ChromaDB)    │   API Client    │ System│
└─────────────────┴─────────────────┴─────────────────┴───────┘
```

### Service Boundaries and Responsibilities

#### 1. Campaign Service (Updated)

**Responsibility**: Orchestrate campaign asset generation via modular endpoints

- **Endpoints**: `/campaigns/icp`, `/campaigns/positioning`, `/campaigns/valueprops`, `/campaigns/email`, `/campaigns/usecasefit`
- **Business Logic**: Each endpoint is atomic but can accept context from previous steps for chaining
- **Extensibility**: New endpoints can be added with minimal impact

#### 2. Content Service

**Responsibility**: Website analysis and content processing

- **Functions**: URL scraping, content extraction, vectorization (using Firecrawl.dev API for dynamic content, JS, and media)
- **Storage**: ChromaDB integration for semantic search
- **Caching**: Intelligent content caching with TTL policies
- **Rationale**: Firecrawl.dev chosen for reliability, dynamic content support, and fast integration; architecture supports future migration to in-house scraping if needed.

#### 3. User Service

**Responsibility**: Authentication, authorization, and usage tracking

- **Functions**: API key management, rate limiting, billing integration
- **Security**: JWT token validation, role-based access control
- **Analytics**: Usage metrics and API call tracking

#### 4. AI Agent Orchestrator (Updated)

- Modular, composable API design supports both atomic and orchestrated/agentic workflows
- Endpoints can be chained by passing `llm_inferred_context` from one to the next
- Extensible for future asset types and analyses

#### 4.1 LLM Provider Abstraction Layer

- The AI Agent Orchestrator includes an adapter-based abstraction layer for LLM provider integration.
- `BaseLLMProvider` interface defines async methods, provider metadata, and a unified generate method.
- Concrete adapters (e.g., OpenAIProvider, AnthropicProvider) implement this interface.
- The orchestrator (`LLMClient`) manages provider selection, failover, and exposes a unified API to the rest of the system.
- All input/output uses Pydantic models for validation and serialization.
- Extensibility: New providers are added by subclassing and registering with the orchestrator.
- All logic is async and stateless; configuration is via environment or dependency injection.
- Unified error handling and failover logic ensure reliability.
- TDD/unit tests are required for this layer.

#### 5. ICP Engine

**Responsibility**: Ideal Customer Profile inference and processing

- **Analysis**: Website-based ICP generation
- **Validation**: User-provided ICP parsing and structuring
- **Enrichment**: Market data integration for ICP enhancement

### Communication Patterns

**Internal Communication**: Direct function calls within monolith
**External APIs**: HTTP clients with circuit breaker pattern
**Async Processing**: Redis-based task queue for long-running operations
**Event Publishing**: Domain events for cross-module communication

### Data Flow Architecture

```
Website URL Input
        │
        ▼
Content Service ──► ChromaDB Storage
        │
        ▼
ICP Engine ──► ICP Analysis/Inference
        │
        ▼
AI Agent Orchestrator ──► LLM APIs
        │
        ▼
Campaign Service ──► Asset Generation
        │
        ▼
PostgreSQL Storage ──► JSON Response
```

## 3. Data Architecture

### Storage Solutions Strategy

#### Primary Database: PostgreSQL

**Rationale**: ACID compliance, JSON support, mature ecosystem

```sql
-- Core tables structure
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    website_url TEXT NOT NULL,
    icp_source VARCHAR(20) CHECK (icp_source IN ('user', 'inferred')),
    icp_data JSONB,
    positioning_canvas JSONB,
    email_campaign JSONB,
    enrichment_blueprint JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE website_content (
    id UUID PRIMARY KEY,
    url_hash VARCHAR(64) UNIQUE NOT NULL,
    url TEXT NOT NULL,
    content_text TEXT,
    metadata JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE api_usage (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 1,
    date DATE NOT NULL,
    UNIQUE(user_id, endpoint, date)
);
```

#### Vector Database: ChromaDB

**Purpose**: Semantic search and RAG operations

- **Website content embeddings** for contextual retrieval
- **Campaign template storage** for similar company matching
- **ICP classification** support with semantic similarity

#### Caching Layer: Redis

**Use Cases**:

- **Session management**: User authentication state
- **Rate limiting**: API call counting with TTL
- **Content caching**: Processed website content
- **Queue management**: Async task processing

### Data Access Patterns

#### Repository Pattern Implementation

```python
class CampaignRepository:
    async def create_campaign(self, campaign_data: CampaignCreate) -> Campaign
    async def get_campaign(self, campaign_id: UUID) -> Optional[Campaign]
    async def get_user_campaigns(self, user_id: UUID) -> List[Campaign]
    async def update_campaign(self, campaign_id: UUID, updates: dict) -> Campaign

class ContentRepository:
    async def get_cached_content(self, url_hash: str) -> Optional[WebsiteContent]
    async def cache_content(self, content: WebsiteContent) -> None
    async def invalidate_cache(self, url_hash: str) -> None
```

#### Query Optimization Strategy

- **Indexes**: User ID, campaign creation date, URL hash
- **Partitioning**: API usage by date for historical data management
- **Connection pooling**: SQLAlchemy async pool for concurrent requests

### Data Evolution Strategy

#### Schema Migration Management

- **Alembic** for version-controlled database migrations
- **Backward compatibility** maintenance for API responses
- **Blue-green deployment** support for zero-downtime updates

#### Data Retention Policies

- **Campaign data**: 2-year retention with configurable policies
- **Website content cache**: 30-day TTL with refresh logic
- **API usage logs**: 1-year retention for billing and analytics

## 4. Security Architecture

### Authentication and Authorization

#### API Key Authentication

```python
class APIKeyAuth:
    def __init__(self, api_key_header: str = "X-API-Key"):
        self.api_key_header = api_key_header
    
    async def authenticate(self, request: Request) -> User:
        api_key = request.headers.get(self.api_key_header)
        if not api_key:
            raise HTTPException(401, "API key required")
        
        user = await self.validate_api_key(api_key)
        if not user:
            raise HTTPException(401, "Invalid API key")
        
        return user
```

#### Rate Limiting Strategy

- **Tier-based limits**: Free (100/day), Pro (1000/day), Enterprise (unlimited)
- **Endpoint-specific limits**: Resource-intensive operations have lower limits
- **Redis-based tracking**: Sliding window rate limiting implementation

### Data Protection Strategies

#### Encryption at Rest

- **Database encryption**: PostgreSQL TDE for sensitive data
- **API key hashing**: bcrypt with salt for stored credentials
- **Content encryption**: Sensitive website content encrypted in ChromaDB

#### Encryption in Transit

- **TLS 1.3**: All API endpoints require HTTPS
- **Certificate management**: Let's Encrypt with auto-renewal
- **Internal communication**: mTLS for service-to-service communication (future microservices)

#### Data Privacy Compliance

- **GDPR compliance**: User data deletion and export capabilities
- **Data minimization**: Only collect necessary information
- **Anonymization**: Remove PII from analytics and logging

### Security Monitoring

#### Threat Detection

```python
class SecurityMonitor:
    async def log_suspicious_activity(self, event: SecurityEvent):
        # Log to security monitoring system
        # Alert on patterns: unusual API usage, failed auth attempts
        pass
    
    async def check_rate_limit_abuse(self, user_id: UUID) -> bool:
        # Detect rapid successive requests
        # Flag potential API abuse patterns
        pass
```

#### Audit Logging

- **API access logs**: All requests with user identification
- **Data access tracking**: Campaign generation and retrieval
- **Administrative actions**: User management and configuration changes

## 5. Scalability and Performance

### Scaling Strategy

#### Horizontal Scaling Approach

**Phase 1: Vertical Scaling**

- **Database**: Increase PostgreSQL instance size
- **Application**: Multi-core CPU optimization with async processing
- **Memory**: Redis cache expansion for better hit rates

**Phase 2: Horizontal Scaling**

- **Load balancer**: Multiple FastAPI instances behind nginx
- **Database scaling**: Read replicas for query distribution
- **Cache distribution**: Redis cluster for session management

**Phase 3: Service Extraction**

- **AI processing service**: Separate compute-intensive operations
- **Content processing service**: Independent website analysis
- **API gateway**: Centralized routing and rate limiting

### Performance Optimization

#### Application-Level Optimizations

```python
# Async processing for I/O operations
async def generate_campaign_async(website_url: str, icp_data: Optional[str]):
    tasks = []
    
    # Parallel processing of independent operations
    tasks.append(scrape_website_content(website_url))
    if not icp_data:
        tasks.append(infer_icp_from_website(website_url))
    
    # Await all tasks concurrently
    results = await asyncio.gather(*tasks)
    return process_campaign_generation(results)
```

#### Database Performance

- **Query optimization**: Proper indexing and query planning
- **Connection pooling**: Async SQLAlchemy pool management
- **Prepared statements**: Parameterized queries for security and performance

#### Caching Strategy

```python
class CacheStrategy:
    # L1: In-memory cache for frequently accessed data
    # L2: Redis cache for session and content data
    # L3: Database with optimized queries
    
    async def get_website_content(self, url: str) -> WebsiteContent:
        # Check L1 cache first
        if content := self.memory_cache.get(url):
            return content
        
        # Check L2 cache (Redis)
        if content := await self.redis_cache.get(url):
            self.memory_cache.set(url, content)
            return content
        
        # Fetch from database and populate caches
        content = await self.database.get_content(url)
        await self.redis_cache.set(url, content, ttl=3600)
        self.memory_cache.set(url, content)
        return content
```

### Resource Estimation

#### Traffic Projections

- **Current target**: 1000 API calls/day across all users
- **6-month projection**: 10,000 API calls/day
- **12-month projection**: 100,000 API calls/day

#### Infrastructure Requirements

```yaml
# Initial deployment (Render/Railway)
CPU: 2 vCPU
Memory: 4 GB RAM
Storage: 50 GB SSD
Database: PostgreSQL (2 CPU, 4 GB RAM)
Redis: 1 GB memory cache

# 6-month scaling
CPU: 4 vCPU
Memory: 8 GB RAM
Storage: 100 GB SSD
Database: PostgreSQL (4 CPU, 8 GB RAM)
Redis: 2 GB memory cache

# 12-month scaling (microservices transition)
Load Balancer: nginx with SSL termination
App Instances: 3x (2 CPU, 4 GB each)
Database: PostgreSQL (8 CPU, 16 GB RAM) + read replica
Cache: Redis cluster (4 GB total)
```

## 6. Resilience and Reliability

### Failure Modes and Recovery

#### LLM Service Failures

```python
class LLMClient:
    def __init__(self):
        self.providers = [
            OpenAIProvider(priority=1),
            AnthropicProvider(priority=2)
        ]
    
    async def generate_with_fallback(self, prompt: str) -> str:
        for provider in self.providers:
            try:
                result = await provider.generate(prompt)
                return result
            except ProviderException as e:
                logger.warning(f"Provider {provider.name} failed: {e}")
                continue
        
        raise AllProvidersFailedException("All LLM providers unavailable")
```

#### Database Resilience

- **Connection retry logic**: Exponential backoff for transient failures
- **Read replica failover**: Automatic switching for read operations
- **Transaction rollback**: Proper error handling with cleanup

#### External API Resilience

```python
class ExternalAPIClient:
    def __init__(self):
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=30,
            expected_exception=HTTPException
        )
    
    @circuit_breaker
    async def fetch_company_data(self, domain: str) -> CompanyData:
        # Circuit breaker protects against cascading failures
        # Falls back to cached data or graceful degradation
        pass
```

### Monitoring and Alerting

#### Health Check Endpoints

```python
@app.get("/health")
async def health_check():
    checks = {
        "database": await check_database_connection(),
        "redis": await check_redis_connection(),
        "llm_providers": await check_llm_providers(),
        "external_apis": await check_external_apis()
    }
    
    status = "healthy" if all(checks.values()) else "degraded"
    return {"status": status, "checks": checks}
```

#### Observability Stack

- **Metrics**: Prometheus for performance metrics
- **Logging**: Structured JSON logs with correlation IDs
- **Tracing**: OpenTelemetry for request tracing
- **Alerting**: PagerDuty integration for critical failures

#### SLA Targets

- **Availability**: 99.5% uptime (3.6 hours downtime/month)
- **Response time**: 95th percentile under 30 seconds
- **Error rate**: Less than 1% of requests fail
- **Data durability**: 99.99% for campaign data

### Disaster Recovery

#### Backup Strategy

```yaml
Database Backups:
  - Full backup: Daily at 2 AM UTC
  - Incremental: Every 6 hours
  - Retention: 30 days full, 7 days incremental
  - Cross-region replication: Weekly snapshots

Vector Database:
  - ChromaDB export: Daily
  - S3 storage with versioning
  - Retention: 30 days

Redis:
  - RDB snapshots: Every 12 hours
  - AOF persistence: Enabled
  - Backup retention: 7 days
```

#### Recovery Procedures

- **RTO (Recovery Time Objective)**: 4 hours for full service restoration
- **RPO (Recovery Point Objective)**: 1 hour maximum data loss
- **Automated failover**: Database and cache layer switching
- **Manual processes**: Application deployment and configuration

## 7. Development and Deployment

### Local Development Environment

**Dependency and Environment Management**

- Poetry 2.1.3 is the standard tool for managing Python dependencies and virtual environments in this project. All contributors should use Poetry for installing, adding, or updating dependencies, and for managing the project's virtual environment. See the README for installation and usage instructions.

#### Docker Compose Setup

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/blossomer
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      - chromadb

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: blossomer
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chromadb_data:/chroma/chroma
```

#### Development Workflow

```bash
# Setup local environment
make setup-dev
docker-compose up -d

# Run tests
make test
make test-integration

# Code quality checks
make lint
make type-check
make security-scan

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt
      
      - name: Run tests
        run: |
          pytest tests/ --cov=src/ --cov-report=xml
      
      - name: Security scan
        run: |
          bandit -r src/
          safety check

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          # Deploy to Render staging environment
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_STAGING }}"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy to Render production environment
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_PROD }}"
```

### Environment Strategy

#### Configuration Management

```python
class Settings(BaseSettings):
    # Environment-specific configuration
    environment: str = "development"
    debug: bool = False
    
    # Database
    database_url: str
    database_pool_size: int = 10
    
    # Redis
    redis_url: str
    
    # External APIs
    openai_api_key: str
    anthropic_api_key: str
    bing_search_api_key: str
    
    # Security
    api_key_salt: str
    jwt_secret_key: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Environment-specific overrides
environments = {
    "development": {
        "debug": True,
        "database_pool_size": 5
    },
    "staging": {
        "debug": False,
        "database_pool_size": 10
    },
    "production": {
        "debug": False,
        "database_pool_size": 20
    }
}
```

### Feature Flagging

#### Progressive Rollout Strategy

```python
class FeatureFlags:
    def __init__(self):
        self.flags = {
            "new_icp_algorithm": {
                "enabled": True,
                "rollout_percentage": 10,
                "user_whitelist": ["beta_user_1", "beta_user_2"]
            },
            "enhanced_email_generation": {
                "enabled": False,
                "rollout_percentage": 0
            }
        }
    
    def is_enabled(self, flag_name: str, user_id: str) -> bool:
        flag = self.flags.get(flag_name, {"enabled": False})
        
        if not flag["enabled"]:
            return False
        
        if user_id in flag.get("user_whitelist", []):
            return True
        
        # Hash-based consistent rollout
        rollout_hash = int(hashlib.md5(f"{flag_name}:{user_id}".encode()).hexdigest(), 16)
        return (rollout_hash % 100) < flag.get("rollout_percentage", 0)
```

### Observability and Debugging

#### Logging Strategy

```python
import structlog

logger = structlog.get_logger()

class LoggingMiddleware:
    async def __call__(self, request: Request, call_next):
        correlation_id = str(uuid.uuid4())
        
        # Add correlation ID to context
        with structlog.contextvars.bound_contextvars(
            correlation_id=correlation_id,
            user_id=getattr(request.state, 'user_id', None),
            endpoint=request.url.path
        ):
            start_time = time.time()
            
            try:
                response = await call_next(request)
                duration = time.time() - start_time
                
                logger.info(
                    "request_completed",
                    status_code=response.status_code,
                    duration=duration
                )
                
                return response
            except Exception as e:
                duration = time.time() - start_time
                logger.error(
                    "request_failed",
                    error=str(e),
                    duration=duration
                )
                raise
```

#### Debugging Tools

- **FastAPI Debug Mode**: Automatic reload and detailed error pages
- **Database Query Logging**: SQLAlchemy query profiling
- **Performance Profiling**: py-spy for production profiling
- **Request Tracing**: OpenTelemetry integration for distributed tracing

## API Design Best Practices for AI Integration (Updated)

- Modular, composable endpoints for each campaign asset and analysis
- Consistent input schema: all endpoints require `website_url`, accept optional `user_inputted_context` and `llm_inferred_context`
- Designed for both atomic and orchestrated workflows
- Extensible for future features

**Endpoint Design Checklist:**
- [ ] Clear, documented purpose
- [ ] RESTful path and method
- [ ] Input validation (Pydantic models)
- [ ] Descriptive error handling
- [ ] Fast, stateless response
- [ ] Security considerations
- [ ] Logging/monitoring hooks
- [ ] Documented in OpenAPI/Swagger
- [ ] Privacy/ethics reviewed

These principles are referenced throughout the codebase and documentation to ensure consistent, high-quality API design.

---

## Architecture Decision Records

### ADR-001: Modular Monolith vs Microservices

**Decision**: Start with modular monolith
**Rationale**: Team size, development velocity, cost optimization
**Consequences**: Easier initial development, planned evolution to microservices

### ADR-002: PostgreSQL vs MongoDB

**Decision**: PostgreSQL with JSONB
**Rationale**: ACID compliance, mature ecosystem, JSON flexibility
**Consequences**: Strong consistency, familiar tooling, SQL optimization

### ADR-003: FastAPI vs Flask/Django

**Decision**: FastAPI
**Rationale**: Async support, automatic documentation, type safety
**Consequences**: Modern Python features, excellent performance, smaller ecosystem

This architecture provides a solid foundation for the Blossomer GTM API while maintaining flexibility for future growth and evolution into a microservices architecture as the product and team scale.

## Prompt Templating System Architecture

The prompt templating system centralizes and manages all prompt templates for LLM providers, ensuring consistency, extensibility, and provider-agnostic design. It is implemented as a dedicated module with the following goals:

- Centralize all prompt templates (for campaign assets, LLM tasks, etc.)
- Handle variable substitution and validation using Pydantic models
- Decouple prompt construction from LLM provider logic
- Support easy extension and robust testing

**Key Components:**
- Jinja2 template files for each campaign asset/use case
- Pydantic models for type-safe variable validation
- Template engine for rendering and error handling
- Registry for mapping use cases to templates and models

**Extensibility:**
- Add new templates by creating a new .jinja2 file, a Pydantic model, and registering in the registry
- Provider-agnostic: output is a plain string, ready for any LLM

**See [PROMPT_TEMPLATES.md](PROMPT_TEMPLATES.md) for full details, examples, and usage patterns.**

```mermaid
flowchart TD
    A[API/Service Layer] --> B[Prompt Registry]
    B --> C[Template Engine]
    C --> D[Templates (.jinja2)]
    B --> E[Pydantic Models]
    C --> F[Rendered Prompt String]
    F --> G[LLM Provider]
```

| Component         | Responsibility                                  |
|-------------------|-------------------------------------------------|
| templates/        | Store Jinja2 template files                     |
| base.py           | Core rendering and validation logic             |
| models.py         | Pydantic models for template variables          |
| registry.py       | Maps use cases to templates and models          |
| Unit tests        | Ensure correctness and safety                   |
