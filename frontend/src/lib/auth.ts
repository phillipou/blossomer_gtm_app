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
  apiKey: string | null
  userInfo: UserInfo | null
}

// Global auth state store for non-component usage
let globalAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
  apiKey: null,
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
    apiKey: token, // For compatibility with useAuth hook
    userInfo: {
      user_id: user.id,
      email: user.primaryEmail || '',
      name: user.displayName || undefined,
    }
  } : {
    isAuthenticated: false,
    token: null,
    apiKey: null,
    userInfo: null
  }, [user, token]);

  // Update global auth state whenever local state changes
  useEffect(() => {
    updateGlobalAuthState(authState);
  }, [authState]);

  // Auth state transition detection with selective cache clearing
  const prevAuthState = useRef<AuthState | null>(null);
  
  useEffect(() => {
    // Only handle auth transitions, not every auth state change
    if (prevAuthState.current !== null) {
      const wasAuthenticated = prevAuthState.current.isAuthenticated;
      const isNowAuthenticated = authState.isAuthenticated;
      const wasUserId = prevAuthState.current.userInfo?.user_id;
      const currentUserId = authState.userInfo?.user_id;
      
      // Handle auth state transitions with selective cache clearing
      if (wasAuthenticated !== isNowAuthenticated || wasUserId !== currentUserId) {
        console.log('🔄 Auth state transition detected:', {
          from: wasAuthenticated ? 'authenticated' : 'unauthenticated',
          to: isNowAuthenticated ? 'authenticated' : 'unauthenticated',
          userChanged: wasUserId !== currentUserId,
          userInfo: authState.userInfo
        });
        
        // Clear drafts and cache based on transition type
        handleAuthTransition(wasAuthenticated, isNowAuthenticated, queryClient);
      }
    }
    
    prevAuthState.current = authState;
  }, [authState.isAuthenticated, authState.userInfo?.user_id, queryClient]);

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

/**
 * Handle authentication state transitions with appropriate cache clearing
 * Implements selective cache management to prevent database sync issues
 */
function handleAuthTransition(
  wasAuthenticated: boolean, 
  isNowAuthenticated: boolean, 
  queryClient: any
) {
  if (!wasAuthenticated && isNowAuthenticated) {
    // User logged in/signed up - clear playground data to prevent contamination
    console.log('🚨 Login/Signup: AGGRESSIVE cache clearing to prevent database sync issues');
    
    // Clear ALL playground localStorage data
    DraftManager.clearAllPlayground();
    
    // Clear ALL cached queries that might have playground data
    queryClient.getQueryCache().findAll().forEach((query: any) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && !queryKey[0]?.toString().startsWith('db_')) {
        console.log('🗑️ Removing playground cache:', queryKey);
        queryClient.removeQueries({ queryKey });
      }
    });
    
    console.log('✅ Login cache clearing complete - playground data removed');
    
  } else if (wasAuthenticated && !isNowAuthenticated) {
    // User logged out - clear only user-specific cache, preserve playground
    console.log('✅ Logout: Clearing user cache, preserving playground data');
    
    // Clear user-specific cached queries
    queryClient.getQueryCache().findAll().forEach((query: any) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0]?.toString().startsWith('db_')) {
        console.log('🗑️ Removing user cache:', queryKey);
        queryClient.removeQueries({ queryKey });
      }
    });
    
    // Don't clear playground drafts - user might want to continue in playground
  }
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

// Legacy functions for backward compatibility with useAuth hook
export function setAuthState(apiKey: string, userInfo: UserInfo) {
  // Store auth state in localStorage for persistence
  const authData = { apiKey, userInfo }
  localStorage.setItem('authState', JSON.stringify(authData))
}

export function clearAuthState() {
  // Clear auth state from localStorage
  localStorage.removeItem('authState')
}

export async function validateApiKey(apiKey: string): Promise<UserInfo> {
  // This would typically validate the API key with the backend
  // For now, return a placeholder implementation
  throw new Error('API key validation not implemented with Stack Auth')
}