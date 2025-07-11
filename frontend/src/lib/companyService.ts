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
  console.log('[NORMALIZE] Raw company response:', company);
  
  // Transform the data field to camelCase for frontend use
  const transformedData = transformKeysToCamelCase<Record<string, any>>(company.data || {});
  
  // Create normalized company with consistent camelCase format
  const normalized: CompanyOverviewResponse = {
    companyId: company.id,
    companyName: company.name,
    companyUrl: company.url,
    description: transformedData.description || '',
    // Directly access the new flattened fields after camelCase transformation
    businessProfileInsights: transformedData.businessProfileInsights || [],
    capabilities: transformedData.capabilities || [],
    useCaseAnalysisInsights: transformedData.useCaseAnalysisInsights || [],
    positioningInsights: transformedData.positioningInsights || [],
    targetCustomerInsights: transformedData.targetCustomerInsights || [],
    objections: transformedData.objections || [],
    metadata: transformedData.metadata || {},
  };
  
  console.log('[NORMALIZE] Normalized company (single format):', {
    companyId: normalized.companyId,
    hasCompanyName: !!normalized.companyName,
    hasDescription: !!normalized.description,
    insightsFieldCount: {
      businessProfile: normalized.businessProfileInsights?.length || 0,
      capabilities: normalized.capabilities?.length || 0,
      useCase: normalized.useCaseAnalysisInsights?.length || 0,
      positioning: normalized.positioningInsights?.length || 0,
      targetCustomer: normalized.targetCustomerInsights?.length || 0
    },
    formatConsistent: true // Always camelCase for company
  });
  
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
 * Simplified merge function using object spread - no defensive programming
 * Assumes currentOverview is always in normalized camelCase format from cache
 */
function mergeCompanyUpdates(
  currentOverview: CompanyOverviewResponse,
  updates: { name?: string; description?: string; [key: string]: any }
): CompanyUpdate {
  console.log('[MERGE-COMPANY-UPDATES] Simplified merge:', {
    currentKeys: Object.keys(currentOverview || {}),
    updateKeys: Object.keys(updates || {}),
    inputFormat: 'normalized-camelCase'
  });
  
  // Simple object spread merge - all fields preserved automatically
  const mergedData = {
    ...currentOverview,
    ...updates,
    // Ensure name consistency
    companyName: updates.name || currentOverview.companyName
  };
  
  console.log('[MERGE-COMPANY-UPDATES] Merge complete:', {
    preservedFieldCount: Object.keys(mergedData).length,
    companyName: mergedData.companyName,
    hasComplexFields: !!(mergedData.businessProfileInsights || mergedData.capabilities)
  });
  
  return {
    companyId: currentOverview.companyId,
    name: updates.name || currentOverview.companyName,
    data: mergedData,
  };
}

/**
 * Simplified list field merge - now uses same pattern as regular updates
 * No longer needed as separate function, but kept for backward compatibility
 */
function mergeCompanyListFieldUpdates(
  currentOverview: CompanyOverviewResponse,
  listFieldUpdates: Record<string, string[]>
): CompanyUpdate {
  console.log('[MERGE-COMPANY-LIST-FIELDS] Using simplified merge pattern:', {
    currentKeys: Object.keys(currentOverview || {}),
    listUpdateKeys: Object.keys(listFieldUpdates || {}),
    inputFormat: 'normalized-camelCase'
  });
  
  // Use same simple merge pattern as regular updates
  return mergeCompanyUpdates(currentOverview, listFieldUpdates);
}

export async function updateCompany(companyData: CompanyUpdate, token?: string | null): Promise<CompanyOverviewResponse> {
  console.log('[UPDATE-COMPANY] API boundary transformation:', {
    companyId: companyData.companyId,
    inputData: companyData,
    dataFieldKeys: Object.keys(companyData.data || {}),
    transformationPoint: 'updateCompany-api-boundary'
  });
  
  // Transform data field to snake_case for backend - Single transformation point
  const backendPayload = {
    ...companyData,
    data: transformKeysToSnakeCase(companyData.data || {})
  };
  
  console.log('[UPDATE-COMPANY] Backend payload:', {
    companyId: backendPayload.companyId,
    name: backendPayload.name,
    dataKeys: Object.keys(backendPayload.data || {}),
    hasSnakeCase: Object.keys(backendPayload.data || {}).some(k => k.includes('_')),
    payloadSize: JSON.stringify(backendPayload).length
  });
  
  const response = await apiFetch<CompanyResponse>(`/companies/${companyData.companyId}`, {
    method: 'PUT',
    body: JSON.stringify(backendPayload),
  }, token);
  
  // Always normalize response to maintain consistent format
  const normalized = normalizeCompanyResponse(response);
  
  console.log('[UPDATE-COMPANY] Response normalized:', {
    responseId: normalized.companyId,
    fieldCount: Object.keys(normalized).length,
    formatConsistent: true // Always camelCase for company
  });
  
  return normalized;
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
