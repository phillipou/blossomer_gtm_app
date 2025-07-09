import { apiFetch } from './apiClient';
import type { CompanyOverviewResponse, CompanyOverviewUpdate } from '../types/api';

// =================================================================
// Company API Functions
// =================================================================

export async function getCompany(token?: string | null): Promise<CompanyOverviewResponse> {
  return apiFetch<CompanyOverviewResponse>('/company', { method: 'GET' }, token);
}

export async function analyzeCompany(websiteUrl: string, userInputtedContext?: string, token?: string | null): Promise<CompanyOverviewResponse> {
  return apiFetch<CompanyOverviewResponse>('/company', {
    method: 'POST',
    body: JSON.stringify({ website_url: websiteUrl, user_inputted_context: userInputtedContext || '' }),
  }, token);
}

export async function updateCompany(companyData: CompanyOverviewUpdate, token?: string | null): Promise<CompanyOverviewResponse> {
  return apiFetch<CompanyOverviewResponse>('/company', {
    method: 'PUT',
    body: JSON.stringify(companyData),
  }, token);
}
