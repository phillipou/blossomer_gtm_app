import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { LayoutGrid, Pencil } from "lucide-react"
import { EmailPreview } from "../components/campaigns/EmailPreview"
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal"
import SubNav from "../components/navigation/SubNav"
import CampaignDetailHeader, { type EditingMode as HeaderEditingMode } from "../components/campaigns/CampaignDetailHeader"
import type { GeneratedEmail, EmailConfig, CompanyOverviewResponse, TargetAccountResponse, TargetPersonaResponse } from "../types/api"
import { transformKeysToCamelCase } from "../lib/utils"

interface EmailWizardModalProps {
  editingComponent: { type: string; currentConfig: EmailConfig } | null;
}


const EditingMode = {
  Component: "component" as HeaderEditingMode,
  Writing: "writing" as HeaderEditingMode,
};

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [email, setEmail] = useState<GeneratedEmail | null>(null)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingComponent] = useState<EmailWizardModalProps['editingComponent']>(null)
  const [editingMode, setEditingMode] = useState<HeaderEditingMode>(EditingMode.Component)

  useEffect(() => {
    // Load the email data from localStorage
    if (campaignId) {
      const stored = localStorage.getItem("emailHistory")
      if (stored) {
        const emailHistory: GeneratedEmail[] = JSON.parse(stored)
        const foundEmail = emailHistory.find(email => email.id === campaignId)
        
        if (foundEmail) {
          console.log("[CampaignDetail] Loaded campaignId:", campaignId)
          console.log("[CampaignDetail] Loaded real email:", foundEmail)
          setEmail(foundEmail)
        } else {
          console.warn("[CampaignDetail] Email not found in localStorage:", campaignId)
          // Navigate back to campaigns if email not found
          navigate('/campaigns')
        }
      } else {
        console.warn("[CampaignDetail] No emailHistory in localStorage")
        // Navigate back to campaigns if no email history
        navigate('/campaigns')
      }
    }
  }, [campaignId, navigate])



  const handleWizardComplete = async (config: EmailConfig) => {
    // Update the email with new config and save to localStorage
    console.log("[CampaignDetail] handleWizardComplete config:", config)
    if (email) {
      const updatedEmail = {
        ...email,
        config: config,
      }
      console.log("[CampaignDetail] Updated email after wizard complete:", updatedEmail)
      
      // Update localStorage
      const stored = localStorage.getItem("emailHistory")
      if (stored) {
        const emailHistory: GeneratedEmail[] = JSON.parse(stored)
        const updatedHistory = emailHistory.map(e => 
          e.id === email.id ? updatedEmail : e
        )
        localStorage.setItem("emailHistory", JSON.stringify(updatedHistory))
      }
      
      setEmail(updatedEmail)
    }
    setIsWizardOpen(false)
  }

  const handleCreateVariant = (email: GeneratedEmail) => {
    // Navigate to create a new variant
    navigate("/campaigns", { state: { createVariant: true, baseEmail: email } })
  }

  const handleCopyEmail = (email: GeneratedEmail) => {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
  }

  const handleSaveEmail = (email: GeneratedEmail) => {
    console.log("[CampaignDetail] handleSaveEmail, email to save:", email)
    // TODO: Implement save functionality
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading campaign...</p>
        </div>
      </div>
    )
  }

  // Tab switcher for Component Mode (left, default) and Writing Mode (right)
  const modeTabs = [
    { label: "Component Mode", value: EditingMode.Component, icon: <LayoutGrid className="w-4 h-4 mr-2" /> },
    { label: "Writing Mode", value: EditingMode.Writing, icon: <Pencil className="w-4 h-4 mr-2" /> },
  ];

  // Use snapshots from the email object for display context
  const company = email.companySnapshot ? { companyName: email.companySnapshot.companyName, companyUrl: email.companySnapshot.companyUrl } : null;
  const account = email.accountSnapshot ? { id: email.accountSnapshot.id, targetAccountName: email.accountSnapshot.targetAccountName, targetAccountDescription: email.accountSnapshot.targetAccountDescription } : null;
  const persona = email.personaSnapshot ? { id: email.personaSnapshot.id, targetPersonaName: email.personaSnapshot.targetPersonaName, targetPersonaDescription: email.personaSnapshot.targetPersonaDescription } : null;

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Company", href: "/company" },
          { label: "Campaigns", href: "/campaigns" },
          { label: email.subject || campaignId || "Campaign" }
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="campaign"
      />
      <div className="flex-1 p-8">
        <CampaignDetailHeader
          subject={email.subject}
          timestamp={email.timestamp}
          modeTabs={modeTabs}
          editingMode={editingMode}
          setEditingMode={setEditingMode}
          company={company}
          account={account}
          persona={persona}
        />
        {/* Content Area */}
        <div className="overflow-auto p-0">
          <EmailPreview
            email={email}
            onCreateVariant={handleCreateVariant}
            onCopy={handleCopyEmail}
            onSend={handleSaveEmail}
            editingMode={editingMode}
            setEditingMode={setEditingMode}
          />
        </div>
      </div>
      {/* Email Wizard Modal */}
      <EmailWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
        mode="edit"
        editingComponent={editingComponent}
        initialConfig={email.config}
      />
    </div>
  )
} 