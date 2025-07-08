# Authentication System Testing & Integration - Handoff

*Created: July 8, 2025*

## 🎯 What We're Trying to Do

Enable authenticated API endpoints and complete the Stack Auth integration testing. The goal is to move from demo-only usage (`/demo/*` endpoints) to authenticated usage (`/api/*` endpoints) with Stack Auth JWT tokens.

## 🔧 What We've Done and Why

### 1. Enabled Authenticated Endpoints
**File**: `frontend/src/lib/auth.ts`
- ✅ **Changed `shouldUseAuthenticatedEndpoints()`** from `return false` to `return true`
- **Why**: This routes API calls to `/api/*` instead of `/demo/*` endpoints

### 2. Updated API Client to Accept Tokens
**Files**: `frontend/src/lib/apiClient.ts`
- ✅ **Added optional `token` parameter** to `apiFetch()` and `apiFetchWithRateLimit()`
- ✅ **Modified header logic** to use passed token instead of just `authState.token`
- **Why**: The original `getAuthState()` function can't access React hooks outside components, so we need to pass tokens explicitly

**Before**:
```typescript
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T>
```

**After**:
```typescript
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}, token?: string | null): Promise<T>
```

### 3. Updated Service Functions to Accept Tokens
**File**: `frontend/src/lib/accountService.ts`
- ✅ **Added optional `token` parameter** to:
  - `generateTargetCompany()`
  - `generateTargetPersona()` 
  - `generateEmailCampaign()`
- **Why**: These service functions need to pass Stack Auth tokens to the API client

## 🚧 Current Issue Identified

### Problem: Authentication Failing
**Error**: `POST http://localhost:8000/api/accounts 403 (Forbidden)` with `{detail: 'Not authenticated'}`

**Root Cause**: Components are calling service functions without passing Stack Auth tokens

**Evidence from Console**:
```
apiClient.ts:46  POST http://localhost:8000/api/accounts 403 (Forbidden)
Accounts.tsx:145 [AddAccount] API error: {detail: 'Not authenticated'}
```

**What's Happening**:
1. ✅ Endpoint routing works correctly (calling `/api/accounts` not `/demo/accounts`)
2. ❌ No `Authorization: Bearer <token>` header being sent
3. ❌ Backend correctly rejecting unauthenticated requests

## 🎯 What We Need to Do Next

### Immediate Priority: Fix Token Passing

**1. Update Accounts Component** (`frontend/src/pages/Accounts.tsx`)
```typescript
// Add Stack Auth imports
import { useAuthState } from '../lib/auth'

// In component:
const authState = useAuthState()

// Update API call (line ~116):
const response = await generateTargetCompany(
  overview?.companyUrl.trim() || '',
  name,
  description,
  undefined,
  companyContext,
  authState.token  // ← Add this token parameter
);
```

**2. Update Other Components Using Service Functions**
- Find all components calling `generateTargetPersona()`, `generateEmailCampaign()`
- Add Stack Auth token passing

**3. Test Authentication Flow**
```bash
# 1. Sign in at http://localhost:5173/auth?mode=signin
# 2. Go to Accounts page and try creating a target account
# 3. Check Network tab for Authorization header
# 4. Verify API call succeeds with 200 OK
```

### Secondary Priority: Real JWT Validation

**Backend**: `backend/app/api/routes/neon_auth.py` 
- Replace placeholder `validate_stack_auth_token()` with real Stack Auth JWT validation
- Current: Accepts any token length > 10 characters
- Needed: Verify JWT signature, expiration, extract real user data

## 🔍 How to Test

### Quick Test Checklist
1. **Sign in**: Go to `/auth?mode=signin` and authenticate with Google
2. **Check token**: In browser console, verify `user.accessToken` exists
3. **Try API call**: Create a target account and check Network tab
4. **Expected**: Request should include `Authorization: Bearer <token>` header
5. **Expected**: API call should return 200 OK, not 403 Forbidden

### Debugging Commands
```bash
# Check if user is authenticated
console.log(useUser()) // Should show user object with accessToken

# Check API routing
console.log(getApiBasePath()) // Should return '/api'

# Check auth state
console.log(useAuthState()) // Should show isAuthenticated: true, token: 'jwt...'
```

## 📁 Files Modified This Session

### Core Authentication Logic
- `frontend/src/lib/auth.ts` - Enabled authenticated endpoints
- `frontend/src/lib/apiClient.ts` - Added token parameter support
- `frontend/src/lib/accountService.ts` - Added token parameters to service functions

### Architecture Complete
- Hybrid authentication system (Stack Auth + database) is fully implemented
- Database schema supports Stack Auth user IDs as primary keys
- All documentation updated (ARCHITECTURE.md, DECISIONS.md, PRD.md)

## 🎉 Success Criteria

**Short-term** (next 30 minutes):
- ✅ API calls include Authorization headers
- ✅ Authenticated endpoints return 200 OK instead of 403 Forbidden
- ✅ User can create target accounts while signed in

**Medium-term** (next session):
- ✅ Real Stack Auth JWT validation implemented
- ✅ All components pass tokens correctly
- ✅ Error handling for expired/invalid tokens

## 🔗 Related Documentation

- **ARCHITECTURE.md** - Hybrid authentication architecture details
- **TASKS.md** - Current priorities and completion status
- **PRD.md** - Authentication user experience flow
- **DECISIONS.md** - Decision to use Stack Auth user IDs as primary keys

## 💡 Key Insights

1. **Hybrid approach working**: Stack Auth for identity + database for business logic
2. **Token passing pattern**: Components → Service functions → API client → Backend
3. **Endpoint routing successful**: Demo vs authenticated endpoints working correctly
4. **Next step is simple**: Just need to pass tokens from components to service functions

The authentication architecture is solid and working - we just need to complete the token-passing chain from React components to API calls.