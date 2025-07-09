# API Rate Limiting Design for Stack Auth JWT Tokens

## Executive Summary

This document outlines the design for implementing comprehensive API rate limiting for authenticated users using Stack Auth JWT tokens. The system builds upon existing IP-based demo rate limiting and introduces user-based rate limiting for production endpoints.

## Current State Analysis

### Existing Implementation
- **Demo Rate Limiting**: Fully implemented IP-based rate limiting using `DemoRateLimiter` class
  - Redis-backed with in-memory fallback
  - Per-endpoint and total request limits
  - Configurable windows and limits
  - Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  
- **Authentication**: Stack Auth JWT validation implemented
  - JWT validation in `backend/app/core/auth.py`
  - User ID available via `user['sub']` from decoded JWT payload
  - Applied to production endpoints via `Depends(validate_stack_auth_jwt)`

### Gap Analysis
- **Missing User-Based Rate Limiting**: TODO comments indicate need for JWT user ID rate limiting
- **No Tiered Limits**: All authenticated users have same limits
- **No Redis Integration**: Current system doesn't use Redis for user rate limiting

## Proposed Rate Limiting Architecture

### 1. Multi-Tier Rate Limiting Strategy

#### Tier Structure
```python
RATE_LIMIT_TIERS = {
    "free": {
        "company_generate": {"limit": 10, "window": 3600},      # 10/hour
        "account_generate": {"limit": 20, "window": 3600},      # 20/hour  
        "persona_generate": {"limit": 20, "window": 3600},      # 20/hour
        "campaign_generate": {"limit": 5, "window": 3600},      # 5/hour
        "daily_total": {"limit": 100, "window": 86400},        # 100/day
        "monthly_total": {"limit": 1000, "window": 2592000}    # 1000/month
    },
    "pro": {
        "company_generate": {"limit": 100, "window": 3600},
        "account_generate": {"limit": 200, "window": 3600},
        "persona_generate": {"limit": 200, "window": 3600}, 
        "campaign_generate": {"limit": 50, "window": 3600},
        "daily_total": {"limit": 1000, "window": 86400},
        "monthly_total": {"limit": 10000, "window": 2592000}
    },
    "enterprise": {
        # Higher limits or unlimited for enterprise
        "company_generate": {"limit": 1000, "window": 3600},
        # ... etc
    },
    "admin": {
        # Unlimited access for admins
        "bypass_rate_limiting": True
    }
}
```

### 2. Rate Limiting Implementation

#### Core Components

1. **UserRateLimiter Class**
   ```python
   class UserRateLimiter:
       def __init__(self, redis_url: Optional[str] = None)
       async def check_user_limit(self, user_id: str, endpoint: str, tier: str) -> Tuple[bool, Dict]
       async def get_user_tier(self, user_id: str) -> str  # From user profile/subscription
       async def is_admin(self, user_id: str) -> bool  # Check if user has admin role
   ```

2. **Rate Limiting Dependency**
   ```python
   def jwt_rate_limit_dependency(endpoint: str) -> Callable:
       async def dependency(request: Request, response: Response, user=Depends(validate_stack_auth_jwt)):
           user_id = user['sub']
           
           # Check if user is admin - bypass rate limiting
           if await user_rate_limiter.is_admin(user_id):
               response.headers["X-RateLimit-Bypass"] = "admin"
               return  # Skip rate limiting for admins
           
           # Regular rate limiting for non-admin users
           tier = await user_rate_limiter.get_user_tier(user_id)
           # Check rate limits and set headers
   ```

#### Key Design Decisions

1. **Redis Keys Strategy**
   ```
   user_rate_limit:{endpoint}:{user_id}:{window_start}
   user_rate_limit:daily:{user_id}:{date}
   user_rate_limit:monthly:{user_id}:{year_month}
   user_tier:{user_id}  # Cache user subscription tier
   user_role:{user_id}  # Cache user role (admin check)
   ```

2. **Fallback Strategy**
   - Redis primary, in-memory secondary (like demo limiter)
   - Graceful degradation if Redis unavailable
   - Conservative limits in fallback mode

3. **Headers Strategy** 
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 85
   X-RateLimit-Reset: 1640995200
   X-RateLimit-Tier: free
   X-RateLimit-Scope: endpoint  # or daily/monthly
   X-RateLimit-Bypass: admin    # Only present for admin users
   ```

### 3. Integration Points

#### Database Schema
```sql
-- Add to user/subscription tracking  
ALTER TABLE users ADD COLUMN rate_limit_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
-- Possible roles: 'user', 'admin', 'super_admin'

-- Or integrate with existing subscription system
-- Alternative: Use Stack Auth's built-in role system if available

-- Admin user management
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_rate_limit_tier ON users(rate_limit_tier);
```

#### Environment Configuration
```bash
REDIS_URL=redis://localhost:6379/1
RATE_LIMITING_ENABLED=true
RATE_LIMITING_FALLBACK_MODE=conservative  # or disabled
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. **Create UserRateLimiter class** based on existing DemoRateLimiter
2. **Add Redis dependency** to pyproject.toml (if not present)
3. **Implement JWT rate limiting dependency**
4. **Add user tier resolution logic**

### Phase 2: Endpoint Integration (Week 2) 
1. **Replace TODO comments** with actual rate limiting
2. **Apply to all production endpoints**:
   - `/api/company/` (company generation)
   - `/api/target-accounts/` (account generation) 
   - `/api/target-personas/` (persona generation)
   - `/api/campaigns/` (campaign generation)

### Phase 3: Monitoring & Optimization (Week 3)
1. **Add rate limiting metrics**
2. **Implement rate limit exceeded logging**
3. **Create admin endpoints** for rate limit management
4. **Performance testing** with realistic load

## Technical Considerations

### Performance Impact
- **Redis Latency**: ~1-5ms per rate limit check
- **Caching**: User tier resolution cached in Redis (TTL: 1 hour)
- **Batch Operations**: Pipeline Redis operations where possible

### Security Considerations
- **JWT Validation**: Always validate JWT before rate limiting
- **User ID Extraction**: Use `user['sub']` from validated JWT
- **Anti-Gaming**: Multiple rate limit scopes (endpoint, daily, monthly)

### Error Handling
```python
# Graceful degradation if rate limiting fails
try:
    allowed, info = await user_rate_limiter.check_user_limit(user_id, endpoint, tier)
except Exception as e:
    logger.error(f"Rate limiting error: {e}")
    # Allow request but log for monitoring
    allowed, info = True, default_rate_info
```

## Configuration Examples

### Development Environment
```python
DEV_RATE_LIMITS = {
    "free": {
        "company_generate": {"limit": 1000, "window": 3600},  # Relaxed for dev
        # ...
    }
}
```

### Production Environment  
```python
PROD_RATE_LIMITS = {
    "free": {
        "company_generate": {"limit": 10, "window": 3600},   # Strict limits
        # ...
    }
}
```

## Monitoring & Alerting

### Metrics to Track
- Rate limit hits by endpoint/user/tier
- Redis performance and availability
- Fallback mode usage
- User tier distribution

### Alert Conditions
- High rate of 429 responses (>10% of requests)
- Redis connection failures
- Unusual rate limiting patterns (potential abuse)

## Migration Strategy

### Rollout Plan
1. **Deploy infrastructure** without enforcement (monitoring only)
2. **Enable rate limiting** for new endpoints first
3. **Gradually apply** to existing endpoints
4. **Monitor and adjust** limits based on usage patterns

### Rollback Plan
- Environment variable to disable rate limiting
- Graceful fallback to no rate limiting if Redis fails
- Quick configuration updates without code deployment

## Admin Role Management

### Admin Designation Options

#### Option 1: Database-Based Roles
```python
# In user service/repository
async def is_user_admin(user_id: str) -> bool:
    user = await get_user_by_id(user_id)
    return user.role in ['admin', 'super_admin']

# Admin designation via direct DB update
UPDATE users SET role = 'admin' WHERE id = 'user_123';
```

#### Option 2: Stack Auth Custom Claims (Preferred)
```python
# Use Stack Auth's built-in permission system
async def is_user_admin(user: dict) -> bool:
    # Check JWT custom claims or permissions
    permissions = user.get('permissions', [])
    return 'admin' in permissions or 'rate_limit_bypass' in permissions
```

#### Option 3: Environment-Based Admin List
```python
# For initial admin setup
ADMIN_USER_IDS = os.getenv('ADMIN_USER_IDS', '').split(',')

async def is_user_admin(user_id: str) -> bool:
    return user_id in ADMIN_USER_IDS
```

### Admin Management Endpoints

```python
@router.post("/admin/users/{user_id}/make-admin")
async def make_user_admin(
    user_id: str,
    current_user=Depends(validate_stack_auth_jwt),
    admin_check=Depends(require_admin_role)
):
    """Make a user an admin (admin-only endpoint)"""
    
@router.delete("/admin/users/{user_id}/revoke-admin")  
async def revoke_admin(
    user_id: str,
    current_user=Depends(validate_stack_auth_jwt),
    admin_check=Depends(require_admin_role)
):
    """Revoke admin privileges (admin-only endpoint)"""

@router.get("/admin/rate-limits/stats")
async def get_rate_limit_stats(
    admin_check=Depends(require_admin_role)
):
    """View rate limiting statistics (admin-only)"""
```

### Security Considerations for Admin Bypass

1. **Audit Logging**: Log all admin API usage
2. **Admin Activity Monitoring**: Alert on unusual admin activity  
3. **Principle of Least Privilege**: Minimize number of admins
4. **Admin Session Management**: Consider shorter JWT expiry for admins

## Future Enhancements

### Advanced Features
1. **Burst Allowances**: Allow temporary exceeding of limits
2. **Dynamic Scaling**: Adjust limits based on system load
3. **Geographic Limits**: Different limits by region
4. **API Key Integration**: Rate limiting for API keys vs. user sessions

### Business Logic Integration
1. **Subscription Management**: Automatic tier updates
2. **Usage Analytics**: Detailed usage reporting for users
3. **Billing Integration**: Overage charges for enterprise customers

## Dependencies

### Required Packages
```toml
redis = ">=4.5.0,<5.0.0"  # Add to pyproject.toml
```

### Infrastructure Requirements
- Redis instance (development and production)
- Environment variables for configuration
- Monitoring/logging infrastructure

## Success Criteria

### Technical Metrics
- < 5ms latency added per request for rate limiting
- 99.9% uptime for rate limiting system
- Zero false positives (legitimate requests blocked)

### Business Metrics  
- Prevent API abuse while maintaining user experience
- Enable tiered pricing model based on usage
- Scalable foundation for future growth

---

## Next Steps

1. **Review and approve** this design document
2. **Set up Redis infrastructure** for development and production
3. **Begin Phase 1 implementation** with UserRateLimiter class
4. **Define specific rate limits** based on business requirements
5. **Create monitoring dashboard** for rate limiting metrics

## Questions for Stakeholder Review

1. What are the target rate limits for free vs. paid tiers?
2. Should we implement burst allowances for better UX?
3. What Redis infrastructure do we have available?
4. How should rate limiting integrate with existing subscription management?
5. What monitoring/alerting tools should we integrate with?