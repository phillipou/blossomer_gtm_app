# Blossomer GTM API - Software Architecture Blueprint v2.0

## 1. Architectural Philosophy and Patterns

### Core Architecture: Enhanced Modular Monolith

**Primary Choice: Intelligent Modular Monolith**

The Blossomer GTM API uses an enhanced modular monolith architecture with intelligent orchestration capabilities, designed to evolve gracefully into microservices.

**Key Architectural Principles:**

- **Smart Context Orchestration**: Intelligent data management across endpoints
- **Atomic + Composable Endpoints**: Individual business value with chainable context
- **Agent-Based Internal Architecture**: Clear separation between user-facing endpoints and internal processing agents
- **AI-First Design**: Built for LLM reliability, quality validation, and iterative refinement

**Architecture Pattern: Domain-Driven Design (DDD) with AI Orchestration**

- **Campaign Intelligence Domain**: Smart context management and orchestration
- **Asset Generation Domain**: Modular campaign asset creation
- **Content Processing Domain**: Website analysis and data enrichment
- **User Experience Domain**: Authentication, corrections, and feedback loops
- **Integration Domain**: External APIs and data source management

**Evolution Path:**

1. **Phase 1** (Current): Enhanced modular monolith with smart orchestration
2. **Phase 2**: Extract AI processing and context orchestration to separate services
3. **Phase 3**: Full microservices with intelligent service mesh

## 2. Enhanced System Architecture

### Intelligent Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  FastAPI Router │ Auth Middleware │ Rate Limiting │ Logging  │
│  Circuit Breaker │ Context Tracking │ Quality Gates         │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Smart Orchestration Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Context Orchestrator │ Quality Validator │ Correction Engine│
│  Data Source Manager │ Response Synthesizer │ Cache Manager  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Domain Services Layer                     │
├─────────────────┬─────────────────┬─────────────────┬───────┤
│   Campaign      │   Content       │   Enrichment    │ User  │
│   Generation    │   Processing    │   Sources       │ Mgmt  │
└─────────────────┴─────────────────┴─────────────────┴───────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Layer                          │
├─────────────────┬─────────────────┬─────────────────┬───────┤
│   Website       │   ICP           │   Content       │ LLM   │
│   Analysis      │   Inference     │   Synthesis     │ Client│
│   Agent         │   Agent         │   Agent         │       │
└─────────────────┴─────────────────┴─────────────────┴───────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
├─────────────────┬─────────────────┬─────────────────┬───────┤
│   PostgreSQL    │   ChromaDB      │   Redis Cache   │ External│
│   Database      │   Vector Store  │   Context Store │ APIs  │
└─────────────────┴─────────────────┴─────────────────┴───────┘
```

### Enhanced Endpoint Architecture

#### Core Business Endpoints

| Endpoint | Purpose | Context Dependencies | Output |
|----------|---------|---------------------|---------|
| `/campaigns/product_overview` | Foundation product analysis | `website_url` | Product features, customers, competitive context |
| `/campaigns/target_company` | Company targeting strategy | `website_url`, `product_overview?` | Firmographics, buying signals, disqualifiers |
| `/campaigns/target_persona` | Primary buyer persona | `website_url`, `target_company?` | Decision-maker profile, behaviors, pain points |
| `/campaigns/positioning` | Positioning and value props | `website_url`, `target_company`, `target_persona` | Unique insight, value propositions |
| `/campaigns/email` | Email campaign sequences | All above context | Subject lines, sequences, personalization |
| `/campaigns/enrichment_sources` | Implementation guidance | Any targeting attributes | APIs, tools, costs, workflows |

#### System Endpoints

| Endpoint | Purpose | Input | Output |
|----------|---------|-------|--------|
| `/campaigns/correct` | Output refinement | Original response + corrections | Improved response |
| `/health` | System status | None | Provider health, performance metrics |

#### Legacy Endpoints (Backwards Compatibility)

| Endpoint | Purpose | Status | Migration Path |
|----------|---------|--------|----------------|
| `/campaigns/icp` | Consolidated ICP | Maintained | Internally routes to decomposed endpoints |

## 3. Smart Context Orchestration System

### Context Management Architecture

The Context Orchestrator is the intelligence layer that manages data requirements and quality across all endpoints.

```python
class ContextOrchestrator:
    """
    Intelligent context management system
    
    Key responsibilities:
    1. Assess quality of provided context
    2. Determine what additional data is needed  
    3. Orchestrate data fetching from multiple sources
    4. Cache and reuse context across related requests
    5. Provide transparent feedback on data quality
    """
    
    def __init__(self):
        self.data_sources = {
            "website_scraper": WebsiteScrapingAgent(),
            "product_analyzer": ProductAnalysisAgent(),
            "market_research": MarketResearchAgent(),
            "icp_inference": ICPInferenceAgent()
        }
        
        self.endpoint_requirements = {
            "target_company": [
                ContextRequirement(
                    context_type=ContextType.WEBSITE_CONTENT,
                    required=True,
                    quality_threshold=0.7,
                    fallback_sources=["website_scraper"]
                ),
                ContextRequirement(
                    context_type=ContextType.PRODUCT_OVERVIEW,
                    required=False,
                    quality_threshold=0.6,
                    fallback_sources=["product_analyzer"]
                )
            ]
            # ... other endpoint requirements
        }
```

### Context Quality Assessment

```python
class ContextQuality(Enum):
    SUFFICIENT = "sufficient"    # >80% confidence, complete data
    PARTIAL = "partial"         # 60-80% confidence, some gaps
    INSUFFICIENT = "insufficient" # 40-60% confidence, major gaps  
    MISSING = "missing"         # <40% confidence or no data

class ContextAssessment:
    context_type: ContextType
    quality: ContextQuality
    confidence_score: float      # 0-1 confidence level
    data_freshness: Optional[float]  # Hours since update
    gaps: List[str]             # Specific missing information
    source: str                 # Data source identifier
```

## 4. AI Agent Architecture

### Agent vs. Endpoint Design Philosophy

**Endpoints = User Value | Agents = Implementation Details**

| Criteria | Endpoint | Internal Agent |
|----------|----------|----------------|
| **Purpose** | Direct business value to users | Internal processing step |
| **Scope** | Complete, usable deliverable | Intermediate data transformation |
| **Caching** | Results worth long-term storage | Ephemeral processing |
| **Versioning** | Stable external contract | Can change with implementation |
| **Error Handling** | User-friendly error responses | Technical error propagation |

### Core AI Agents

#### WebsiteAnalysisAgent
- **Purpose**: Scrape, process, and analyze website content
- **Input**: Website URL, scraping preferences
- **Output**: Structured website data, content embeddings
- **Integrations**: Firecrawl.dev API, content preprocessing pipeline

#### ICPInferenceAgent  
- **Purpose**: Generate ideal customer profiles from website analysis
- **Input**: Website content, user context (optional)
- **Output**: Target company and persona profiles
- **Logic**: LLM-powered analysis with confidence scoring

#### ContentSynthesisAgent
- **Purpose**: Combine multiple data sources into coherent context
- **Input**: Multiple data sources, synthesis requirements
- **Output**: Unified context for campaign generation
- **Logic**: Intelligent data merging and gap identification

#### EnrichmentRecommendationAgent
- **Purpose**: Recommend specific data sources and APIs
- **Input**: Target attributes, budget constraints
- **Output**: Prioritized data source recommendations
- **Database**: 20+ data source catalog with cost/quality metadata

## 5. Enhanced LLM Provider Architecture

### Circuit Breaker Pattern Implementation

```python
class EnhancedLLMClient:
    """
    Production-ready LLM client with comprehensive error handling
    """
    
    def __init__(self, providers: List[BaseLLMProvider]):
        self.providers = sorted(providers, key=lambda p: p.priority)
        self.circuit_breakers = {
            provider.name: CircuitBreaker(
                failure_threshold=5,
                recovery_timeout=60
            ) for provider in providers
        }
        self.metrics = LLMMetrics()
    
    async def generate_with_failover(
        self, 
        request: LLMRequest,
        max_retries: int = 2,
        timeout: float = 30.0
    ) -> LLMResponse:
        """Generate with automatic failover and retry logic"""
        
        for provider in self.providers:
            circuit_breaker = self.circuit_breakers[provider.name]
            
            if not circuit_breaker.can_execute():
                continue
                
            for attempt in range(max_retries + 1):
                try:
                    response = await asyncio.wait_for(
                        provider.generate(request),
                        timeout=timeout
                    )
                    
                    circuit_breaker.record_success()
                    self.metrics.record_success(provider.name)
                    return response
                    
                except asyncio.TimeoutError:
                    circuit_breaker.record_failure()
                    break  # Don't retry timeouts
                    
                except Exception as e:
                    if attempt < max_retries:
                        await asyncio.sleep((2 ** attempt) * 0.1)  # Exponential backoff
                    else:
                        circuit_breaker.record_failure()
                        break
        
        raise AllProvidersFailedException("All LLM providers failed")
```

### Output Validation and Recovery

```python
class LLMOutputValidator:
    """Advanced output validation with error recovery"""
    
    @classmethod
    def validate_and_parse(
        cls,
        llm_output: str,
        expected_schema: Type[BaseModel],
        max_retry_attempts: int = 3
    ) -> BaseModel:
        """Validate with progressive error recovery strategies"""
        
        for attempt in range(max_retry_attempts):
            try:
                # Extract and clean JSON
                json_str = cls.extract_json_from_text(llm_output)
                cleaned_json = cls.clean_json_string(json_str)
                
                # Parse and validate
                parsed_data = json.loads(cleaned_json)
                validated_output = expected_schema.parse_obj(parsed_data)
                
                return validated_output
                
            except json.JSONDecodeError as e:
                if attempt < max_retry_attempts - 1:
                    llm_output = cls._aggressive_json_cleanup(llm_output)
                    
            except ValidationError as e:
                if attempt < max_retry_attempts - 1:
                    llm_output = cls._fill_missing_fields(llm_output, expected_schema, e)
        
        raise OutputValidationError(f"Failed validation after {max_retry_attempts} attempts")
```

## 6. Data Architecture and Storage Strategy

### Multi-Layer Storage Architecture

#### PostgreSQL (Primary Database)
- **User management**: Authentication, API keys, billing
- **Campaign storage**: Generated assets and metadata  
- **Context caching**: Processed website content and analysis
- **Usage tracking**: API calls, rate limiting, analytics

#### ChromaDB (Vector Database)
- **Content embeddings**: Website content for semantic search
- **Template matching**: Similar company pattern recognition
- **Context similarity**: Related context retrieval for chaining

#### Redis (Caching and Session Management)
- **Context cache**: Short-term context storage for endpoint chaining
- **Rate limiting**: API call counting with TTL
- **Session management**: User authentication state
- **Queue management**: Async task processing

### Enhanced Database Schema

```sql
-- Enhanced campaign storage with decomposed structure
CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    website_url TEXT NOT NULL,
    
    -- Decomposed campaign components
    product_overview JSONB,
    target_company JSONB,
    target_persona JSONB,
    positioning JSONB,
    email_campaign JSONB,
    enrichment_sources JSONB,
    
    -- Metadata and tracking
    context_sources TEXT[],
    confidence_scores JSONB,
    corrections_applied JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Context storage for intelligent orchestration
CREATE TABLE context_cache (
    id UUID PRIMARY KEY,
    url_hash VARCHAR(64) NOT NULL,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    quality_score FLOAT NOT NULL,
    data_sources TEXT[],
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(url_hash, context_type)
);

-- Enhanced API usage tracking
CREATE TABLE api_usage_detailed (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(100) NOT NULL,
    context_sources TEXT[],
    processing_time_ms INTEGER,
    llm_provider VARCHAR(50),
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,4),
    quality_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. Correction and Refinement System

### Correction Architecture

```python
class CampaignCorrector:
    """Handles user corrections and output refinement"""
    
    def __init__(self):
        self.correction_strategies = {
            CorrectionScope.FIELD_SPECIFIC: self._apply_field_corrections,
            CorrectionScope.SECTION_WIDE: self._apply_section_corrections,
            CorrectionScope.GLOBAL: self._apply_global_corrections
        }
    
    async def apply_corrections(self, request: CorrectionRequest) -> CorrectionResponse:
        """Apply corrections using appropriate strategy"""
        
        strategy = self.correction_strategies[request.correction_scope]
        corrected_data, changes_made = await strategy(request)
        
        return CorrectionResponse(
            corrected_data=corrected_data,
            correction_summary=CorrectionSummary(
                changes_made=changes_made,
                fields_updated=self._extract_updated_fields(changes_made),
                confidence_impact=self._assess_confidence_impact(request, corrected_data)
            ),
            confidence_level=self._calculate_new_confidence(request, corrected_data)
        )
```

### Correction Types and Strategies

| Correction Scope | Use Case | Strategy |
|------------------|----------|----------|
| **Field-Specific** | Single field corrections | Direct field updates with related field validation |
| **Section-Wide** | Multiple related fields | AI-assisted section improvement with user guidance |
| **Global** | Tone, style, approach changes | Complete regeneration with enhanced context |

## 8. Performance and Reliability Requirements

### Performance Targets

| Metric | Target | Measurement |
|--------|---------|-------------|
| **Individual Endpoint Response** | <30 seconds | 95th percentile |
| **Context Orchestration Overhead** | <5 seconds | Average additional time |
| **LLM Provider Failover** | <2 seconds | Time to switch providers |
| **Context Cache Hit Rate** | >80% | For repeated URL analysis |
| **Output Validation Success** | >95% | First-attempt validation rate |

### Reliability Mechanisms

#### Circuit Breaker Configuration
```python
circuit_breaker_config = {
    "failure_threshold": 5,      # Failures before opening circuit
    "recovery_timeout": 60,      # Seconds before trying again
    "test_request_timeout": 10   # Timeout for health check requests
}
```

#### Quality Gates
- **Context Quality**: Minimum 70% confidence before processing
- **Output Validation**: Schema compliance required for all responses
- **Provider Health**: Automatic failover for unhealthy LLM providers
- **Data Freshness**: Context cache TTL based on data type

## 9. Implementation Roadmap and Priorities

### Phase 1: Foundation Enhancement (Weeks 1-3)
#### Priority 1: Reliability Infrastructure
- [ ] Enhanced LLM client with circuit breaker pattern
- [ ] Advanced output validation and error recovery
- [ ] Comprehensive error handling and logging

#### Priority 2: Core Business Value
- [ ] Product overview endpoint implementation
- [ ] Correction system for user refinement
- [ ] Context quality assessment foundation

### Phase 2: Intelligence Layer (Weeks 4-6)
#### Priority 1: Smart Context Orchestration
- [ ] Context orchestrator with automatic data fetching
- [ ] Quality-based context management
- [ ] Transparent data source tracking

#### Priority 2: Decomposed Architecture
- [ ] Target company analysis endpoint
- [ ] Target persona development endpoint

### Phase 3: Implementation Guidance (Weeks 7-8)
#### Priority 1: Enrichment Recommendations
- [ ] Data source recommendation engine
- [ ] Cost calculation and workflow generation
- [ ] Integration with 20+ data providers

#### Priority 2: Optimization and Polish
- [ ] Performance optimization and caching
- [ ] End-to-end testing and validation
- [ ] Documentation and developer experience

### Migration and Backwards Compatibility

#### Legacy Endpoint Strategy
- **Keep existing `/campaigns/icp`** for backwards compatibility
- **Internal routing** to new decomposed endpoints
- **Response transformation** to maintain existing format
- **Deprecation timeline** with advance notice to users

## 10. Security and Compliance

### Enhanced Security Architecture

#### API Security
- **API key authentication** with rate limiting per tier
- **Request validation** with comprehensive input sanitization
- **Response sanitization** to prevent data leakage
- **Audit logging** for all API interactions

#### Data Protection
- **Context encryption** for sensitive website content
- **PII detection** and automatic anonymization
- **GDPR compliance** with data deletion and export capabilities
- **SOC 2 preparation** with comprehensive audit trails

### Monitoring and Observability

#### Health Monitoring
```python
@app.get("/health")
async def comprehensive_health_check():
    return {
        "status": "healthy",
        "checks": {
            "database": await check_database_connection(),
            "redis": await check_redis_connection(),
            "chromadb": await check_vector_database(),
            "llm_providers": await check_all_llm_providers(),
            "external_apis": await check_external_integrations()
        },
        "metrics": {
            "avg_response_time": get_avg_response_time(),
            "error_rate": get_error_rate(),
            "context_cache_hit_rate": get_cache_hit_rate()
        }
    }
```

#### Observability Stack
- **Structured logging** with correlation IDs across all requests
- **Performance metrics** with Prometheus integration
- **Error tracking** with comprehensive stack traces
- **User behavior analytics** for API usage patterns

---

## Architecture Decision Records (Updated)

### ADR-004: Smart Context Orchestration
**Decision**: Implement intelligent context management layer
**Rationale**: Eliminates manual context management burden, improves user experience
**Consequences**: Added complexity, significant competitive advantage

### ADR-005: ICP Endpoint Decomposition  
**Decision**: Break monolithic ICP into focused endpoints
**Rationale**: Better performance, caching, user experience
**Consequences**: More endpoints to maintain, improved flexibility

### ADR-006: Correction System Architecture
**Decision**: Build comprehensive correction and refinement system
**Rationale**: Essential for AI output quality and user adoption
**Consequences**: Additional complexity, unique market differentiation

### ADR-007: Enhanced LLM Reliability
**Decision**: Implement circuit breaker pattern with advanced failover
**Rationale**: Production reliability requirements, cost optimization
**Consequences**: More complex provider management, significantly improved uptime

---

## Removed from Previous Version

To streamline the architecture document, I've removed or consolidated:

1. **Detailed Infrastructure Requirements**: Moved specific server specs to deployment docs
2. **Comprehensive Database Queries**: Simplified to essential schema and patterns  
3. **Extensive Code Examples**: Kept only architecture-defining code snippets
4. **Detailed Backup Procedures**: Moved operational details to ops documentation
5. **Feature Flag Examples**: Kept concept, removed detailed implementation
6. **Extensive CI/CD Pipeline**: Simplified to essential deployment strategy
7. **Detailed Cost Projections**: Moved to business planning documents

The updated architecture focuses on the core architectural decisions, patterns, and systems that developers need to understand and implement, while removing operational details that belong in separate documentation.

---

*Architecture version: 2.0*  
*Last updated: January 2025*  
*Aligned with: PRD v2.0*