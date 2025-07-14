import { useState } from "react";
import { Button } from "../components/ui/button";
import { Wand2, Plus } from "lucide-react";
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal";
import { EmailHistory } from "../components/campaigns/EmailHistory";
import PageHeader from "../components/navigation/PageHeader";
import AddCard from "../components/ui/AddCard";
import InputModal from "../components/modals/InputModal";
import type { EmailConfig, GenerateEmailRequest, EmailGenerationResponse } from "../types/api";
import { useEntityCRUD } from "../lib/hooks/useEntityCRUD";
import { useAuthState } from '../lib/auth';
import { useAuthAwareNavigation } from "../lib/hooks/useAuthAwareNavigation";
import { useCompanyContext } from "../lib/hooks/useCompanyContext";
import { useGetCampaigns } from "../lib/hooks/useCampaigns";
import { DraftManager } from "../lib/draftManager";
import { getCampaignSubject, getCampaignBody } from "../lib/entityDisplayUtils";
// import NoCompanyFound from "../components/auth/NoCompanyFound";

export default function CampaignsPage() {
  // ALL HOOKS MUST BE CALLED FIRST (Rules of Hooks)
  const { token } = useAuthState();
  const { navigateToNestedEntity, navigateToEntityList, navigateToEntity, isAuthenticated } = useAuthAwareNavigation();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"create" | "edit">("create");
  const [editingComponent, setEditingComponent] = useState<{
    type: string;
    currentConfig: EmailConfig;
  } | null>(null);
  const [currentEmailConfig, setCurrentEmailConfig] = useState<EmailConfig | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<any>(null);
  // const [generatedCampaignData, setGeneratedCampaignData] = useState<EmailGenerationResponse | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Universal context and CRUD hooks
  const { overview, companyId } = useCompanyContext();
  const { create: createCampaignUniversal, delete: deleteCampaignUniversal } = useEntityCRUD<EmailGenerationResponse>('campaign');
  
  // Get personas from DraftManager (automatically synced from API by useGetAllPersonas hook)
  const draftPersonas = DraftManager.getDrafts('persona').map(draft => ({
    ...draft.data,
    id: draft.tempId,
    isDraft: true,
  }));
  
  const allPersonas = draftPersonas;
  
  // Campaign data retrieval (following exact Accounts.tsx pattern)
  const { data: campaigns } = useGetCampaigns(token);
  const draftCampaigns = !isAuthenticated ? DraftManager.getDrafts('campaign').map(draft => ({
    ...draft.data,
    id: draft.tempId,
    isDraft: true,
  })) : [];
  const allCampaigns = isAuthenticated ? (campaigns || []) : [...(campaigns || []), ...draftCampaigns];
  
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
  
  // Smart empty state (following Personas.tsx pattern)
  if (allPersonas.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Email Campaigns"
          subtitle="Generate personalized outreach emails"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 max-w-md">
            <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">Create Personas First</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Campaigns require persona targeting. Create personas first before generating campaigns.
            </p>
            <Button onClick={() => navigateToEntityList('persona')} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Create Personas
            </Button>
          </div>
        </div>
      </div>
    );
  }


  const handleOpenCreateWizard = () => {
    setWizardMode("create");
    setEditingComponent(null);
    setCurrentEmailConfig(null);
    setIsWizardOpen(true);
  };

  const handleWizardComplete = async (config: EmailConfig) => {
    if (!overview) return;
    
    const request: GenerateEmailRequest = {
        companyContext: overview,
        targetAccount: config.selectedAccount as any,
        targetPersona: config.selectedPersona as any,
        preferences: {
            useCase: config.selectedUseCase,
            emphasis: config.emphasis,
            openingLine: config.openingLine,
            ctaSetting: config.ctaSetting,
            template: config.template,
            socialProof: config.socialProof,
        },
    };
    
    const personaId = (config.selectedPersona as any)?.id || "";
    setSelectedPersonaId(personaId);
    setIsGenerating(true);
    
    try {
      console.log('[CAMPAIGNS-WIZARD] Creating campaign with universal patterns:', {
        personaId,
        isAuthenticated,
        request
      });
      
      // Use universal create system - automatically handles AI generation + save
      const result = await createCampaignUniversal(request as any, {
        parentId: personaId,
        navigateOnSuccess: true
      });
      
      console.log('[CAMPAIGNS-WIZARD] Campaign created successfully:', result);
      setIsWizardOpen(false);
      setForceUpdate(prev => prev + 1); // Refresh campaign list
      
    } catch (error) {
      console.error('[CAMPAIGNS-WIZARD] Campaign creation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectEmail = (email: any) => {
    // Extract parent context from campaign data structure (following AccountDetail.tsx pattern)
    const personaId = email.personaId || email.data?.personaId || selectedPersonaId;
    const accountId = email.accountId || email.data?.accountId;
    
    console.log('[CAMPAIGNS-SELECT] Navigating to campaign:', {
      campaignId: email.id,
      personaId,
      accountId,
      isAuthenticated
    });
    
    // Use proper nested navigation with full parent context
    if (accountId && personaId) {
      navigateToNestedEntity('account', accountId, 'persona', personaId, 'campaign', email.id);
    } else {
      // Fallback to direct navigation if parent context is missing
      navigateToEntity('campaign', email.id);
    }
  };

  const handleEditEmail = (email: any) => {
    setEditingEmail(email);
    setEditModalOpen(true);
  };

  const handleSaveEmailEdit = async ({ name, description }: { name: string; description: string }) => {
    if (!editingEmail) return;
    
    console.log('[CAMPAIGNS-EDIT] Updating campaign with universal patterns:', {
      campaignId: editingEmail.id,
      updates: { name, description },
      isAuthenticated
    });
    
    if (editingEmail.id.startsWith('temp_')) {
      // Draft campaign - use DraftManager field preservation
      DraftManager.updateDraftPreserveFields('campaign', editingEmail.id, {
        name,
        description,
        // Preserve subject mapping for campaigns
        subjects: {
          ...editingEmail.subjects,
          primary: name
        }
      });
      setForceUpdate(prev => prev + 1);
    } else if (isAuthenticated) {
      // Universal update will be implemented in Stage 3
      console.warn('Universal campaign update will be implemented in Stage 3');
    }
    
    setEditModalOpen(false);
    setEditingEmail(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingEmail(null);
  };

  // Dual-Path Deletion Pattern using Universal System
  const handleDeleteCampaign = async (email: any) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        console.log('[CAMPAIGNS-DELETE] Deleting campaign with universal patterns:', {
          campaignId: email.id,
          isAuthenticated,
          isDraft: email.id.startsWith('temp_')
        });
        
        // Use universal delete system for both draft and authenticated campaigns
        await deleteCampaignUniversal(email.id);
        setForceUpdate(prev => prev + 1);
        
        console.log('[CAMPAIGNS-DELETE] Campaign deleted successfully');
      } catch (error) {
        console.error('[CAMPAIGNS-DELETE] Failed to delete campaign:', error);
      }
    }
  };


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Email Campaigns"
        subtitle="Generate personalized outreach emails"
        primaryAction={{
          label: "New Email",
          onClick: handleOpenCreateWizard,
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden p-8 space-y-8">
        <div className="flex flex-1 gap-8 overflow-auto">
          {!allCampaigns || allCampaigns.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center text-gray-500 max-w-md">
                <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Email</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create personalized outreach emails with our AI-powered wizard. Configure your target audience,
                  use case, and personalization settings to generate compelling emails.
                  {draftCampaigns.length > 0 && (
                    <span className="block text-orange-600 mt-2">
                      ({draftCampaigns.length} draft{draftCampaigns.length !== 1 ? 's' : ''} waiting to be saved)
                    </span>
                  )}
                </p>
                <Button onClick={handleOpenCreateWizard} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Your First Email
                </Button>
              </div>
            </div>
          ) : (
            <EmailHistory
              emails={allCampaigns}
              onSelectEmail={handleSelectEmail}
              onEditEmail={handleEditEmail}
              onDeleteEmail={handleDeleteCampaign}
              extraItem={<AddCard onClick={handleOpenCreateWizard} label="Add New" />}
            />
          )}
        </div>
      </div>

      <EmailWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
        mode={wizardMode}
        editingComponent={editingComponent}
        initialConfig={currentEmailConfig || undefined}
      />

      <InputModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleSaveEmailEdit}
        title="Edit Email"
        subtitle="Update the subject and content of this email."
        nameLabel="Subject Line"
        namePlaceholder="Enter email subject..."
        descriptionLabel="Email Content"
        descriptionPlaceholder="Enter the email body content..."
        submitLabel="Update Email"
        cancelLabel="Cancel"
        defaultName={getCampaignSubject(editingEmail)}
        defaultDescription={getCampaignBody(editingEmail)}
        isLoading={false}
      />
    </div>
  );
}
