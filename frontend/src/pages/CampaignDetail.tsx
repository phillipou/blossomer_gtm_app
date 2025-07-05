import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { LayoutGrid, Pencil } from "lucide-react"
import { EmailPreview } from "../components/campaigns/EmailPreview"
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal"
import SubNav from "../components/navigation/SubNav"
import CampaignDetailHeader, { type EditingMode as HeaderEditingMode } from "../components/campaigns/CampaignDetailHeader"
import type { GeneratedEmail, EmailConfig } from "../types/api"

interface EmailWizardModalProps {
  editingComponent: any;
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
    // In a real app, this would fetch the email data from an API
    // For now, we'll simulate loading the email data
    if (campaignId) {
      // Mock data - replace with actual API call
      const mockEmail: GeneratedEmail = {
        id: campaignId,
        timestamp: new Date().toLocaleString(),
        subject: "Quick question about scaling your sales process",
        body: `Hi [First Name],

I noticed you're building something exciting at [Company]. As a fellow founder, I know how challenging it can be to balance product development with the need to generate revenue.

Many technical founders I work with struggle with the same challenge: they need to prove product-market fit and generate early revenue, but don't want to get bogged down in manual sales tasks that take time away from building.

That's exactly why we built Blossomer - to help founders like you establish a predictable sales process without having to hire a full sales team yet.

Would you be open to a quick 15-minute call to discuss how we've helped other technical founders in similar situations?

Best,
[Your Name]`,
        segments: [
          { text: "Hi [First Name],", type: "greeting", color: "bg-purple-100 border-purple-200" },
          {
            text: "I noticed you're building something exciting at [Company]. As a fellow founder, I know how challenging it can be to balance product development with the need to generate revenue.",
            type: "opening",
            color: "bg-blue-100 border-blue-200",
          },
          {
            text: "Many technical founders I work with struggle with the same challenge: they need to prove product-market fit and generate early revenue, but don't want to get bogged down in manual sales tasks that take time away from building.",
            type: "pain-point",
            color: "bg-red-100 border-red-200",
          },
          {
            text: "That's exactly why we built Blossomer - to help founders like you establish a predictable sales process without having to hire a full sales team yet.",
            type: "solution",
            color: "bg-green-100 border-green-200",
          },
          {
            text: "Would you be open to a quick 15-minute call to discuss how we've helped other technical founders in similar situations?",
            type: "cta",
            color: "bg-yellow-100 border-yellow-200",
          },
          { text: "Best,\n[Your Name]", type: "signature", color: "bg-gray-100 border-gray-200" },
        ],
        breakdown: {
          subject: {
            label: "Subject Line",
            description: "The email's subject line, crafted to grab attention",
            color: "bg-blue-50 border-blue-200",
          },
          greeting: {
            label: "Greeting",
            description: "Standard personalized greeting",
            color: "bg-purple-100 border-purple-200",
          },
          opening: {
            label: "Opening Line",
            description: "Personalized based on company research",
            color: "bg-blue-100 border-blue-200",
          },
          "pain-point": {
            label: "Pain Point",
            description: "Manual sales tasks taking time from product",
            color: "bg-red-100 border-red-200",
          },
          solution: {
            label: "Solution",
            description: "Scaling Sales Without Hiring use case",
            color: "bg-green-100 border-green-200",
          },
          cta: {
            label: "Call to Action",
            description: "Ask for meeting: 15-minute call",
            color: "bg-yellow-100 border-yellow-200",
          },
          signature: { label: "Signature", description: "Professional closing", color: "bg-gray-100 border-gray-200" },
        },
        config: {
          selectedAccount: "1",
          selectedPersona: "1", 
          selectedUseCase: "1",
          emphasis: "pain-point",
          template: "professional",
          openingLine: "custom",
          ctaSetting: "meeting",
          companyName: "Demo Company",
          accountName: "Demo Account",
          personaName: "Demo Persona",
        },
      }
      setEmail(mockEmail)
    }
  }, [campaignId])



  const handleWizardComplete = (config: EmailConfig) => {
    // Update the email with new config
    if (email) {
      setEmail({
        ...email,
        config: config,
      })
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
    console.log("Saving email:", email)
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

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/campaigns" },
          { label: email.subject || campaignId || "Campaign" }
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
      />
      <div className="flex-1 p-8">
        <CampaignDetailHeader
          subject={email.subject}
          timestamp={email.timestamp}
          modeTabs={modeTabs}
          editingMode={editingMode}
          setEditingMode={setEditingMode}
          companyName={email.config?.companyName || "Company"}
          accountName={email.config?.accountName || "Account"}
          personaName={email.config?.personaName || "Persona"}
        />
        {/* Content Area */}
        <div className="overflow-auto p-0">
          <EmailPreview
            email={email}
            onCreateVariant={handleCreateVariant as any}
            onCopy={handleCopyEmail as any}
            onSend={handleSaveEmail as any}
            editingMode={editingMode}
            setEditingMode={setEditingMode}
          />
        </div>
      </div>
      {/* Email Wizard Modal */}
      <EmailWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete as any}
        mode="edit"
        editingComponent={editingComponent}
        initialConfig={email.config}
      />
    </div>
  )
} 