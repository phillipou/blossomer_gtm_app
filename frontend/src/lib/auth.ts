// Authentication utilities and API client updates
import { useUser, useStackApp } from '@stackframe/react'
import { useEffect, useState, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DraftManager } from './draftManager';

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

// Global auth state store for non-component usage
let globalAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
  userInfo: null
};

// Function to update global auth state (called from useAuthState hook)
export function updateGlobalAuthState(state: AuthState) {
  globalAuthState = state;
}

// Get auth state using Stack Auth
export function getAuthState(): AuthState {
  // Return the global auth state that's updated by the hook
  return globalAuthState;
}

// Hook version for React components
export function useAuthState(): AuthState & { loading: boolean } {
  const user = useUser();
  const app = useStackApp();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Use optional QueryClient to avoid circular dependency with UserScopedQueryClientProvider
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    // QueryClient not available yet (during provider initialization)
    queryClient = null;
  }
  // REMOVED: prevAuthState ref no longer needed after eliminating problematic useEffect

  useEffect(() => {
    let isMounted = true;
    async function fetchToken() {
      setLoading(true);
      if (user && typeof user.getAuthJson === 'function') {
        try {
          const { accessToken } = await user.getAuthJson();
          if (isMounted) setToken(accessToken || null);
        } catch {
          if (isMounted) setToken(null);
        }
      } else {
        if (isMounted) setToken(null);
      }
      if (isMounted) setLoading(false);
    }
    fetchToken();
    return () => { isMounted = false; };
  }, [user]);

  const authState = useMemo(() => user ? {
    isAuthenticated: true,
    token,
    userInfo: {
      user_id: user.id,
      email: user.primaryEmail || '',
      name: user.displayName || undefined,
    }
  } : {
    isAuthenticated: false,
    token: null,
    userInfo: null
  }, [user, token]);

  // Update global auth state whenever local state changes
  useEffect(() => {
    updateGlobalAuthState(authState);
  }, [authState]);

  // REMOVED: Following Issue #20/#21 pattern - eliminate problematic useEffect causing infinite loops
  // The auth state transition and cache clearing logic was causing infinite re-renders
  // Cache clearing will be handled elsewhere or by React Query's built-in mechanisms

  return { ...authState, loading };
}

// New hook: useAsyncAuthToken
// Returns { token, loading } for use in components
export function useAsyncAuthToken() {
  const user = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchToken() {
      setLoading(true);
      if (user && typeof user.getAuthJson === 'function') {
        try {
          const { accessToken } = await user.getAuthJson();
          if (isMounted) setToken(accessToken || null);
        } catch (e) {
          if (isMounted) setToken(null);
        }
      } else {
        if (isMounted) setToken(null);
      }
      if (isMounted) setLoading(false);
    }
    fetchToken();
    return () => { isMounted = false; };
  }, [user]);

  return { token, loading };
}

// These functions are no longer needed with Stack Auth integration
// but keeping for backward compatibility during migration

// Check if user should use authenticated endpoints
export function shouldUseAuthenticatedEndpoints(): boolean {
  // Use /api only if authenticated
  const authState = getAuthState();
  return !!authState.isAuthenticated && !!authState.token;
}

// Get API base path (demo vs authenticated)
export function getApiBasePath(): string {
  return shouldUseAuthenticatedEndpoints() ? '/api' : '/demo';
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