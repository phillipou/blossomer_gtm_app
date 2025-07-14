import { apiFetch } from './apiClient';
import type { Campaign, CampaignCreate, CampaignUpdate, GenerateEmailRequest, GeneratedEmail, EmailGenerationResponse } from '../types/api';
import { transformKeysToCamelCase } from "./utils";

// =================================================================
// Campaign CRUD API Functions
// =================================================================

export async function getCampaigns(token?: string | null): Promise<Campaign[]> {
  // Note: There is no general GET /campaigns endpoint in the API
  // Campaigns are retrieved via personas or accounts
  // For now, return empty array to prevent API errors
  // TODO: Implement proper campaign listing via parent entities
  console.log('[CAMPAIGN-SERVICE] getCampaigns called - no general campaigns endpoint available');
  return [];
}

export async function getCampaign(campaignId: string, token?: string | null): Promise<Campaign> {
  const campaign = await apiFetch<Campaign>(`/campaigns/${campaignId}`, { method: 'GET' }, token);
  return normalizeCampaignResponse(campaign);
}

export async function updateCampaign(campaignId: string, campaignData: CampaignUpdate, token?: string | null): Promise<Campaign> {
  return apiFetch<Campaign>(`/campaigns/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(campaignData),
  }, token);
}

export async function deleteCampaign(campaignId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/campaigns/${campaignId}`, { method: 'DELETE' }, token);
}

export async function generateEmail(generationData: GenerateEmailRequest, token?: string | null): Promise<EmailGenerationResponse> {
    // Use different endpoints for authenticated vs demo users
    const endpoint = token ? '/campaigns/generate-email' : '/campaigns/generate-ai';
    
    console.log('[CAMPAIGN-SERVICE] Starting generateEmail:', {
        hasToken: !!token,
        endpoint,
        generationData: {
            companyContext: !!generationData.companyContext,
            targetAccount: generationData.targetAccount,
            targetPersona: generationData.targetPersona,
            preferences: generationData.preferences
        }
    });
    
    try {
        const result = await apiFetch<EmailGenerationResponse>(endpoint, {
            method: 'POST',
            body: JSON.stringify(generationData),
        }, token);
        
        console.log('[CAMPAIGN-SERVICE] generateEmail SUCCESS:', {
            hasResult: !!result,
            resultKeys: result ? Object.keys(result) : [],
            hasSubjects: !!(result as any)?.subjects,
            hasEmailBody: !!(result as any)?.emailBody,
            hasBreakdown: !!(result as any)?.breakdown
        });
        
        return result;
    } catch (error) {
        console.error('[CAMPAIGN-SERVICE] generateEmail FAILED:', {
            error,
            errorMessage: error?.message,
            errorStack: error?.stack,
            generationData,
            endpoint
        });
        throw error;
    }
}

// =================================================================
// Universal Campaign Functions for useEntityCRUD Integration
// =================================================================

/**
 * Generate campaign with EmailGenerationResponse format
 * Used by universal hooks for consistent AI generation flow
 */
export async function generateCampaign(campaignData: any, token?: string | null): Promise<EmailGenerationResponse> {
    console.log('[CAMPAIGN-SERVICE] generateCampaign called with:', {
        hasToken: !!token,
        campaignDataKeys: Object.keys(campaignData || {}),
        campaignData
    });
    
    try {
        // Use the same endpoint as generateEmail but return EmailGenerationResponse format
        const result = await generateEmail(campaignData, token);
        
        console.log('[CAMPAIGN-SERVICE] generateCampaign SUCCESS:', {
            resultKeys: Object.keys(result || {}),
            hasSubjects: !!result.subjects,
            hasEmailBody: !!result.emailBody,
            hasBreakdown: !!result.breakdown
        });
        
        return result;
    } catch (error) {
        console.error('[CAMPAIGN-SERVICE] generateCampaign FAILED:', {
            error,
            errorMessage: error?.message,
            campaignData
        });
        throw error;
    }
}

/**
 * Create campaign for authenticated users using EmailGenerationResponse data
 * Integrates with universal useEntityCRUD patterns
 * Requires account_id and persona_id as specified in API
 */
export async function createCampaign(emailData: EmailGenerationResponse | GeneratedEmail, token?: string | null, options?: { accountId?: string; personaId?: string }): Promise<Campaign> {
    // Extract required IDs from options or email data
    const accountId = options?.accountId || (emailData as any).accountId;
    const personaId = options?.personaId || (emailData as any).personaId;
    
    if (!accountId || !personaId) {
        throw new Error('Campaign creation requires accountId and personaId parameters');
    }
    
    // Transform EmailGenerationResponse to Campaign create format
    const createData: CampaignCreate = {
        name: (emailData as any).subjects?.primary || (emailData as any).subject || 'Generated Campaign',
        type: 'email',
        data: emailData,
    };
    
    console.log('[CAMPAIGN-SERVICE] Creating campaign with data:', {
        createData,
        originalEmailData: emailData,
        accountId,
        personaId,
        hasToken: !!token
    });
    
    // Include required query parameters as per API specification
    const queryParams = new URLSearchParams({
        account_id: accountId,
        persona_id: personaId
    });
    
    const response = await apiFetch<Campaign>(`/campaigns?${queryParams.toString()}`, {
        method: 'POST',
        body: JSON.stringify(createData),
    }, token);
    
    // Normalize the response to ensure consistent format
    return normalizeCampaignResponse(response);
}

/**
 * Normalize campaign response for consistent UI data format
 * Ensures EmailGenerationResponse fields are accessible at top level
 */
export function normalizeCampaignResponse(campaign: Campaign): Campaign & EmailGenerationResponse {
    console.log('[NORMALIZE-CAMPAIGN] Raw campaign response:', campaign);
    
    // Transform data keys to camelCase
    const data = transformKeysToCamelCase<Record<string, any>>(campaign.data || {});
    
    // Extract email generation fields for top-level access
    const emailFields = {
        subjects: data.subjects || {},
        emailBody: data.emailBody || data.email_body || [],
        breakdown: data.breakdown || {},
        metadata: data.metadata || {}
    };
    
    const normalized = {
        ...campaign,
        ...emailFields,
        data,
        type: campaign.type, // always preserve top-level type
        
        // Ensure required fields for universal system
        id: campaign.id,
        name: campaign.name,
        personaId: campaign.personaId,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
    };
    
    console.log('[NORMALIZE-CAMPAIGN] Normalized campaign:', {
        id: normalized.id,
        name: normalized.name,
        hasSubjects: !!normalized.subjects,
        hasEmailBody: !!normalized.emailBody,
        hasBreakdown: !!normalized.breakdown,
        emailBodyLength: normalized.emailBody?.length || 0
    });
    
    return normalized as Campaign & EmailGenerationResponse;
}
