import { useState, useEffect, memo, useMemo, useCallback } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { ChevronRight, ChevronLeft, Wand2, X, RefreshCw } from "lucide-react"
import { EditDialog, EditDialogContent, EditDialogHeader, EditDialogTitle } from "../ui/dialog"
import { useCompanyContext } from "../../lib/hooks/useCompanyContext"
import { useAuthState } from "../../lib/auth"
import { DraftManager } from "../../lib/draftManager"
import { getAccountName } from "../../lib/entityDisplayUtils"
import { useDataContext } from "../../contexts/DataContext"
import { ModalLoadingOverlay, ModalLoadingMessages } from "../ui/modal-loading"
import { useGetAccounts } from "../../lib/hooks/useAccounts"
import { useGetAllPersonas } from "../../lib/hooks/usePersonas"

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

export const EmailWizardModal = memo(function EmailWizardModal({
  isOpen,
  onClose,
  onComplete,
  mode,
  editingComponent,
  initialConfig,
}: EmailWizardModalProps) {
  const { token } = useAuthState()
  const { companyId, isLoading: isCompanyLoading } = useCompanyContext()
  const { isLoading: isDataLoading, syncData } = useDataContext()
  
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

  // Conditional data loading: authenticated users get API data, unauthenticated users get DraftManager data
  const isAuthenticated = !!token
  
  // Authenticated data sources - use real API IDs
  const { data: authenticatedAccounts } = useGetAccounts(companyId!, token)
  const { data: authenticatedPersonas } = useGetAllPersonas(companyId!, token)
  
  // Unauthenticated data sources - use DraftManager with tempIds
  const draftAccounts = !isAuthenticated ? DraftManager.getDrafts('account').map(draft => ({
    ...draft.data,
    id: draft.tempId  // Use DraftManager tempId as the account ID for unauthenticated users
  })) : []
  
  const draftPersonas = !isAuthenticated ? DraftManager.getDrafts('persona') : []
  
  // Use the appropriate data source based on authentication status
  const allAccounts = isAuthenticated ? (authenticatedAccounts || []) : draftAccounts
  
  // Both authenticated and unauthenticated personas now use the same schema
  // Authenticated: direct API data, Unauthenticated: DraftManager data (already normalized)
  const allPersonasForProcessing = isAuthenticated 
    ? (authenticatedPersonas || [])
    : draftPersonas.map(draft => ({
        ...draft.data,
        id: draft.tempId  // Use DraftManager tempId as the persona ID for unauthenticated users
      }))

  // Memoized data transformations to replace heavy useEffect
  const transformedAccounts = useMemo(() => 
    allAccounts.map(account => ({
      id: account.id,
      name: getAccountName(account) || 'Untitled Account'
    })), [allAccounts]
  );

  const transformedPersonasData = useMemo(() => {
    const transformedPersonas: WizardPersona[] = []
    const allPersonasData: Array<{ persona: any; accountId: string }> = []
    
    allPersonasForProcessing.forEach(persona => {
      const accountId = persona.accountId || persona.data?.accountId;
      if (accountId) {
        const personaForWizard: WizardPersona = {
          id: persona.id || persona.tempId,
          name: persona.targetPersonaName || persona.name || 'Untitled Persona',
          accountId: accountId,
          useCases: persona.useCases || [],
          description: persona.targetPersonaDescription || persona.description || '',
          personaIds: [persona.id || persona.tempId]
        };
        
        transformedPersonas.push(personaForWizard);
        allPersonasData.push({
          persona: persona,
          accountId: accountId
        });
      }
    });
    
    return { transformedPersonas, allPersonasData };
  }, [allPersonasForProcessing]);

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
      hasDataUseCases: !!(selectedPersonaData?.persona.data?.useCases),
      dataUseCasesLength: selectedPersonaData?.persona.data?.useCases?.length || 0,
      dataUseCasesData: selectedPersonaData?.persona.data?.useCases,
      fullPersonaData: selectedPersonaData?.persona
    });
    
    // Use cases are always in persona.data.useCases (unified schema)
    const useCasesData = selectedPersonaData?.persona.data?.useCases;
    
    if (!useCasesData || !Array.isArray(useCasesData)) {
      console.log('[USE-CASES] No use cases found in persona data');
      return [];
    }
    
    const useCases = useCasesData.map((useCase: any, index: number) => ({
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

  // Simple data loading - works for both authenticated and unauthenticated users
  useEffect(() => {
    console.log('[EMAIL-WIZARD] Modal effect triggered:', {
      isOpen,
      isCompanyLoading,
      token: !!token,
      isDataLoading,
      shouldWait: token && isDataLoading
    });
    
    if (!isOpen || isCompanyLoading) return
    
    // For authenticated users, wait for DataProvider to finish syncing
    if (token && isDataLoading) return
    
    try {
      setLoading(true)
      
      console.log('[EMAIL-WIZARD] Loading data from DraftManager:', {
        isAuthenticated: !!token,
        accountsCount: allAccounts.length,
        personasCount: allPersonasForProcessing.length,
        dataProviderLoading: isDataLoading,
        allAccountsData: allAccounts.map(acc => ({ id: acc.id, name: acc.name || acc.targetAccountName })),
        allPersonasData: allPersonasForProcessing.map(p => ({ 
          id: p.data.id || p.tempId, 
          accountId: p.parentId || p.data.accountId,
          name: p.data.targetPersonaName || p.data.name 
        }))
      });
      
      // Transform accounts for wizard use
      const transformedAccounts: WizardAccount[] = allAccounts.map(account => {
        console.log('[EMAIL-WIZARD] Processing account:', {
          accountId: account.id,
          accountName: getAccountName(account),
          accountKeys: Object.keys(account)
        });
        return {
          id: account.id,
          name: getAccountName(account) || 'Untitled Account'
        };
      })
      
      // Transform personas for wizard use
      const transformedPersonas: WizardPersona[] = []
      const allPersonasData: Array<{ persona: any; accountId: string }> = []
      
      allPersonasForProcessing.forEach(persona => {
        let accountId = persona.accountId || persona.account_id
        
        console.log('[EMAIL-WIZARD] Processing persona:', {
          personaId: persona.id,
          personaName: persona.targetPersonaName || persona.name,
          accountIdFromPersona: persona.accountId,
          finalAccountId: accountId,
          availableAccountIds: allAccounts.map(acc => acc.id),
          availableAccountNames: allAccounts.map(acc => ({ id: acc.id, name: getAccountName(acc) }))
        });
        
        // Match personas to accounts by extracting timestamp from IDs
        // Account IDs: temp_{timestamp}
        // Persona account IDs: temp_account_{timestamp+1}_{random}
        let matchedAccountId = null;
        if (accountId) {
          // Try exact match first
          const exactMatch = allAccounts.find(account => account.id === accountId);
          if (exactMatch) {
            matchedAccountId = exactMatch.id;
          } else {
            // Try timestamp-based matching for cases where persona has temp_account_ format
            const personaTimestampMatch = accountId.match(/temp_account_(\d+)_/);
            if (personaTimestampMatch) {
              const personaTimestamp = parseInt(personaTimestampMatch[1]);
              // Look for account with timestamp within 10ms (personas created right after accounts)
              const timestampMatch = allAccounts.find(account => {
                const accountTimestampMatch = account.id.match(/temp_(\d+)/);
                if (accountTimestampMatch) {
                  const accountTimestamp = parseInt(accountTimestampMatch[1]);
                  return Math.abs(personaTimestamp - accountTimestamp) <= 10;
                }
                return false;
              });
              if (timestampMatch) {
                matchedAccountId = timestampMatch.id;
                console.log('[EMAIL-WIZARD] 🔗 Matched persona to account via timestamp:', {
                  personaAccountId: accountId,
                  matchedAccountId,
                  timestampDiff: personaTimestamp - parseInt(timestampMatch.id.match(/temp_(\d+)/)[1])
                });
              }
            }
          }
        }
        
        const accountExists = !!matchedAccountId;
        console.log('[EMAIL-WIZARD] Account exists check:', { 
          originalAccountId: accountId,
          matchedAccountId,
          accountExists,
          matchType: accountId === matchedAccountId ? 'exact' : matchedAccountId ? 'timestamp' : 'none'
        });
        
        if (accountExists) {
          const personaId = persona.id; // Use the actual persona ID (works for both auth/unauth)
          const isApiPersona = !!(persona.id && !persona.id.startsWith('temp_'));
          
          const wizardPersona: WizardPersona = {
            id: personaId,
            name: persona.targetPersonaName || persona.name || 'Untitled Persona',
            accountId: matchedAccountId  // Use the matched account ID, not the original
          }
          
          transformedPersonas.push(wizardPersona)
          allPersonasData.push({ persona, accountId: matchedAccountId })
          
          console.log('[EMAIL-WIZARD] ✅ Added persona:', {
            personaId,
            name: wizardPersona.name,
            originalAccountId: accountId,
            matchedAccountId,
            source: isApiPersona ? 'API' : 'DRAFT',
            hasUseCases: !!(persona.data?.useCases && persona.data.useCases.length > 0),
            useCasesCount: persona.data?.useCases?.length || 0
          });
        } else {
          console.log('[EMAIL-WIZARD] ❌ SKIPPED persona due to account mismatch:', {
            personaId: persona.id,
            personaName: persona.targetPersonaName || persona.name,
            personaAccountId: accountId,
            availableAccountIds: allAccounts.map(acc => acc.id),
            skippedReason: !accountId ? 'No accountId found' : 'Account ID does not match any available account'
          });
        }
      })
      
      console.log('[EMAIL-WIZARD] Data loaded successfully:', {
        accountsCount: transformedAccounts.length,
        personasCount: transformedPersonas.length,
        isAuthenticated: !!token,
        personaDataSample: allPersonasData.slice(0, 2).map(p => ({
          personaId: p.persona.id,
          name: p.persona.targetPersonaName || p.persona.name,
          source: p.persona.id && !p.persona.id.startsWith('temp_') ? 'API' : 'DRAFT',
          hasUseCases: !!(p.persona.useCases && p.persona.useCases.length > 0),
          useCasesCount: p.persona.useCases?.length || 0,
          useCasesPreview: p.persona.useCases?.slice(0, 2)
        }))
      })
      
      setTargetAccounts(transformedAccounts)
      setTargetPersonas(transformedPersonas)
      setAllPersonasData(allPersonasData)
      
    } catch (error) {
      console.error('[EMAIL-WIZARD] Error loading data:', error)
      setTargetAccounts([])
      setTargetPersonas([])
      setAllPersonasData([])
    } finally {
      setLoading(false)
    }
  }, [isOpen, isCompanyLoading, isDataLoading, allAccounts.length, allPersonasForProcessing.length, token])

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
      console.log('[EMAIL-WIZARD] Starting email generation...', {
        config,
        isGenerating,
        currentStep: safeCurrentStep
      });
      
      setIsGenerating(true)
      try {
        console.log('[EMAIL-WIZARD] Calling onComplete with config:', config);
        await onComplete(config)
        console.log('[EMAIL-WIZARD] onComplete successful, setting isGenerating to false');
        setIsGenerating(false)
      } catch (error) {
        console.error('[EMAIL-WIZARD] Email generation failed:', {
          error,
          errorMessage: error?.message,
          errorStack: error?.stack,
          config
        });
        setIsGenerating(false)
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
      <EditDialogContent className={isGenerating ? "sm:max-w-[500px]" : "sm:max-w-2xl max-h-[90vh] overflow-y-auto"}>
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
          <div className={`space-y-6 ${isGenerating ? "min-h-[100px]" : "min-h-[300px]"}`}>
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
                    <p className="text-sm text-gray-500 mb-4">
                      {token 
                        ? "Click 'Sync Data' to load your accounts from the API, or create accounts on the Accounts page."
                        : "Generate target accounts and personas from the Accounts or Personas pages first."
                      }
                    </p>
                    {token && (
                      <Button 
                        onClick={() => {
                          console.log('[EMAIL-WIZARD] Manual sync triggered');
                          syncData();
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Data
                      </Button>
                    )}
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
}) 