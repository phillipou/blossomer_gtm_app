/**
 * Company Data Mapper
 * 
 * Transforms between raw API types (snake_case) and UI models (camelCase).
 * This creates a clean separation between API shape and UI shape,
 * preventing shape drift between backend and frontend.
 */

import type { components } from '../../types/generated-api.js';

// Raw API types from OpenAPI generation
type CompanyResponseRaw = components['schemas']['CompanyResponse'];
type CompanyCreateRaw = components['schemas']['CompanyCreate'];

// UI Model types (camelCase for frontend consumption)
export interface CompanyOverviewUI {
  companyId: string;
  companyName: string;
  companyUrl: string;
  description?: string;
  businessProfileInsights?: string[];
  capabilities?: string[];
  useCaseAnalysisInsights?: string[];
  positioningInsights?: string[];
  objections?: string[];
  targetCustomerInsights?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreateUI {
  name: string;
  url: string;
  analysisData?: Record<string, unknown>;
}

/**
 * Transform raw API response to UI model
 * Single transformation point from API boundary to frontend
 */
export function mapCompanyResponseToUI(raw: CompanyResponseRaw): CompanyOverviewUI {
  // Extract analysis data safely
  const analysisData = raw.analysis_data || {};
  
  return {
    companyId: raw.id,
    companyName: raw.name,
    companyUrl: raw.url,
    description: analysisData.description as string,
    businessProfileInsights: analysisData.business_profile_insights as string[],
    capabilities: analysisData.capabilities as string[],
    useCaseAnalysisInsights: analysisData.use_case_analysis_insights as string[],
    positioningInsights: analysisData.positioning_insights as string[],
    objections: analysisData.objections as string[],
    targetCustomerInsights: analysisData.target_customer_insights as string[],
    metadata: analysisData.metadata as Record<string, unknown>,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at
  };
}

/**
 * Transform UI model to API request format
 * Single transformation point from frontend to API boundary
 */
export function mapCompanyCreateToAPI(ui: CompanyCreateUI): CompanyCreateRaw {
  return {
    name: ui.name,
    url: ui.url,
    analysis_data: ui.analysisData || {}
  };
}

/**
 * Transform UI update data to API request format
 * Handles partial updates while maintaining field separation
 */
export function mapCompanyUpdateToAPI(
  ui: Partial<CompanyOverviewUI>
): Partial<CompanyCreateRaw> {
  const apiUpdate: Partial<CompanyCreateRaw> = {};
  
  // Map top-level fields
  if (ui.companyName !== undefined) {
    apiUpdate.name = ui.companyName;
  }
  if (ui.companyUrl !== undefined) {
    apiUpdate.url = ui.companyUrl;
  }
  
  // Map analysis data fields
  if (shouldUpdateAnalysisData(ui)) {
    apiUpdate.analysis_data = {
      ...(ui.description && { description: ui.description }),
      ...(ui.businessProfileInsights && { business_profile_insights: ui.businessProfileInsights }),
      ...(ui.capabilities && { capabilities: ui.capabilities }),
      ...(ui.useCaseAnalysisInsights && { use_case_analysis_insights: ui.useCaseAnalysisInsights }),
      ...(ui.positioningInsights && { positioning_insights: ui.positioningInsights }),
      ...(ui.objections && { objections: ui.objections }),
      ...(ui.targetCustomerInsights && { target_customer_insights: ui.targetCustomerInsights }),
      ...(ui.metadata && { metadata: ui.metadata })
    };
  }
  
  return apiUpdate;
}

/**
 * Helper to determine if analysis_data should be updated
 */
function shouldUpdateAnalysisData(ui: Partial<CompanyOverviewUI>): boolean {
  const analysisFields = [
    'description',
    'businessProfileInsights', 
    'capabilities',
    'useCaseAnalysisInsights',
    'positioningInsights', 
    'objections',
    'targetCustomerInsights',
    'metadata'
  ];
  
  return analysisFields.some(field => ui[field as keyof CompanyOverviewUI] !== undefined);
}