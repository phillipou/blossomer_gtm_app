import { apiFetch } from './apiClient';
import type { Campaign, CampaignCreate, CampaignUpdate, GenerateEmailRequest, GeneratedEmail, EmailGenerationResponse } from '../types/api';
import { transformKeysToCamelCase } from "./utils";

// =================================================================
// Campaign CRUD API Functions
// =================================================================

export async function getCampaigns(token?: string | null, companyId?: string): Promise<Campaign[]> {
  if (!token) {
    // Unauthenticated users - no server campaigns to fetch
    console.log('[CAMPAIGN-SERVICE] No token provided - returning empty array for unauthenticated users');
    return [];
  }
  
  if (!companyId) {
    console.warn('[CAMPAIGN-SERVICE] No companyId provided - cannot fetch campaigns without company context');
    return [];
  }
  
  try {
    // Get all accounts for the company first
    const accounts = await apiFetch<any[]>(`/accounts?company_id=${companyId}`, { method: 'GET' }, token);
    
    // Fetch campaigns for each account
    const allCampaigns: Campaign[] = [];
    
    for (const account of accounts) {
      try {
        console.log('[CAMPAIGN-SERVICE] Fetching campaigns for account:', account.id);
        const accountCampaigns = await apiFetch<Campaign[]>(`/campaigns?account_id=${account.id}`, { method: 'GET' }, token);
        
        // Normalize each campaign response
        const normalizedCampaigns = accountCampaigns.map(campaign => {
          const normalized = normalizeCampaignResponse(campaign);
          // Add account context for frontend use
          return {
            ...normalized,
            accountId: account.id,
            accountName: account.name
          };
        });
        
        allCampaigns.push(...normalizedCampaigns);
      } catch (accountError) {
        console.warn('[CAMPAIGN-SERVICE] Failed to fetch campaigns for account:', account.id, accountError);
        // Continue with other accounts even if one fails
      }
    }
    
    console.log('[CAMPAIGN-SERVICE] Successfully fetched campaigns:', {
      totalCampaigns: allCampaigns.length,
      accountsChecked: accounts.length,
      companyId
    });
    
    return allCampaigns;
    
  } catch (error) {
    console.error('[CAMPAIGN-SERVICE] Failed to fetch campaigns:', {
      error,
      companyId,
      hasToken: !!token
    });
    return [];
  }
}

export async function getCampaign(campaignId: string, token?: string | null): Promise<Campaign> {
  const campaign = await apiFetch<Campaign>(`/campaigns/${campaignId}`, { method: 'GET' }, token);
  return normalizeCampaignResponse(campaign);
}

export async function updateCampaign(campaignId: string, campaignData: CampaignUpdate, token?: string | null): Promise<Campaign> {
  console.log('[CAMPAIGN-SERVICE] Updating campaign:', {
    campaignId,
    updateData: campaignData,
    hasToken: !!token
  });
  
  try {
    const response = await apiFetch<Campaign>(`/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    }, token);
    
    // Normalize the response to ensure consistent format
    const normalized = normalizeCampaignResponse(response);
    
    console.log('[CAMPAIGN-SERVICE] Campaign updated successfully:', {
      campaignId: normalized.id,
      hasSubjects: !!normalized.subjects,
      hasEmailBody: !!normalized.emailBody,
      emailBodyLength: normalized.emailBody?.length || 0
    });
    
    return normalized;
    
  } catch (error) {
    console.error('[CAMPAIGN-SERVICE] Failed to update campaign:', {
      campaignId,
      error,
      campaignData
    });
    throw error;
  }
}

export async function deleteCampaign(campaignId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/campaigns/${campaignId}`, { method: 'DELETE' }, token);
}

// =================================================================
// Field-Preserving Update Functions (for Entity Abstraction)
// =================================================================

/**
 * Merge campaign updates while preserving complex email structures
 */
function mergeCampaignUpdates(
  currentCampaign: Record<string, any> | null | undefined,
  updates: Record<string, any>
): CampaignUpdate {
  console.log('[MERGE-CAMPAIGN] Campaign update merge:', {
    currentCampaign,
    updates,
    currentHasData: !!currentCampaign?.data,
    updatesKeys: Object.keys(updates || {})
  });
  
  const safeCurrent = currentCampaign || {};
  const currentData = safeCurrent.data || safeCurrent;
  
  // Merge updates with current data, preserving complex structures
  const mergedData = {
    ...currentData,
    ...updates
  };
  
  // Handle name updates - prioritize updates, then fall back to existing
  let campaignName: string;
  
  console.log('[MERGE-CAMPAIGN] Name resolution logic:', {
    updates: {
      name: updates.name,
      subjectsPrimary: updates.subjects?.primary,
      hasSubjects: !!updates.subjects
    },
    safeCurrent: {
      name: safeCurrent.name,
      subjectsPrimary: safeCurrent.subjects?.primary,
      hasSubjects: !!safeCurrent.subjects
    }
  });
  
  if (updates.name) {
    campaignName = updates.name;
    console.log('[MERGE-CAMPAIGN] Using updates.name:', campaignName);
  } else if (updates.subjects?.primary) {
    campaignName = updates.subjects.primary;
    console.log('[MERGE-CAMPAIGN] Using updates.subjects.primary:', campaignName);
  } else if (safeCurrent.name) {
    campaignName = safeCurrent.name;
    console.log('[MERGE-CAMPAIGN] Using safeCurrent.name:', campaignName);
  } else if (safeCurrent.subjects?.primary) {
    campaignName = safeCurrent.subjects.primary;
    console.log('[MERGE-CAMPAIGN] Using safeCurrent.subjects.primary:', campaignName);
  } else {
    campaignName = 'Updated Campaign';
    console.log('[MERGE-CAMPAIGN] Using default name:', campaignName);
  }
  
  // Build clean data payload excluding top-level database fields
  const topLevelFields = new Set(['id', 'name', 'type', 'accountId', 'personaId', 'createdAt', 'updatedAt']);
  const dataPayload: Record<string, any> = {};
  
  Object.entries(mergedData).forEach(([key, value]) => {
    if (!topLevelFields.has(key) && key !== 'data') {
      dataPayload[key] = value;
    }
  });
  
  console.log('[MERGE-CAMPAIGN] Merged campaign data:', {
    campaignName,
    dataPayloadKeys: Object.keys(dataPayload),
    preservedComplexStructures: {
      hasSubjects: !!dataPayload.subjects,
      hasEmailBody: !!dataPayload.emailBody,
      hasBreakdown: !!dataPayload.breakdown
    }
  });
  
  return {
    name: campaignName,
    data: dataPayload
  };
}

/**
 * Update campaign with field preservation - preserves all email content and metadata
 */
export async function updateCampaignPreserveFields(
  campaignId: string,
  currentCampaign: any,
  updates: { name?: string; [key: string]: any },
  token?: string | null
): Promise<Campaign> {
  const mergedData = mergeCampaignUpdates(currentCampaign, updates);
  
  console.log('[PRESERVE-FIELDS] Campaign update with field preservation:', {
    campaignId,
    mergedData,
    preservesEmailContent: !!(mergedData.data?.subjects && mergedData.data?.emailBody)
  });
  
  return updateCampaign(campaignId, mergedData, token);
}

export async function generateEmail(generationData: GenerateEmailRequest, token?: string | null): Promise<EmailGenerationResponse> {
    // Use different endpoints for authenticated vs demo users
    const endpoint = '/campaigns/generate-ai';
    
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
