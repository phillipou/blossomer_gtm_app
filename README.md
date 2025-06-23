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
1. Set up FastAPI app skeleton (`main.py`, routers, and basic health check endpoint)
2. Implement API key authentication (middleware or dependency)
3. Define Pydantic models for input/output schemas and DB models
4. Stub out campaign endpoints with placeholder logic and response schemas
5. Set up database models and session management (SQLAlchemy + Alembic)
6. Integrate website scraping and ICP processing (BeautifulSoup, Requests)
7. Prepare for LLM and ChromaDB integration (stub service classes)
8. Implement error handling and rate limiting
9. Write initial tests and documentation

---

*This section summarizes the technical implementation plan and initial codebase structure based on the PRD. Reference this for architectural and planning context during development.*
