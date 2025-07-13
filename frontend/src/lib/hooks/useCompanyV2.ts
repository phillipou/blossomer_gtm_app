/**
 * Company Hooks V2 - Single-Transform PUT Pipeline
 * 
 * React Query hooks using simplified service layer with:
 * - User-scoped cache keys for proper segregation
 * - Single transformation points
 * - Simplified field preservation
 * - Auto-generated type safety
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthState } from '../auth.js';
import { useQueryKey } from '../query/UserScopedQueryClient.js';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompanyPreserveFields,
  deleteCompany,
  type CompanyOverviewUI,
  type CompanyCreateUI
} from '../services/index.js';

/**
 * Get all companies for authenticated user
 */
export function useCompanies() {
  const { token } = useAuthState();
  const queryKey = useQueryKey(['companies']);

  return useQuery({
    queryKey,
    queryFn: () => getCompanies(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

/**
 * Get specific company by ID
 */
export function useCompany(companyId: string | undefined) {
  const { token } = useAuthState();
  const queryKey = useQueryKey(['company', companyId || '']);

  return useQuery({
    queryKey,
    queryFn: () => getCompany(companyId!, token),
    enabled: !!companyId && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

/**
 * Create new company
 */
export function useCreateCompany() {
  const { token } = useAuthState();
  const queryClient = useQueryClient();
  const companiesQueryKey = useQueryKey(['companies']);

  return useMutation({
    mutationFn: (companyData: CompanyCreateUI) => createCompany(companyData, token),
    onSuccess: (newCompany) => {
      // Update companies list cache
      queryClient.setQueryData(companiesQueryKey, (oldData: CompanyOverviewUI[] = []) => [
        newCompany,
        ...oldData
      ]);

      // Set individual company cache  
      queryClient.setQueryData(['company', newCompany.companyId], newCompany);

      console.log('✅ Company created and cache updated:', newCompany);
    },
    onError: (error) => {
      console.error('❌ Failed to create company:', error);
    }
  });
}

/**
 * Update company with field preservation
 */
export function useUpdateCompany() {
  const { token } = useAuthState();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      companyId, 
      updates 
    }: { 
      companyId: string; 
      updates: Partial<CompanyOverviewUI> 
    }) => {
      // Get current company from cache - use actual query key
      const currentCompany = queryClient.getQueryData<CompanyOverviewUI>(['company', companyId]);
      
      return updateCompanyPreserveFields(companyId, updates, currentCompany!, token);
    },
    onSuccess: (updatedCompany, { companyId }) => {
      // Update individual company cache
      queryClient.setQueryData(['company', companyId], updatedCompany);

      // Update companies list cache
      const companiesQueryKey = useQueryKey(['companies']);
      queryClient.setQueryData(companiesQueryKey, (oldData: CompanyOverviewUI[] = []) =>
        oldData.map(company => 
          company.companyId === companyId ? updatedCompany : company
        )
      );

      console.log('✅ Company updated and cache synced:', updatedCompany);
    },
    onError: (error, { companyId }) => {
      console.error(`❌ Failed to update company ${companyId}:`, error);
    }
  });
}

/**
 * Delete company
 */
export function useDeleteCompany() {
  const { token } = useAuthState();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => deleteCompany(companyId, token),
    onSuccess: (_, companyId) => {
      // Remove from companies list cache
      const companiesQueryKey = useQueryKey(['companies']);
      queryClient.setQueryData(companiesQueryKey, (oldData: CompanyOverviewUI[] = []) =>
        oldData.filter(company => company.companyId !== companyId)
      );

      // Remove individual company cache
      queryClient.removeQueries({ queryKey: ['company', companyId] });

      console.log('✅ Company deleted and cache cleaned:', companyId);
    },
    onError: (error, companyId) => {
      console.error(`❌ Failed to delete company ${companyId}:`, error);
    }
  });
}