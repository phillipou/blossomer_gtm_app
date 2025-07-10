import { apiFetch } from './apiClient';
import type { CompanyOverviewResponse, CompanyUpdate, CompanyResponse, CompanyCreate } from '../types/api';

// =================================================================
// Company API Functions
// =================================================================

export async function getCompanies(token?: string | null): Promise<CompanyResponse[]> {
  return await apiFetch<CompanyResponse[]>('/companies', { method: 'GET' }, token);
}

export async function getCompany(token?: string | null, companyId?: string): Promise<CompanyOverviewResponse> {
  if (companyId) {
    // Fetch specific company by ID
    const company = await apiFetch<CompanyResponse>(`/companies/${companyId}`, { method: 'GET' }, token);
    
    // The backend's CompanyResponse needs to be mapped to the frontend's CompanyOverviewResponse
    return {
      companyId: company.id,
      companyName: company.name,
      companyUrl: company.url,
      description: company.data?.description || '',
      businessProfile: company.data?.business_profile,
      capabilities: company.data?.capabilities || [],
      useCaseAnalysis: company.data?.use_case_analysis,
      positioning: company.data?.positioning,
      objections: company.data?.objections || [],
      icpHypothesis: company.data?.icp_hypothesis,
      metadata: company.data?.metadata || {},
    };
  } else {
    // Fetch the list of companies and return the first one.
    // This is a temporary solution until multi-company selection is implemented.
    const companies = await apiFetch<CompanyResponse[]>('/companies', { method: 'GET' }, token);
    if (companies.length === 0) {
      throw new Error("No companies found for this user.");
    }
    const company = companies[0];
    
    // The backend's CompanyResponse needs to be mapped to the frontend's CompanyOverviewResponse
    return {
      companyId: company.id,
      companyName: company.name,
      companyUrl: company.url,
      description: company.data?.description || '',
      businessProfile: company.data?.business_profile,
      capabilities: company.data?.capabilities || [],
      useCaseAnalysis: company.data?.use_case_analysis,
      positioning: company.data?.positioning,
      objections: company.data?.objections || [],
      icpHypothesis: company.data?.icp_hypothesis,
      metadata: company.data?.metadata || {},
    };
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

export async function createCompany(companyData: CompanyCreate, token?: string | null): Promise<CompanyResponse> {
  // The backend endpoint is /companies, using POST
  return await apiFetch<CompanyResponse>('/companies', {
    method: 'POST',
    body: JSON.stringify(companyData),
    headers: {
      'Content-Type': 'application/json',
    },
  }, token);
}

export async function updateCompany(companyData: CompanyUpdate, token?: string | null): Promise<CompanyOverviewResponse> {
  const response = await apiFetch<CompanyResponse>(`/companies/${companyData.companyId}`, {
    method: 'PUT',
    body: JSON.stringify(companyData),
  }, token);

  return {
    companyId: response.id,
    companyName: response.name,
    companyUrl: response.url,
    description: response.data?.description || '',
    businessProfile: response.data?.business_profile,
    capabilities: response.data?.capabilities || [],
    useCaseAnalysis: response.data?.use_case_analysis,
    positioning: response.data?.positioning,
    objections: response.data?.objections || [],
    icpHypothesis: response.data?.icp_hypothesis,
    metadata: response.data?.metadata || {},
  };
}
