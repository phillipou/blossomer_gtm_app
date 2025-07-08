import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Wand2, Plus } from "lucide-react"
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal"
import { EmailHistory } from "../components/campaigns/EmailHistory"
import PageHeader from "../components/navigation/PageHeader"
import AddCard from "../components/ui/AddCard"
import InputModal from "../components/modals/InputModal"
import type { GeneratedEmail, EmailConfig } from "../types/api";
import { generateEmailCampaign, getStoredTargetAccounts } from "../lib/accountService";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import { useAuthState } from '../lib/auth';

export default function CampaignsPage() {
  const navigate = useNavigate()
  const [emailHistory, setEmailHistory] = useState<GeneratedEmail[]>([])
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<"create" | "edit">("create")
  const [editingComponent, setEditingComponent] = useState<{
    type: string
    currentConfig: EmailConfig
  } | null>(null)
  const [currentEmailConfig, setCurrentEmailConfig] = useState<EmailConfig | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<GeneratedEmail | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const overview = useCompanyOverview();
  const authState = useAuthState();

  // Debug log to see emailHistory on every render
  console.log("Rendering CampaignsPage, emailHistory:", emailHistory)

  // Load emailHistory from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("emailHistory")
    console.log("[Campaigns] Raw emailHistory from localStorage:", stored)
    if (stored) {
      const parsed = JSON.parse(stored)
      console.log("[Campaigns] Parsed emailHistory from localStorage:", parsed)
      setEmailHistory(parsed)
    }
  }, [])

  const handleOpenCreateWizard = () => {
    setWizardMode("create")
    setEditingComponent(null)
    setCurrentEmailConfig(null)
    setIsWizardOpen(true)
  }

  const handleWizardComplete = async (config: EmailConfig) => {
    setIsGenerating(true);
    setError(null);
    try {
      console.log("[Campaigns] handleWizardComplete config:", config);
      // Gather context for the request
      if (!overview) throw new Error("Company overview not loaded");
      const accounts = getStoredTargetAccounts();
      const selectedAccount = accounts.find(acc => acc.id === config.selectedAccount);
      if (!selectedAccount) throw new Error("Selected account not found");
      const persona = selectedAccount.personas?.find(p => p.id === config.selectedPersona);
      if (!persona) throw new Error("Selected persona not found");
      // Build preferences from config
      const preferences = {
        useCase: config.selectedUseCase,
        emphasis: config.emphasis,
        openingLine: config.openingLine,
        ctaSetting: config.ctaSetting,
        template: config.template,
        socialProof: config.socialProof,
      };
      // Build the request
      const request = {
        companyContext: overview,
        targetAccount: selectedAccount,
        targetPersona: persona,
        preferences,
      };
      // Log the user prompt/request
      console.log("[Campaigns] EmailGenerationRequest payload:", request);
      // Call the LLM-backed API
      const response = await generateEmailCampaign(request, authState.token);
      console.log("[Campaigns] LLM API response:", response);
      // Build the new email object
      const newEmail: GeneratedEmail = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        config: config,
        subject: response.subjects.primary,
        body: response.emailBody.map(seg => seg.text).join("\n\n"),
        segments: response.emailBody.map(seg => ({ ...seg, color: response.breakdown[seg.type]?.color || "bg-blue-50 border-blue-200" })),
        breakdown: response.breakdown,
        companySnapshot: {
          companyName: overview.companyName,
          companyUrl: overview.companyUrl,
        },
        accountSnapshot: {
          id: selectedAccount.id,
          targetAccountName: selectedAccount.targetAccountName,
          targetAccountDescription: selectedAccount.targetAccountDescription,
        },
        personaSnapshot: {
          id: persona.id,
          targetPersonaName: persona.targetPersonaName,
          targetPersonaDescription: persona.targetPersonaDescription,
        },
      };
      console.log("[Campaigns] New email object:", newEmail);
      setEmailHistory((prev) => {
        const updated = [newEmail, ...prev];
        console.log("[Campaigns] Updated emailHistory (to be saved):", updated);
        localStorage.setItem("emailHistory", JSON.stringify(updated));
        return updated;
      });
      setIsWizardOpen(false);
      navigate(`/campaigns/${newEmail.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate email");
      console.error("[Campaigns] Error generating email:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectEmail = (email: GeneratedEmail) => {
    // Navigate to the campaign detail page
    navigate(`/campaigns/${email.id}`)
  }

  const handleEditEmail = (email: GeneratedEmail) => {
    setEditingEmail(email)
    setEditModalOpen(true)
  }

  const handleSaveEmailEdit = async ({ name, description }: { name: string; description: string }) => {
    if (!editingEmail) return
    setIsSaving(true)
    try {
      const updatedEmail: GeneratedEmail = {
        ...editingEmail,
        subject: name.trim(),
        body: description.trim(),
      }
      setEmailHistory((prev) => {
        const updated = prev.map(email => 
          email.id === editingEmail.id ? updatedEmail : email
        )
        console.log("[Campaigns] Updated emailHistory after edit (to be saved):", updated)
        localStorage.setItem("emailHistory", JSON.stringify(updated))
        return updated
      })
      setEditModalOpen(false)
      setEditingEmail(null)
    } catch (err) {
      console.error("Error updating email:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setEditingEmail(null)
  }

  const handleDeleteEmail = (email: GeneratedEmail) => {
    setEmailHistory((prev) => {
      const updated = prev.filter(e => e.id !== email.id)
      console.log("[Campaigns] Updated emailHistory after delete (to be saved):", updated)
      localStorage.setItem("emailHistory", JSON.stringify(updated))
      return updated
    })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Email Campaigns"
        subtitle="Generate personalized outreach emails"
        primaryAction={{
          label: "New Email",
          onClick: handleOpenCreateWizard,
          icon: <Plus className="w-4 h-4 mr-2" />
        }}
      />

      {/* Content Layout */}
      <div className="flex-1 flex flex-col overflow-hidden p-8 space-y-8">
        {/* View Toggle - Removed since we're using separate pages now */}

        {/* Content Area */}
        <div className="flex flex-1 gap-8 overflow-auto">
          {emailHistory.length === 0 ? (
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
              emails={emailHistory}
              onSelectEmail={handleSelectEmail}
              onEditEmail={handleEditEmail}
              onDeleteEmail={handleDeleteEmail}
              extraItem={<AddCard onClick={handleOpenCreateWizard} label="Add New" />}
            />
          )}
        </div>
      </div>

      {/* Email Wizard Modal */}
      <EmailWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
        mode={wizardMode}
        editingComponent={editingComponent}
        initialConfig={currentEmailConfig || undefined}
      />

      {/* Edit Email Modal */}
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
  )
}