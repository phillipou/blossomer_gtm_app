# CRUD API Testing Guide for Blossomer GTM API

## Overview
This guide provides comprehensive instructions for testing the new CRUD endpoints using Postman with the OpenAPI specification.

## OpenAPI Specification Access

### 1. Get the OpenAPI Spec
The FastAPI application automatically generates OpenAPI documentation. You can access it in two ways:

**JSON Format (for Postman import):**
```
http://localhost:8000/openapi.json
```

**Interactive Documentation:**
```
http://localhost:8000/docs
```

### 2. Import into Postman
1. Start the API server: `poetry run python -m uvicorn backend.app.api.main:app --reload`
2. In Postman, click "Import" 
3. Select "Link" and paste: `http://localhost:8000/openapi.json`
4. Click "Continue" and "Import"

## Authentication Setup

### Required Headers
All CRUD endpoints require Stack Auth JWT authentication:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Getting a JWT Token
1. Use the Neon Auth sync endpoint first: `POST /api/neon-auth/sync-user`
2. Or use your existing Stack Auth JWT token from the frontend

## API Endpoints Structure

### Base URL
```
http://localhost:8000/api
```

### Endpoint Categories

#### Companies CRUD
- `POST /companies` - Create company
- `GET /companies` - List companies (paginated)
- `GET /companies/{id}` - Get specific company
- `GET /companies/{id}/relations` - Get company with accounts
- `PUT /companies/{id}` - Update company
- `DELETE /companies/{id}` - Delete company

#### Accounts CRUD
- `POST /accounts-crud` - Create account
- `GET /accounts-crud` - List accounts for company
- `GET /accounts-crud/{id}` - Get specific account
- `GET /accounts-crud/{id}/relations` - Get account with personas/campaigns
- `PUT /accounts-crud/{id}` - Update account
- `DELETE /accounts-crud/{id}` - Delete account

#### Personas CRUD
- `POST /personas-crud` - Create persona
- `GET /personas-crud` - List personas for account
- `GET /personas-crud/{id}` - Get specific persona
- `GET /personas-crud/{id}/relations` - Get persona with campaigns
- `PUT /personas-crud/{id}` - Update persona
- `DELETE /personas-crud/{id}` - Delete persona

#### Campaigns CRUD
- `POST /campaigns-crud` - Create campaign
- `GET /campaigns-crud` - List campaigns for account
- `GET /campaigns-crud/{id}` - Get specific campaign
- `PUT /campaigns-crud/{id}` - Update campaign
- `DELETE /campaigns-crud/{id}` - Delete campaign

## Sample Request Bodies

### 1. Create Company
```json
{
  "name": "TechFlow Solutions",
  "url": "https://techflowsolutions.com",
  "analysis_data": {
    "description": "AI-powered workflow automation platform for software teams",
    "business_profile": {
      "category": "B2B SaaS workflow automation",
      "business_model": "Monthly/annual subscriptions with tiered pricing",
      "existing_customers": "50+ software companies using the platform"
    },
    "capabilities": [
      "Automated code review workflows",
      "CI/CD pipeline optimization",
      "Team collaboration tools",
      "Performance analytics dashboard"
    ],
    "positioning": {
      "key_market_belief": "Manual dev processes are the biggest bottleneck in software delivery",
      "unique_approach": "AI-driven automation that learns from team patterns"
    }
  }
}
```

### 2. Create Account
**Query Parameter:** `company_id=<company-uuid>`
```json
{
  "name": "Mid-market SaaS Companies",
  "account_data": {
    "firmographics": {
      "industry": ["Software", "SaaS", "Technology"],
      "employees": "50-500",
      "revenue": "$5M-$50M",
      "geography": ["North America", "Europe"],
      "funding_stage": ["Series A", "Series B", "Series C"],
      "keywords": ["rapid growth", "scaling team", "CI/CD", "automation", "developer productivity"]
    },
    "buying_signals": [
      {
        "title": "Recent engineering hiring",
        "description": "Companies actively hiring developers indicating growth",
        "type": "Company Data",
        "priority": "High",
        "detection_method": "LinkedIn job postings, company announcements"
      },
      {
        "title": "DevOps tool adoption",
        "description": "Recent adoption of modern development tools",
        "type": "Tech Stack",
        "priority": "Medium",
        "detection_method": "GitHub repos, job descriptions, tech stack data"
      }
    ],
    "rationale": [
      "Mid-market companies have complex workflows but limited resources",
      "Growing teams need better automation to maintain velocity",
      "Budget available for tools that improve developer productivity"
    ]
  }
}
```

### 3. Create Persona
**Query Parameter:** `account_id=<account-uuid>`
```json
{
  "name": "VP of Engineering",
  "persona_data": {
    "demographics": {
      "job_titles": ["VP Engineering", "Head of Engineering", "Engineering Director"],
      "departments": ["Engineering", "Technology"],
      "seniority": ["VP", "Director", "Senior Manager"],
      "buying_roles": ["Decision Maker", "Technical Buyer", "Economic Buyer"],
      "job_description_keywords": ["team leadership", "technical strategy", "developer productivity", "scaling", "automation"]
    },
    "use_cases": [
      {
        "use_case": "Code review automation",
        "pain_points": "Manual code reviews slow down development cycles and create bottlenecks",
        "capability": "AI-powered code review that catches issues early and provides instant feedback",
        "desired_outcome": "Faster development cycles with maintained code quality"
      },
      {
        "use_case": "CI/CD optimization",
        "pain_points": "Build pipelines are slow and unreliable, causing deployment delays",
        "capability": "Intelligent pipeline optimization that reduces build times by 40%",
        "desired_outcome": "Reliable, fast deployments that don't block development"
      }
    ],
    "goals": [
      "Improve team productivity and delivery speed",
      "Reduce technical debt and improve code quality",
      "Scale engineering processes as team grows",
      "Minimize time spent on manual, repetitive tasks"
    ],
    "objections": [
      "Concerned about integration complexity with existing tools",
      "Budget approval process may be lengthy",
      "Team resistance to changing established workflows"
    ],
    "buying_signals": [
      {
        "title": "Team scaling challenges",
        "description": "Posts about managing growing engineering teams",
        "type": "Social Media",
        "priority": "High",
        "detection_method": "LinkedIn posts, conference talks, blog posts"
      }
    ]
  }
}
```

### 4. Create Campaign
**Query Parameters:** `account_id=<account-uuid>&persona_id=<persona-uuid>`
```json
{
  "name": "Q4 VP Engineering Outreach",
  "campaign_type": "email",
  "campaign_data": {
    "subject_line": "Quick question about your development workflow",
    "content": "Hi {{name}}, I noticed {{company}} has been growing rapidly...",
    "segments": [
      {
        "type": "greeting",
        "text": "Hi {{name}}"
      },
      {
        "type": "opening",
        "text": "I noticed {{company}} has been growing rapidly and hiring more developers"
      },
      {
        "type": "pain-point",
        "text": "As teams scale, manual code reviews and slow CI/CD pipelines often become major bottlenecks"
      },
      {
        "type": "solution",
        "text": "TechFlow's AI-powered automation platform helps engineering teams like yours maintain velocity while improving code quality"
      },
      {
        "type": "evidence",
        "text": "We've helped 50+ similar companies reduce their build times by 40% and speed up code reviews by 60%"
      },
      {
        "type": "cta",
        "text": "Would you be open to a 15-minute demo to see how this could work for your team?"
      }
    ],
    "alternatives": {
      "subject_lines": [
        "Scaling your engineering team at {{company}}?",
        "How {{company}} can ship code 40% faster"
      ]
    },
    "configuration": {
      "personalization": "high",
      "tone": "professional",
      "length": "short"
    }
  }
}
```

## Testing Workflow

### Recommended Testing Order

1. **Create Company**
   - `POST /companies`
   - Save the returned `id` for subsequent requests

2. **Create Account**
   - `POST /accounts-crud?company_id=<company-id>`
   - Save the returned `id`

3. **Create Persona**
   - `POST /personas-crud?account_id=<account-id>`
   - Save the returned `id`

4. **Create Campaign**
   - `POST /campaigns-crud?account_id=<account-id>&persona_id=<persona-id>`

5. **Test Read Operations**
   - `GET /companies` - List all companies
   - `GET /companies/{id}` - Get specific company
   - `GET /companies/{id}/relations` - Get company with accounts
   - Repeat for accounts, personas, campaigns

6. **Test Update Operations**
   - `PUT /companies/{id}` - Update company
   - `PUT /accounts-crud/{id}` - Update account
   - `PUT /personas-crud/{id}` - Update persona
   - `PUT /campaigns-crud/{id}` - Update campaign

7. **Test Delete Operations** (in reverse order)
   - `DELETE /campaigns-crud/{id}`
   - `DELETE /personas-crud/{id}`
   - `DELETE /accounts-crud/{id}`
   - `DELETE /companies/{id}`

### Query Parameters for GET Requests

#### Pagination Parameters
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100, max: 1000)

#### Filter Parameters
- `company_id`: Required for accounts/personas/campaigns list endpoints
- `account_id`: Required for personas/campaigns list endpoints
- `persona_id`: Optional filter for campaigns list

### Example GET Requests

```bash
# Get companies with pagination
GET /companies?skip=0&limit=10

# Get accounts for specific company
GET /accounts-crud?company_id=<uuid>&skip=0&limit=10

# Get personas for specific account
GET /personas-crud?account_id=<uuid>&skip=0&limit=10

# Get campaigns for specific account and persona
GET /campaigns-crud?account_id=<uuid>&persona_id=<uuid>&skip=0&limit=10
```

## Expected Response Formats

### Success Responses

#### Create (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "TechFlow Solutions",
  "url": "https://techflowsolutions.com",
  "analysis_data": {...},
  "user_id": "user-uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Read (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "TechFlow Solutions",
  "url": "https://techflowsolutions.com",
  "analysis_data": {...},
  "user_id": "user-uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Company Name",
  "url": "https://techflowsolutions.com",
  "analysis_data": {...},
  "user_id": "user-uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:10:00Z"
}
```

#### Delete (204 No Content)
```
<empty response body>
```

### Error Responses

#### 400 Bad Request
```json
{
  "detail": "Company with this name already exists"
}
```

#### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

#### 404 Not Found
```json
{
  "detail": "Company not found"
}
```

#### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Row-Level Security Testing

### Test User Isolation
1. Create data with one JWT token
2. Try to access the same data with a different user's JWT token
3. Should receive 404 Not Found (not 403 Forbidden for security)

### Test Cascade Deletes
1. Create company → account → persona → campaign
2. Delete company
3. Verify all related data is deleted

### Test Foreign Key Validation
1. Try to create account with non-existent company_id
2. Try to create persona with non-existent account_id
3. Try to create campaign with non-existent account_id or persona_id
4. Should receive 404 Not Found

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check JWT token format and validity
2. **404 Not Found**: Verify UUIDs are correct and belong to your user
3. **422 Validation Error**: Check request body format and required fields
4. **500 Internal Server Error**: Check server logs for database connection issues

### Debug Steps

1. Check API server is running: `curl http://localhost:8000/health`
2. Verify OpenAPI spec: `curl http://localhost:8000/openapi.json`
3. Test with interactive docs: `http://localhost:8000/docs`
4. Check server logs for detailed error messages

## Notes

- All endpoints use UUID primary keys
- JSON fields (analysis_data, account_data, persona_data, campaign_data) are flexible and can contain any valid JSON
- Timestamps are automatically managed by the database
- All operations are user-scoped - you can only access your own data
- Delete operations cascade to related records
- Create operations require valid parent record ownership