/**
 * Company Service V2 - Single-Transform PUT Pipeline
 * 
 * Implements expert memo recommendations:
 * - Single transformation point: UI camelCase → API snake_case only at boundary
 * - No multi-step transformations 
 * - Clean separation between raw API types and UI models
 * - Uses auto-generated types and mappers for consistency
 */

import { apiFetch } from '../apiClient.js';
import { 
  mapCompanyResponseToUI, 
  mapCompanyCreateToAPI, 
  mapCompanyUpdateToAPI,
  type CompanyOverviewUI,
  type CompanyCreateUI,
  type components 
} from '../mappers/index.js';

// Raw API types from auto-generated OpenAPI spec
type CompanyResponseRaw = components['schemas']['CompanyResponse'];
type CompanyCreateRaw = components['schemas']['CompanyCreate'];

/**
 * Get all companies for authenticated user
 */
export async function getCompanies(token?: string | null): Promise<CompanyOverviewUI[]> {
  const rawCompanies = await apiFetch<CompanyResponseRaw[]>('/companies', { method: 'GET' }, token);
  
  // Single transformation point: Raw API → UI Model
  return rawCompanies.map(mapCompanyResponseToUI);
}

/**
 * Get specific company by ID
 */
export async function getCompany(companyId: string, token?: string | null): Promise<CompanyOverviewUI> {
  const rawCompany = await apiFetch<CompanyResponseRaw>(`/companies/${companyId}`, { method: 'GET' }, token);
  
  // Single transformation point: Raw API → UI Model
  return mapCompanyResponseToUI(rawCompany);
}

/**
 * Create new company
 * Single transformation: UI Model → API Request → UI Model
 */
export async function createCompany(companyData: CompanyCreateUI, token?: string | null): Promise<CompanyOverviewUI> {
  console.log('[COMPANY-CREATE] UI Model Input:', companyData);
  
  // Single transformation point: UI → API
  const apiPayload = mapCompanyCreateToAPI(companyData);
  console.log('[COMPANY-CREATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<CompanyResponseRaw>('/companies', {
    method: 'POST',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[COMPANY-CREATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const uiModel = mapCompanyResponseToUI(rawResponse);
  console.log('[COMPANY-CREATE] Final UI Model:', uiModel);
  
  return uiModel;
}

/**
 * Update company with field preservation
 * Single transformation: Merged UI Model → API Request → UI Model
 */
export async function updateCompany(
  companyId: string, 
  updates: Partial<CompanyOverviewUI>,
  currentCompany?: CompanyOverviewUI,
  token?: string | null
): Promise<CompanyOverviewUI> {
  console.log('[COMPANY-UPDATE] Starting update:', { companyId, updates, currentCompany });
  
  // Simple merge at UI level - no complex field separation needed
  const mergedCompany = currentCompany ? {
    ...currentCompany,
    ...updates
  } : updates;
  
  console.log('[COMPANY-UPDATE] Merged UI Model:', mergedCompany);
  
  // Single transformation point: UI → API
  const apiPayload = mapCompanyUpdateToAPI(mergedCompany);
  console.log('[COMPANY-UPDATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<CompanyResponseRaw>(`/companies/${companyId}`, {
    method: 'PUT',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[COMPANY-UPDATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const updatedUiModel = mapCompanyResponseToUI(rawResponse);
  console.log('[COMPANY-UPDATE] Final UI Model:', updatedUiModel);
  
  return updatedUiModel;
}

/**
 * Delete company
 */
export async function deleteCompany(companyId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/companies/${companyId}`, { method: 'DELETE' }, token);
}

/**
 * Simple field preservation for React Query integration
 * No complex merge logic - just spread operator
 */
export async function updateCompanyPreserveFields(
  companyId: string,
  updates: Partial<CompanyOverviewUI>,
  currentCompany: CompanyOverviewUI,
  token?: string | null
): Promise<CompanyOverviewUI> {
  return updateCompany(companyId, updates, currentCompany, token);
}