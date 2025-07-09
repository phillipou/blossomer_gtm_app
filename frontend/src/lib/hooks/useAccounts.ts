import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccount,
} from '../accountService';
import type { Account, AccountCreate, AccountUpdate } from '../../types/api';

const ACCOUNT_QUERY_KEY = 'accounts';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNT_QUERY_KEY, companyId] });
    },
  });
}

export function useUpdateAccount(companyId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Account, Error, { accountId: string; accountData: AccountUpdate }>({
    mutationFn: ({ accountId, accountData }) => updateAccount(accountId, accountData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNT_QUERY_KEY, companyId] });
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
