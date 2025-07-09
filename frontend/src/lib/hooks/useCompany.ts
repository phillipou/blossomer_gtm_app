import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompany,
  analyzeCompany,
  updateCompany,
} from '../companyService';
import type { CompanyOverviewResponse, CompanyOverviewUpdate } from '../../types/api';

const COMPANY_QUERY_KEY = 'company';

export function useGetCompany(token?: string | null) {
  return useQuery<CompanyOverviewResponse, Error>({
    queryKey: [COMPANY_QUERY_KEY],
    queryFn: () => getCompany(token),
    // Only enabled when authenticated - demo mode doesn't GET existing data
    enabled: !!token,
  });
}

export function useAnalyzeCompany(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<CompanyOverviewResponse, Error, { websiteUrl: string; userInputtedContext?: string }>({
    mutationFn: ({ websiteUrl, userInputtedContext }) => analyzeCompany(websiteUrl, userInputtedContext, token),
    onSuccess: (data) => {
      queryClient.setQueryData([COMPANY_QUERY_KEY], data);
    },
  });
}

export function useUpdateCompany(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<CompanyOverviewResponse, Error, CompanyOverviewUpdate>({
    mutationFn: (companyData) => updateCompany(companyData, token),
    onSuccess: (data) => {
      queryClient.setQueryData([COMPANY_QUERY_KEY], data);
    },
  });
}
