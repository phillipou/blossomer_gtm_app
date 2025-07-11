# Blossomer GTM API - API Reference

*Last updated: July 11, 2025*

## Overview

This API reference provides complete documentation for frontend integration with the Blossomer GTM API. It includes both implemented endpoints and planned endpoints marked with TODO status.

### Base URLs
- **Development**: `http://localhost:8000`
- **Production**: `https://blossomer-gtm-app.onrender.com`

### API Structure
- **Demo endpoints**: `/demo/*` - No authentication, IP rate limited
- **Production endpoints**: `/api/*` - Stack Auth JWT required
- **Admin endpoints**: `/admin/*` - Admin access only

## Endpoint Summary Table

| Resource   | AI Generation Endpoint (Demo)         | AI Generation Endpoint (Prod)         | CRUD Endpoints (Prod)                |
|------------|---------------------------------------|---------------------------------------|--------------------------------------|
| Companies  | POST /demo/companies/generate-ai      | POST /api/companies/generate-ai       | /api/companies, /api/companies/{id}  |
| Accounts   | POST /demo/accounts/generate-ai       | POST /api/accounts/generate-ai        | /api/accounts, /api/accounts/{id}    |
| Personas   | POST /demo/personas/generate-ai       | POST /api/personas/generate-ai        | /api/personas, /api/personas/{id}    |
| Campaigns  | POST /demo/campaigns/generate-ai      | POST /api/campaigns/generate-ai       | /api/campaigns, /api/campaigns/{id}  |

- All CRUD endpoints follow standard RESTful conventions (POST, GET, PUT, DELETE).
- All AI generation endpoints use the `/generate-ai` subroute for each resource.

## Authentication

### Stack Auth JWT Authentication
All production endpoints require a Stack Auth JWT token in the Authorization header:

```bash
Authorization: Bearer <stack_auth_jwt_token>
```

- The frontend retrieves and caches the Stack Auth JWT token after login using the `useAuthState()` hook.
- The token is available as `useAuthState().token` and is sent in the Authorization header for all `/api/*` requests.

**Example (React):**
```javascript
import { useAuthState } from '../lib/auth';

const { token } = useAuthState();

const response = await fetch('/api/accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ ... })
});
```

### Rate Limiting
- **Demo endpoints**: 10 requests per hour per IP
- **Production endpoints**: 100 requests per hour per API key
- **Rate limit headers** included in all responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Timestamp when rate limit resets

## Company Endpoints

### AI Generate Company Overview

- **Demo**: `POST /demo/companies/generate-ai`
- **Production**: `POST /api/companies/generate-ai`

**Request Body**:
```json
{
  "website_url": "https://example.com",
  "user_inputted_context": "Optional context about the company or product",
  "company_context": "Optional existing company analysis data"
}
```

**Response**: (see ProductOverviewResponse schema with flattened fields)

**Data Model Changes (July 2025)**:
- **Flattened Fields**: AI-generated complex objects now returned as `List[str]` for UI compatibility
- **Examples**: 
  - `business_profile_insights: ["Category: B2B SaaS", "Business Model: Subscription"]`
  - `positioning_insights: ["Value Prop: AI-powered automation", "Differentiator: Real-time analytics"]`
  - `use_case_analysis_insights: ["Primary Use: Lead generation", "Process Impact: 40% time savings"]`
  - `target_customer_insights: ["ICP: Mid-market companies", "Size: 100-500 employees"]`
- **Preserved Complex Types**: `firmographics`, `demographics`, `buying_signals` (have dedicated UIs)

### Company CRUD

- **Create**: `POST /api/companies`
- **List**: `GET /api/companies`
- **Retrieve**: `GET /api/companies/{company_id}`
- **Update**: `PUT /api/companies/{company_id}` (supports field preservation)
- **Delete**: `DELETE /api/companies/{company_id}`

**Field Preservation (July 2025)**:
- **Partial Updates**: All PUT requests preserve existing fields not included in request body
- **Backend Implementation**: Merges updates with existing JSONB data to prevent data loss
- **Frontend Pattern**: Use `updateEntityPreserveFields` service function for safe partial updates
- **Example**: Updating only `name` and `description` preserves all analysis data (`business_profile_insights`, `capabilities`, etc.)

## Account Endpoints

### AI Generate Target Account Profile

- **Demo**: `POST /demo/accounts/generate-ai`
- **Production**: `POST /api/accounts/generate-ai`

**Request Body**:
```json
{
  "website_url": "https://example.com",
  "account_profile_name": "Mid-market SaaS companies",
  "hypothesis": "User's reasoning about the profile",
  "additional_context": "Optional additional context",
  "company_context": { /* ... */ }
}
```

**Response**: (see TargetAccountResponse schema)

### Account CRUD

- **Create**: `POST /api/accounts`
- **List**: `GET /api/accounts`
- **Retrieve**: `GET /api/accounts/{account_id}`
- **Update**: `PUT /api/accounts/{account_id}`
- **Delete**: `DELETE /api/accounts/{account_id}`

## Persona Endpoints

### AI Generate Target Persona Profile

- **Demo**: `POST /demo/personas/generate-ai`
- **Production**: `POST /api/personas/generate-ai`

**Request Body**:
```json
{
  "website_url": "https://example.com",
  "persona_profile_name": "VP of Engineering",
  "hypothesis": "Why this persona is ideal",
  "additional_context": "Optional persona hints",
  "company_context": { /* ... */ },
  "target_account_context": { /* ... */ }
}
```

**Response**: (see TargetPersonaResponse schema)

### Persona CRUD

- **Create**: `POST /api/personas`
- **List**: `GET /api/personas`
- **Retrieve**: `GET /api/personas/{persona_id}`
- **Update**: `PUT /api/personas/{persona_id}`
- **Delete**: `DELETE /api/personas/{persona_id}`

## Campaign Endpoints

### AI Generate Email Campaign

- **Demo**: `POST /demo/campaigns/generate-ai`
- **Production**: `POST /api/campaigns/generate-ai`

**Request Body**:
```json
{
  "company_context": { /* ... */ },
  "target_account": { /* ... */ },
  "target_persona": { /* ... */ },
  "preferences": { /* ... */ }
}
```

**Response**: (see EmailGenerationResponse schema)

### Campaign CRUD

- **Create**: `POST /api/campaigns`
- **List**: `GET /api/campaigns`
- **Retrieve**: `GET /api/campaigns/{campaign_id}`
- **Update**: `PUT /api/campaigns/{campaign_id}`
- **Delete**: `DELETE /api/campaigns/{campaign_id}`

---

## User Management Endpoints

### **🔴 TODO: User Registration**

Create new user account and generate API key.

**Endpoint**: `POST /auth/signup` *(Not implemented)*

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "company": "Optional company name"
}
```

**Expected Response**:
```json
{
  "user_id": "user_1234567890",
  "email": "user@example.com",
  "api_key": "bls_1234567890abcdef...",
  "key_prefix": "bls_1234",
  "tier": "free",
  "rate_limits": {
    "requests_per_hour": 100,
    "requests_per_day": 1000
  }
}
```

### **✅ Validate API Key**

Validate an API key and return user information.

**Endpoint**: `POST /auth/validate` 

**Request Body**:
```json
{
  "api_key": "bls_1234567890abcdef..."
}
```

**Response**:
```json
{
  "valid": true,
  "user_id": "user_1234567890",
  "email": "user@example.com",
  "tier": "free",
  "rate_limits": {
    "requests_remaining": 95,
    "reset_time": "2025-07-05T15:30:00Z"
  }
}
```

### **🔴 TODO: Save Analysis**

Save analysis results to user account for persistence.

**Endpoint**: `POST /api/user/analyses` *(Not implemented)*

**Request Body**:
```json
{
  "analysis_type": "company_overview",
  "website_url": "https://example.com",
  "analysis_data": "Complete analysis JSON",
  "name": "Optional name for saved analysis"
}
```

---

## Data Export Endpoints

### **🔴 TODO: Export Analysis**

Generate formatted exports of analysis data.

**Endpoint**: `POST /api/export/{analysis_id}` *(Not implemented)*

**Request Body**:
```json
{
  "format": "pdf" | "csv" | "json",
  "sections": ["company_overview", "target_accounts", "personas"],
  "template": "standard" | "detailed" | "summary"
}
```

**Expected Response**:
```json
{
  "export_id": "exp_1234567890",
  "download_url": "https://api.example.com/downloads/exp_1234567890.pdf",
  "expires_at": "2025-07-06T12:00:00Z",
  "file_size": "2.4MB"
}
```

### **🔴 TODO: Create Share Link**

Generate shareable read-only links for analysis results.

**Endpoint**: `POST /api/share/{analysis_id}` *(Not implemented)*

**Request Body**:
```json
{
  "expires_in": "7d" | "30d" | "never",
  "password_protected": true,
  "allowed_sections": ["company_overview", "target_accounts"]
}
```

---

## System Endpoints

### **✅ Health Check**

Check API health and service status.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "llm_providers": {
      "openai": "available",
      "anthropic": "available", 
      "google": "available"
    },
    "website_scraper": "available"
  },
  "timestamp": "2025-07-05T12:00:00Z"
}
```

### **🔴 TODO: Usage Statistics**

Get API usage statistics for authenticated user.

**Endpoint**: `GET /api/usage` *(Not implemented)*

**Response**:
```json
{
  "current_period": {
    "requests_made": 45,
    "requests_limit": 100,
    "reset_time": "2025-07-05T15:00:00Z"
  },
  "historical": {
    "total_requests": 342,
    "analyses_generated": 23,
    "campaigns_created": 8
  }
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "detail": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "field_errors": {
    "website_url": ["Invalid URL format"]
  },
  "retry_after": "30s" // For rate limiting errors
}
```

### Common Error Codes
- `INVALID_URL`: Website URL format is invalid
- `WEBSITE_UNREACHABLE`: Cannot access the provided website
- `RATE_LIMIT_EXCEEDED`: Too many requests (429 status)
- `INVALID_API_KEY`: API key is invalid or expired (401 status)
- `INSUFFICIENT_CONTEXT`: Not enough context to generate analysis
- `AI_SERVICE_UNAVAILABLE`: All LLM providers are temporarily unavailable
- `CONTENT_PROCESSING_FAILED`: Website content could not be processed

### Rate Limiting Responses
```json
{
  "detail": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED", 
  "retry_after": "3600s",
  "rate_limit": {
    "limit": 10,
    "remaining": 0,
    "reset": "2025-07-05T13:00:00Z"
  }
}
```

## Frontend Integration Examples

### Basic Analysis Flow
```javascript
// Start company analysis
const response = await fetch('/demo/companies/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    website_url: 'https://example.com',
    user_inputted_context: 'Optional context'
  })
});

const companyData = await response.json();

// Generate target account
const accountResponse = await fetch('/demo/accounts/generate-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account_profile_name: 'Mid-market SaaS companies',
    hypothesis: 'Companies with 100-500 employees'
  })
});

// Store in localStorage for session persistence
localStorage.setItem('company_analysis', JSON.stringify(companyData));
```

### Field-Preserving Updates (July 2025)
```javascript
// Safe partial update - preserves all existing analysis data
const updateCompany = async (companyId, updates) => {
  const response = await fetch(`/api/companies/${companyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: updates.name,
      data: {
        description: updates.description,
        company_name: updates.name,
        // Backend automatically preserves all other fields:
        // business_profile_insights, capabilities, positioning_insights, etc.
      }
    })
  });
  
  return response.json();
};

// Frontend service layer usage
import { updateCompanyPreserveFields } from '../lib/companyService';

const handleEdit = async (updates) => {
  const savedCompany = await updateCompanyPreserveFields(
    companyId,
    currentCompany, // Complete current entity data
    updates // Only the fields being updated
  );
  
  // All existing analysis data is preserved
  console.log('Preserved fields:', Object.keys(savedCompany.data));
};
```

### Authenticated Requests
```javascript
// Using API key for production endpoints
const response = await fetch('/api/company', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({ website_url: url })
});

// Check rate limits
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');
```

### Error Handling
```javascript
try {
  const response = await fetch('/demo/company', options);
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 429) {
      // Handle rate limiting
      const retryAfter = error.retry_after;
      showRateLimitMessage(retryAfter);
    } else if (response.status === 400) {
      // Handle validation errors
      showValidationErrors(error.field_errors);
    } else {
      // Handle other errors
      showGenericError(error.detail);
    }
    return;
  }
  
  const data = await response.json();
  handleSuccessfulResponse(data);
  
} catch (networkError) {
  showNetworkError();
}
```

## July 2025 Updates Summary

### Key Changes
1. **Data Model Flattening**: AI-generated complex objects now returned as `List[str]` for UI compatibility
2. **Field Preservation**: All PUT endpoints preserve existing fields not included in request body
3. **Modal Logic**: Centralized modal management prevents duplicate state bugs
4. **Endpoint URLs**: Corrected demo endpoint paths to use `/generate-ai` subroute

### Migration Notes
- **Frontend**: Update components to handle flattened data structures
- **Backend**: Use field-preserving update patterns for all entity modifications
- **Testing**: Verify partial updates preserve all existing analysis data

### Reference Implementation
- **Company Entity**: Serves as reference for field preservation and data flattening patterns
- **Service Layer**: `updateEntityPreserveFields` functions for safe partial updates
- **Hook Layer**: `useUpdateEntityPreserveFields` hooks for React integration

This API reference provides everything a frontend developer needs to integrate with both current and planned Blossomer GTM API endpoints, including the July 2025 architectural improvements.