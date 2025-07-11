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
import type { Account, AccountCreate, AccountUpdate, TargetCompanyRequest, TargetAccountResponse } from '../../types/api';

const ACCOUNT_QUERY_KEY = 'accounts';

export function useGenerateAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<TargetAccountResponse, Error, TargetCompanyRequest>({
    mutationFn: (request) => generateAccount(request, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNT_QUERY_KEY, companyId] });
    },
  });
}

export function useGetAccounts(companyId: string, token?: string | null) {
  return useQuery<Account[], Error>({
    queryKey: [ACCOUNT_QUERY_KEY, companyId],
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
      queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
      queryClient.setQueryData(['account', normalized.id], normalized);
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
      queryClient.setQueryData(['account', normalized.id], normalized);
    },
  });
}

export function useDeleteAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (accountId) => deleteAccount(accountId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNT_QUERY_KEY, companyId] });
    },
  });
}

export function useGetAccount(accountId: string, token?: string | null) {
  return useQuery<Account, Error>({
    queryKey: ['account', accountId],
    queryFn: () => getAccount(accountId, token),
    enabled: !!accountId && !!token,
  });
}

// =================================================================
// Field-Preserving Update Hooks (for Entity Abstraction)
// =================================================================

export function useUpdateAccountPreserveFields(token?: string | null, accountId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Account,
    Error,
    { currentAccount: TargetAccountResponse; updates: { name?: string; description?: string; [key: string]: any } }
  >({
    mutationFn: ({ currentAccount, updates }) => 
      updateAccountPreserveFields(accountId!, currentAccount, updates, token),
    onSuccess: (savedAccount) => {
      console.log('[PRESERVE-FIELDS] Account updated with field preservation:', savedAccount);
      queryClient.setQueryData(['account', accountId], savedAccount);
    },
  });
}

export function useUpdateAccountListFieldsPreserveFields(token?: string | null, accountId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Account, 
    Error, 
    { currentAccount: TargetAccountResponse; listFieldUpdates: Record<string, string[]> }
  >({
    mutationFn: ({ currentAccount, listFieldUpdates }) => 
      updateAccountListFieldsPreserveFields(accountId!, currentAccount, listFieldUpdates, token),
    onSuccess: (savedAccount) => {
      console.log('[PRESERVE-LIST-FIELDS] Account list fields updated with field preservation:', savedAccount);
      queryClient.setQueryData(['account', accountId], savedAccount);
    },
  });
}
