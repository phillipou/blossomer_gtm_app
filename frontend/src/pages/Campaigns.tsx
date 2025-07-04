import { useState } from "react"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Wand2, Plus, Bell } from "lucide-react"
import { EmailWizardModal } from "../components/campaigns/EmailWizardModal"
import { EmailPreview } from "../components/campaigns/EmailPreview"
import { EmailHistory } from "../components/campaigns/EmailHistory"
import PageHeader from "../components/navigation/PageHeader"

// Mock data - in real app this would come from API
// const targetAccounts = [
//   { id: "1", name: "Technical B2B SaaS Founder-Led Startups" },
//   { id: "2", name: "Marketing Directors at Mid-Market Companies" },
// ]

// const targetPersonas = [
//   { id: "1", name: "Startup Founder", accountId: "1" },
//   { id: "2", name: "Technical Co-founder", accountId: "1" },
//   { id: "3", name: "Marketing Director", accountId: "2" },
// ]

// const useCases = [
//   {
//     id: "1",
//     title: "Scaling Sales Without Hiring",
//     description: "Help founders establish sales processes before building a team",
//     personaIds: ["1", "2"],
//   },
//   {
//     id: "2",
//     title: "Founder Time Optimization",
//     description: "Reduce manual sales tasks to focus on product development",
//     personaIds: ["1", "2"],
//   },
//   {
//     id: "3",
//     title: "Predictable Revenue Generation",
//     description: "Build repeatable systems for consistent customer acquisition",
//     personaIds: ["1", "3"],
//   },
// ]

interface GeneratedEmail {
  id: string
  timestamp: string
  subject: string
  body: string
  segments: EmailSegment[]
  breakdown: EmailBreakdown
  config?: any
}

interface EmailSegment {
  text: string
  type: string
  color: string
}

interface EmailBreakdown {
  subject: {
    label: string
    description: string
    color: string
  }
  greeting: {
    label: string
    description: string
    color: string
  }
  opening: {
    label: string
    description: string
    color: string
  }
  "pain-point": {
    label: string
    description: string
    color: string
  }
  solution: {
    label: string
    description: string
    color: string
  }
  cta: {
    label: string
    description: string
    color: string
  }
  signature: {
    label: string
    description: string
    color: string
  }
}

export default function CampaignsPage() {
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [emailHistory, setEmailHistory] = useState<GeneratedEmail[]>([])
  const [activeView, setActiveView] = useState<"preview" | "history">("preview")
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<"create" | "edit">("create")
  const [editingComponent, setEditingComponent] = useState<{
    type: string
    currentConfig: any
  } | null>(null)
  const [currentEmailConfig, setCurrentEmailConfig] = useState<any>(null)

  const handleOpenCreateWizard = () => {
    setWizardMode("create")
    setEditingComponent(null)
    setCurrentEmailConfig(null)
    setIsWizardOpen(true)
  }

  const handleOpenEditWizard = (componentType: string, email: GeneratedEmail) => {
    setWizardMode("edit")
    setEditingComponent({
      type: componentType,
      currentConfig: email.config,
    })
    setCurrentEmailConfig(email.config)
    setIsWizardOpen(true)
  }

  const handleWizardComplete = (config: any) => {
    // Generate email data based on config
    const emailData = generateEmailFromConfig(config)

    const newEmail: GeneratedEmail = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      config: config,
      ...emailData,
    }

    if (wizardMode === "create") {
      // Add new email to history
      setEmailHistory((prev) => [newEmail, ...prev])
      setGeneratedEmail(newEmail)
      setActiveView("preview")
    } else {
      // Update existing email
      setEmailHistory((prev) =>
        prev.map((email) =>
          email.id === generatedEmail?.id ? { ...email, ...newEmail, id: email.id, timestamp: email.timestamp } : email,
        ),
      )
      setGeneratedEmail((prev) => prev ? { ...prev, ...newEmail, id: prev.id, timestamp: prev.timestamp } : null)
    }

    setIsWizardOpen(false)
  }

  const generateEmailFromConfig = (_config: any): Omit<GeneratedEmail, 'id' | 'timestamp' | 'config'> => {
    // This would normally call an API, but for demo we'll return mock data
    return {
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
    }
  }

  const handleCreateVariant = (email: GeneratedEmail) => {
    const variant: GeneratedEmail = {
      ...email,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      subject: email.subject + " (Variant)",
    }
    setEmailHistory((prev) => [variant, ...prev])
    setGeneratedEmail(variant)
  }

  const handleCopyEmail = (email: GeneratedEmail) => {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
  }

  const handleSaveEmail = (email: GeneratedEmail) => {
    console.log("Saving email:", email)
    // TODO: Implement save functionality
  }

  const handleSelectEmail = (email: GeneratedEmail) => {
    setGeneratedEmail(email)
    setActiveView("preview")
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* View Toggle */}
        {emailHistory.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveView("preview")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Preview {generatedEmail && `(Current)`}
              </button>
              <button
                onClick={() => setActiveView("history")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Emails ({emailHistory.length})
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex flex-1 gap-8 overflow-auto p-6">
          {activeView === "preview" ? (
            generatedEmail ? (
              <div className="w-full">
                <EmailPreview
                  email={generatedEmail}
                  onCreateVariant={handleCreateVariant}
                  onCopy={handleCopyEmail}
                  onSend={handleSaveEmail}
                  onEditComponent={handleOpenEditWizard}
                />
              </div>
            ) : (
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
            )
          ) : (
            <div className="max-w-6xl mx-auto">
              <EmailHistory
                emails={emailHistory}
                onSelectEmail={handleSelectEmail}
                onCopyEmail={handleCopyEmail}
                onSendEmail={handleSaveEmail}
              />
            </div>
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
        initialConfig={currentEmailConfig}
      />
    </div>
  )
} 