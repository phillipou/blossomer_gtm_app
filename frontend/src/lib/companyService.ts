import { apiFetch } from './apiClient';
import type { CompanyOverviewResponse, CompanyUpdate, CompanyResponse, CompanyCreate } from '../types/api';
import { transformKeysToCamelCase } from "./utils";
import { transformKeysToSnakeCase } from './utils';

// =================================================================
// Company API Functions
// =================================================================

export async function getCompanies(token?: string | null): Promise<CompanyResponse[]> {
  return await apiFetch<CompanyResponse[]>('/companies', { method: 'GET' }, token);
}

export function normalizeCompanyResponse(company: CompanyResponse): CompanyOverviewResponse {
  // Log the input for debugging
  console.log('[NORMALIZE] Raw company response:', company);
  const data = transformKeysToCamelCase<Record<string, any>>(company.data || {});
  const normalized = {
    companyId: company.id,
    companyName: company.name,
    companyUrl: company.url,
    description: data.description || '',
    businessProfile: data.businessProfile || { category: '', businessModel: '', existingCustomers: '' },
    capabilities: data.capabilities || [],
    useCaseAnalysis: data.useCaseAnalysis || { processImpact: '', problemsAddressed: '', howTheyDoItToday: '' },
    positioning: data.positioning || { keyMarketBelief: '', uniqueApproach: '', languageUsed: '' },
    objections: data.objections || [],
    icpHypothesis: data.icpHypothesis || { targetAccountHypothesis: '', targetPersonaHypothesis: '' },
    metadata: data.metadata || {},
    ...data,
  };
  // Log the output for debugging
  console.log('[NORMALIZE] Normalized company overview:', normalized);
  return normalized;
}

export async function getCompany(token?: string | null, companyId?: string): Promise<CompanyOverviewResponse> {
  if (companyId) {
    // Fetch specific company by ID
    const company = await apiFetch<CompanyResponse>(`/companies/${companyId}`, { method: 'GET' }, token);
    return normalizeCompanyResponse(company);
  } else {
    // Fetch the list of companies and return the first one.
    const companies = await apiFetch<CompanyResponse[]>('/companies', { method: 'GET' }, token);
    if (companies.length === 0) {
      throw new Error("No companies found for this user.");
    }
    return normalizeCompanyResponse(companies[0]);
  }
}

export async function analyzeCompany(websiteUrl: string, userInputtedContext?: string, token?: string | null): Promise<CompanyOverviewResponse> {
  // This endpoint returns ProductOverviewResponse, which we map to CompanyOverviewResponse
  const response = await apiFetch<any>('/companies/generate-ai', {
    method: 'POST',
    body: JSON.stringify({ website_url: websiteUrl, user_inputted_context: userInputtedContext || '' }),
  }, token);

  // We assume the AI generation endpoint does not return a companyId, so we'll have to fetch it separately
  // or decide on a better flow. For now, we'll return what we have.
  return {
    ...response,
    companyId: '', // No ID from this endpoint
  };
}

// Helper to transform AI response format to backend CRUD format
function transformToCreateFormat(aiResponse: CompanyOverviewResponse): CompanyCreate {
  const { companyId, companyName, companyUrl, ...analysisData } = aiResponse;
  return {
    name: companyName,
    url: companyUrl,
    data: analysisData,
  };
}

export async function createCompany(companyData: CompanyOverviewResponse, token?: string | null): Promise<CompanyResponse> {
  // Transform AI format to backend CRUD format
  const createData = transformToCreateFormat(companyData);
  
  // The backend endpoint is /companies, using POST
  return await apiFetch<CompanyResponse>('/companies', {
    method: 'POST',
    body: JSON.stringify(createData),
    headers: {
      'Content-Type': 'application/json',
    },
  }, token);
}

/**
 * Merge partial updates with existing company data, preserving all fields
 */
function mergeCompanyUpdates(
  currentOverview: CompanyOverviewResponse,
  updates: { name?: string; description?: string }
): CompanyUpdate {
  // Transform the normalized frontend data back to backend format using existing utilities
  const frontendData = {
    description: updates.description || currentOverview.description,
    companyName: updates.name || currentOverview.companyName,
    businessProfile: currentOverview.businessProfile,
    capabilities: currentOverview.capabilities,
    useCaseAnalysis: currentOverview.useCaseAnalysis,
    positioning: currentOverview.positioning,
    objections: currentOverview.objections,
    icpHypothesis: currentOverview.icpHypothesis,
    metadata: currentOverview.metadata,
  };

  // Use existing utility to convert to snake_case for backend
  const backendData = transformKeysToSnakeCase(frontendData);

  return {
    companyId: currentOverview.companyId,
    name: updates.name,
    data: backendData,
  };
}

export async function updateCompany(companyData: CompanyUpdate, token?: string | null): Promise<CompanyOverviewResponse> {
  const response = await apiFetch<CompanyResponse>(`/companies/${companyData.companyId}`, {
    method: 'PUT',
    body: JSON.stringify(companyData),
  }, token);

  return normalizeCompanyResponse(response);
}

/**
 * Update company with field preservation - recommended for partial updates
 */
export async function updateCompanyPreserveFields(
  companyId: string,
  currentOverview: CompanyOverviewResponse,
  updates: { name?: string; description?: string },
  token?: string | null
): Promise<CompanyOverviewResponse> {
  const mergedUpdate = mergeCompanyUpdates(currentOverview, updates);
  
  console.log("Company Service: Updating with preserved fields:", {
    companyId,
    updates,
    preservedFieldCount: Object.keys(mergedUpdate.data || {}).length
  });
  
  return updateCompany(mergedUpdate, token);
}
