import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  updateCampaignPreserveFields,
  deleteCampaign,
  generateEmail,
  normalizeCampaignResponse,
} from '../campaignService';
import type { Campaign, CampaignCreate, CampaignUpdate, GenerateEmailRequest, GeneratedEmail } from '../../types/api';

const CAMPAIGN_QUERY_KEY = 'campaigns';

export function useGetCampaigns(token?: string | null, companyId?: string) {
  return useQuery<Campaign[], Error>({
    queryKey: [CAMPAIGN_QUERY_KEY, companyId],
    queryFn: () => getCampaigns(token, companyId),
    // Only enabled for authenticated users with company context
    // Unauthenticated users get campaigns from DraftManager in component logic
    enabled: !!token && !!companyId,
  });
}

export function useGetCampaign(campaignId: string, token?: string | null) {
    return useQuery<Campaign, Error>({
        queryKey: [CAMPAIGN_QUERY_KEY, campaignId],
        queryFn: () => getCampaign(campaignId, token),
        enabled: !!campaignId && !!token,
    });
}

// Add conditional hook for entity page usage (following AccountDetail.tsx pattern)
export function useGetCampaignForEntityPage(token?: string | null, entityId?: string) {
  return useQuery<Campaign, Error>({
    queryKey: [CAMPAIGN_QUERY_KEY, entityId],
    queryFn: () => getCampaign(entityId!, token),
    // Only enabled for authenticated users - unauthenticated users use DraftManager only
    enabled: !!entityId && entityId !== 'new' && !!token && entityId !== '*',
  });
}

export function useCreateCampaign(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Campaign, Error, CampaignCreate>({
    mutationFn: (campaignData) => createCampaign(campaignData, token),
    onSuccess: (savedCampaign) => {
      const normalized = normalizeCampaignResponse(savedCampaign);
      console.log('[NORMALIZE] (onCreateSuccess) Normalized campaign:', normalized);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.setQueryData(['campaign', normalized.id], normalized);
    },
  });
}

export function useUpdateCampaign(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Campaign, Error, { campaignId: string; data: CampaignUpdate }>({
    mutationFn: ({ campaignId, data }) => updateCampaign(campaignId, data, token),
    onSuccess: (savedCampaign) => {
      const normalized = normalizeCampaignResponse(savedCampaign);
      console.log('[NORMALIZE] (onUpdateSuccess) Normalized campaign:', normalized);
      queryClient.setQueryData(['campaign', normalized.id], normalized);
    },
  });
}

export function useDeleteCampaign(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (campaignId) => deleteCampaign(campaignId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGN_QUERY_KEY] });
    },
  });
}

export function useGenerateEmail(token?: string | null) {
    const queryClient = useQueryClient();
    return useMutation<GeneratedEmail, Error, GenerateEmailRequest>({
        mutationFn: (generationData) => generateEmail(generationData, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CAMPAIGN_QUERY_KEY] });
        },
    });
}

// =================================================================
// Field-Preserving Update Hooks (for Entity Abstraction)
// =================================================================

export function useUpdateCampaignPreserveFields(token?: string | null, campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Campaign,
    Error,
    { currentCampaign: any; updates: { name?: string; [key: string]: any } }
  >({
    mutationFn: ({ currentCampaign, updates }) => 
      updateCampaignPreserveFields(campaignId!, currentCampaign, updates, token),
    onSuccess: (savedCampaign) => {
      console.log('[PRESERVE-FIELDS] Campaign updated with field preservation:', savedCampaign);
      
      // Update cache with normalized campaign
      queryClient.setQueryData([CAMPAIGN_QUERY_KEY, campaignId], savedCampaign);
      // Invalidate list queries to refresh campaign lists
      queryClient.invalidateQueries({ queryKey: [CAMPAIGN_QUERY_KEY] });
    },
  });
}
