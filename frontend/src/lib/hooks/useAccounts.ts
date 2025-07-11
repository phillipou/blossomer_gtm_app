import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccount,
  generateAccount,
  normalizeAccountResponse,
  updateAccountPreserveFields,
  updateAccountListFieldsPreserveFields,
} from '../accountService';
import type { Account, AccountCreate, AccountUpdate, TargetAccountAPIRequest, TargetAccountResponse } from '../../types/api';

// Standardized query keys for consistency
const ACCOUNTS_LIST_KEY = 'accounts';
const ACCOUNT_DETAIL_KEY = 'account';

// Cache validation utility - Stage 3 improvement
const validateCacheState = (queryClient: any, entityId: string) => {
  const cached = queryClient.getQueryData([ACCOUNT_DETAIL_KEY, entityId]);
  console.log('[CACHE-VALIDATION] Account cache state:', {
    entityId,
    exists: !!cached,
    format: cached ? {
      hasTargetAccountName: !!(cached as any).targetAccountName,
      hasName: !!(cached as any).name,
      topLevelKeys: Object.keys(cached as any),
      isNormalized: !Object.keys(cached as any).some((k: string) => k.includes('_')),
      fieldCount: Object.keys(cached as any).length
    } : null,
    timestamp: new Date().toISOString()
  });
  return cached;
};

// Cache consistency test - Stage 3 improvement
export const testCachePatterns = (queryClient: any, accountId: string) => {
  console.log('[CACHE-TEST] Testing cache invalidation and refresh patterns:', { accountId });
  
  // Test 1: Check if account exists in cache
  const detailCached = queryClient.getQueryData([ACCOUNT_DETAIL_KEY, accountId]);
  
  // Test 2: Check if accounts list exists for any company
  const allQueries = queryClient.getQueryCache().getAll();
  const accountsListQueries = allQueries.filter((query: any) => 
    query.queryKey[0] === ACCOUNTS_LIST_KEY
  );
  
  console.log('[CACHE-TEST] Cache pattern results:', {
    detailExists: !!detailCached,
    listQueriesCount: accountsListQueries.length,
    cacheConsistency: detailCached ? 'normalized' : 'missing',
    queryKeysUsed: {
      detail: [ACCOUNT_DETAIL_KEY, accountId],
      lists: accountsListQueries.map((q: any) => q.queryKey)
    }
  });
  
  return {
    detailExists: !!detailCached,
    listQueriesCount: accountsListQueries.length,
    isConsistent: !!detailCached && !Object.keys(detailCached).some((k: string) => k.includes('_'))
  };
};

export function useGenerateAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<TargetAccountResponse, Error, TargetAccountAPIRequest>({
    mutationFn: (request) => generateAccount(request, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_LIST_KEY, companyId] });
    },
  });
}

export function useGetAccounts(companyId: string, token?: string | null) {
  return useQuery<Account[], Error>({
    queryKey: [ACCOUNTS_LIST_KEY, companyId],
    queryFn: () => getAccounts(companyId, token),
    enabled: !!companyId && !!token,
  });
}

export function useCreateAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Account, Error, AccountCreate>({
    mutationFn: (accountData) => createAccount(companyId, accountData, token),
    onSuccess: (savedAccount) => {
      const normalized = normalizeAccountResponse(savedAccount);
      console.log('[NORMALIZE] (onCreateSuccess) Normalized account:', normalized);
      
      // Invalidate list and set detail cache - Stage 3 consistency
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_LIST_KEY, companyId] });
      queryClient.setQueryData([ACCOUNT_DETAIL_KEY, normalized.id], normalized);
      
      // Validate cache state
      validateCacheState(queryClient, normalized.id);
    },
  });
}

export function useUpdateAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Account, Error, { accountId: string; data: AccountUpdate }>({
    mutationFn: ({ accountId, data }) => updateAccount(accountId, data, token),
    onSuccess: (savedAccount) => {
      const normalized = normalizeAccountResponse(savedAccount);
      console.log('[NORMALIZE] (onUpdateSuccess) Normalized account:', normalized);
      
      // Set detail cache and validate - Stage 3 consistency
      queryClient.setQueryData([ACCOUNT_DETAIL_KEY, normalized.id], normalized);
      validateCacheState(queryClient, normalized.id);
    },
  });
}

export function useDeleteAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (accountId) => deleteAccount(accountId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_LIST_KEY, companyId] });
    },
  });
}

export function useGetAccount(accountId: string | undefined, token?: string | null) {
  return useQuery<Account, Error>({
    queryKey: [ACCOUNT_DETAIL_KEY, accountId],
    queryFn: () => getAccount(accountId!, token),
    enabled: !!accountId && accountId !== 'new' && !!token,
  });
}

// Version for useEntityPage compatibility (token first, then entityId)
export function useGetAccountForEntityPage(token?: string | null, entityId?: string) {
  return useQuery<Account, Error>({
    queryKey: [ACCOUNT_DETAIL_KEY, entityId],
    queryFn: () => getAccount(entityId!, token),
    enabled: !!entityId && entityId !== 'new' && !!token,
  });
}

// Version for useEntityPage compatibility (useGetList with just token)
export function useGetAccountsForEntityPage(token?: string | null) {
  // Return a dummy result to prevent redirect logic from triggering
  // We don't actually need the list for account detail pages
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

// =================================================================
// Field-Preserving Update Hooks (for Entity Abstraction)
// =================================================================

export function useUpdateAccountPreserveFields(token?: string | null, accountId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Account,
    Error,
    { currentAccount: any; updates: { name?: string; description?: string; [key: string]: any } }
  >({
    mutationFn: ({ currentAccount, updates }) => 
      updateAccountPreserveFields(accountId!, currentAccount, updates, token),
    onSuccess: (savedAccount) => {
      console.log('[PRESERVE-FIELDS] Account updated with field preservation:', savedAccount);
      
      // Use consistent key and validate cache - Stage 3 improvement
      queryClient.setQueryData([ACCOUNT_DETAIL_KEY, accountId], savedAccount);
      validateCacheState(queryClient, accountId!);
    },
  });
}

export function useUpdateAccountListFieldsPreserveFields(token?: string | null, accountId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Account, 
    Error, 
    { currentAccount: any; listFieldUpdates: Record<string, string[]> }
  >({
    mutationFn: ({ currentAccount, listFieldUpdates }) => 
      updateAccountListFieldsPreserveFields(accountId!, currentAccount, listFieldUpdates, token),
    onSuccess: (savedAccount) => {
      console.log('[PRESERVE-LIST-FIELDS] Account list fields updated with field preservation:', savedAccount);
      
      // Use consistent key and validate cache - Stage 3 improvement
      queryClient.setQueryData([ACCOUNT_DETAIL_KEY, accountId], savedAccount);
      validateCacheState(queryClient, accountId!);
    },
  });
}
