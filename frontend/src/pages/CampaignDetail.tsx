import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LayoutGrid, Pencil } from "lucide-react";
import { EmailPreview } from "../components/campaigns/EmailPreview";
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal";
import SubNav from "../components/navigation/SubNav";
import CampaignDetailHeader, { type EditingMode as HeaderEditingMode } from "../components/campaigns/CampaignDetailHeader";
import type { Campaign, EmailConfig } from "../types/api";
import { useGetCampaign, useUpdateCampaign } from "../lib/hooks/useCampaigns";
import { useAuthState } from "../lib/auth";

interface EmailWizardModalProps {
  editingComponent: { type: string; currentConfig: EmailConfig } | null;
}

const EditingMode = {
  Component: "component" as HeaderEditingMode,
  Writing: "writing" as HeaderEditingMode,
};

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthState();

  const { data: campaign, isLoading, error } = useGetCampaign(campaignId!, token);
  const { mutate: updateCampaign } = useUpdateCampaign(campaignId!, token);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingComponent] = useState<EmailWizardModalProps['editingComponent']>(null);
  const [editingMode, setEditingMode] = useState<HeaderEditingMode>(EditingMode.Component);

  const handleWizardComplete = async (config: EmailConfig) => {
    if (campaign) {
      updateCampaign({ ...campaign, config });
    }
    setIsWizardOpen(false);
  };

  const handleCreateVariant = (email: Campaign) => {
    navigate("/campaigns", { state: { createVariant: true, baseEmail: email } });
  };

  const handleCopyEmail = (email: Campaign) => {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
  };

  const handleSaveEmail = (email: Campaign) => {
    updateCampaign(email);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Campaign not found.</p>
        </div>
      </div>
    );
  }

  const modeTabs = [
    { label: "Component Mode", value: EditingMode.Component, icon: <LayoutGrid className="w-4 h-4 mr-2" /> },
    { label: "Writing Mode", value: EditingMode.Writing, icon: <Pencil className="w-4 h-4 mr-2" /> },
  ];

  const company = campaign.companySnapshot ? { companyName: campaign.companySnapshot.companyName, companyUrl: campaign.companySnapshot.companyUrl } : null;
  const account = campaign.accountSnapshot ? { id: campaign.accountSnapshot.id, targetAccountName: campaign.accountSnapshot.targetAccountName, targetAccountDescription: campaign.accountSnapshot.targetAccountDescription } : null;
  const persona = campaign.personaSnapshot ? { id: campaign.personaSnapshot.id, targetPersonaName: campaign.personaSnapshot.targetPersonaName, targetPersonaDescription: campaign.personaSnapshot.targetPersonaDescription } : null;

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Company", href: "/company" },
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.subject || campaignId || "Campaign" },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="campaign"
      />
      <div className="flex-1 p-8">
        <CampaignDetailHeader
          subject={campaign.subject}
          timestamp={campaign.timestamp}
          modeTabs={modeTabs}
          editingMode={editingMode}
          setEditingMode={setEditingMode}
          company={company}
          account={account}
          persona={persona}
        />
        <div className="overflow-auto p-0">
          <EmailPreview
            email={campaign}
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