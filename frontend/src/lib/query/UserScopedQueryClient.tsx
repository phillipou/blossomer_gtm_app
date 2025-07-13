/**
 * User-Scoped Query Client Provider
 * 
 * Implements cache segregation between playground and authenticated users.
 * Each authenticated user gets their own cache scope with `db_${userId}` prefixes.
 * Playground users use unprefixed keys.
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAuthState } from '../auth.js';

interface UserScopedQueryContextType {
  getScopedKey: (baseKey: string[]) => string[];
  clearUserCache: () => void;
  clearPlaygroundCache: () => void;
}

const UserScopedQueryContext = createContext<UserScopedQueryContextType | null>(null);

interface UserScopedQueryClientProviderProps {
  children: React.ReactNode;
  client: QueryClient;
}

export function UserScopedQueryClientProvider({ children, client }: UserScopedQueryClientProviderProps) {
  const { isAuthenticated, userInfo } = useAuthState();

  const contextValue = useMemo(() => {
    const getScopedKey = (baseKey: string[]): string[] => {
      if (isAuthenticated && userInfo?.user_id) {
        // Authenticated users get db_${userId} prefix
        return [`db_${userInfo.user_id}`, ...baseKey];
      } else {
        // Playground users use unprefixed keys
        return baseKey;
      }
    };

    const clearUserCache = () => {
      if (isAuthenticated && userInfo?.user_id) {
        // Clear only this user's cache entries
        const userPrefix = `db_${userInfo.user_id}`;
        client.getQueryCache().findAll().forEach(query => {
          const queryKey = query.queryKey;
          if (Array.isArray(queryKey) && queryKey[0] === userPrefix) {
            client.removeQueries({ queryKey });
          }
        });
        console.log(`✅ Cleared cache for user: ${userInfo.user_id}`);
      }
    };

    const clearPlaygroundCache = () => {
      // Clear only playground cache entries (unprefixed)
      client.getQueryCache().findAll().forEach(query => {
        const queryKey = query.queryKey;
        if (Array.isArray(queryKey) && !queryKey[0]?.toString().startsWith('db_')) {
          client.removeQueries({ queryKey });
        }
      });
      console.log('✅ Cleared playground cache');
    };

    return {
      getScopedKey,
      clearUserCache,
      clearPlaygroundCache
    };
  }, [isAuthenticated, userInfo?.user_id, client]);

  return (
    <QueryClientProvider client={client}>
      <UserScopedQueryContext.Provider value={contextValue}>
        {children}
      </UserScopedQueryContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * Hook to get user-scoped query keys and cache management utilities
 */
export function useUserScopedQuery() {
  const context = useContext(UserScopedQueryContext);
  if (!context) {
    throw new Error('useUserScopedQuery must be used within UserScopedQueryClientProvider');
  }
  return context;
}

/**
 * Helper hook for creating user-scoped query keys
 * Usage: const queryKey = useQueryKey(['companies']) 
 * Result: ['db_user123', 'companies'] for authenticated users or ['companies'] for playground
 */
export function useQueryKey(baseKey: string[]): string[] {
  const { getScopedKey } = useUserScopedQuery();
  return useMemo(() => getScopedKey(baseKey), [getScopedKey, baseKey]);
}

/**
 * Enhanced auth state change handler with selective cache clearing
 */
export function useAuthAwareCacheManagement() {
  const { isAuthenticated, userInfo } = useAuthState();
  const { clearUserCache, clearPlaygroundCache } = useUserScopedQuery();
  const queryClient = useQueryClient();

  useEffect(() => {
    // This hook handles cache clearing based on auth state transitions
    // The actual auth state change detection happens in auth.ts
    // This just provides the clearing utilities
  }, [isAuthenticated, userInfo, clearUserCache, clearPlaygroundCache, queryClient]);

  return {
    clearUserCache,
    clearPlaygroundCache,
    clearAllCache: () => queryClient.clear()
  };
}