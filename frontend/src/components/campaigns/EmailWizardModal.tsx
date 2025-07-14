import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { ChevronRight, ChevronLeft, Wand2, X, RefreshCw } from "lucide-react"
import { EditDialog, EditDialogContent, EditDialogHeader, EditDialogTitle } from "../ui/dialog"
import { useGetAccounts } from "../../lib/hooks/useAccounts"
import { useGetAllPersonas } from "../../lib/hooks/usePersonas"
import { useCompanyContext } from "../../lib/hooks/useCompanyContext"
import { useAuthState } from "../../lib/auth"
import { DraftManager } from "../../lib/draftManager"
import { getAccountName } from "../../lib/entityDisplayUtils"
import { ModalLoadingOverlay, ModalLoadingMessages } from "../ui/modal-loading"

interface EmailWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: EmailConfig) => Promise<void>
  mode: "create" | "edit"
  editingComponent?: {
    type: string;
    currentConfig: EmailConfig;
  } | null;
  initialConfig?: EmailConfig;
}

interface EmailConfig {
  selectedAccount: string;
  selectedPersona: string;
  selectedUseCase: string;
  emphasis: string;
  template: string;
  openingLine: string;
  ctaSetting: string;
  socialProof?: string;
  companyName?: string;
  accountName?: string;
  personaName?: string;
}

// Transform stored data for wizard use
interface WizardAccount {
  id: string;
  name: string;
}

interface WizardPersona {
  id: string;
  name: string;
  accountId: string;
}

interface WizardUseCase {
  id: string;
  title: string;
  description: string;
  personaIds: string[];
}

export function EmailWizardModal({
  isOpen,
  onClose,
  onComplete,
  mode,
  editingComponent,
  initialConfig,
}: EmailWizardModalProps) {
  const { token } = useAuthState()
  const { companyId, isLoading: isCompanyLoading } = useCompanyContext()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [targetAccounts, setTargetAccounts] = useState<WizardAccount[]>([])
  const [targetPersonas, setTargetPersonas] = useState<WizardPersona[]>([])
  const [allPersonasData, setAllPersonasData] = useState<Array<{ persona: any; accountId: string }>>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<EmailConfig>({
    selectedAccount: "",
    selectedPersona: "",
    selectedUseCase: "",
    emphasis: "",
    template: "",
    openingLine: "",
    ctaSetting: "",
    socialProof: "",
  })

  // Fetch all accounts and personas upfront using existing hooks
  const { data: apiAccounts, isLoading: isAccountsLoading } = useGetAccounts(companyId || "", token)
  
  // For authenticated users, use the hook that automatically syncs personas to DraftManager
  // This ensures API personas are available even if user hasn't visited Personas page
  const { data: apiPersonas, isLoading: isPersonasLoading } = useGetAllPersonas(companyId || "", token);
  
  // Get all personas from DraftManager (works for both auth states)
  // - For authenticated users: API personas synced by useGetAllPersonas in Personas page + any drafts
  // - For unauthenticated users: only draft personas created in playground mode
  const allDraftPersonas = DraftManager.getDrafts('persona')
  
  // Get draft accounts for unauthenticated users
  const draftAccounts = !token ? DraftManager.getDrafts('account') : []

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
        fields: ["template", "openingLine", "ctaSetting", "socialProof"],
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

  const canProceed = currentStepData.fields.every((field) => {
    if (field === "socialProof") return true // socialProof is optional
    return config[field as keyof typeof config]
  })
  const isLastStep = safeCurrentStep === steps.length - 1
  const filteredPersonas = targetPersonas.filter((persona) => persona.accountId === config.selectedAccount)
  
  // Get use cases from selected persona
  const getUseCasesForSelectedPersona = (): WizardUseCase[] => {
    if (!config.selectedPersona) {
      console.log('[USE-CASES] No persona selected');
      return [];
    }
    
    const selectedPersonaData = allPersonasData.find(
      ({ persona }) => persona.id === config.selectedPersona
    );
    
    console.log('[USE-CASES] Looking for use cases in persona:', {
      selectedPersonaId: config.selectedPersona,
      foundPersonaData: !!selectedPersonaData,
      personaKeys: selectedPersonaData ? Object.keys(selectedPersonaData.persona) : 'no persona',
      hasUseCases: !!(selectedPersonaData?.persona.useCases),
      useCasesLength: selectedPersonaData?.persona.useCases?.length || 0,
      useCasesData: selectedPersonaData?.persona.useCases,
      fullPersonaData: selectedPersonaData?.persona
    });
    
    if (!selectedPersonaData?.persona.useCases) {
      console.log('[USE-CASES] No use cases found in persona data');
      return [];
    }
    
    const useCases = selectedPersonaData.persona.useCases.map((useCase: any, index: number) => ({
      id: `${config.selectedPersona}_${index}`,
      title: useCase.useCase || useCase.title || `Use Case ${index + 1}`,
      description: useCase.painPoints && useCase.desiredOutcome 
        ? `${useCase.painPoints} → ${useCase.desiredOutcome}`
        : useCase.description || 'No description available',
      personaIds: [config.selectedPersona]
    }));
    
    console.log('[USE-CASES] Transformed use cases:', useCases);
    return useCases;
  }
  
  const filteredUseCases = getUseCasesForSelectedPersona()

  // Combine all data sources when modal opens or data changes
  useEffect(() => {
    if (!isOpen || isCompanyLoading || isAccountsLoading) return
    
    // For authenticated users, wait for persona loading to complete
    if (token && isPersonasLoading) return
    
    try {
      setLoading(true)
      
      console.log('[EMAIL-WIZARD] Starting data load:', {
        isAuthenticated: !!token,
        hasApiAccounts: !!(apiAccounts && apiAccounts.length > 0),
        hasApiPersonas: !!(apiPersonas && apiPersonas.length > 0),
        draftAccountsCount: draftAccounts.length,
        draftPersonasCount: allDraftPersonas.length
      });
      
      // Combine all accounts from both sources
      let allAccounts: any[] = []
      
      // Add API accounts (for authenticated users)
      if (token && apiAccounts) {
        allAccounts = [...apiAccounts]
        console.log('[EMAIL-WIZARD] Added API accounts:', apiAccounts.length);
      }
      
      // Add draft accounts (for unauthenticated users)
      if (!token) {
        const transformedDraftAccounts = draftAccounts.map(draft => ({
          ...draft.data,
          id: draft.tempId,
          isDraft: true,
        }))
        allAccounts = [...allAccounts, ...transformedDraftAccounts]
        console.log('[EMAIL-WIZARD] Added draft accounts for unauthenticated user:', transformedDraftAccounts.length);
      }
      
      // Transform accounts for wizard use
      const transformedAccounts: WizardAccount[] = allAccounts.map(account => ({
        id: account.id,
        name: getAccountName(account) || 'Untitled Account'
      }))
      
      // Transform all personas for wizard use
      const transformedPersonas: WizardPersona[] = []
      const allPersonasData: Array<{ persona: any; accountId: string }> = []
      
      allDraftPersonas.forEach(draft => {
        const persona = draft.data
        const accountId = draft.parentId || persona.accountId
        
        // Only include personas that belong to available accounts
        const accountExists = allAccounts.some(account => account.id === accountId)
        if (accountExists) {
          // Use the real persona ID if available, otherwise use the draft temp ID
          const personaId = persona.id || draft.tempId;
          const isApiPersona = !!(persona.id && !persona.id.startsWith('temp_'));
          
          const wizardPersona: WizardPersona = {
            id: personaId,
            name: persona.targetPersonaName || persona.name || 'Untitled Persona',
            accountId: accountId
          }
          
          transformedPersonas.push(wizardPersona)
          // Use the real persona ID for data lookup consistency
          allPersonasData.push({ persona: { ...persona, id: personaId }, accountId })
          
          console.log('[EMAIL-WIZARD] Added persona:', {
            personaId,
            name: wizardPersona.name,
            accountId,
            source: isApiPersona ? 'API' : 'DRAFT',
            hasUseCases: !!(persona.useCases && persona.useCases.length > 0),
            useCasesCount: persona.useCases?.length || 0
          });
        }
      })
      
      console.log('[EMAIL-WIZARD] Loaded data:', {
        accountsCount: transformedAccounts.length,
        personasCount: transformedPersonas.length,
        isAuthenticated: !!token,
        companyId,
        allAccountIds: allAccounts.map(a => a.id),
        allPersonaAccountIds: transformedPersonas.map(p => p.accountId),
        personaDataSample: allPersonasData.slice(0, 2).map(p => ({
          personaId: p.persona.id,
          name: p.persona.targetPersonaName || p.persona.name,
          source: p.persona.id && !p.persona.id.startsWith('temp_') ? 'API' : 'DRAFT',
          hasUseCases: !!(p.persona.useCases && p.persona.useCases.length > 0),
          useCasesCount: p.persona.useCases?.length || 0,
          useCasesPreview: p.persona.useCases?.slice(0, 2),
          dataKeys: Object.keys(p.persona.data || {}),
          topLevelKeys: Object.keys(p.persona).filter(k => k !== 'data')
        })),
        loadingStates: {
          isCompanyLoading,
          isAccountsLoading,
          isPersonasLoading: token ? isPersonasLoading : 'N/A (unauthenticated)'
        }
      })
      
      setTargetAccounts(transformedAccounts)
      setTargetPersonas(transformedPersonas)
      setAllPersonasData(allPersonasData)
      
    } catch (error) {
      console.error('Error loading target accounts and personas:', error)
      setTargetAccounts([])
      setTargetPersonas([])
      setAllPersonasData([])
    } finally {
      setLoading(false)
    }
  }, [isOpen, token, companyId, isCompanyLoading, apiAccounts, isAccountsLoading, apiPersonas, isPersonasLoading, allDraftPersonas.length, draftAccounts.length])

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
          socialProof: "",
        })
      }
      setCurrentStep(0)
      setIsGenerating(false)
    }
  }, [isOpen, mode, initialConfig])

  // Auto-select blossomer template when reaching step 3 if no template is selected
  useEffect(() => {
    if (safeCurrentStep === 2 && mode === "create" && !config.template) {
      setConfig(prev => ({ ...prev, template: "blossomer" }))
    }
  }, [safeCurrentStep, mode, config.template])

  const handleNext = async () => {
    if (isLastStep) {
      setIsGenerating(true)
      try {
        await onComplete(config)
        setIsGenerating(false)
      } catch (error) {
        setIsGenerating(false)
        console.error('Email generation failed:', error)
      }
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
      socialProof: "",
    })
    setCurrentStep(0)
    setIsGenerating(false)
    onClose()
  }

  const getActionButtonText = () => {
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
        <ModalLoadingOverlay isLoading={isGenerating} message={ModalLoadingMessages.generatingEmail}>
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-gray-600">Loading target accounts and personas...</span>
                  </div>
                ) : targetAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No target accounts found.</p>
                    <p className="text-sm text-gray-500">
                      Generate target accounts and personas from the Accounts or Personas pages first.
                    </p>
                  </div>
                ) : (
                  <>
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
                            {filteredPersonas.length === 0 ? (
                              <div className="px-2 py-1 text-sm text-gray-500">
                                No personas found for this account
                              </div>
                            ) : (
                              filteredPersonas.map((persona) => (
                                <SelectItem key={persona.id} value={persona.id}>
                                  {persona.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
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
                        {filteredUseCases.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 border rounded-lg">
                            {config.selectedPersona ? (
                              "No use cases found for this persona"
                            ) : (
                              "Select a persona to see available use cases"
                            )}
                          </div>
                        ) : (
                          filteredUseCases.map((useCase) => (
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
                          ))
                        )}
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
                  currentStepData.fields.includes("ctaSetting") ||
                  currentStepData.fields.includes("socialProof")))) && (
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
                          className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50 cursor-not-allowed opacity-60 relative"
                          aria-disabled="true"
                        >
                          <RadioGroupItem value="custom" id="custom" className="mt-1" disabled />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Label htmlFor="custom" className="font-medium text-gray-500">
                                Custom Template
                              </Label>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Coming Soon
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              We're building custom template support for advanced use cases
                            </p>
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
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, ctaSetting: "priority-check" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.ctaSetting === "priority-check"}
                        >
                          <RadioGroupItem value="priority-check" id="priority-check" className="mt-1" />
                          <div>
                            <Label htmlFor="priority-check" className="font-medium cursor-pointer">
                              Ask if this is a priority
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Gauge timing and urgency for their needs</p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, ctaSetting: "free-resource" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.ctaSetting === "free-resource"}
                        >
                          <RadioGroupItem value="free-resource" id="free-resource" className="mt-1" />
                          <div>
                            <Label htmlFor="free-resource" className="font-medium cursor-pointer">
                              Offer free help or resource
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Provide value upfront with no strings attached</p>
                          </div>
                        </div>
                        <div
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setConfig((prev) => ({ ...prev, ctaSetting: "visit-link" }))}
                          tabIndex={0}
                          role="button"
                          aria-pressed={config.ctaSetting === "visit-link"}
                        >
                          <RadioGroupItem value="visit-link" id="visit-link" className="mt-1" />
                          <div>
                            <Label htmlFor="visit-link" className="font-medium cursor-pointer">
                              Invite to visit a resource
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">Direct them to relevant content or demo</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentStepData.fields.includes("socialProof") && (
                  <div>
                    <Label className="text-base font-medium mb-3 block">Social Proof (Optional)</Label>
                    <Textarea
                      value={config.socialProof || ""}
                      onChange={(e) => setConfig((prev) => ({ ...prev, socialProof: e.target.value }))}
                      placeholder="Add any specific social proof, customer testimonials, case studies, or success metrics you'd like to include in the email..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      This will be incorporated into the evidence section of your email.
                    </p>
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
              {isLastStep ? (
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
        </ModalLoadingOverlay>
      </EditDialogContent>
    </EditDialog>
  )
} 