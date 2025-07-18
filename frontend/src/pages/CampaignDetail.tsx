import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { campaignConfig } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
import SubNav from '../components/navigation/SubNav';
import InputModal from '../components/modals/InputModal';
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { useCompanyContext } from '../lib/hooks/useCompanyContext';
import { useAuthState } from '../lib/auth';
import { useGetCampaignForEntityPage } from '../lib/hooks/useCampaigns';
import { useGetPersonaForEntityPage } from '../lib/hooks/usePersonas';
import { useGetAccountForEntityPage } from '../lib/hooks/useAccounts';
import { DraftManager } from '../lib/draftManager';
import { LayoutGrid, Pencil, Wand2 } from 'lucide-react';
import type { EmailGenerationResponse, EmailConfig } from '../types/api';
import { EmailPreview } from '../components/campaigns/EmailPreview';
import { EmailWizardModal } from '../components/campaigns/EmailWizardModal';
import CampaignDetailHeader, { type EditingMode as HeaderEditingMode } from '../components/campaigns/CampaignDetailHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
// import NoCompanyFound from '../components/auth/NoCompanyFound';

// Stable references to prevent re-renders
const emptyObject = {};
const emptyMutate = () => {};

// Standardized error handling following AccountDetail/PersonaDetail pattern
const handleComponentError = (operation: string, error: any) => {
  console.error(`[COMPONENT-ERROR] ${operation} failed:`, {
    error: error?.message || error,
    operation,
    timestamp: new Date().toISOString(),
    stack: error?.stack
  });
};

const EditingMode = {
  Component: "component" as HeaderEditingMode,
  Writing: "writing" as HeaderEditingMode,
};

export default function CampaignDetail() {
  // ALL HOOKS MUST BE CALLED FIRST (Rules of Hooks)
  const { token } = useAuthState();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<{ type: string; currentConfig: EmailConfig } | null>(null);
  const [editingMode, setEditingMode] = useState<HeaderEditingMode>(EditingMode.Component);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Universal context and CRUD hooks
  const { overview: company, companyId, hasValidContext } = useCompanyContext();
  const { update: updateCampaignUniversal, delete: deleteCampaignUniversal } = useEntityCRUD<EmailGenerationResponse>('campaign');
  const { navigateWithPrefix, navigateToEntityList, isAuthenticated } = useAuthAwareNavigation();
  
  // Get campaign data first
  const { data: campaignData } = useGetCampaignForEntityPage(token, campaignId);
  
  // Handle draft campaigns for unauthenticated users
  const draftCampaign = !isAuthenticated && campaignId?.startsWith('temp_') 
    ? DraftManager.getDraft('campaign', campaignId) 
    : null;
  
  // Use draft data if available, otherwise use API data
  const campaign = draftCampaign?.data || campaignData;
  
  // Extract parent IDs from campaign data (campaigns store snapshots, not direct IDs)
  const personaId = campaign?.personaId;
  const accountId = campaign?.accountId;
  
  // Get parent entity data using extracted IDs (conditional hooks to prevent unauthenticated API calls)
  const { data: persona } = useGetPersonaForEntityPage(token, personaId);
  const { data: account } = useGetAccountForEntityPage(token, accountId);
  
  // THEN check for early returns (after ALL hooks)
  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Company context not found.</p>
        </div>
      </div>
    );
  }
  
  if (!campaignId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Campaign ID not provided.</p>
        </div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Campaign not found.</p>
          <Button onClick={() => navigateToEntityList('campaign')} className="mt-4">
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  // Handlers using universal patterns
  const handleWizardComplete = async (config: EmailConfig) => {
    try {
      console.log('[CAMPAIGN-DETAIL] Updating campaign with universal patterns:', {
        campaignId,
        config,
        isAuthenticated
      });
      
      // Use universal update system for both draft and authenticated campaigns
      await updateCampaignUniversal(campaignId, { config } as any);
      setForceUpdate(prev => prev + 1);
      
      setIsWizardOpen(false);
    } catch (error) {
      handleComponentError('Campaign wizard update', error);
    }
  };

  const handleCreateVariant = (email: any) => {
    navigateToEntityList('campaign');
  };

  const handleCopyEmail = (email: any) => {
    const emailText = `Subject: ${email.subjects?.primary || email.subject || 'Campaign'}\\n\\n${
      email.emailBody?.map((segment: any) => segment.text).join('') || email.body || ''
    }`;
    navigator.clipboard.writeText(emailText);
  };

  const handleSaveEmail = async (email: any) => {
    try {
      console.log('[CAMPAIGN-DETAIL] Saving email with universal patterns:', {
        campaignId,
        email,
        isAuthenticated,
        preservingFields: ['subjects', 'emailBody', 'breakdown', 'metadata'],
        isTemporaryCampaign: campaignId?.startsWith('temp_'),
        emailSubjectData: {
          emailSubjectsPrimary: email.subjects?.primary,
          emailSubject: email.subject,
          emailSubjectsObject: email.subjects,
          campaignName: campaign?.name
        }
      });
      
      // Use universal update system for both draft and authenticated campaigns
      // For authenticated users, this will make a PUT request to the server
      // For unauthenticated users, this will update DraftManager
      const updateData = {
        // Preserve and update complex email structures
        subjects: email.subjects,
        emailBody: email.emailBody,
        breakdown: email.breakdown,
        metadata: email.metadata
        // Don't set name here - let the merge logic in campaignService handle it
        // This allows the updated subjects.primary to become the new campaign name
      };
      
      console.log('[CAMPAIGN-DETAIL] About to call updateCampaignUniversal with:', {
        campaignId,
        updateData,
        isAuthenticated,
        willHitDatabase: isAuthenticated && !campaignId?.startsWith('temp_')
      });
      
      const result = await updateCampaignUniversal(campaignId!, updateData as any);
      
      console.log('[CAMPAIGN-DETAIL] Universal update completed:', {
        result,
        campaignId,
        isAuthenticated,
        databaseUpdated: isAuthenticated && !campaignId?.startsWith('temp_')
      });
      
      setForceUpdate(prev => prev + 1);
      
      console.log('[CAMPAIGN-DETAIL] Email saved successfully with field preservation');
    } catch (error) {
      console.error('[CAMPAIGN-DETAIL] Save email failed:', {
        error,
        campaignId,
        isAuthenticated,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      handleComponentError('Campaign save', error);
    }
  };

  // Build simple breadcrumb navigation: Campaigns / {name}
  const breadcrumbs = [
    { 
      label: "Campaigns", 
      href: isAuthenticated ? "/app/campaigns" : "/playground/campaigns" 
    },
    { 
      label: campaign.subjects?.primary || campaign.name || campaignId || "Campaign",
      href: "" // Current page, no href needed
    }
  ];

  const modeTabs = [
    { label: "Component Mode", value: EditingMode.Component, icon: <LayoutGrid className="w-4 h-4 mr-2" /> },
    { label: "Writing Mode", value: EditingMode.Writing, icon: <Pencil className="w-4 h-4 mr-2" /> },
  ];

  // Prepare context data for header - prioritize snapshots from campaign data
  // For draft campaigns, snapshots are in campaign.data; for normalized campaigns, they're at campaign root
  const companySnapshot = campaign?.companySnapshot || campaign?.data?.companySnapshot || (company ? { 
    companyName: company.companyName, 
    companyUrl: company.companyUrl 
  } : null);
  
  const accountSnapshot = campaign?.accountSnapshot || campaign?.data?.accountSnapshot || (account ? { 
    id: account.id, 
    targetAccountName: account.name, 
    targetAccountDescription: account.description 
  } : null);
  
  const personaSnapshot = campaign?.personaSnapshot || campaign?.data?.personaSnapshot || (persona ? { 
    id: persona.id, 
    targetPersonaName: persona.name, 
    targetPersonaDescription: persona.description 
  } : null);

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={breadcrumbs}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="campaign"
      />
      
      <div className="flex-1 p-8">
        <CampaignDetailHeader
          subject={campaign.subjects?.primary || campaign.name || "Campaign"}
          timestamp={campaign.createdAt || new Date().toISOString()}
          modeTabs={modeTabs}
          editingMode={editingMode}
          setEditingMode={setEditingMode}
          company={companySnapshot}
          account={accountSnapshot}
          persona={personaSnapshot}
        />
        
        <div className="overflow-auto p-0">
          <EmailPreview
            email={{
              ...campaign,
              segments: campaign.emailBody || [],
              subject: campaign.subjects?.primary || campaign.subject || 'Untitled Campaign'
            }}
            onCreateVariant={handleCreateVariant}
            onCopy={handleCopyEmail}
            onSend={handleSaveEmail}
            editingMode={editingMode}
            setEditingMode={setEditingMode}
          />
        </div>
      </div>

      <EmailWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
        mode="edit"
        editingComponent={editingComponent}
        initialConfig={campaign.config}
      />
    </div>
  );
}