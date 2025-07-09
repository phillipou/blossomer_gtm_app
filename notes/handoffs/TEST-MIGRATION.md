# Test Suite Migration & Cleanup - Handoff Document

**Status**: Ready for Implementation  
**Priority**: High - Current tests are blocking CI/CD and don't reflect actual implementation  
**Estimated Effort**: 2-3 days  
**Dependencies**: None  

## Executive Summary

The current test suite (`/tests/`) is severely outdated and contains numerous tests that reference deprecated services, old schemas, and removed functionality. Many tests fail due to authentication mocking issues and schema mismatches. This handoff provides a comprehensive migration plan to bring the test suite up to current implementation standards.

## Current State Analysis

### Test Directory Structure
```
tests/
├── test_circuit_breaker.py           # ✅ OK - Keep as-is
├── test_content_preprocessing.py     # ✅ OK - Keep as-is  
├── test_context_orchestrator.py      # ❌ DELETE - Tests deprecated ContextOrchestrator
├── test_context_orchestrator_service.py # 🔧 MAJOR FIXES - Schema/auth issues
├── test_dev_file_cache.py            # ✅ OK - Keep as-is
├── test_health.py                    # ❌ DELETE - Generic test, no value
├── test_imports.py                   # ❌ DELETE - Basic import test
├── test_llm_circuit_breaker_integration.py # ✅ OK - Keep as-is
├── test_llm_service.py               # ✅ OK - Keep as-is
├── test_llm_singleton.py             # ✅ OK - Keep as-is
├── test_main.py                      # 🔧 MAJOR FIXES - Outdated schemas
├── test_positioning.py               # ❌ DELETE - References removed service
├── test_product_overview_pipeline.py # ❌ DELETE - Tests old pipeline
├── test_product_overview_service.py  # 🔧 MAJOR FIXES - Schema/auth issues
├── test_target_account_service.py    # 🔧 MINOR FIXES - Mostly correct
├── test_target_accounts.py           # 🔧 MAJOR FIXES - Schema mismatches
├── test_target_persona_service.py    # 🔧 MINOR FIXES - Mostly correct
├── test_target_personas.py           # 🔧 MAJOR FIXES - Schema mismatches
└── test_website_scraper.py           # ✅ OK - Keep as-is
```

### Key Problems Identified

1. **Authentication Mocking Issues**
   - Tests use outdated `validate_stack_auth_jwt` overrides
   - Rate limiting mocks don't match current implementation
   - Missing proper JWT token structure

2. **Schema Mismatches**
   - Response models don't match current schemas in `/backend/app/schemas/__init__.py`
   - Old field names and structures throughout tests
   - Missing required fields in test responses

3. **Deprecated Service References**
   - Tests reference `ContextOrchestrator` (now deprecated)
   - Old import paths and service interfaces
   - Product overview pipeline tests for removed functionality

4. **Missing Test Coverage**
   - No tests for email generation service
   - No tests for Stack Auth integration
   - No tests for demo rate limiting

## Migration Plan

### Phase 1: Immediate Cleanup (0.5 days)

#### Files to Delete
```bash
rm tests/test_context_orchestrator.py
rm tests/test_product_overview_pipeline.py  
rm tests/test_imports.py
rm tests/test_health.py
rm tests/test_positioning.py
```

**Justification**: These files test deprecated functionality or provide no value.

#### Verify Remaining Tests Still Pass
```bash
poetry run pytest tests/test_circuit_breaker.py -v
poetry run pytest tests/test_content_preprocessing.py -v
poetry run pytest tests/test_dev_file_cache.py -v
poetry run pytest tests/test_llm_circuit_breaker_integration.py -v
poetry run pytest tests/test_llm_service.py -v
poetry run pytest tests/test_llm_singleton.py -v
poetry run pytest tests/test_website_scraper.py -v
```

### Phase 2: Fix Core Service Tests (1 day)

#### 2.1 Update `test_target_account_service.py`

**Current Issues**:
- Schema field mismatches in mock responses
- Missing `target_account_rationale` field
- Incorrect `firmographics` structure

**Required Changes**:
```python
# Update mock responses to match current TargetAccountResponse schema
# Line 31-101: Fix expected_response structure
expected_response = TargetAccountResponse(
    target_account_name="Enterprise SaaS Companies",
    target_account_description="Mid-market SaaS companies with growth potential",
    target_account_rationale=["Rationale for enterprise SaaS companies."],  # ADD THIS
    firmographics={
        "industry": ["Software", "Technology", "SaaS"],
        "employees": "100-500",  # Changed from company_size
        "revenue": "$10M-$50M",  # Changed from revenue_range  
        "geography": ["North America", "Europe"],
        "business_model": ["B2B SaaS"],
        "funding_stage": ["Series A-C"],  # Changed from funding_status
        "keywords": ["cloud", "saas", "enterprise"],
    },
    # Remove key_characteristics, pain_points, disqualifying_factors, account_examples, engagement_strategy
    buying_signals=[...],  # Keep but update structure
    buying_signals_rationale=["Funding indicates budget and growth focus."],  # ADD THIS
    metadata={...}  # Update to match ICPMetadata schema
)
```

#### 2.2 Update `test_target_persona_service.py`

**Current Issues**:
- Missing `target_persona_rationale` field
- Wrong schema structure for demographics and other fields

**Required Changes**:
```python
# Update mock responses to match current TargetPersonaResponse schema
# Remove: psychographics, day_in_life, pain_points, buying_behavior, messaging_preferences, engagement_strategy
# Add: target_persona_rationale, demographics (with new structure), use_cases, objections, goals, purchase_journey
```

#### 2.3 Update `test_context_orchestrator_service.py`

**Current Issues**:
- Tests deprecated `_resolve_context` method
- Mock classes don't match current interfaces
- Schema mismatches

**Required Changes**:
```python
# Update MockPromptVars to match current prompt variable classes
# Fix MockResponseModel to match actual response schemas
# Update test cases to use current analyze() method signature
# Remove tests for deprecated _resolve_context method
```

### Phase 3: Fix API Endpoint Tests (1 day)

#### 3.1 Fix `test_main.py` 

**Critical Issues**:
- Lines 53-86: `fake_generate_structured_output` returns wrong schema
- Lines 113-272: Product overview test uses hardcoded response that doesn't match `ProductOverviewResponse`
- Lines 344-542: Target account test response structure outdated
- Lines 580-714: Target persona test response structure outdated

**Required Changes**:

```python
# Update product overview response (lines 113-272)
def test_product_overview_endpoint_success(monkeypatch):
    # Mock response must match ProductOverviewResponse schema exactly
    mock_response = ProductOverviewResponse(
        company_name="Fake Company Inc.",
        company_url="https://example.com",
        description="Fake Company Inc. is a supply chain productivity platform...",
        business_profile=BusinessProfile(
            category="Data Integration and Automation Platform",
            business_model="SaaS platform with subscription pricing...",
            existing_customers="Mid-to-large companies in manufacturing, retail, logistics"
        ),
        capabilities=[
            "Data Unification: Uses AI to ingest and standardize data",
            "Real-Time Querying: Enables instant answers via co-pilot interface"
        ],
        use_case_analysis=UseCaseAnalysis(
            process_impact="Impacts supply chain planning and operational decision-making",
            problems_addressed="Addresses fragmented data sources, manual data cleaning",
            how_they_do_it_today="Currently rely on spreadsheets, manual consolidation"
        ),
        positioning=Positioning(
            key_market_belief="Current supply chain tools are siloed and outdated",
            unique_approach="Seamlessly connects existing data sources for real-time insights",
            language_used="Metaphors like 'supercharging spreadsheets'"
        ),
        objections=[
            "Integration Complexity: Concerns about connecting with legacy systems",
            "Cost and ROI: Questions about pricing model and tangible benefits"
        ],
        icp_hypothesis=ICPHypothesis(
            target_account_hypothesis="Mid-to-large enterprises in manufacturing, retail, logistics",
            target_persona_hypothesis="Supply Chain Manager, Operations Director, Planning Lead"
        ),
        metadata={
            "sources_used": ["website"],
            "primary_context_source": "website_content",
            "context_quality": "sufficient",
            "assessment_summary": "Comprehensive analysis from website content"
        },
        buying_signals=[
            {
                "title": "Digital Transformation Initiatives", 
                "indicators": ["Technology investments", "Process automation projects"],
                "signal_source": "company_updates"
            }
        ]
    )
```

```python
# Update target account response (lines 344-542) 
fake_response = TargetAccountResponse(
    target_account_name="AI Developer Tools Startups",
    target_account_description="Targeting early-stage AI developer tool startups...",
    target_account_rationale=[
        "AI developer tools startups are in high-growth phases",
        "These companies operate in fast-evolving verticals", 
        "Startups have limited internal sales resources"
    ],
    firmographics=Firmographics(
        industry=["Artificial Intelligence Software", "Developer Tools"],
        employees="1-50",
        revenue="Less than $10M", 
        geography=["United States", "Europe", "Canada"],
        business_model=["Startup", "Early-stage"],
        funding_stage=["Seed", "Series A"],
        keywords=["rapid scaling", "AI development", "cloud deployment"]
    ),
    buying_signals=[...],  # Update to match BuyingSignal schema
    buying_signals_rationale=[...],
    metadata=ICPMetadata(...)  # Use proper ICPMetadata schema
)
```

```python
# Update target persona response (lines 580-714)
fake_response = TargetPersonaResponse(
    target_persona_name="Chief Marketing Officer",
    target_persona_description="Senior executive responsible for marketing strategy",
    target_persona_rationale=[
        "CMOs are primary decision makers for marketing technology",
        "They control marketing budgets and technology investments"
    ],
    demographics=Demographics(
        job_titles=["Chief Marketing Officer", "VP Marketing"],
        departments=["Marketing"], 
        seniority=["C-Suite"],
        buying_roles=["Economic Buyers", "Decision Maker"],
        job_description_keywords=["marketing strategy", "customer acquisition"]
    ),
    use_cases=[
        UseCase(
            use_case="Campaign Performance Tracking",
            pain_points="Fragmented marketing data across multiple platforms",
            capability="Unified dashboard for campaign analytics", 
            desired_outcome="Increase marketing ROI and attribution accuracy"
        )
    ],
    buying_signals=[...],  # Update to BuyingSignal schema
    buying_signals_rationale=[...],
    objections=["Budget constraints", "Integration complexity"],
    goals=["Increase MQLs/SQLs", "Improve campaign ROI"],
    purchase_journey=["Awareness", "Evaluation", "Trial", "Purchase"],
    metadata={...}
)
```

#### 3.2 Fix `test_target_accounts.py`

**Required Changes**:
- Update all mock responses to use `TargetAccountResponse` schema
- Fix `firmographics` field structure to match `Firmographics` model
- Add missing `target_account_rationale` and `buying_signals_rationale` fields
- Update `metadata` to use `ICPMetadata` structure

#### 3.3 Fix `test_target_personas.py`

**Required Changes**:
- Update all mock responses to use `TargetPersonaResponse` schema
- Replace old fields with new schema fields (demographics, use_cases, etc.)
- Add missing required fields like `target_persona_rationale`
- Fix authentication mocking

### Phase 4: Fix Authentication & Dependencies (0.5 days)

#### 4.1 Create Shared Test Utilities

Create `tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from backend.app.api.main import app
from backend.app.core.auth import validate_stack_auth_jwt
from backend.app.core.demo_rate_limiter import demo_ip_rate_limit_dependency

class MockUser:
    def __init__(self):
        self.id = "test-user-id"
        self.rate_limit_exempt = True
        self.sub = "test-user-id"

@pytest.fixture
def test_client():
    """Test client with authentication and rate limiting disabled."""
    # Override auth dependency
    app.dependency_overrides[validate_stack_auth_jwt] = lambda: MockUser()
    
    # Override rate limiting for all demo endpoints
    for endpoint_type in ["company_generate", "accounts_generate", "personas_generate"]:
        app.dependency_overrides[demo_ip_rate_limit_dependency(endpoint_type)] = lambda: None
    
    yield TestClient(app)
    
    # Clean up overrides
    app.dependency_overrides.clear()
```

#### 4.2 Update All Test Files

Replace individual auth mocking with:
```python
def test_example(test_client):
    response = test_client.post("/api/company", json=payload)
    # No need for individual auth overrides
```

### Phase 5: Add Missing Test Coverage (0.5 days)

#### 5.1 Create `test_email_generation_service.py`

```python
"""Test cases for email_generation_service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.app.services.email_generation_service import generate_email_campaign
from backend.app.schemas import EmailGenerationRequest, EmailGenerationResponse

class TestEmailGenerationService:
    @pytest.mark.asyncio
    async def test_generate_email_success(self):
        # Test successful email generation
        pass
    
    @pytest.mark.asyncio  
    async def test_generate_email_missing_context(self):
        # Test error handling for missing context
        pass
```

#### 5.2 Create `test_auth_integration.py`

```python
"""Test cases for Stack Auth JWT validation."""
import pytest
from fastapi import HTTPException
from backend.app.core.auth import validate_stack_auth_jwt

class TestStackAuthIntegration:
    @pytest.mark.asyncio
    async def test_valid_jwt_token(self):
        # Test valid JWT validation
        pass
    
    @pytest.mark.asyncio
    async def test_invalid_jwt_token(self):
        # Test invalid JWT handling
        pass
```

#### 5.3 Create `test_rate_limiting.py`

```python
"""Test cases for demo rate limiting functionality."""
import pytest
from backend.app.core.demo_rate_limiter import demo_ip_rate_limit_dependency

class TestDemoRateLimiting:
    def test_rate_limit_enforcement(self):
        # Test rate limiting logic
        pass
```

## Implementation Checklist

### Pre-Implementation
- [ ] Backup current tests directory: `cp -r tests tests_backup_$(date +%Y%m%d)`
- [ ] Ensure all current "OK" tests pass: `poetry run pytest tests/test_circuit_breaker.py tests/test_content_preprocessing.py tests/test_dev_file_cache.py tests/test_llm_circuit_breaker_integration.py tests/test_llm_service.py tests/test_llm_singleton.py tests/test_website_scraper.py -v`

### Phase 1: Cleanup
- [ ] Delete outdated test files
- [ ] Verify remaining tests still pass

### Phase 2: Service Tests  
- [ ] Fix `test_target_account_service.py` schema issues
- [ ] Fix `test_target_persona_service.py` schema issues
- [ ] Fix `test_context_orchestrator_service.py` interface issues
- [ ] Run service tests: `poetry run pytest tests/test_*_service.py -v`

### Phase 3: API Tests
- [ ] Fix `test_main.py` schema and auth issues
- [ ] Fix `test_target_accounts.py` schema issues  
- [ ] Fix `test_target_personas.py` schema issues
- [ ] Run API tests: `poetry run pytest tests/test_main.py tests/test_target_accounts.py tests/test_target_personas.py -v`

### Phase 4: Auth & Dependencies
- [ ] Create `tests/conftest.py` with shared fixtures
- [ ] Update all test files to use shared auth mocking
- [ ] Test auth integration: `poetry run pytest --tb=short`

### Phase 5: New Coverage
- [ ] Create `test_email_generation_service.py`
- [ ] Create `test_auth_integration.py` 
- [ ] Create `test_rate_limiting.py`
- [ ] Run new tests: `poetry run pytest tests/test_email_generation_service.py tests/test_auth_integration.py tests/test_rate_limiting.py -v`

### Final Validation
- [ ] Run full test suite: `poetry run pytest -v`
- [ ] Verify no skipped tests: `poetry run pytest --tb=no -q | grep SKIPPED`
- [ ] Check test coverage: `poetry run pytest --cov=backend.app --cov-report=term-missing`
- [ ] Update CI/CD pipeline if needed

## Risk Mitigation

### Backup Strategy
```bash
# Create timestamped backup before starting
cp -r tests tests_backup_$(date +%Y%m%d_%H%M%S)
```

### Incremental Validation
After each phase:
```bash
# Run tests for modified files only
poetry run pytest tests/modified_file.py -v --tb=short

# Run quick smoke test
poetry run pytest tests/ -x --tb=line
```

### Rollback Plan
If migration fails:
```bash
# Restore from backup
rm -rf tests
mv tests_backup_YYYYMMDD_HHMMSS tests
```

## Expected Outcomes

### Before Migration
- ~15-20 test failures due to schema/auth issues
- Many skipped tests due to template/prompt issues
- No test coverage for email generation
- Outdated authentication mocking

### After Migration  
- All tests passing (target: 95%+ pass rate)
- No skipped tests due to outdated code
- Comprehensive coverage of current functionality
- Proper authentication testing
- Clean, maintainable test codebase

## Dependencies & Prerequisites

### Required Knowledge
- FastAPI testing patterns
- Pydantic schema definitions 
- Stack Auth JWT structure
- Current service architecture

### Required Access
- Write access to `/tests/` directory
- Ability to run `poetry run pytest`
- Access to current schema definitions in `/backend/app/schemas/`

### Required Tools
- Poetry for dependency management
- Pytest for test execution
- Code editor with Python support

## Success Criteria

1. **All Tests Pass**: `poetry run pytest -v` returns 0 exit code
2. **No Skipped Tests**: All legitimate test cases run successfully  
3. **Schema Compliance**: All mock responses match current schemas exactly
4. **Auth Integration**: Proper Stack Auth JWT testing
5. **Coverage**: Tests cover all major service endpoints and functionality
6. **Maintainability**: Clean, well-organized test structure

## Support & Escalation

### Questions During Implementation
- Check current schemas in `/backend/app/schemas/__init__.py`
- Reference service implementations in `/backend/app/services/`
- Look at working tests in files marked "OK" above

### If Implementation Stalls
- Focus on getting "MINOR FIXES" files working first
- Use backup to restore if needed
- Consider implementing in smaller increments per file

### Post-Implementation
- Monitor CI/CD pipeline performance
- Update this document with any additional findings
- Consider adding integration tests for end-to-end workflows

---

**Estimated Total Time**: 2-3 days  
**Risk Level**: Medium (good backup strategy mitigates risk)  
**Business Impact**: High (enables reliable CI/CD and development workflow)