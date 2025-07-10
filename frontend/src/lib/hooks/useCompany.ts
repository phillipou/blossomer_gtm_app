import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanies,
  getCompany,
  analyzeCompany,
  updateCompany,
  createCompany,
  normalizeCompanyResponse,
} from '../companyService';
import type { CompanyOverviewResponse, CompanyUpdate, CompanyResponse, CompanyCreate } from '../../types/api';

const COMPANY_QUERY_KEY = 'company';
const COMPANIES_QUERY_KEY = 'companies';

export function useGetCompanies(token?: string | null) {
  return useQuery<CompanyResponse[], Error>({
    queryKey: [COMPANIES_QUERY_KEY],
    queryFn: () => getCompanies(token),
    enabled: !!token,
  });
}

export function useGetCompany(token?: string | null, companyId?: string) {
  return useQuery<CompanyOverviewResponse, Error>({
    queryKey: [COMPANY_QUERY_KEY, companyId],
    queryFn: () => getCompany(token, companyId),
    // Only enabled when authenticated with company ID - demo mode doesn't GET existing data
    enabled: !!token && !!companyId,
  });
}

export function useAnalyzeCompany(token?: string | null, companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation<CompanyOverviewResponse, Error, { websiteUrl: string; userInputtedContext?: string }>({
    mutationFn: ({ websiteUrl, userInputtedContext }) => analyzeCompany(websiteUrl, userInputtedContext, token),
  });
}

export function useCreateCompany(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<CompanyResponse, Error, CompanyOverviewResponse>({
    mutationFn: (newCompany) => createCompany(newCompany, token),
    onSuccess: (savedCompany) => {
      const normalized = normalizeCompanyResponse(savedCompany);
      console.log('[NORMALIZE] (onCreateSuccess) Normalized company overview:', normalized);
      // When a company is successfully created, invalidate the list of companies
      // so it can be refetched with the new data.
      queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
      // Also, add the new company to the cache immediately for a better UX
      queryClient.setQueryData([COMPANY_QUERY_KEY, normalized.companyId], normalized);
    },
  });
}

export function useUpdateCompany(token?: string | null, companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation<CompanyOverviewResponse, Error, CompanyUpdate>({
    mutationFn: (companyData) => updateCompany(companyData, token),
    onSuccess: (savedCompany) => {
      const normalized = normalizeCompanyResponse(savedCompany as any);
      console.log('[NORMALIZE] (onUpdateSuccess) Normalized company overview:', normalized);
      queryClient.setQueryData([COMPANY_QUERY_KEY, companyId], normalized);
    },
  });
}
