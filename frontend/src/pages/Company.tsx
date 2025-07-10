import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import CustomersList from "./Accounts";
import OverviewCard from "../components/cards/OverviewCard";
import DashboardLoading from "../components/dashboard/DashboardLoading";
import { ErrorDisplay } from "../components/ErrorDisplay";
import type { CompanyOverviewResponse, TargetAccountResponse, ApiError } from "../types/api";
import ListInfoCard from "../components/cards/ListInfoCard";
import PageHeader from "../components/navigation/PageHeader";
import { getStoredTargetAccounts } from "../lib/accountService";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";
import { Edit3, Trash2, Building2, Wand2 } from "lucide-react";
import { getEntityColorForParent } from "../lib/entityColors";
import { useGetCompany, useAnalyzeCompany, useUpdateCompany, useGetCompanies, useCreateCompany } from "../lib/hooks/useCompany";
import { useAuthState } from "../lib/auth";
import { useAutoSave } from "../lib/hooks/useAutoSave";
import { DraftManager } from "../lib/draftManager";
import ListInfoCardEditModal, { type ListInfoCardItem } from '../components/cards/ListInfoCardEditModal';
import InputModal from '../components/modals/InputModal';
import { isApiError } from "../lib/utils";
import { getCompanies } from '../lib/companyService';

const STATUS_STAGES = [
  { label: "Loading website...", percent: 20 },
  { label: "Analyzing company...", percent: 45 },
  { label: "Researching market...", percent: 70 },
  { label: "Finalizing...", percent: 90 },
];

type CardKey =
  | "business_profile"
  | "capabilities"
  | "positioning_insights"
  | "use_case_insights"
  | "target_customer_insights"
  | "objections";

const cardConfigs: { 
  key: CardKey; 
  label: string; 
  bulleted?: boolean;
  getItems: (overview: CompanyOverviewResponse) => string[];
  subtitle: string;
}[] = [
  { 
    key: "business_profile", 
    label: "Business Profile", 
    bulleted: true,
    getItems: (overview) => [
      `Category: ${overview.businessProfile?.category || 'N/A'}`,
      `Business Model: ${overview.businessProfile?.businessModel || 'N/A'}`,
      `Existing Customers: ${overview.businessProfile?.existingCustomers || 'N/A'}`
    ],
    subtitle: "Core business information and customer profile."
  },
  { 
    key: "capabilities", 
    label: "Key Features & Capabilities", 
    bulleted: true,
    getItems: (overview) => overview.capabilities || [],
    subtitle: "Core features and strengths of the company/product."
  },
  { 
    key: "positioning_insights", 
    label: "Positioning", 
    bulleted: true,
    getItems: (overview) => [
      `Market Belief: ${overview.positioning?.keyMarketBelief || 'N/A'}`,
      `Unique Approach: ${overview.positioning?.uniqueApproach || 'N/A'}`,
      `Language Used: ${overview.positioning?.languageUsed || 'N/A'}`
    ],
    subtitle: "How they position themselves in the market."
  },
  { 
    key: "use_case_insights", 
    label: "Process & Impact Analysis", 
    bulleted: true,
    getItems: (overview) => [
      `Process Impact: ${overview.useCaseAnalysis?.processImpact || 'N/A'}`,
      `Problems Addressed: ${overview.useCaseAnalysis?.problemsAddressed || 'N/A'}`,
      `Current State: ${overview.useCaseAnalysis?.howTheyDoItToday || 'N/A'}`
    ],
    subtitle: "Analysis of processes and problems this solution addresses."
  },
  { 
    key: "target_customer_insights", 
    label: "Target Customer Insights", 
    bulleted: true,
    getItems: (overview) => [
      `Target Accounts: ${overview.icpHypothesis?.targetAccountHypothesis || 'N/A'}`,
      `Key Personas: ${overview.icpHypothesis?.targetPersonaHypothesis || 'N/A'}`
    ],
    subtitle: "Ideal customer profile and decision-maker insights."
  },
  { 
    key: "objections", 
    label: "Potential Concerns", 
    bulleted: true,
    getItems: (overview) => overview.objections || [],
    subtitle: "Common concerns prospects might have about this solution."
  },
];

export default function Company() {
  console.log("Company: Component rendered");
  const location = useLocation();
  const navigate = useNavigate();
  const { id: companyId } = useParams<{ id: string }>();
  const { token } = useAuthState();
  const { data: companies } = useGetCompanies(token);

  // Determine the mode based on route params and auth state
  const isAuthenticatedMode = !!token && !!companyId;
  const isUnauthenticatedMode = !token && !companyId;

  // Handle redirect logic for authenticated users on /company
  useEffect(() => {
    if (token && !companyId && companies && companies.length > 0) {
      // Authenticated user on /company with companies - redirect to most recent company
      console.log("Company: Authenticated user on /company route with companies - redirecting to most recent");
      navigate(`/app/company/${companies[companies.length - 1].id}`, { replace: true });
      return;
    } else if (!token && companyId) {
      // Unauthenticated user on /company/:id (invalid state)
      console.log("Company: Unauthenticated user on /company/:id route - redirecting to /company");
      navigate('/playground/company', { replace: true });
      return;
    }
  }, [token, companyId, companies, navigate]);

  const queryClient = useQueryClient();
  const { data: overview, isLoading: isGetLoading, error: getError, refetch } = useGetCompany(token, companyId);
  const { mutate: analyzeCompany, isPending: isAnalyzing, error: analyzeError } = useAnalyzeCompany(token, companyId);
  const updateCompanyMutation = useUpdateCompany(token, companyId);
  const { mutate: updateCompany } = updateCompanyMutation;
  const createCompanyMutation = useCreateCompany(token);
  const { mutate: createCompany, isPending: isCreatingCompany } = createCompanyMutation;
  const { isLoading: isLoadingCompanies } = useGetCompanies(token);

  const [generatedCompanyData, setGeneratedCompanyData] = useState<any>(null);

  const [progressStage, setProgressStage] = useState(() => {
    console.log("Company: Initializing progressStage state");
    return 0;
  });
  const [activeTab] = useState(() => {
    console.log("Company: Initializing activeTab state");
    return "company";
  });
  const [targetAccounts, setTargetAccounts] = useState<(
    TargetAccountResponse & { id: string; createdAt: string }
  )[]>(() => {
    console.log("Company: Initializing targetAccounts state");
    return [];
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CardKey | null>(null);
  const [editingItems, setEditingItems] = useState<ListInfoCardItem[]>([]);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [companyUrlInput, setCompanyUrlInput] = useState("");
  const [companyContextInput, setCompanyContextInput] = useState("");
  const apiResponseProcessed = useRef(false);

  // Get draft company and combine with existing overview
  const draftCompanies = DraftManager.getDrafts('company');
  const draftOverview = draftCompanies.length > 0 ? draftCompanies[0].data : null;

  // Auto-save hook for generated companies  
  const autoSave = useAutoSave({
    entity: 'company',
    data: generatedCompanyData,
    createMutation: createCompanyMutation,
    updateMutation: updateCompanyMutation,
    isAuthenticated: !!token,
    entityId: companyId,
    onSaveSuccess: (savedCompany) => {
      console.log("Company: Company auto-saved successfully", savedCompany);
      setGeneratedCompanyData(null);
      navigate(`/app/company/${savedCompany.id}`, { replace: true });
    },
    onSaveError: (error) => {
      console.error("Company: Auto-save failed", error);
    },
  });

  // Debug modal state
  useEffect(() => {
    console.log("Company: isGenerationModalOpen state changed to", isGenerationModalOpen);
  }, [isGenerationModalOpen]);

  // Log state changes
  useEffect(() => {
    console.log("Company: progressStage state changed to", progressStage);
  }, [progressStage]);

  useEffect(() => {
    console.log("Company: targetAccounts state changed to", targetAccounts);
  }, [targetAccounts]);



  useEffect(() => {
    console.log("Company: useEffect for API response. location.state:", location.state);
    const apiResponse = location.state?.apiResponse;
    if (apiResponse && !apiResponseProcessed.current) {
      console.log("Company: API response found in location.state, setting query data.", apiResponse);
      apiResponseProcessed.current = true;
      queryClient.setQueryData(['company', companyId], apiResponse);
      
      // For unauthenticated users, trigger auto-save logic (which will save to draft)
      if (!token) {
        console.log("Company: Unauthenticated user - triggering auto-save for draft creation");
        // Store the full AI response format for consistent display logic
        setGeneratedCompanyData(apiResponse);
      }
    }
  }, [location.state, queryClient, companyId, token]);

  useEffect(() => {
    console.log("Company: useEffect for analysis progress. isAnalyzing:", isAnalyzing);
    if (isAnalyzing) {
      setProgressStage(0);
      const timer = setInterval(() => {
        setProgressStage(prev => {
          if (prev < STATUS_STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 4000);
      return () => {
        console.log("Company: Clearing analysis progress timer.");
        clearInterval(timer);
      };
    }
  }, [isAnalyzing]);

  useEffect(() => {
    console.log("Company: useEffect for target accounts from local storage.");
    const accounts = getStoredTargetAccounts();
    setTargetAccounts(accounts);
    console.log("Company: Loaded target accounts:", accounts);
  }, []);

  const handleListEdit = (field: CardKey, items: string[]) => {
    setEditingField(field);
    setEditingItems(items.map((text, i) => ({ id: i.toString(), text })));
    setIsEditDialogOpen(true);
  };

  const handleSave = (newItems: ListInfoCardItem[]) => {
    if (!editingField || !overview) return;
    
    const updatedItems = newItems.map(item => item.text);

    let updatedOverview = { ...overview };

    if (editingField === 'capabilities' || editingField === 'objections') {
      updatedOverview = { ...updatedOverview, [editingField]: updatedItems };
    } else if (editingField === 'business_profile') {
      const category = updatedItems.find(item => item.startsWith("Category:"))?.replace("Category: ", "") || "";
      const businessModel = updatedItems.find(item => item.startsWith("Business Model:"))?.replace("Business Model: ", "") || "";
      const existingCustomers = updatedItems.find(item => item.startsWith("Existing Customers:"))?.replace("Existing Customers: ", "") || "";
      updatedOverview.businessProfile = { category, businessModel, existingCustomers };
    } else if (editingField === 'positioning_insights') {
      const keyMarketBelief = updatedItems.find(item => item.startsWith("Market Belief:"))?.replace("Market Belief: ", "") || "";
      const uniqueApproach = updatedItems.find(item => item.startsWith("Unique Approach:"))?.replace("Unique Approach: ", "") || "";
      const languageUsed = updatedItems.find(item => item.startsWith("Language Used:"))?.replace("Language Used: ", "") || "";
      updatedOverview.positioning = { keyMarketBelief, uniqueApproach, languageUsed };
    } else if (editingField === 'use_case_insights') {
      const processImpact = updatedItems.find(item => item.startsWith("Process Impact:"))?.replace("Process Impact: ", "") || "";
      const problemsAddressed = updatedItems.find(item => item.startsWith("Problems Addressed:"))?.replace("Problems Addressed: ", "") || "";
      const howTheyDoItToday = updatedItems.find(item => item.startsWith("Current State:"))?.replace("Current State: ", "") || "";
      updatedOverview.useCaseAnalysis = { processImpact, problemsAddressed, howTheyDoItToday };
    } else if (editingField === 'target_customer_insights') {
        const targetAccountHypothesis = updatedItems.find(item => item.startsWith("Target Accounts:"))?.replace("Target Accounts: ", "") || "";
        const targetPersonaHypothesis = updatedItems.find(item => item.startsWith("Key Personas:"))?.replace("Key Personas: ", "") || "";
        updatedOverview.icpHypothesis = { targetAccountHypothesis, targetPersonaHypothesis };
    }
    
    const { companyId, ...data } = updatedOverview;

    updateCompany({
      companyId: companyId,
      data: data,
    });

    setIsEditDialogOpen(false);
    setEditingField(null);
    setEditingItems([]);
  };

  const handleRetry = useCallback(() => {
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }
    console.log("Company: handleRetry called.");
    const url = location.state?.url;
    const icp = location.state?.icp;
    if (url) {
      console.log("Company: Retrying analysis with URL:", url, "and ICP:", icp);
      analyzeCompany({ websiteUrl: url, userInputtedContext: icp });
    } else {
      console.log("Company: No URL in state, refetching company data.");
      refetch();
    }
  }, [location.state, analyzeCompany, refetch, token, navigate]);

  const handleAccountClick = (accountId: string) => {
    console.log("Company: handleAccountClick called with accountId:", accountId);
    navigate(`/target-accounts/${accountId}`);
  };

  const handleEditAccount = (account: TargetAccountResponse & { id: string; createdAt: string }) => {
    console.log("Company: handleEditAccount called with account:", account);
    navigate(`/target-accounts/${account.id}`);
  };

  const handleDeleteAccount = (accountId: string) => {
    console.log("Company: handleDeleteAccount called with accountId:", accountId);
    setTargetAccounts(prev => {
      const updated = prev.filter(account => account.id !== accountId);
      console.log("Company: Updated targetAccounts after deletion:", updated);
      return updated;
    });
    const updatedAccounts = getStoredTargetAccounts().filter(account => account.id !== accountId);
    localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
    console.log("Company: Removed account from local storage.");
  };

  const handleAddAccount = () => {
    console.log("Company: handleAddAccount called.");
    navigate('/target-accounts');
  };

  const handleGenerateCompany = useCallback(({ name, description }: { name: string; description: string }) => {
    console.log("Company: handleGenerateCompany called with:", { websiteUrl: name, userInputtedContext: description });
    analyzeCompany(
      { websiteUrl: name, userInputtedContext: description },
      {
        onSuccess: (response) => {
          console.log("Company: Company generated successfully", response);
          const companyData = { 
            ...response, 
            companyUrl: name, 
            companyName: response.companyName || new URL(name).hostname 
          };
          
          // Use AI response format consistently
          setGeneratedCompanyData(companyData);
          setIsGenerationModalOpen(false);
        },
        onError: (err) => {
          console.error('Company: Company generation failed:', err);
        },
      }
    );
  }, [analyzeCompany]);

  // Show loading while checking for companies (authenticated users on /company)
  if (token && !companyId && isLoadingCompanies) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={100}
      />
    );
  }

  if (isGetLoading || isAnalyzing) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={isAnalyzing ? (STATUS_STAGES[progressStage]?.percent || 0) : 100}
      />
    );
  }

  const errorToDisplay = getError || analyzeError;
  if (errorToDisplay) {
    if (isApiError(errorToDisplay)) {
      return <ErrorDisplay error={errorToDisplay} onRetry={handleRetry} onHome={() => navigate('/')} />;
    }
    return <ErrorDisplay error={{ errorCode: 'UNKNOWN_ERROR', message: errorToDisplay.message }} onRetry={handleRetry} onHome={() => navigate('/')} />;
  }

  const displayOverview = overview || draftOverview;

  // Handle authenticated users with no companies  
  const showNoCompanies = token && !companyId && companies && companies.length === 0 && !draftOverview;
  // Handle unauthenticated users with no localStorage data
  const showNoOverview = !displayOverview;

  const companyName = displayOverview?.companyName || "Company";
  const domain = displayOverview?.companyUrl || "";

  console.log("Company: About to render, isGenerationModalOpen =", isGenerationModalOpen);

  return (
    <>
      <style>{`
        .blue-bullet::marker {
          color: #2563eb;
        }
      `}</style>
      {showNoCompanies || showNoOverview ? (
        <div className="flex flex-col h-full">
          <PageHeader
            title="Your Company"
            subtitle="Get started by analyzing your first company"
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-3">Generate Your First Company</h2>
                <p className="text-gray-600 mb-6">
                  Create your first company profile with our AI-powered wizard. 
                  Enter your website URL and let us help you generate detailed business insights.
                </p>
              </div>
              <Button 
                onClick={() => {
                  console.log("Company: Button clicked, opening modal");
                  setIsGenerationModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Your First Company
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <PageHeader
            title="Your Company"
            subtitle={draftOverview && !overview ? "Company analysis and insights (Draft - not yet saved)" : "Company analysis and insights"}
          />
          {activeTab === "company" && (
            <div className="flex-1 p-8 space-y-8">
              <OverviewCard
                title={companyName}
                subtitle={domain}
                bodyTitle="Company Overview"
                bodyText={displayOverview?.description || "No description available"}
                showButton={false}
                entityType="company"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {cardConfigs.map(({ key, label, getItems, subtitle, bulleted }) => {
                  const items = displayOverview ? getItems(displayOverview) : [];
                  const isEditable = true;
                  return (
                    <ListInfoCard
                      key={key}
                      title={label}
                      items={items}
                      onEdit={isEditable ? () => handleListEdit(key, items) : undefined}
                      renderItem={(item: string, idx: number) => (
                        bulleted ? (
                          <span key={idx} className="text-sm text-gray-700 blue-bullet mb-2">{item}</span>
                        ) : (
                          <div key={idx} className="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">{item}</div>
                        )
                      )}
                      editModalSubtitle={subtitle}
                      entityType="company"
                    />
                  );
                })}
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Target Accounts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
                  {targetAccounts.map((account) => (
                    <SummaryCard
                      key={account.id}
                      title={account.targetAccountName}
                      description={account.targetAccountDescription}
                      parents={[
                        { name: companyName, color: getEntityColorForParent('company'), label: "Company" },
                      ]}
                      onClick={() => handleAccountClick(account.id)}
                      entityType="account"
                    >
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditAccount(account); }} className="text-blue-600">
                        <Edit3 className="w-5 h-5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteAccount(account.id); }} className="text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </SummaryCard>
                  ))}
                  <AddCard onClick={handleAddAccount} label="Add New" />
                </div>
              </div>
            </div>
          )}
          {activeTab === "target-accounts" && (
            <div className="flex-1 p-8">
              <CustomersList />
            </div>
          )}
        </div>
      )}
      <ListInfoCardEditModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSave}
        initialItems={editingItems}
        title={`Edit ${editingField?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
        subtitle="Update the list of items below."
      />
      <InputModal
        isOpen={isGenerationModalOpen}
        onClose={() => {
          setIsGenerationModalOpen(false);
        }}
        onSubmit={handleGenerateCompany}
        title="Generate Company Overview"
        subtitle="Enter your company's website URL to generate a comprehensive analysis and insights."
        nameLabel="Website URL"
        namePlaceholder="https://yourcompany.com"
        nameType="url"
        nameRequired={true}
        descriptionLabel="Additional Context (Optional)"
        descriptionPlaceholder="e.g., We're a B2B SaaS company focused on marketing automation for small businesses..."
        showDescription={true}
        descriptionRequired={false}
        submitLabel={isAnalyzing || autoSave.isSaving ? (<><Wand2 className="w-4 h-4 mr-2" />Analyzing...</>) : (<><Wand2 className="w-4 h-4 mr-2" />Generate Overview</>)}
        cancelLabel="Cancel"
        isLoading={isAnalyzing || autoSave.isSaving}
        error={typeof analyzeError === 'object' && analyzeError && 'message' in analyzeError ? (analyzeError as any).message : undefined}
      />
    </>
  );
}