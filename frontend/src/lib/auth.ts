// Authentication utilities and API client updates
import { useUser, useStackApp } from '@stackframe/react'

export interface UserInfo {
  user_id: string
  email: string
  name?: string
  tier?: string
  rate_limit_exempt?: boolean
  created_at?: string
  last_used?: string
}

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  userInfo: UserInfo | null
}

// Get auth state using Stack Auth
export function getAuthState(): AuthState {
  // This function needs to be called from within a React component
  // We'll create a hook version for components and a fallback for non-component usage
  try {
    // Check if we're in a browser environment and have access to Stack Auth
    if (typeof window !== 'undefined') {
      // For now, return fallback state - we'll use the hook version in components
      return {
        isAuthenticated: false,
        token: null,
        userInfo: null
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error)
  }
  
  return {
    isAuthenticated: false,
    token: null,
    userInfo: null
  }
}

// Hook version for React components
export function useAuthState(): AuthState {
  const user = useUser()
  const app = useStackApp()
  
  if (user) {
    return {
      isAuthenticated: true,
      token: user.accessToken || null,
      userInfo: {
        user_id: user.id,
        email: user.primaryEmail || '',
        name: user.displayName || undefined,
      }
    }
  }
  
  return {
    isAuthenticated: false,
    token: null,
    userInfo: null
  }
}

// These functions are no longer needed with Stack Auth integration
// but keeping for backward compatibility during migration

// Check if user should use authenticated endpoints
export function shouldUseAuthenticatedEndpoints(): boolean {
  // Enable authenticated endpoints now that Stack Auth is integrated
  // This will route to /api/* instead of /demo/* when user is authenticated
  return true
}

// Get API base path (demo vs authenticated)
export function getApiBasePath(): string {
  return shouldUseAuthenticatedEndpoints() ? '/api' : '/demo'
}

// Rate limit helper - check headers from API responses
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export function parseRateLimitHeaders(response: Response): RateLimitInfo | null {
  const limit = response.headers.get('X-RateLimit-Limit')
  const remaining = response.headers.get('X-RateLimit-Remaining')
  const reset = response.headers.get('X-RateLimit-Reset')
  const retryAfter = response.headers.get('Retry-After')

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    }
  }

  return null
}