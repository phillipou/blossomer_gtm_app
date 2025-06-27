# Blossomer GTM API - Product Requirements Document

## 1. Introduction

This Product Requirements Document (PRD) outlines the specifications for the Blossomer GTM API, an AI-powered go-to-market campaign generator specifically designed for B2B founders. The document serves as a comprehensive guide for the development team, defining the functional requirements, technical architecture, and user experience expectations for building this API-first solution.

The Blossomer GTM API aims to democratize expert-level go-to-market strategy and execution for early-stage B2B companies that lack the resources for full-service consulting but need systematic, actionable guidance to establish their initial sales playbook and positioning.

## 2. Product overview

The Blossomer GTM API is an AI-powered API that takes just your website URL and target customer info to create complete marketing campaign materials. It analyzes your company's positioning, writes targeted messaging, and gives you guidance on improving your data quality.

Unlike traditional marketing automation tools that focus on campaign execution, Blossomer emphasizes strategic foundation-building through systematic experimentation and expert-level guidance delivered via structured API responses. The product operates on a "0-90% philosophy" - providing founders with 90% complete, expert-quality campaigns that require minimal refinement rather than starting from scratch.

### Key value propositions

- **Expert GTM guidance without consultant costs**: Delivers strategic insights typically available only through expensive consulting engagements
- **Systematic experimentation framework**: Provides structured approach to testing and refining go-to-market strategies
- **Developer-first integration**: API-only design enables seamless integration into existing workflows and tools
- **Pre-sales stage optimization**: Specifically designed for founders still discovering their ICP and sales process
- **Intelligent context orchestration**: Automatically manages data requirements and context across endpoints
- **Iterative refinement**: Built-in correction capabilities for improving AI-generated outputs

## 3. Goals and objectives

### Primary objectives

- **Generate 0-90% quality benchmark campaigns**: Deliver expert-level go-to-market assets that require minimal refinement
- **Enable systematic GTM experimentation**: Provide structured frameworks for testing positioning, messaging, and targeting approaches
- **Reduce time-to-market for B2B founders**: Accelerate the transition from product development to systematic sales execution
- **Democratize expert GTM knowledge**: Make sophisticated go-to-market strategies accessible to resource-constrained startups
- **Provide actionable implementation guidance**: Bridge the gap between insights and execution with specific tool recommendations

### Success metrics

- Campaign quality score achievement of 85%+ based on expert evaluation criteria
- API response time under 30 seconds for individual endpoint calls
- User adoption rate of 60%+ for generated campaign assets in actual outreach
- 90%+ API uptime and reliability for production workloads
- Context orchestration accuracy of 90%+ for automatic data fetching
- Correction success rate of 80%+ for user refinements

### Business objectives

- Establish market position as the definitive GTM intelligence API for early-stage B2B companies
- Create scalable revenue model through API usage-based pricing
- Build foundation for future GTM automation and analytics products
- Capture market share through superior context management and user experience

## 4. Target audience

### Primary users

**Pre-Seed to Series A B2B founders**

- Company stage: Pre-first sales hire (solo founder to 5-person teams)
- Technical proficiency: Comfortable with API integration or working with technical co-founders
- Pain points: Lack expert GTM guidance, limited budget for consulting, need systematic approach to sales
- Use cases: Establishing initial positioning, creating first outreach campaigns, defining ICP criteria

### Secondary users

**Technical co-founders and early engineering hires**

- Role: Implementing GTM tools and integrations for founding team
- Technical needs: Clean API documentation, structured JSON responses, reliable service
- Integration scenarios: Building internal tools, connecting to existing CRM/email systems

### User personas

**Alex - Solo B2B SaaS Founder**

- Background: Former engineer, first-time founder
- Challenge: Knows product inside-out but struggles with positioning and messaging
- Goal: Generate professional outreach campaigns without hiring expensive consultants

**Sarah - Technical Co-founder**

- Background: CTO at pre-Series A startup
- Challenge: Founding team needs GTM assets but lacks marketing expertise
- Goal: Integrate AI-generated campaigns into existing sales workflow tools

## 5. Features and requirements

### Core features

#### 5.1 Input processing engine

- **Website URL analysis** (required): Automated extraction and processing of company website content, value propositions, and positioning statements using Firecrawl.dev API (handles dynamic content, JS, and media)
- **ICP description parsing** (optional): Natural language processing of free-form ideal customer profile descriptions when provided by user
- **ICP inference**: Automated generation of ideal customer profile when not provided, based on website analysis and market positioning
- **Content vectorization**: ChromaDB storage for semantic search and retrieval-augmented generation
- **Smart context orchestration**: Intelligent assessment of context quality and automatic data fetching when needed

#### 5.2 AI agent orchestration

- **Multi-step workflow management**: Coordinated agent processing for complex campaign generation tasks
- **Prompt template system**: Structured Pydantic output parsers ensuring consistent, high-quality responses
- **Context retention**: Cross-step context management for coherent campaign generation
- **Quality evaluation**: LLM-assisted scoring and validation of generated content
- **Circuit breaker pattern**: Robust failover mechanisms for LLM provider reliability
- **Output validation**: Advanced error recovery and JSON parsing with correction strategies

#### 5.3 Campaign asset generation (Enhanced Modular Architecture)

The API provides modular endpoints for generating specific campaign assets independently, enabling flexible integration and frontend development. Each asset can be requested separately or in combination based on user needs.

**Core Endpoints:**
- `/campaigns/product_overview`: Company product analysis and feature extraction
- `/campaigns/target_company`: Target company profile and buying signals 
- `/campaigns/target_persona`: Primary decision-maker persona analysis
- `/campaigns/positioning`: Positioning canvas and value propositions
- `/campaigns/email`: Email campaign sequences and personalization
- `/campaigns/enrichment_sources`: Data source recommendations and implementation guidance

**Enhanced Endpoints:**
- `/campaigns/correct`: User correction and refinement system
- `/campaigns/usecasefit`: Use case analysis and workflow integration

**Input Schema (Universal):**
All endpoints support:
- **Required**: `website_url`
- **Optional**: `user_inputted_context` (user-provided context)
- **Optional**: `llm_inferred_context` (output from previous endpoints for chaining)

**Smart Context Management:**
- Automatic context quality assessment
- Intelligent data fetching when context is insufficient
- Transparent feedback on data sources and confidence levels

#### 5.4 External integrations

- **Web scraping capabilities**: Firecrawl.dev API for comprehensive website analysis (chosen for dynamic content support, reliability, and fast integration; architecture allows future migration to in-house scraping if needed)
- **Search integration**: Bing Search API for market research and competitive intelligence
- **Tech stack detection**: Clearbit/Apollo API integration for technographic enrichment
- **LLM service management**: Multi-provider support (OpenAI GPT-4, Anthropic Claude) with fallback mechanisms
- **Data enrichment sources**: Integration recommendations for 20+ data providers and APIs

### Technical requirements

#### 5.5 API specifications (Enhanced)

- **RESTful API design**: Standard HTTP methods with JSON request/response format
- **Modular endpoint structure**: Decomposed endpoints for specific business functions
- **Composable context**: Intelligent context chaining and orchestration
- **Extensible architecture**: New endpoints can be added with minimal impact
- **Streaming responses**: Real-time updates for long-running campaign generation processes
- **Rate limiting**: Robust, per-API-key rate limiting enforced on all endpoints, with configurable hourly and daily limits based on API key tier (free, paid, enterprise). All responses include standard rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`). Exceeding limits returns HTTP 429 with a `Retry-After` header. Admin/test users may be exempt. All rate limit events are logged for analytics and monitoring.
- **Comprehensive error handling**: Detailed error responses with actionable guidance
- **Frontend-ready architecture**: API design optimized for eventual frontend integration
- **Correction system**: Built-in refinement and improvement capabilities

#### 5.6 Data management

- **Vector storage**: ChromaDB integration for semantic search and RAG operations
- **Relational database**: SQLite (development) / PostgreSQL (production) for structured data
- **Content caching**: Intelligent caching of website analysis and generated assets
- **Data retention**: Configurable retention policies for user data and generated campaigns
- **Context persistence**: Efficient cross-endpoint context storage and retrieval

#### 5.7 Reliability and performance

- **Circuit breaker pattern**: LLM provider failover and reliability management
- **Output validation**: Advanced JSON parsing with error recovery
- **Performance optimization**: Response time targets under 30 seconds per endpoint
- **Quality assurance**: Systematic validation and confidence scoring
- **Monitoring**: Comprehensive observability and health checking

## Context Assessment and Orchestration (v2.1)

All campaign generation endpoints now use a unified, intelligent context assessment flow:

- **Order of Precedence:**
  1. User-provided context (if present and sufficient)
  2. LLM-inferred context (if present and sufficient)
  3. Website content (scraped and processed only if above are insufficient)
- **Sufficiency is endpoint-specific:**
  - Each endpoint (e.g., product_overview, target_company, target_persona) defines its own required fields and minimum confidence/quality thresholds.
  - The Context Orchestrator enforces these requirements using its readiness logic.
- **Benefits:**
  - Reduces unnecessary scraping and LLM calls
  - Enables chaining of endpoint outputs
  - Provides a consistent, user-friendly experience
  - Makes the system extensible and robust

This design is now a core part of the smart context orchestration system and applies to all endpoints. See ARCHITECTURE.md for implementation details.

## 6. Enhanced user stories and acceptance criteria

### Authentication and access management

**ST-101: API key authentication**
As a developer integrating Blossomer GTM API, I want to authenticate using API keys so that I can securely access the service.

*Acceptance criteria:*
- API key can be generated through developer portal
- All API requests require valid API key in Authorization header
- Invalid API keys return 401 Unauthorized with clear error message
- API key usage is tracked for billing and rate limiting

**ST-102: Rate limiting enforcement**
As a platform administrator, I want to enforce rate limits per API key so that service quality is maintained for all users.

*Acceptance criteria:*
- Rate limits are enforced based on API key tier
- Rate limit headers are included in all responses
- 429 Too Many Requests is returned when limits are exceeded
- Rate limit resets are clearly communicated
- Rate limiting logic is consistent across all endpoints
- Exemptions for admin/test users are respected
- Rate limit events are logged for analytics/monitoring
- Rate limiting is documented in API docs and developer portal

### Enhanced campaign generation workflow

**ST-103: Website URL processing with smart context**
As a B2B founder, I want to submit my website URL and have the system intelligently gather all necessary context automatically.

*Acceptance criteria:*
- API accepts valid website URLs as the only required input parameter
- System automatically assesses context quality and fetches additional data as needed
- Context orchestration provides transparent feedback on data sources used
- Invalid URLs return 400 Bad Request with specific error details
- Processed website data is available for all subsequent campaign generation requests

**ST-104: Product overview generation**
As a B2B founder, I want to generate a comprehensive product overview from my website so I can understand how my product is positioned.

*Acceptance criteria:*
- Product overview can be generated via `/campaigns/product_overview` endpoint
- Output includes product description, key features, company profiles, persona profiles, use cases, pain points, and pricing
- Customer profiles are extracted from testimonials and case studies
- Use cases and pain points are extracted from explicit mentions on the website
- Technology stack and competitive context are identified
- Confidence scoring indicates data quality and gaps

**ST-105: Target company analysis**
As a B2B founder, I want to generate detailed target company profiles so I can identify ideal prospects.

*Acceptance criteria:*
- Target company analysis available via `/campaigns/target_company` endpoint
- Output includes firmographic criteria, qualifying signals, and buying signals
- Disqualifying criteria are clearly identified
- Growth indicators and technology requirements are specified
- Implementation guidance for prospect identification is provided

**ST-106: Target persona development**
As a B2B founder, I want to create detailed buyer personas so I can tailor my messaging effectively.

*Acceptance criteria:*
- Primary persona analysis available via `/campaigns/target_persona` endpoint
- Output includes role characteristics, professional signals, and behavioral indicators
- Buying journey stages and decision criteria are mapped
- Pain points and motivations are clearly articulated
- Communication preferences and evaluation process are documented

**ST-107: Buying committee mapping**
As a B2B founder, I want to understand the complete buying committee so I can multi-thread my sales process.

*Acceptance criteria:*
- Output includes all buying committee members with influence levels
- Decision flow and consensus requirements are mapped
- Messaging strategy for each stakeholder is provided
- Influence dynamics and relationship mapping included

**ST-108: Correction and refinement system**
As a B2B founder, I want to correct and refine AI-generated outputs so I can improve accuracy over time.

*Acceptance criteria:*
- Correction capabilities available via `/campaigns/correct` endpoint
- Support for field-specific, section-wide, and global corrections
- AI-assisted improvement based on user guidance
- Preservation of specified fields during regeneration
- Confidence impact assessment for corrections

**ST-109: Enrichment source recommendations**
As a B2B founder, I want specific recommendations for data sources and APIs so I can implement the targeting strategies.

*Acceptance criteria:*
- Enrichment recommendations available via `/campaigns/enrichment_sources` endpoint
- Specific APIs and tools recommended for each targeting attribute
- Cost estimates and implementation difficulty provided
- Step-by-step workflow for data enrichment included
- Alternative approaches and validation methods suggested

### Context orchestration and intelligence

**ST-110: Smart context assessment**
As a developer, I want the API to automatically assess context quality so I don't need to manage data requirements manually.

*Acceptance criteria:*
- System automatically evaluates available context for each endpoint
- Missing or insufficient context triggers automatic data fetching
- Transparent feedback on data sources and confidence levels
- Graceful degradation when required data cannot be obtained
- User override options for forcing refresh or skipping data fetching

**ST-111: Context chaining optimization**
As a developer, I want efficient context passing between endpoints so I can build complex workflows.

*Acceptance criteria:*
- Context from previous endpoints automatically enhances subsequent calls
- Optimal data reuse reduces redundant processing and costs
- Clear documentation of context dependencies and requirements
- Versioned context schemas for backwards compatibility
- Performance optimization through intelligent caching

### Error handling and reliability

**ST-112: Advanced error recovery**
As a developer, I want comprehensive error handling so my applications can gracefully handle failures.

*Acceptance criteria:*
- LLM provider failures trigger automatic failover to backup providers
- JSON parsing errors include correction attempts and suggestions
- Network timeouts are handled with appropriate retry logic
- Detailed error responses include resolution guidance and error codes
- Circuit breaker pattern prevents cascading failures

**ST-113: Output validation and quality assurance**
As a platform administrator, I want systematic output validation so users receive high-quality results.

*Acceptance criteria:*
- All LLM outputs are validated against expected schemas
- Malformed JSON is automatically corrected when possible
- Confidence scoring indicates output quality and reliability
- Quality thresholds trigger regeneration when necessary
- User feedback mechanisms improve validation over time

## 7. Technical requirements / Stack

### Backend architecture

**Programming language and framework**
- Python 3.11+ for modern language features and performance
- FastAPI for high-performance API development with automatic documentation
- Pydantic for data validation and serialization
- Uvicorn ASGI server for production deployment

**AI and machine learning**
- OpenAI GPT-4 API for primary language model capabilities
- Anthropic Claude API for backup language model and comparison
- Advanced prompt templating system with Jinja2
- ChromaDB for vector storage and semantic search operations
- Multi-provider LLM abstraction with circuit breaker pattern

**Data storage and management**
- SQLite for development environment and testing
- PostgreSQL for production deployment
- ChromaDB for vector embeddings and retrieval-augmented generation
- Redis for caching and session management (production)
- Intelligent content preprocessing pipeline

**External integrations**
- Firecrawl.dev API for comprehensive website scraping
- Bing Search API for market research and competitive intelligence
- Clearbit API for company and technographic data enrichment
- Apollo API for additional B2B data and contact information
- 20+ data enrichment source integrations

### Infrastructure and deployment

**Containerization and deployment**
- Docker for containerized application deployment
- Render or Railway for managed hosting and scaling
- GitHub Actions for CI/CD pipeline automation
- Environment-specific configuration management

**Security and monitoring**
- API key authentication with robust, per-key rate limiting (see above)
- HTTPS enforcement for all API endpoints
- Structured logging with request/response tracking
- Error monitoring and alerting system
- Circuit breaker monitoring and health checks

### Development and testing

**Environment and dependency management**
- Poetry 2.1.3 for Python dependency and environment management
- Virtual environment isolation and reproducible builds
- Development container support for consistent environments

**Code quality and testing**
- Pytest for comprehensive unit and integration testing
- Black for code formatting and style consistency
- MyPy for static type checking
- Pre-commit hooks for code quality enforcement
- Test-driven development for critical components

**Documentation and API design**
- FastAPI automatic OpenAPI/Swagger documentation
- Structured JSON schemas for all API responses
- Comprehensive API documentation with examples
- Version management for API backwards compatibility

### Performance and scalability

**Performance requirements**
- Individual endpoint response time under 30 seconds
- Support for concurrent request processing
- Efficient caching of frequently accessed data
- Optimized vector similarity search performance
- Context orchestration overhead under 5 seconds

**Scalability considerations**
- Horizontal scaling support through stateless architecture
- Database connection pooling for efficient resource utilization
- Queue-based processing for long-running operations
- Load balancing for high-availability deployment
- Microservices-ready modular architecture

## 8. Enhanced API Design

### Endpoint Architecture

**Core Business Endpoints:**
- `/campaigns/product_overview` - Foundation product analysis
- `/campaigns/target_company` - Company targeting and signals
- `/campaigns/target_persona` - Primary buyer persona
- `/campaigns/positioning` - Positioning and value props
- `/campaigns/email` - Email sequences and messaging
- `/campaigns/enrichment_sources` - Implementation guidance

**System Endpoints:**
- `/campaigns/correct` - Output correction and refinement
- `/health` - System health and provider status
- `/usage` - API usage and billing information

### Response Architecture

**Unified Response Structure:**
```json
{
  "success": true,
  "data": {
    // Endpoint-specific response data
  },
  "metadata": {
    "endpoint": "target_company",
    "sources_used": ["website_scraper", "market_research"],
    "context_quality": "high",
    "processing_time": "12.3s",
    "confidence_level": {
      "overall": "High",
      "data_gaps": []
    }
  }
}
```

**Error Response Structure:**
```json
{
  "success": false,
  "error": {
    "error_code": "CONTEXT_INSUFFICIENT",
    "message": "Unable to gather sufficient website content",
    "details": {
      "field_errors": {},
      "retry_after": "60s"
    },
    "suggestion": "Check website accessibility or provide additional context"
  },
  "metadata": {
    "endpoint": "target_company",
    "processing_time": "5.2s"
  }
}
```

### Context Management

**Context Orchestration Flow:**
1. **Assessment**: Evaluate existing context quality
2. **Planning**: Determine required data sources
3. **Fetching**: Execute data gathering plan
4. **Validation**: Verify context completeness
5. **Processing**: Generate campaign assets

**Context Types:**
- `website_content`: Scraped and processed website data
- `product_overview`: Product features and positioning
- `icp_analysis`: Target customer profiles
- `user_provided`: User-supplied context and corrections
- `market_research`: External market and competitive data

## 9. Design and user interface

### API design principles

**Modular, composable architecture**
- Atomic endpoints for specific business functions
- Intelligent context orchestration across endpoints
- Consistent input/output schemas with extensible metadata

**Response structure consistency**
All API responses follow consistent JSON schemas with standardized error handling, metadata inclusion, and clear data hierarchies. Response structures are designed for programmatic consumption while remaining human-readable for debugging and development.

**Smart defaults with user control**
- Automatic context management with override capabilities
- Intelligent data fetching with transparent feedback
- Progressive enhancement of outputs through user corrections

### Documentation and developer experience

**Aesthetic and tone**
The API documentation and developer resources adopt a GitHub/AWS Console aesthetic - clean, functional, and developer-friendly. The design prioritizes information density and systematic organization over visual flourishes, reflecting the product's focus on practical utility.

**Copy and messaging**
Documentation maintains a professional but approachable tone, providing confident guidance while acknowledging the systematic nature of go-to-market strategy development. Technical explanations are clear and actionable, avoiding jargon while maintaining precision.

### Integration considerations

Response formats are optimized for integration with common B2B tools and workflows, including:
- Placeholder formatting for personalization engines
- Export compatibility for email platforms and CRM systems
- Structured data for workflow automation tools
- API-first design enabling custom frontend development

### Error handling and feedback

**Clear error communication**
Error responses provide specific, actionable guidance for resolution while maintaining the professional tone. Error messages include relevant context, suggested corrections, and links to documentation resources.

**Progress indication**
For long-running operations, the API provides clear progress indication through streaming responses and status endpoints, allowing client applications to provide meaningful feedback to end users.

**Quality transparency**
All responses include confidence levels and data source transparency, enabling users to make informed decisions about output reliability and areas for improvement.

## Context Quality & Endpoint Readiness Criteria

To ensure high-quality, actionable campaign assets, the Blossomer GTM API enforces endpoint-specific context requirements and quality thresholds. The system automatically assesses the provided context and, if necessary, fetches additional data or returns actionable feedback to the user.

### Why This Matters

- **Founder Reality:** Early-stage founders often provide features but lack clear positioning or targeting.
- **Progressive Quality:** Each endpoint builds on previous context, ensuring outputs are reliable and actionable.
- **Actionable Feedback:** Users receive specific guidance on what's missing and how to improve their input.

### Endpoint Readiness Criteria

| Endpoint                      | Required Context                        | Min. Confidence | Notes/Logic                                                                 |
|-------------------------------|-----------------------------------------|-----------------|----------------------------------------------------------------------------|
| `/campaigns/product_overview` | Basic product description + 2-3 features| 0.5             | Can work without clear value prop                                           |
| `/campaigns/target_company`   | Any B2B indicator + problem space       | 0.4             | Will infer from features if targeting unclear                              |
| `/campaigns/target_persona`   | Department/function + problems addressed| 0.4             | Will infer seniority from feature complexity                               |
| `/campaigns/positioning`      | Comprehensive feature list + problems   | 0.5             | Creates positioning, doesn't just extract                                  |
| `/campaigns/email`            | Features + basic problem/solution fit   | 0.5             | Transforms features → benefits automatically                               |

#### Example Error Response

```json
{
  "error": "Insufficient content quality for product overview",
  "quality_assessment": "low",
  "confidence": 0.4,
  "missing_requirements": ["Product features", "Pricing information"],
  "recommendations": {
    "immediate_actions": ["Add product features section"],
    "data_enrichment": ["Enable website crawling"],
    "user_input_needed": ["Target market definition"]
  }
}
```

---

## Changelog

### Version 2.0 (Current) - Major Architecture Enhancement

#### 🎯 **New Features**
- **Smart Context Orchestration**: Automatic context quality assessment and intelligent data fetching
- **Product Overview Endpoint**: `/campaigns/product_overview` for comprehensive product analysis
- **ICP Decomposition**: Separate endpoints for target company, persona, and buying committee analysis
- **Correction System**: `/campaigns/correct` for user-driven output refinement
- **Enrichment Sources**: `/campaigns/enrichment_sources` for actionable implementation guidance

#### 🏗️ **Architecture Improvements**
- **Enhanced LLM Abstraction**: Circuit breaker pattern with advanced failover logic
- **Output Validation**: Robust JSON parsing with error recovery and correction attempts
- **Context Management**: Intelligent context chaining and quality assessment across endpoints
- **Performance Optimization**: Response time targets and caching strategies
- **Reliability Enhancement**: Comprehensive error handling and monitoring

#### 📊 **Endpoint Changes**
- **Added**: `/campaigns/product_overview` - Product analysis and feature extraction
- **Added**: `/campaigns/target_company` - Company profile and buying signals
- **Added**: `/campaigns/target_persona` - Primary decision-maker analysis
- **Added**: `/campaigns/correct` - Output correction and refinement
- **Added**: `/campaigns/enrichment_sources` - Data source recommendations
- **Modified**: All endpoints now support enhanced context orchestration

#### 🔧 **Technical Enhancements**
- **LLM Provider Management**: Multi-provider support with intelligent failover
- **Prompt Engineering**: Advanced template system with Jinja2 and validation
- **Content Processing**: Enhanced website analysis with smart preprocessing
- **Data Sources**: Integration with 20+ enrichment providers and APIs
- **Quality Assurance**: Systematic validation and confidence scoring
- **Rate limiting**: Per-API-key, tier-based rate limiting with standard headers and analytics logging

#### 📈 **Performance & Reliability**
- **Response Times**: Individual endpoints under 30 seconds (improved from full campaign generation)
- **Error Recovery**: Advanced JSON parsing with automatic correction attempts
- **Context Efficiency**: Reduced redundant processing through smart caching
- **Monitoring**: Comprehensive observability and health checking

#### 🎨 **User Experience**
- **Transparent Processing**: Clear feedback on data sources and confidence levels
- **Iterative Refinement**: Built-in correction capabilities for continuous improvement
- **Implementation Guidance**: Actionable recommendations for data enrichment and targeting
- **Flexible Integration**: Atomic endpoints enable custom workflows and frontend development

#### 💼 **Business Impact**
- **Reduced Time-to-Value**: Faster individual endpoint responses enable quicker iteration
- **Increased Accuracy**: Correction system and context orchestration improve output quality
- **Enhanced Adoption**: Implementation guidance bridges gap between insights and execution
- **Competitive Differentiation**: Smart context management unique in market

### Version 1.0 (Previous) - Initial Release

#### 🎯 **Core Features**
- Website URL analysis with Firecrawl.dev integration
- AI-powered ICP inference and generation
- Modular campaign asset generation
- Basic prompt templating and LLM integration

#### 📊 **Original Endpoints**
- `/campaigns/icp` - Consolidated ideal customer profile generation (deprecated)
- `/campaigns/positioning` - Positioning canvas and value propositions
- `/campaigns/email` - Email campaign sequences
- `/campaigns/usecasefit` - Use case analysis

#### 🔧 **Technical Foundation**
- FastAPI framework with automatic documentation
- OpenAI GPT-4 integration with basic error handling
- ChromaDB for vector storage and semantic search
- Basic website scraping and content processing

---

*Document version: 2.0*  
*Last updated: January 2025*  
*Document owner: Product Management*