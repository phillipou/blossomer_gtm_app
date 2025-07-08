// Authentication utilities and API client updates

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
  apiKey: string | null
  userInfo: UserInfo | null
}

// Storage keys
const AUTH_STORAGE_KEY = 'blossomer_auth'
const API_KEY_STORAGE_KEY = 'blossomer_api_key'

// Get auth state from localStorage
export function getAuthState(): AuthState {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY)
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
    
    if (authData && apiKey) {
      const userInfo = JSON.parse(authData)
      return {
        isAuthenticated: true,
        apiKey,
        userInfo
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error)
  }
  
  return {
    isAuthenticated: false,
    apiKey: null,
    userInfo: null
  }
}

// Save auth state to localStorage
export function setAuthState(apiKey: string, userInfo: UserInfo): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userInfo))
  } catch (error) {
    console.error('Error saving auth state:', error)
  }
}

// Clear auth state
export function clearAuthState(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing auth state:', error)
  }
}

// Validate API key with backend
export async function validateApiKey(apiKey: string): Promise<UserInfo> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
  
  const response = await fetch(`${baseUrl}/auth/validate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Invalid API key')
  }

  return response.json()
}

// Create authenticated fetch function
export function createAuthenticatedFetch() {
  const authState = getAuthState()
  
  return async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authorization header if authenticated
    if (authState.isAuthenticated && authState.apiKey) {
      headers['Authorization'] = `Bearer ${authState.apiKey}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }
}

// Check if user should use authenticated endpoints
export function shouldUseAuthenticatedEndpoints(): boolean {
  const authState = getAuthState()
  return authState.isAuthenticated && authState.apiKey !== null
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