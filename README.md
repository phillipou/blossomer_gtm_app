# Blossomer GTM API

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

Create a `.env` file in the project root and fill in your secrets (see PRD.md for required variables):

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

## Development Approach: Stateless First

For early development and prototyping, the Blossomer GTM API is intentionally designed to be stateless. Database models and persistent storage will be added later, once requirements are clearer. Endpoints currently use mock or in-memory data, allowing rapid iteration and easy refactoring. This approach enables fast progress on API design and business logic without being blocked by database setup or migrations.

---

## API Endpoints

### POST /campaigns/positioning

**Purpose:**
Generate a Unique Insight (core reframe) and Unique Selling Points (USPs) for a B2B startup, based on company description, website, and (optionally) ICP. This endpoint follows API design best practices and the unique insight/USP methodology described in the project documentation.

**Request Body:**
```json
{
  "website_url": "https://example.com",
  "description": "AI-powered marketing automation for SMBs",
  "icp": "B2B SaaS startups" // optional
}
```

**Response:**
```json
{
  "unique_insight": "Most B2B marketing tools focus on automation, but the real bottleneck is understanding what actually resonates with buyers. Blossomer reframes the problem: it's not about sending more messages, but about crafting the right message for the right ICP at the right time.",
  "unique_selling_points": [
    {
      "theme": "Buyer-Centric Messaging",
      "description": "Delivers messaging tailored to the emotional and practical needs of your ICP.",
      "evidence": [
        "Analyzes ICP pain points and language",
        "Adapts messaging based on real buyer feedback"
      ]
    },
    {
      "theme": "Rapid Time to Value",
      "description": "Get actionable campaign assets in minutes, not weeks.",
      "evidence": [
        "Automated campaign generation",
        "No manual copywriting required"
      ]
    }
  ]
}
```

**Notes:**
- Input is validated using Pydantic models.
- The endpoint is stateless and currently returns a mock response for prototyping.
- The response structure is designed for clarity, specificity, and future LLM integration.
