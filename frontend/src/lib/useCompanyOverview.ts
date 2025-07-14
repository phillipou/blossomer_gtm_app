import { useQuery } from '@tanstack/react-query';
import type { CompanyOverviewResponse } from "../types/api";

export function useCompanyOverview() {
  // Use useQuery to properly track cache changes instead of getQueryData
  const { data } = useQuery({
    queryKey: ['company'],
    queryFn: () => null, // No fetcher needed - this is cache-only
    enabled: false, // Don't fetch, just listen to cache changes
  });
  
  return data;
}
 