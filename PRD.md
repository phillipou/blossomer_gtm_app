# Blossomer GTM API - Product Requirements Document

## 1. Introduction

This Product Requirements Document (PRD) outlines the specifications for the Blossomer GTM API, an AI-powered go-to-market campaign generator specifically designed for B2B founders. The document serves as a comprehensive guide for the development team, defining the functional requirements, technical architecture, and user experience expectations for building this API-first solution.

The Blossomer GTM API aims to democratize expert-level go-to-market strategy and execution for early-stage B2B companies that lack the resources for full-service consulting but need systematic, actionable guidance to establish their initial sales playbook and positioning.

## 2. Product overview

The Blossomer GTM API is a developer-focused, AI-powered service that transforms minimal input (website URL and ICP description) into comprehensive go-to-market campaign assets. The product leverages advanced AI agent orchestration to analyze company positioning, generate targeted messaging, and provide structured data enrichment guidance.

Unlike traditional marketing automation tools that focus on campaign execution, Blossomer emphasizes strategic foundation-building through systematic experimentation and expert-level guidance delivered via structured API responses. The product operates on a "0-90% philosophy" - providing founders with 90% complete, expert-quality campaigns that require minimal refinement rather than starting from scratch.

### Key value propositions

- **Expert GTM guidance without consultant costs**: Delivers strategic insights typically available only through expensive consulting engagements
- **Systematic experimentation framework**: Provides structured approach to testing and refining go-to-market strategies
- **Developer-first integration**: API-only design enables seamless integration into existing workflows and tools
- **Pre-sales stage optimization**: Specifically designed for founders still discovering their ICP and sales process

## 3. Goals and objectives

### Primary objectives

- **Generate 0-90% quality benchmark campaigns**: Deliver expert-level go-to-market assets that require minimal refinement
- **Enable systematic GTM experimentation**: Provide structured frameworks for testing positioning, messaging, and targeting approaches
- **Reduce time-to-market for B2B founders**: Accelerate the transition from product development to systematic sales execution
- **Democratize expert GTM knowledge**: Make sophisticated go-to-market strategies accessible to resource-constrained startups

### Success metrics

- Campaign quality score achievement of 85%+ based on expert evaluation criteria
- API response time under 30 seconds for complete campaign generation
- User adoption rate of 60%+ for generated campaign assets in actual outreach
- 90%+ API uptime and reliability for production workloads

### Business objectives

- Establish market position as the definitive GTM intelligence API for early-stage B2B companies
- Create scalable revenue model through API usage-based pricing
- Build foundation for future GTM automation and analytics products

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

#### 5.2 AI agent orchestration

- **Multi-step workflow management**: LangGraph-powered agent coordination for complex campaign generation tasks
- **Prompt template system**: Structured Pydantic output parsers ensuring consistent, high-quality responses
- **Memory persistence**: Cross-step context retention for coherent campaign generation
- **Quality evaluation**: LLM-assisted scoring and validation of generated content

#### 5.3 Campaign asset generation

The API provides modular endpoints for generating specific campaign assets independently, enabling flexible integration and frontend development. Each asset can be requested separately or in combination based on user needs.

**Positioning Canvas (JSON Output)**

- Endpoint: `/campaigns/positioning`
- One-paragraph "why us / why now" summary with market timing and competitive differentiation
- Three unique value propositions specifically tailored to ICP characteristics (user-provided or inferred)
- Structured data format enabling programmatic usage and modification
- Metadata indicating whether ICP was user-provided or AI-inferred

**Email Campaign Pack (JSON Output)**

- Endpoint: `/campaigns/email`
- Three optimized subject line variations with A/B testing recommendations
- Two-step email sequence: initial outreach with value-focused messaging and strategic follow-up
- Professional but approachable tone calibrated for B2B decision-makers
- Personalization placeholders for dynamic content insertion

**Enrichment Blueprint (JSON Output)**

- Endpoint: `/campaigns/enrichment`
- Firmographic data points for lead qualification (company size, industry, revenue)
- Technographic data points for targeting (tech stack, tools, integrations)
- Personalization data points for outreach customization (recent news, job changes, company updates)

**Complete Campaign Package**

- Endpoint: `/campaigns/complete`
- Single request returning all three asset types in structured response
- Optimized for scenarios requiring full campaign generation
- Maintains individual asset structure within combined response

#### 5.4 External integrations

- **Web scraping capabilities**: Firecrawl.dev API for comprehensive website analysis (chosen for dynamic content support, reliability, and fast integration; architecture allows future migration to in-house scraping if needed)
- **Search integration**: Bing Search API for market research and competitive intelligence
- **Tech stack detection**: Clearbit/Apollo API integration for technographic enrichment
- **LLM service management**: Multi-provider support (OpenAI GPT-4, Anthropic Claude) with fallback mechanisms

### Technical requirements

#### 5.5 API specifications

- **RESTful API design**: Standard HTTP methods with JSON request/response format
- **Modular endpoint structure**: Separate endpoints for each campaign asset type enabling flexible frontend integration
- **Streaming responses**: Real-time updates for long-running campaign generation processes
- **Rate limiting**: Configurable throttling to manage API usage and costs
- **Error handling**: Comprehensive error responses with actionable guidance
- **Frontend-ready architecture**: API design optimized for eventual frontend integration with consistent response schemas

#### 5.6 Data management

- **Vector storage**: ChromaDB integration for semantic search and RAG operations
- **Relational database**: SQLite (development) / PostgreSQL (production) for structured data
- **Content caching**: Intelligent caching of website analysis and generated assets
- **Data retention**: Configurable retention policies for user data and generated campaigns

## 6. User stories and acceptance criteria

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

### Campaign generation workflow

**ST-103: Website URL processing**
As a B2B founder, I want to submit my website URL so that the API can analyze my company's positioning and messaging.

*Acceptance criteria:*

- API accepts valid website URLs as the only required input parameter
- Website content is scraped and processed within 15 seconds
- Extracted content is stored in vector database for retrieval
- Invalid URLs return 400 Bad Request with specific error details
- Processed website data is available for all subsequent campaign generation requests

**ST-104: ICP description processing (optional)**
As a B2B founder, I want to optionally provide my ideal customer profile description so that generated campaigns use my specific targeting rather than inferred ICP.

*Acceptance criteria:*

- API accepts optional free-form text descriptions of ideal customers
- When provided, user ICP description takes precedence over inferred ICP
- User-provided ICP is parsed and structured for campaign generation
- All generated assets include metadata indicating ICP source (user-provided vs. inferred)

**ST-104b: ICP inference**
As a B2B founder, I want the API to infer my ideal customer profile from my website when I don't provide one, so that I can still generate targeted campaigns.

*Acceptance criteria:*

- API automatically generates ICP when not provided by user
- Inferred ICP is based on website analysis, positioning, and market context
- Generated ICP includes confidence score and reasoning
- All campaign assets clearly indicate when ICP was AI-inferred rather than user-provided

**ST-105: Positioning canvas generation**
As a B2B founder, I want to generate a positioning canvas independently so that I can focus on messaging framework development.

*Acceptance criteria:*

- Positioning canvas can be generated via dedicated `/campaigns/positioning` endpoint
- Canvas includes one-paragraph "why us / why now" summary
- Three unique value propositions are generated based on ICP (user-provided or inferred)
- Output includes metadata indicating ICP source and confidence level
- Generated content maintains professional tone while being approachable

**ST-106: Email campaign pack generation**
As a B2B founder, I want to generate email campaign assets independently so that I can focus specifically on outreach content.

*Acceptance criteria:*

- Email pack can be generated via dedicated `/campaigns/email` endpoint
- Email pack includes three optimized subject line variations
- Two-step email sequence is generated (initial outreach + follow-up)
- Content is personalized based on ICP characteristics (user-provided or inferred)
- Email templates include placeholder tags for dynamic personalization

**ST-107: Enrichment blueprint generation**
As a B2B founder, I want to generate data enrichment guidance independently so that I can focus on lead qualification strategy.

*Acceptance criteria:*

- Blueprint can be generated via dedicated `/campaigns/enrichment` endpoint
- Blueprint includes firmographic data points for lead qualification
- Technographic data points are provided for targeting
- Personalization data points are specified for outreach customization
- All data points include source recommendations and collection methods

**ST-107b: Complete campaign package generation**
As a B2B founder, I want to generate all campaign assets in a single request so that I can get comprehensive GTM guidance efficiently.

*Acceptance criteria:*

- Complete package can be generated via `/campaigns/complete` endpoint
- Response includes all three asset types (positioning, email, enrichment)
- Individual asset structure is maintained within combined response
- Single request optimizes processing time compared to separate requests
- Response format supports easy extraction of individual asset components

### API response management

**ST-108: Streaming response handling**
As a developer, I want to receive streaming updates during campaign generation so that I can provide real-time feedback to users.

*Acceptance criteria:*

- Long-running operations support server-sent events streaming
- Progress updates are sent at key workflow milestones
- Streaming connection handles network interruptions gracefully
- Final response includes complete campaign assets in structured format

**ST-109: Error handling and recovery**
As a developer, I want comprehensive error responses so that I can handle failures appropriately in my application.

*Acceptance criteria:*

- All errors return appropriate HTTP status codes
- Error responses include detailed error messages and resolution guidance
- Transient failures are distinguished from permanent errors
- Retry-able operations include appropriate retry-after headers

### Data management and persistence

**ST-110: Campaign storage and retrieval**
As a B2B founder, I want my generated campaigns to be stored so that I can retrieve them later for reference and iteration.

*Acceptance criteria:*

- Generated campaigns are stored with unique identifiers
- Campaigns can be retrieved using campaign ID
- Campaign metadata includes generation timestamp and input parameters
- Storage retention follows configured data retention policies

**ST-111: Website content caching**
As a platform administrator, I want website content to be cached so that repeated analysis is efficient and cost-effective.

*Acceptance criteria:*

- Website content is cached after initial scraping
- Cache expiration is configurable based on content type
- Cached content is used for subsequent requests to same domain
- Cache invalidation is supported for forced refresh scenarios

### Database modeling

**ST-112: User data modeling**
As a platform administrator, I want user data to be properly modeled so that API usage can be tracked and managed effectively.

*Acceptance criteria:*

- Users table stores basic user information and API key associations
- API usage is tracked per user for billing and analytics
- User data relationships support multiple API keys per user
- Data model supports user tier management and access control

**ST-113: Campaign data modeling**
As a platform administrator, I want campaign data to be properly modeled so that generated assets can be stored, retrieved, and analyzed efficiently.

*Acceptance criteria:*

- Campaigns table stores generated campaign assets and metadata
- Website_Content table stores scraped and processed website information
- Vector_Embeddings table integrates with ChromaDB for semantic search
- Database schema supports efficient querying and reporting

### Edge cases and error scenarios

**ST-114: Invalid website handling**
As a developer, I want appropriate error handling for invalid websites so that my application can respond appropriately.

*Acceptance criteria:*

- Inaccessible websites return 422 Unprocessable Entity
- Websites with no relevant content return structured error response
- Protected/login-required websites are handled gracefully
- Error responses include specific failure reasons and suggested alternatives

**ST-115: LLM service failure handling**
As a platform administrator, I want LLM service failures to be handled gracefully so that service availability is maintained.

*Acceptance criteria:*

- Multiple LLM providers are configured with automatic failover
- Service degradation responses are returned when all providers fail
- Failed requests are queued for retry with exponential backoff
- Service status endpoints indicate LLM provider availability

## 7. Technical requirements / Stack

### Backend architecture

**Programming language and framework**

- Python 3.11+ for modern language features and performance
- FastAPI for high-performance API development with automatic documentation
- Pydantic for data validation and serialization
- Uvicorn ASGI server for production deployment

**AI and machine learning**

- LangChain framework for LLM application development and prompt management
- LangGraph for complex agent orchestration and workflow management
- OpenAI GPT-4 API for primary language model capabilities
- Anthropic Claude API for backup language model and comparison
- ChromaDB for vector storage and semantic search operations

**Data storage and management**

- SQLite for development environment and testing
- PostgreSQL for production deployment via Supabase integration
- ChromaDB for vector embeddings and retrieval-augmented generation
- Redis for caching and session management (production)

**External integrations**

- BeautifulSoup4 + Requests for web scraping and content extraction
- Bing Search API for market research and competitive intelligence
- Clearbit API for company and technographic data enrichment
- Apollo API for additional B2B data and contact information

### Infrastructure and deployment

**Containerization and deployment**

- Docker for containerized application deployment
- Render or Railway for managed hosting and scaling
- GitHub Actions for CI/CD pipeline automation
- Environment-specific configuration management

**Security and monitoring**

- API key authentication with rate limiting
- HTTPS enforcement for all API endpoints
- Structured logging with request/response tracking
- Error monitoring and alerting system

### Development and testing

**Environment and dependency management**

- Poetry 2.1.3 is used for all Python dependency and environment management. All contributors should install Poetry (https://python-poetry.org/docs/#installation) and use it for adding/removing dependencies and managing virtual environments. See the README for setup instructions.

**Code quality and testing**

- Pytest for comprehensive unit and integration testing
- Black for code formatting and style consistency
- MyPy for static type checking
- Pre-commit hooks for code quality enforcement

**Documentation and API design**

- FastAPI automatic OpenAPI/Swagger documentation
- Structured JSON schemas for all API responses
- Comprehensive API documentation with examples
- Version management for API backwards compatibility

### Performance and scalability

**Performance requirements**

- API response time under 30 seconds for complete campaign generation
- Support for concurrent request processing
- Efficient caching of frequently accessed data
- Optimized vector similarity search performance

**Scalability considerations**

- Horizontal scaling support through stateless architecture
- Database connection pooling for efficient resource utilization
- Queue-based processing for long-running operations
- Load balancing for high-availability deployment

## 8. Design and user interface

### API design principles

**Developer-first approach**
The Blossomer GTM API prioritizes developer experience through clean, predictable API design that follows RESTful conventions and provides comprehensive documentation. The interface emphasizes clarity and systematic organization, reflecting the product's utilitarian aesthetic.

**Response structure consistency**
All API responses follow consistent JSON schemas with standardized error handling, metadata inclusion, and clear data hierarchies. Response structures are designed for programmatic consumption while remaining human-readable for debugging and development.

### Documentation and developer experience

**Aesthetic and tone**
The API documentation and developer resources adopt a GitHub/AWS Console aesthetic - clean, functional, and developer-friendly. The design prioritizes information density and systematic organization over visual flourishes, reflecting the product's focus on practical utility.

**Copy and messaging**
Documentation maintains a professional but approachable tone, providing confident guidance while acknowledging the systematic nature of go-to-market strategy development. Technical explanations are clear and actionable, avoiding jargon while maintaining precision.

### JSON response schemas

**Structured output format**
All generated campaign assets are returned as structured JSON with consistent field naming, data types, and hierarchical organization. Schemas include metadata fields for generation parameters, quality scores, and usage recommendations.

**Integration considerations**
Response formats are optimized for integration with common B2B tools and workflows, including placeholder formatting for personalization, export compatibility for email platforms, and structured data for CRM integration.

### Error handling and feedback

**Clear error communication**
Error responses provide specific, actionable guidance for resolution while maintaining the professional tone. Error messages include relevant context, suggested corrections, and links to documentation resources.

**Progress indication**
For long-running operations, the API provides clear progress indication through streaming responses and status endpoints, allowing client applications to provide meaningful feedback to end users.

---

*This document version: 1.0*  
*Last updated: [Current Date]*  
*Document owner: Product Management*

---

## Technical Implementation Plan (Reference)

### 1. Initial Scope (MVP)

- API key authentication and rate limiting
- Website URL and optional ICP input processing
- Modular endpoints for:
  - Positioning Canvas (`/campaigns/positioning`)
  - Email Campaign Pack (`/campaigns/email`)
  - Enrichment Blueprint (`/campaigns/enrichment`)
  - Complete Campaign Package (`/campaigns/complete`)
- Error handling and streaming support
- Data models for users, campaigns, website content, and embeddings

### 2. Proposed Directory & Module Structure

```
src/
  api/                # FastAPI routers/endpoints
    __init__.py
    campaigns.py      # All /campaigns/* endpoints
    auth.py           # API key authentication
    errors.py         # Custom error handlers
  models/             # Pydantic schemas and DB models
    __init__.py
    user.py
    campaign.py
    website_content.py
    embeddings.py
  services/           # Business logic, orchestration, integrations
    __init__.py
    campaign_generator.py
    website_scraper.py
    icp_processor.py
    email_generator.py
    enrichment_generator.py
    chromadb_service.py
    llm_service.py
    cache.py
    rate_limiter.py
  db/                 # DB session, migrations, etc.
    __init__.py
    session.py
    migrations/
  main.py             # FastAPI app entrypoint
```

### 3. First Implementation Steps

1. Set up Poetry (v2.1.3) for dependency and environment management (`poetry init`, `poetry install`).
2. Set up FastAPI app skeleton (`main.py`, routers, and basic health check endpoint)
3. Implement API key authentication (middleware or dependency)
4. Define Pydantic models for input/output schemas and DB models
5. Stub out campaign endpoints with placeholder logic and response schemas
6. Set up database models and session management (SQLAlchemy + Alembic)
7. Integrate website scraping and ICP processing (BeautifulSoup, Requests)
8. Prepare for LLM and ChromaDB integration (stub service classes)
9. Implement error handling and rate limiting
10. Write initial tests and documentation

---

*This section summarizes the technical implementation plan and initial codebase structure based on the PRD. Reference this for architectural and planning context during development.*
