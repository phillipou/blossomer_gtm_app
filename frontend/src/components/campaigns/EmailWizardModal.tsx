import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { ChevronRight, ChevronLeft, Wand2, X, RefreshCw } from "lucide-react"
import { EditDialog, EditDialogContent, EditDialogHeader, EditDialogTitle } from "../ui/dialog"

interface EmailWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: any) => void
  mode: "create" | "edit"
  editingComponent?: {
    type: string
    currentConfig: any
  } | null
  initialConfig?: any
}

// Mock data - in real app this would come from API
const targetAccounts = [
  { id: "1", name: "Technical B2B SaaS Founder-Led Startups" },
  { id: "2", name: "Marketing Directors at Mid-Market Companies" },
]

const targetPersonas = [
  { id: "1", name: "Startup Founder", accountId: "1" },
  { id: "2", name: "Technical Co-founder", accountId: "1" },
  { id: "3", name: "Marketing Director", accountId: "2" },
]

const useCases = [
  {
    id: "1",
    title: "Scaling Sales Without Hiring",
    description: "Help founders establish sales processes before building a team",
    personaIds: ["1", "2"],
  },
  {
    id: "2",
    title: "Founder Time Optimization",
    description: "Reduce manual sales tasks to focus on product development",
    personaIds: ["1", "2"],
  },
  {
    id: "3",
    title: "Predictable Revenue Generation",
    description: "Build repeatable systems for consistent customer acquisition",
    personaIds: ["1", "3"],
  },
]

export function EmailWizardModal({
  isOpen,
  onClose,
  onComplete,
  mode,
  editingComponent,
  initialConfig,
}: EmailWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [config, setConfig] = useState({
    selectedAccount: "",
    selectedPersona: "",
    selectedUseCase: "",
    emphasis: "",
    template: "",
    openingLine: "",
    ctaSetting: "",
  })

  // Define steps based on mode
  const getSteps = () => {
    if (mode === "edit" && editingComponent) {
      // For editing specific components, show relevant steps only
      switch (editingComponent.type) {
        case "opening":
          return [{ title: "Opening Line", description: "Customize the opening approach", fields: ["openingLine"] }]
        case "pain-point":
          return [{ title: "Emphasis", description: "Adjust the emphasis approach", fields: ["emphasis"] }]
        case "solution":
          return [{ title: "Use Case", description: "Modify the use case focus", fields: ["selectedUseCase"] }]
        case "cta":
          return [{ title: "Call to Action", description: "Update the call to action", fields: ["ctaSetting"] }]
        case "greeting":
        case "signature":
          return [{ title: "Template", description: "Adjust template settings", fields: ["template"] }]
        default:
          // Fallback for unknown component types
          return [{ title: "Template", description: "Adjust template settings", fields: ["template"] }]
      }
    }

    // Full creation flow
    return [
      {
        title: "Target Selection",
        description: "Choose your target account and persona",
        fields: ["selectedAccount", "selectedPersona"],
      },
      {
        title: "Use Case & Emphasis",
        description: "Select the use case and what to emphasize",
        fields: ["selectedUseCase", "emphasis"],
      },
      {
        title: "Template & Personalization",
        description: "Choose template and personalization settings",
        fields: ["template", "openingLine", "ctaSetting"],
      },
    ]
  }

  const steps = getSteps()

  // Ensure currentStep is always within bounds
  const safeCurrentStep = Math.min(currentStep, steps.length - 1)
  const currentStepData = steps[safeCurrentStep] || {
    title: "Configuration",
    description: "Configure settings",
    fields: [],
  }

  const canProceed = currentStepData.fields.every((field) => config[field as keyof typeof config])
  const isLastStep = safeCurrentStep === steps.length - 1
  const filteredPersonas = targetPersonas.filter((persona) => persona.accountId === config.selectedAccount)
  const filteredUseCases = useCases.filter((useCase) => useCase.personaIds.includes(config.selectedPersona))

  // Initialize config when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialConfig) {
        setConfig(initialConfig)
      } else if (mode === "create") {
        setConfig({
          selectedAccount: "",
          selectedPersona: "",
          selectedUseCase: "",
          emphasis: "",
          template: "",
          openingLine: "",
          ctaSetting: "",
        })
      }
      setCurrentStep(0)
      setIsGenerating(false)
    }
  }, [isOpen, mode, initialConfig])

  const handleNext = async () => {
    if (isLastStep) {
      setIsGenerating(true)
      // Simulate generation/update time
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onComplete(config)
      setIsGenerating(false)
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleClose = () => {
    setConfig({
      selectedAccount: "",
      selectedPersona: "",
      selectedUseCase: "",
      emphasis: "",
      template: "",
      openingLine: "",
      ctaSetting: "",
    })
    setCurrentStep(0)
    setIsGenerating(false)
    onClose()
  }

  const getActionButtonText = () => {
    if (isGenerating) {
      return mode === "edit" ? "Updating..." : "Generating..."
    }
    if (isLastStep) {
      return mode === "edit" ? "Update Email" : "Generate Email"
    }
    return "Next"
  }

  const getModalTitle = () => {
    if (mode === "edit" && editingComponent) {
      return `Edit ${editingComponent.type.charAt(0).toUpperCase() + editingComponent.type.slice(1).replace("-", " ")}`
    }
    return "Email Campaign Wizard"
  }

  return (
    <EditDialog open={isOpen} onOpenChange={handleClose}>
      <EditDialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 pb-6 pt-2">
          <EditDialogHeader className="flex flex-row items-center justify-between">
            <div>
              <EditDialogTitle>{getModalTitle()}</EditDialogTitle>
              <p className="text-sm text-gray-600 mt-1">{steps[safeCurrentStep].description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">
                Step {safeCurrentStep + 1} of {steps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </EditDialogHeader>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((safeCurrentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="space-y-6 min-h-[300px]">
            {/* Target Selection Step */}
            {safeCurrentStep === 0 && mode === "create" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">Target Account</Label>
                  <Select
                    value={config.selectedAccount}
                    onValueChange={(value) =>
                      setConfig((prev) => ({ ...prev, selectedAccount: value, selectedPersona: "" }))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select target account" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {config.selectedAccount && (
                  <div>
                    <Label className="text-base font-medium mb-3 block">Target Persona</Label>
                    <Select
                      value={config.selectedPersona}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, selectedPersona: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select target persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPersonas.map((persona) => (
                          <SelectItem key={persona.id} value={persona.id}>
                            {persona.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Use Case & Emphasis Step */}
            {((safeCurrentStep === 1 && mode === "create") ||
              (mode === "edit" &&
                (currentStepData.fields.includes("selectedUseCase") || currentStepData.fields.includes("emphasis")))) && (
              <div className="space-y-6">
                {currentStepData.fields.includes("selectedUseCase") && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">Use Case</Label>
                    <RadioGroup
                      value={config.selectedUseCase}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, selectedUseCase: value }))}
                    >
                      <div className="space-y-3">
                        {(mode === "create" ? filteredUseCases : useCases).map((useCase) => (
                          <div
                            key={useCase.id}
                            className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => setConfig((prev) => ({ ...prev, selectedUseCase: useCase.id }))}
                            tabIndex={0}
                            role="button"
                            aria-pressed={config.selectedUseCase === useCase.id}
                          >
                            <RadioGroupItem value={useCase.id} id={useCase.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={useCase.id} className="font-medium cursor-pointer">
                                {useCase.title}
                              </Label>
                              <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentStepData.fields.includes("emphasis") && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">Emphasis</Label>
                    <RadioGroup
                      value={config.emphasis}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, emphasis: value }))}
                    >
                      <div className="space-y-3">
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, emphasis: "capabilities" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.emphasis === "capabilities"}
                        >
                          <RadioGroupItem value="capabilities" id="capabilities" className="mt-1" />
                          <div>
                            <Label htmlFor="capabilities" className="font-medium cursor-pointer">
                              Capabilities
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Focus on what your solution can do</p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, emphasis: "pain-point" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.emphasis === "pain-point"}
                        >
                          <RadioGroupItem value="pain-point" id="pain-point" className="mt-1" />
                          <div>
                            <Label htmlFor="pain-point" className="font-medium cursor-pointer">
                              Pain Point
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Highlight the problems you solve</p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, emphasis: "desired-outcome" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.emphasis === "desired-outcome"}
                        >
                          <RadioGroupItem value="desired-outcome" id="desired-outcome" className="mt-1" />
                          <div>
                            <Label htmlFor="desired-outcome" className="font-medium cursor-pointer">
                              Desired Outcome
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Emphasize the results they'll achieve</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {/* Template & Personalization Step */}
            {((safeCurrentStep === 2 && mode === "create") ||
              (mode === "edit" &&
                (currentStepData.fields.includes("template") ||
                  currentStepData.fields.includes("openingLine") ||
                  currentStepData.fields.includes("ctaSetting")))) && (
              <div className="space-y-6">
                {currentStepData.fields.includes("template") && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">Template</Label>
                    <RadioGroup
                      value={config.template}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, template: value }))}
                    >
                      <div className="space-y-3">
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, template: "blossomer" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.template === "blossomer"}
                        >
                          <RadioGroupItem value="blossomer" id="blossomer" className="mt-1" />
                          <div>
                            <Label htmlFor="blossomer" className="font-medium cursor-pointer">
                              Blossomer Best Practice
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Proven template optimized for B2B outreach</p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, template: "custom" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.template === "custom"}
                        >
                          <RadioGroupItem value="custom" id="custom" className="mt-1" />
                          <div>
                            <Label htmlFor="custom" className="font-medium cursor-pointer">
                              Custom Template
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Flexible template for unique approaches</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentStepData.fields.includes("openingLine") && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">Opening Line</Label>
                    <RadioGroup
                      value={config.openingLine}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, openingLine: value }))}
                    >
                      <div className="space-y-3">
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, openingLine: "buying-signal" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.openingLine === "buying-signal"}
                        >
                          <RadioGroupItem value="buying-signal" id="buying-signal" className="mt-1" />
                          <div>
                            <Label htmlFor="buying-signal" className="font-medium cursor-pointer">
                              Personalized based on buying signal
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              Reference recent funding, hiring, or growth signals
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, openingLine: "company-research" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.openingLine === "company-research"}
                        >
                          <RadioGroupItem value="company-research" id="company-research" className="mt-1" />
                          <div>
                            <Label htmlFor="company-research" className="font-medium cursor-pointer">
                              Personalized based on company research
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              Reference company news, products, or achievements
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, openingLine: "not-personalized" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.openingLine === "not-personalized"}
                        >
                          <RadioGroupItem value="not-personalized" id="not-personalized" className="mt-1" />
                          <div>
                            <Label htmlFor="not-personalized" className="font-medium cursor-pointer">
                              Not personalized
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Generic opening suitable for broad outreach</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentStepData.fields.includes("ctaSetting") && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">Call to Action</Label>
                    <RadioGroup
                      value={config.ctaSetting}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, ctaSetting: value }))}
                    >
                      <div className="space-y-3">
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, ctaSetting: "feedback" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.ctaSetting === "feedback"}
                        >
                          <RadioGroupItem value="feedback" id="feedback" className="mt-1" />
                          <div>
                            <Label htmlFor="feedback" className="font-medium cursor-pointer">
                              Ask for feedback
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Low-pressure request for input or thoughts</p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, ctaSetting: "meeting" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.ctaSetting === "meeting"}
                        >
                          <RadioGroupItem value="meeting" id="meeting" className="mt-1" />
                          <div>
                            <Label htmlFor="meeting" className="font-medium cursor-pointer">
                              Ask for meeting
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Direct request for a call or meeting</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={handleBack} disabled={safeCurrentStep === 0 || isGenerating}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button onClick={handleNext} disabled={!canProceed || isGenerating} className="bg-blue-600 hover:bg-blue-700">
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {getActionButtonText()}
                </>
              ) : isLastStep ? (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {getActionButtonText()}
                </>
              ) : (
                <>
                  {getActionButtonText()}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </EditDialogContent>
    </EditDialog>
  )
} 