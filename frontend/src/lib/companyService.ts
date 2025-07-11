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

  // The entire AI-generated data, including our flattened fields, is in the `data` blob.
  // We use `transformKeysToCamelCase` to ensure all fields are in the correct format for the frontend.
  const data = transformKeysToCamelCase<Record<string, any>>(company.data || {});

  const normalized: CompanyOverviewResponse = {
    companyId: company.id,
    companyName: company.name,
    companyUrl: company.url,
    description: data.description || '',
    // Directly access the new flattened fields after camelCase transformation
    businessProfileInsights: data.businessProfileInsights || [],
    capabilities: data.capabilities || [],
    useCaseAnalysisInsights: data.useCaseAnalysisInsights || [],
    positioningInsights: data.positioningInsights || [],
    targetCustomerInsights: data.targetCustomerInsights || [],
    objections: data.objections || [],
    metadata: data.metadata || {},
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

export async function createCompany(companyData: CompanyOverviewResponse, token?: string | null): Promise<CompanyResponse> {
  // The backend now accepts the ProductOverviewResponse directly, but expects snake_case field names.
  // Transform the camelCase frontend data to snake_case for backend validation.
  const backendData = transformKeysToSnakeCase(companyData);
  
  console.log('[CREATE-COMPANY] Sending data to backend:', backendData);
  
  return await apiFetch<CompanyResponse>('/companies', {
    method: 'POST',
    body: JSON.stringify(backendData),
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
    companyUrl: currentOverview.companyUrl, // Always preserve URL
    // Preserve all the new flattened analysis fields
    businessProfileInsights: currentOverview.businessProfileInsights,
    capabilities: currentOverview.capabilities,
    useCaseAnalysisInsights: currentOverview.useCaseAnalysisInsights,
    positioningInsights: currentOverview.positioningInsights,
    targetCustomerInsights: currentOverview.targetCustomerInsights,
    objections: currentOverview.objections,
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

/**
 * Merge list field updates with existing company data, preserving all other fields
 */
function mergeCompanyListFieldUpdates(
  currentOverview: CompanyOverviewResponse,
  listFieldUpdates: Record<string, string[]>
): CompanyUpdate {
  // Transform the normalized frontend data back to backend format using existing utilities
  const frontendData = {
    description: currentOverview.description,
    companyName: currentOverview.companyName,
    companyUrl: currentOverview.companyUrl,
    // Preserve all existing fields, but allow list field updates
    businessProfileInsights: listFieldUpdates.businessProfileInsights || currentOverview.businessProfileInsights,
    capabilities: listFieldUpdates.capabilities || currentOverview.capabilities,
    useCaseAnalysisInsights: listFieldUpdates.useCaseAnalysisInsights || currentOverview.useCaseAnalysisInsights,
    positioningInsights: listFieldUpdates.positioningInsights || currentOverview.positioningInsights,
    targetCustomerInsights: listFieldUpdates.targetCustomerInsights || currentOverview.targetCustomerInsights,
    objections: listFieldUpdates.objections || currentOverview.objections,
    metadata: currentOverview.metadata,
  };

  // Use existing utility to convert to snake_case for backend
  const backendData = transformKeysToSnakeCase(frontendData);

  return {
    companyId: currentOverview.companyId,
    name: currentOverview.companyName,
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

/**
 * Update company list fields with field preservation - recommended for list field updates
 */
export async function updateCompanyListFieldsPreserveFields(
  companyId: string,
  currentOverview: CompanyOverviewResponse,
  listFieldUpdates: Record<string, string[]>,
  token?: string | null
): Promise<CompanyOverviewResponse> {
  const mergedUpdate = mergeCompanyListFieldUpdates(currentOverview, listFieldUpdates);
  
  console.log("Company Service: Updating list fields with preserved fields:", {
    companyId,
    listFieldUpdates,
    updatedFields: Object.keys(listFieldUpdates),
    preservedFieldCount: Object.keys(mergedUpdate.data || {}).length
  });
  
  return updateCompany(mergedUpdate, token);
}
