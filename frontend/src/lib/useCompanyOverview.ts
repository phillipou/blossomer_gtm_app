import { useQueryClient } from '@tanstack/react-query';
import type { CompanyOverviewResponse } from "../types/api";

export function useCompanyOverview() {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<CompanyOverviewResponse>(['company']);
}
 