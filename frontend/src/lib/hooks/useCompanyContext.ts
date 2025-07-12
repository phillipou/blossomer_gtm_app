import { useAuthState } from '../auth';
import { useCompanyOverview } from '../useCompanyOverview';
import { useGetUserCompany } from './useCompany';
import { DraftManager } from '../draftManager';
import { useAuthAwareNavigation } from './useAuthAwareNavigation';
import type { CompanyOverviewResponse } from '../../types/api';

/**
 * Universal company context hook
 * Eliminates 30+ lines of duplicated company detection across Accounts, Personas, Campaigns pages
 * 
 * Provides unified company context detection for both authenticated and unauthenticated users:
 * - Authenticated: Uses React Query cache + API fetch
 * - Unauthenticated: Uses DraftManager localStorage
 * 
 * Usage:
 * const { overview, companyId, hasValidContext, isLoading } = useCompanyContext();
 * if (!hasValidContext) return <NoCompanyFound />;
 */
export function useCompanyContext() {
  const { token } = useAuthState();
  
  // Step 1: Get cached overview (works for both auth states)
  const cachedOverview = useCompanyOverview();
  
  // Step 2: Get fetched overview (authenticated users only)
  const { data: fetchedOverview, isLoading: isCompanyLoading } = useGetUserCompany(token);
  
  // Step 3: Determine active overview with fallback hierarchy
  let overview: CompanyOverviewResponse | null = cachedOverview || fetchedOverview || null;
  
  // Step 4: For unauthenticated users, check DraftManager as final fallback
  if (!token && !overview) {
    const drafts = DraftManager.getDrafts('company');
    if (drafts.length > 0) {
      // DraftManager should already contain normalized CompanyOverviewResponse format
      overview = drafts[0].data;
    }
  }
  
  // Step 5: Extract company ID safely
  const companyId = overview?.companyId;
  
  // Step 6: Debug logging (matches existing patterns from Accounts.tsx)
  console.log('[COMPANY-CONTEXT] Company context detection:', {
    token: !!token,
    cachedOverview: !!cachedOverview,
    fetchedOverview: !!fetchedOverview,
    overview: !!overview,
    companyId,
    isCompanyLoading,
    draftCount: !token ? DraftManager.getDraftCount('company') : 'N/A (authenticated)'
  });
  
  return {
    overview,
    companyId,
    companyName: overview?.companyName,
    isLoading: isCompanyLoading,
    hasValidContext: !!companyId,
    isAuthenticated: !!token,
    
    // Additional context helpers
    hasCompanyData: !!overview,
    isDraft: !token && !!overview,
    isEmpty: !overview && !isCompanyLoading
  };
}

/**
 * Hook variant that throws an error if no company context is found
 * Use for pages that require company context and should not render without it
 */
export function useRequiredCompanyContext() {
  const context = useCompanyContext();
  
  if (!context.isLoading && !context.hasValidContext) {
    throw new Error('Company context is required but not found. Ensure user has created a company first.');
  }
  
  return context;
}

/**
 * Hook variant that provides company context with navigation helpers
 * Combines company context with auth-aware navigation
 */
export function useCompanyContextWithNavigation() {
  const context = useCompanyContext();
  const { navigateToEntityList } = useAuthAwareNavigation();
  
  const navigateToCompanyCreation = () => {
    navigateToEntityList('company');
  };
  
  return {
    ...context,
    navigateToCompanyCreation
  };
}