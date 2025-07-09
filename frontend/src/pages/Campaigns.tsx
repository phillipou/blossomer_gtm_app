import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Wand2, Plus } from "lucide-react";
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal";
import { EmailHistory } from "../components/campaigns/EmailHistory";
import PageHeader from "../components/navigation/PageHeader";
import AddCard from "../components/ui/AddCard";
import InputModal from "../components/modals/InputModal";
import type { Campaign, EmailConfig, GenerateEmailRequest } from "../types/api";
import { useGetCampaigns, useUpdateCampaign, useDeleteCampaign, useGenerateEmail } from "../lib/hooks/useCampaigns";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import { useAuthState } from '../lib/auth';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { token } = useAuthState();
  const overview = useCompanyOverview();

  const { data: campaigns, isLoading, error } = useGetCampaigns(token);
  const { mutate: updateCampaign, isPending: isSaving } = useUpdateCampaign("", token); // campaignId is set in handleSaveEmailEdit
  const { mutate: deleteCampaign } = useDeleteCampaign(token);
  const { mutate: generateEmail, isPending: isGenerating } = useGenerateEmail(token);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"create" | "edit">("create");
  const [editingComponent, setEditingComponent] = useState<{
    type: string;
    currentConfig: EmailConfig;
  } | null>(null);
  const [currentEmailConfig, setCurrentEmailConfig] = useState<EmailConfig | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<Campaign | null>(null);

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
        targetAccount: config.selectedAccount,
        targetPersona: config.selectedPersona,
        preferences: {
            useCase: config.selectedUseCase,
            emphasis: config.emphasis,
            openingLine: config.openingLine,
            ctaSetting: config.ctaSetting,
            template: config.template,
            socialProof: config.socialProof,
        },
    };
    generateEmail(request, {
      onSuccess: (newEmail) => {
        setIsWizardOpen(false);
        navigate(`/campaigns/${newEmail.id}`);
      },
    });
  };

  const handleSelectEmail = (email: Campaign) => {
    navigate(`/campaigns/${email.id}`);
  };

  const handleEditEmail = (email: Campaign) => {
    setEditingEmail(email);
    setEditModalOpen(true);
  };

  const handleSaveEmailEdit = async ({ name, description }: { name: string; description: string }) => {
    if (!editingEmail) return;
    updateCampaign({ id: editingEmail.id, subject: name, body: description });
    setEditModalOpen(false);
    setEditingEmail(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingEmail(null);
  };

  const handleDeleteEmail = (email: Campaign) => {
    deleteCampaign(email.id);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

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
          {!campaigns || campaigns.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center text-gray-500 max-w-md">
                <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Email</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create personalized outreach emails with our AI-powered wizard. Configure your target audience,
                  use case, and personalization settings to generate compelling emails.
                </p>
                <Button onClick={handleOpenCreateWizard} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Your First Email
                </Button>
              </div>
            </div>
          ) : (
            <EmailHistory
              emails={campaigns}
              onSelectEmail={handleSelectEmail}
              onEditEmail={handleEditEmail}
              onDeleteEmail={handleDeleteEmail}
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
        isGenerating={isGenerating}
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
        submitLabel={isSaving ? "Saving..." : "Update Email"}
        cancelLabel="Cancel"
        defaultName={editingEmail?.subject || ""}
        defaultDescription={editingEmail?.body || ""}
        isLoading={isSaving}
      />
    </div>
  );
}
