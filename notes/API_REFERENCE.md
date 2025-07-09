# Blossomer GTM API - API Reference

*Last updated: July 5, 2025*

## Overview

This API reference provides complete documentation for frontend integration with the Blossomer GTM API. It includes both implemented endpoints and planned endpoints marked with TODO status.

### Base URLs
- **Development**: `http://localhost:8000`
- **Production**: `https://blossomer-gtm-app.onrender.com`

### API Structure
- **Demo endpoints**: `/demo/*` - No authentication, IP rate limited
- **Production endpoints**: `/api/*` - API key required
- **Admin endpoints**: `/admin/*` - Admin access only

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

## Company Analysis Endpoints

### **✅ Generate Company Overview**

Generate comprehensive company analysis from website URL.

**Endpoint**: `POST /demo/company` or `POST /api/company`

**Request Body**:
```json
{
  "website_url": "https://example.com",
  "user_inputted_context": "Optional context about the company or product",
  "company_context": "Optional existing company analysis data"
}
```

**Response**:
```json
{
  "company_name": "Example Corp",
  "company_url": "https://example.com",
  "company_overview": "2-3 sentence summary of what the company does and their focus",
  "capabilities": [
    "Core technical capability 1",
    "Platform feature 2",
    "Key functionality 3"
  ],
  "business_model": [
    "SaaS subscription model",
    "Enterprise pricing tiers",
    "Usage-based billing"
  ],
  "differentiated_value": [
    "Unique approach or technology",
    "Market positioning advantage",
    "Proprietary feature set"
  ],
  "customer_benefits": [
    "Expected ROI or efficiency gain",
    "Problem resolution outcome",
    "Value delivery metric"
  ],
  "alternatives": [
    "Competitor 1 - similar features, different pricing",
    "Competitor 2 - broader platform, less specialized"
  ],
  "testimonials": [
    "\"Direct customer quote from website\" - Customer Name, Company",
    "\"Another testimonial with attribution\" - Name, Role"
  ],
  "product_description": "Main product summary and core value proposition",
  "key_features": [
    "Feature 1 with brief description",
    "Feature 2 with benefit explanation"
  ],
  "company_profiles": [
    "Mid-market SaaS companies",
    "Enterprise software vendors"
  ],
  "persona_profiles": [
    "VP of Engineering",
    "Head of Operations"
  ],
  "use_cases": [
    "Use case 1 explicitly mentioned on website",
    "Use case 2 from customer examples"
  ],
  "pain_points": [
    "Pain point 1 addressed by the product",
    "Challenge 2 solved by the platform"
  ],
  "pricing": "Pricing model description if available",
  "confidence_scores": {
    "company_name": 0.95,
    "company_overview": 0.87,
    "capabilities": 0.92,
    "business_model": 0.78,
    "differentiated_value": 0.81,
    "customer_benefits": 0.76,
    "alternatives": 0.69,
    "testimonials": 0.88,
    "product_description": 0.89,
    "key_features": 0.93,
    "company_profiles": 0.72,
    "persona_profiles": 0.74,
    "use_cases": 0.85,
    "pain_points": 0.79,
    "pricing": 0.65
  },
  "metadata": {
    "sources_used": ["website", "user_input"],
    "context_quality": "high",
    "assessment_summary": "Comprehensive website data with clear product positioning",
    "processing_time": "18.3s"
  }
}
```

**Error Responses**:
```json
{
  "detail": "Invalid website URL format",
  "error_code": "INVALID_URL"
}
```

```json
{
  "detail": "Website unreachable or blocked",
  "error_code": "WEBSITE_UNREACHABLE"
}
```

---

## Customer Analysis Endpoints

### **✅ Generate Target Accounts**

Generate ideal customer account profiles with firmographics and buying signals.

**Endpoint**: `POST /demo/accounts` or `POST /api/accounts`

**Request Body**:
```json
{
  "account_profile_name": "Mid-market SaaS companies",
  "hypothesis": "User's reasoning about the profile",
  "additional_context": "Optional additional context"
}
```

**Response**:
```json
{
  "targetCompanyName": "Mid-Market SaaS Companies",
  "targetCompanyDescription": "A brief description of the target company profile.",
  "firmographics": {
    "industry": ["SaaS", "Software"],
    "companySize": {
      "employees": "100-500",
      "revenue": "$10M-$50M"
    },
    "geography": ["North America", "Europe"],
    "businessModel": ["B2B", "Subscription"],
    "fundingStage": ["Series A", "Series B"]
  },
  "buyingSignals": {
    "growthIndicators": ["Recent funding", "Hiring key roles"],
    "technologySignals": ["Using specific tech stack"],
    "organizationalSignals": ["New executive leadership"],
    "marketSignals": ["Regulatory changes"]
  },
  "rationale": "A detailed explanation of why this profile is a good target.",
  "metadata": {
    "context_quality": "high",
    "primary_context_source": "user",
    "assessment_summary": "Summary of the context assessment.",
    "sources_used": ["user_input", "company_context"]
  }
}
```

### **✅ Generate Target Personas**

Generate detailed buyer personas with responsibilities, pain points, and buying criteria.

**Endpoint**: `POST /demo/personas` or `POST /api/personas`

**Request Body**:
```json
{
  "website_url": "https://example.com",
  "user_inputted_context": "Optional persona hints",
  "company_context": "Optional company analysis data",
  "target_account_context": "Optional target account data"
}
```

**Response**:
```json
{
  "persona": "VP of Engineering",
  "persona_attributes": [
    "Senior engineering leadership role",
    "Responsible for team productivity and delivery",
    "Budget authority for development tools",
    "Reports to CTO or CEO"
  ],
  "persona_buying_signals": [
    "Seeking tools to improve team efficiency",
    "Evaluating development workflow solutions",
    "Attending engineering leadership conferences",
    "Active on engineering management forums"
  ],
  "rationale": "This persona has both the authority to make purchasing decisions and the direct pain points that the product addresses. They're actively seeking solutions to improve engineering team productivity and have budget responsibility for development tools.",
  "metadata": {
    "primary_context_source": "website",
    "context_quality": "high",
    "assessment_summary": "Clear persona indicators from product positioning and testimonials",
    "sources_used": ["website", "company_context"]
  }
}
```

---

## Campaign Management Endpoints

### **🔴 TODO: Generate Campaign Assets**

Generate complete campaign materials based on company and customer analysis.

**Endpoint**: `POST /api/campaigns/generate` *(Not implemented)*

**Request Body**:
```json
{
  "campaign_type": "email_sequence",
  "company_context": "Company analysis data",
  "target_account_context": "Target account data",
  "persona_context": "Persona analysis data",
  "campaign_config": {
    "sequence_length": 3,
    "tone": "professional",
    "focus": "value_proposition"
  }
}
```

**Expected Response**:
```json
{
  "campaign_id": "camp_1234567890",
  "campaign_type": "email_sequence",
  "emails": [
    {
      "step": 1,
      "subject": "Email subject line",
      "body": "Email body content with personalization tokens",
      "personalization_tokens": ["{{company_name}}", "{{first_name}}"],
      "send_delay": "immediate"
    },
    {
      "step": 2,
      "subject": "Follow-up subject",
      "body": "Follow-up email content",
      "personalization_tokens": ["{{company_name}}", "{{pain_point}}"],
      "send_delay": "3_days"
    }
  ],
  "positioning_statements": [
    "Core value proposition statement",
    "Differentiation message",
    "Proof point statement"
  ],
  "call_to_actions": [
    "Primary CTA for each email",
    "Alternative soft CTA options"
  ]
}
```

### **🔴 TODO: Refine Campaign Content**

Refine specific parts of generated campaigns using AI assistance.

**Endpoint**: `PATCH /api/campaigns/{campaign_id}/refine` *(Not implemented)*

**Request Body**:
```json
{
  "section": "email_subject" | "email_body" | "positioning",
  "current_content": "Current content to refine",
  "refinement_prompt": "Make this more compelling for technical buyers",
  "context": "Additional context for refinement"
}
```

### **🔴 TODO: Generate Campaign Variants**

Create A/B test variants for campaign elements.

**Endpoint**: `POST /api/campaigns/{campaign_id}/variants` *(Not implemented)*

**Request Body**:
```json
{
  "element_type": "subject_line" | "email_body" | "cta",
  "variant_style": "more_direct" | "softer_approach" | "value_focused",
  "original_content": "Original content to create variant of"
}
```

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
const response = await fetch('/demo/company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    website_url: 'https://example.com',
    user_inputted_context: 'Optional context'
  })
});

const companyData = await response.json();

// Generate target account
const accountResponse = await fetch('/demo/accounts', {
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

This API reference provides everything a frontend developer needs to integrate with both current and planned Blossomer GTM API endpoints.