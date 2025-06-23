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

## Contributing

Contributions are welcome! Please open issues or pull requests.
