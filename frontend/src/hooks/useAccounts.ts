import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAccounts as apiGetAccounts,
  createAccount as apiCreateAccount,
  updateAccount as apiUpdateAccount,
  deleteAccount as apiDeleteAccount,
} from '../lib/accountService'
import { Account, AccountCreate, AccountUpdate } from '../types/api'

// Key for caching and refetching
const ACCOUNTS_QUERY_KEY = 'accounts'

// Hook to fetch all accounts for a company
export const useGetAccounts = (companyId: string) => {
  return useQuery<Account[], Error>({
    queryKey: [ACCOUNTS_QUERY_KEY, companyId],
    queryFn: () => apiGetAccounts(companyId),
    enabled: !!companyId, // Only run the query if companyId is available
  })
}

// Hook to create a new account
export const useCreateAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: { companyId: string; accountData: AccountCreate }) =>
      apiCreateAccount(variables.companyId, variables.accountData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch the accounts list to show the new account
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, variables.companyId] })
    },
  })
}

// Hook to update an existing account
export const useUpdateAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: { accountId: string; accountData: AccountUpdate }) =>
      apiUpdateAccount(variables.accountId, variables.accountData),
    onSuccess: (data: Account) => {
      // Optimistically update the cache or just invalidate to refetch
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['account', data.id] })
    },
  })
}

// Hook to delete an account
export const useDeleteAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => apiDeleteAccount(accountId),
    onSuccess: () => {
      // Invalidate the accounts list so it's removed from the UI
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] })
    },
  })
} 