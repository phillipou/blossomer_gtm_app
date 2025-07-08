# Blossomer GTM API

> **Note:** All project documentation, requirements, architecture, and task tracking are now located in the [@/notes](@/notes/) directory. See:
> - [@/notes/TASKS.md](@/notes/TASKS.md) — Project tasks and status
> - [@/notes/PRD.md](@/notes/PRD.md) — Product Requirements Document
> - [@/notes/ARCHITECTURE.md](@/notes/ARCHITECTURE.md) — Architecture Blueprint
> - [@/notes/prompt_templates.md](@/notes/prompt_templates.md) — Prompt Templating System

---

## Changelog

### [Unreleased]
- **Modular API Redesign:**
  - Each major feature (ICP inference, Positioning, Value Props, Email Campaign, Use Case Fit) is now a separate endpoint.
  - All endpoints require `website_url` as input, and accept optional `user_inputted_context` and `company_context` fields.
  - This change improves composability, extensibility, and supports both atomic and orchestrated/agentic workflows.
  - Rationale: Enables easier addition of new features, more flexible client integration, and better alignment with agentic/LLM-powered workflows. See backend_prd.md and backend_architecture.md for details.

**AI-powered go-to-market campaign generator for B2B founders.**

---

## Overview

Blossomer GTM API is an API-first, AI-powered service that helps early-stage B2B companies generate expert-level go-to-market campaigns, positioning, and messaging assets. Designed for founders and technical teams, it delivers structured, actionable campaign assets with minimal input.

---

## Key Features

- Website URL and ICP (Ideal Customer Profile) analysis
- Modular endpoints for campaign asset generation (positioning, email, enrichment)
- API key authentication and rate limiting
- LLM-powered orchestration (OpenAI, Anthropic, LangChain, LangGraph)
- ChromaDB vector storage for semantic search
- Extensible for future data analysis and frontend integration

---

## Tech Stack

- **Python 3.11+**
- **FastAPI** (API framework)
- **Poetry** (dependency & environment management, v2.1.3)
- **SQLAlchemy, Alembic** (ORM & migrations)
- **ChromaDB** (vector storage)
- **LangChain, LangGraph** (LLM orchestration)
- **Docker** (containerization)
- **Pre-commit, Black, flake8** (code quality)

---

## Quickstart

### 1. Clone the repository

```sh
git clone <repo-url>
cd blossomer-gtm-api
```

### 2. Install Poetry (if not already)

```sh
curl -sSL https://install.python-poetry.org | python3 -
```

### 3. Install dependencies

```sh
poetry install
```

### 4. Set up environment variables

Create a `.env` file in the project root and fill in your secrets (see backend_prd.md for required variables):

```sh
touch .env
# Edit .env with your values
```

### 5. Activate the virtual environment

```sh
poetry shell
```

### 6. Run the API (after implementing main.py)

```sh
uvicorn src.main:app --reload
```

---

## Development Workflow

- Use `poetry add <package>` to add dependencies.
- Use `pre-commit` for code formatting and linting (runs automatically on commit).
- Write code in the `src/` directory.
- Add tests in the `tests/` directory.

---

## Development Cache (`dev_cache/`)

During development, website scraping results are cached in the `dev_cache/website_scrapes/` directory. This prevents repeated API calls (e.g., to Firecrawl) for the same URLs, saving credits and speeding up local testing. The cache is keyed by a hash of the URL and stores results as JSON files. This directory is ignored by git and is safe to delete at any time (files will be regenerated as needed).

---

## Development Approach: Stateless First

For early development and prototyping, the Blossomer GTM API is intentionally designed to be stateless. Database models and persistent storage will be added later, once requirements are clearer. Endpoints currently use mock or in-memory data, allowing rapid iteration and easy refactoring. This approach enables fast progress on API design and business logic without being blocked by database setup or migrations.

---

## API Endpoints

### POST /company/generate

**Purpose:**
Generate a Company Overview (features, company & persona profiles, pricing) for a B2B startup, based on company website and optional context. This endpoint helps summarize the company's product, features, and target segments for outbound campaigns.

**Request Body:**
```json
{
  "website_url": "https://example.com",
  "user_inputted_context": "",
  "company_context": ""
}
```

**Response:**
```json
{
  "company_name": "...",
  "company_url": "...",
  "company_overview": "...",
  "capabilities": ["...", ...],
  "business_model": ["...", ...],
  "differentiated_value": ["...", ...],
  "customer_benefits": ["...", ...],
  "alternatives": ["...", ...],
  "testimonials": ["...", ...],
  "product_description": "...",
  "key_features": ["...", ...],
  "company_profiles": ["...", ...],
  "persona_profiles": ["...", ...],
  "use_cases": ["...", ...],
  "pain_points": ["...", ...],
  "pricing": "...",
  "confidence_scores": {
    "company_name": 0.0,
    "company_url": 0.0,
    "company_overview": 0.0,
    "capabilities": 0.0,
    "business_model": 0.0,
    "differentiated_value": 0.0,
    "customer_benefits": 0.0,
    "alternatives": 0.0,
    "testimonials": 0.0,
    "product_description": 0.0,
    "key_features": 0.0,
    "company_profiles": 0.0,
    "persona_profiles": 0.0,
    "use_cases": 0.0,
    "pain_points": 0.0,
    "pricing": 0.0
  },
  "metadata": {
    "sources_used": ["website"],
    "context_quality": "...",
    "assessment_summary": "..."
  }
}
```

- All fields are required unless otherwise noted.
- If information is not available, fields may be empty strings or empty lists.
- See `backend/app/schemas/__init__.py` for the authoritative schema.

Product Overview Output Example (fields):
- company_name: The official name of the company as found on the website or in the provided context.
- company_url: The canonical website URL for the company (should match the input or be extracted from the website if different).
- company_overview: 2-3 sentence summary of what the company does, their mission, and primary focus area.
- capabilities: Technical capabilities, core product features, platform abilities, and key functionalities.
- business_model: How they make money, pricing approach, target market size, sales model, and revenue streams.
- differentiated_value: What sets them apart from competitors, unique approaches, proprietary technology, or market positioning.
- customer_benefits: Expected outcomes, ROI, efficiency gains, problem resolution, or value delivery for customers.
- alternatives: Similar services/competitors with brief comparison of similarities and key differences.
- testimonials: Up to 5 direct customer quotes found on the website, including attribution when available.
- product_description: Main product summary
- key_features: List of product features/benefits
- company_profiles: Company/firmographic segments (e.g., industry, size, region)
- persona_profiles: Persona/job role segments (e.g., job title, seniority, department)
- use_cases: Use cases explicitly listed on the website
- pain_points: Pain points explicitly listed on the website
- pricing: Pricing information if available
- confidence_scores: Confidence/quality scores for each section (0-1)
- metadata: Additional metadata (sources, context quality, processing time, etc.)

### POST /customers/target_accounts

**Purpose:**
Generate a Target Account Profile (firmographics, buying signals, rationale) for a B2B startup, based on company website and optional context. This endpoint helps identify ideal customer segments for outbound campaigns.

**Request Body:**
```json
{
  "website_url": "https://example.com",
  "user_inputted_context": "",
  "company_context": ""
}
```

**Response:**
```json
{
  "target_company": "Tech-forward SaaS companies",
  "company_attributes": ["SaaS", "Tech-forward", "100-500 employees"],
  "buying_signals": ["Hiring AI engineers", "Investing in automation"],
  "rationale": "These companies are ideal due to their innovation focus.",
  "confidence_scores": {"target_company": 0.95},
  "metadata": {"source": "test"}
}
```

### POST /customers/target_personas

**Purpose:**
Generate a Target Persona Profile (attributes, buying signals, rationale) for a B2B startup, based on company website and optional context. This endpoint helps define the primary decision-maker or influencer for outbound campaigns.

**Request Body:**
```json
{
  "website_url": "https://example.com",
  "user_inputted_context": "",
  "company_context": ""
}
```

**Response:**
```json
{
  "persona": "Head of Operations",
  "persona_attributes": ["Decision maker", "Process-oriented"],
  "persona_buying_signals": ["Seeking efficiency", "Evaluating automation"],
  "rationale": "This persona drives operational improvements.",
  "confidence_scores": {"persona": 0.92},
  "metadata": {"source": "test"}
}
```

## Database Setup (Neon)
- Blossomer now uses [Neon](https://neon.tech/) as the default Postgres database for all environments.
- Set your `DATABASE_URL` in `.env` to your Neon connection string.
- Use Alembic for migrations:
  ```sh
  poetry run dotenv run -- alembic revision --autogenerate -m "<message>"
  poetry run dotenv run -- alembic upgrade head
  ```
- For scripts, always use `poetry run dotenv run -- python <script.py>` to ensure environment variables are loaded.

## Docker Notes
- The Dockerfile expects a valid `DATABASE_URL` in the environment.
- For local development, mount your `.env` or pass `--env-file .env` to `docker run`.
- Neon is cloud-hosted, so Docker containers can connect from anywhere with the right credentials.

## Automated Alembic Migrations with GitHub Actions

This project uses a GitHub Actions workflow to automatically run Alembic migrations against the production database after each push to `main` or via manual trigger. This ensures your production schema is always up to date, even on Render's free plan.

### Setup
1. **Add your production database URL as a GitHub secret:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret.
   - Name: `PROD_DATABASE_URL`
   - Value: (your production database URL)
2. **Workflow file:**
   - Located at `.github/workflows/alembic-migrate.yml`.

### How it Works
- On every push to `main` (or manual trigger), the workflow:
  - Checks out the code
  - Sets up Python and Poetry
  - Installs dependencies
  - Runs Alembic migrations using the production `DATABASE_URL`

### Manual Trigger
- Go to the Actions tab in GitHub
- Select "Alembic Migrate (Production)"
- Click "Run workflow"

### Security Notes
- Only trusted maintainers should have access to trigger this workflow, as it can modify your production database.
- Never expose your production database URL or credentials in code or logs.

### Example Workflow File
```yaml
name: Alembic Migrate (Production)

on:
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install Poetry
        run: pip install poetry
      - name: Install dependencies
        run: poetry install --no-interaction --no-root
      - name: Run Alembic migrations
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: poetry run alembic upgrade head
```

## Render Deployment Guide

### Deploying to Render
1. **Push to `main` branch:**
   - Render is configured to auto-deploy from the `main` branch.
2. **Dockerfile:**
   - The project uses a production-ready Dockerfile at the repo root.
3. **Root Directory:**
   - Set to `.` (repo root) in Render settings.
4. **Port:**
   - Expose port 8000 (default for Gunicorn/Uvicorn).

### Environment Variables
- Set all required environment variables (e.g., `DATABASE_URL`, `API_KEY`, etc.) in the Render dashboard under the Environment tab.
- Never commit secrets to the repo.

### Manual Alembic Migrations (Free Plan)
- If you are on Render's free plan, run Alembic migrations manually after each deploy:
  ```sh
  DATABASE_URL=your-production-db-url poetry run alembic upgrade head
  ```
- Or use the GitHub Actions workflow documented above for automation.

### Rollback
- To rollback a deploy, go to the Render dashboard, select your service, and redeploy a previous commit from the Deploys tab.
- After rollback, re-run Alembic migrations if the schema changed.

### Health Check
- The health check endpoint is available at `/health` (e.g., `https://blossomer-gtm-api.onrender.com/health`).
- Render uses this endpoint to determine if your service is live.

### Additional Notes
- For production, always use a separate database from development.
- For more details, see the [Automated Alembic Migrations with GitHub Actions](#automated-alembic-migrations-with-github-actions) section above.
