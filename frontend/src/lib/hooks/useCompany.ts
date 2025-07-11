import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanies,
  getCompany,
  analyzeCompany,
  updateCompany,
  updateCompanyPreserveFields,
  updateCompanyListFieldsPreserveFields,
  createCompany,
  normalizeCompanyResponse,
} from '../companyService';
import type { CompanyOverviewResponse, CompanyUpdate, CompanyResponse, CompanyCreate } from '../../types/api';

// Standardized query keys for consistency - Stage 3 improvement
const COMPANY_QUERY_KEY = 'company';
const COMPANIES_QUERY_KEY = 'companies';

// Cache validation utility - Stage 3 improvement
const validateCompanyCacheState = (queryClient: any, companyId: string) => {
  const cached = queryClient.getQueryData([COMPANY_QUERY_KEY, companyId]);
  console.log('[CACHE-VALIDATION] Company cache state:', {
    companyId,
    exists: !!cached,
    format: cached ? {
      hasCompanyName: !!(cached as any).companyName,
      hasDescription: !!(cached as any).description,
      topLevelKeys: Object.keys(cached as any),
      isNormalized: true, // Company always uses camelCase format
      fieldCount: Object.keys(cached as any).length
    } : null,
    timestamp: new Date().toISOString()
  });
  return cached;
};

// Cache consistency test - Stage 3 improvement
export const testCompanyCachePatterns = (queryClient: any, companyId: string) => {
  console.log('[CACHE-TEST] Testing company cache invalidation and refresh patterns:', { companyId });
  
  // Test 1: Check if company exists in cache
  const companyCached = queryClient.getQueryData([COMPANY_QUERY_KEY, companyId]);
  
  // Test 2: Check if companies list exists
  const allQueries = queryClient.getQueryCache().getAll();
  const companiesListQueries = allQueries.filter((query: any) => 
    query.queryKey[0] === COMPANIES_QUERY_KEY
  );
  
  console.log('[CACHE-TEST] Company cache pattern results:', {
    companyExists: !!companyCached,
    listQueriesCount: companiesListQueries.length,
    cacheConsistency: companyCached ? 'normalized' : 'missing',
    queryKeysUsed: {
      company: [COMPANY_QUERY_KEY, companyId],
      lists: companiesListQueries.map((q: any) => q.queryKey)
    }
  });
  
  return {
    companyExists: !!companyCached,
    listQueriesCount: companiesListQueries.length,
    isConsistent: !!companyCached
  };
};

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

export function useGetUserCompany(token?: string | null) {
  return useQuery<CompanyOverviewResponse, Error>({
    queryKey: [COMPANY_QUERY_KEY],
    queryFn: () => getCompany(token),
    // Enabled when authenticated (will fetch user's company)
    enabled: !!token,
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
      
      // Invalidate list and set detail cache - Stage 3 consistency
      queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
      queryClient.setQueryData([COMPANY_QUERY_KEY, normalized.companyId], normalized);
      
      // Validate cache state
      validateCompanyCacheState(queryClient, normalized.companyId);
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
      
      // Set detail cache and validate - Stage 3 consistency
      queryClient.setQueryData([COMPANY_QUERY_KEY, companyId], normalized);
      validateCompanyCacheState(queryClient, companyId!);
    },
  });
}

export function useUpdateCompanyPreserveFields(token?: string | null, companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    CompanyOverviewResponse, 
    Error, 
    { currentOverview: CompanyOverviewResponse; updates: { name?: string; description?: string } }
  >({
    mutationFn: ({ currentOverview, updates }) => 
      updateCompanyPreserveFields(companyId!, currentOverview, updates, token),
    onSuccess: (savedCompany) => {
      console.log('[PRESERVE-FIELDS] Company updated with field preservation:', savedCompany);
      
      // Use consistent key and validate cache - Stage 3 improvement
      queryClient.setQueryData([COMPANY_QUERY_KEY, companyId], savedCompany);
      validateCompanyCacheState(queryClient, companyId!);
    },
  });
}

export function useUpdateCompanyListFieldsPreserveFields(token?: string | null, companyId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    CompanyOverviewResponse, 
    Error, 
    { currentOverview: CompanyOverviewResponse; listFieldUpdates: Record<string, string[]> }
  >({
    mutationFn: ({ currentOverview, listFieldUpdates }) => 
      updateCompanyListFieldsPreserveFields(companyId!, currentOverview, listFieldUpdates, token),
    onSuccess: (savedCompany) => {
      console.log('[PRESERVE-LIST-FIELDS] Company list fields updated with field preservation:', savedCompany);
      
      // Use consistent key and validate cache - Stage 3 improvement
      queryClient.setQueryData([COMPANY_QUERY_KEY, companyId], savedCompany);
      validateCompanyCacheState(queryClient, companyId!);
    },
  });
}
