# Claude Code Configuration - Blossomer GTM API

## Project Overview
- AI-powered go-to-market campaign generator for B2B founders
- Modular monolith with service-oriented design
- FastAPI backend + React TypeScript frontend
- Multi-provider LLM integration (OpenAI, Anthropic, Google)

## Core Documentation (Always Reference When Relevant)
- **[ARCHITECTURE.md](@/notes/ARCHITECTURE.md)**: Technical system design, tech stack, deployment architecture
- **[PRD.md](@/notes/PRD.md)**: User flows, interactions, product decisions, UX rationale
- **[API_REFERENCE.md](@/notes/API_REFERENCE.md)**: All endpoints, request/response examples, frontend integration
- **[TASKS.md](@/notes/TASKS.md)**: Current priorities, implementation roadmap, blockers
- **[DECISIONS.md](@/notes/DECISIONS.md)**: Architectural decisions, trade-offs, evolution rationale

## Development Workflow
1. **Read → Analyze → Implement**: Read relevant files, analyze the issue/requirement, then implement the solution
2. **Check core docs first**: Reference ARCHITECTURE.md and PRD.md before implementing
3. **Update TASKS.md**: Mark todos complete and add new ones as discovered
4. **Document decisions**: Add significant choices to DECISIONS.md
5. **Suggest doc updates**: Always offer to update relevant documentation

## Code Change Authority
- **Make direct changes**: When asked to fix code, implement features, or make improvements, directly edit the files
- **No permission asking**: Don't ask for permission to make code changes - just implement them
- **Proactive fixes**: If you spot bugs, syntax errors, or issues while reading code, fix them immediately
- **Batch changes**: When making related changes across multiple files, implement all of them together
- **Error resolution**: When build errors or linting issues are reported, fix them directly in the code

## Coding Standards
- **Follow existing patterns**: Check codebase for established conventions before adding new patterns
- **Minimal changes**: Limit modifications to what's necessary for the current task
- **Code organization**: Keep files under 300 lines, use clear module boundaries
- **Line length**: 100 characters documented, 120 characters enforced
- **Environment awareness**: Support dev/test/prod environments, never hardcode
- **Rate limiting**: All endpoints must implement appropriate rate limiting
- **No stubbing in prod**: Mocking only allowed in tests
- **API Casing Convention**: Backend uses snake_case, frontend uses camelCase, with transformation at API boundaries

## AI/LLM Integration Requirements
- **Use Jinja2 templates**: All prompts must use the prompt registry system
- **Structured outputs**: Use Pydantic models for LLM responses
- **Multi-provider support**: Utilize circuit breaker pattern for reliability
- **Context processing**: Implement proper content preprocessing for better AI results

## Testing Standards
- **TDD preferred**: Write tests before or alongside implementation
- **Comprehensive coverage**: Unit, integration, and end-to-end tests
- **Mock LLM responses**: Use proper mocking for AI services in tests
- **No test data in prod**: Isolate all test/mock data to test environment

## Test Commands
- Backend: `poetry run pytest` (from root)
- Frontend: `npm test` (from frontend/)
- Full test suite: Check README.md for complete test commands

## Build Commands
- Backend: `poetry install` then `poetry run python -m uvicorn backend.app.api.main:app --reload`
- Frontend: `npm install` then `npm run dev` (from frontend/)
- Full build: Check README.md for complete build commands

## Documentation Workflow
- **Always suggest updates**: When making changes, offer to update relevant core documentation
- **Reference before implementing**: Check core docs to understand existing patterns and decisions
- **Keep docs current**: Update TASKS.md when completing work, add new decisions to DECISIONS.md
- **Cross-reference**: Link between docs when discussing related concepts

## Directory Structure
```
blossomer-gtm-api/
├── backend/app/           # FastAPI application
│   ├── api/              # API routes
│   ├── core/             # Core services (auth, database, LLM)
│   ├── models/           # Database models
│   ├── prompts/          # Jinja2 prompt templates
│   ├── schemas/          # Pydantic schemas
│   └── services/         # Business logic services
├── frontend/src/         # React TypeScript application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route components
│   ├── lib/             # Utilities and services
│   └── types/           # TypeScript definitions
├── tests/               # Backend tests
├── .cursor/rules/       # Cursor IDE rules
└── @/notes/             # Core documentation
```

## Key Files to Reference
- `pyproject.toml`: Python dependencies and project config
- `package.json`: Frontend dependencies
- `docker-compose.yml`: Local development setup
- `alembic/`: Database migrations
- `.cursor/rules/`: Development guidelines and best practices