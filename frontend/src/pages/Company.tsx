import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from "react-router-dom";
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
import { Edit3, Trash2 } from "lucide-react";
import { getEntityColorForParent } from "../lib/entityColors";
import { useGetCompany, useAnalyzeCompany, useUpdateCompany } from "../lib/hooks/useCompany";
import { useAuthState } from "../lib/auth";
import ListInfoCardEditModal, { type ListInfoCardItem } from '../components/cards/ListInfoCardEditModal';
import { isApiError } from "../lib/utils";

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
  const { token } = useAuthState();

  // Only redirect to /auth if we're trying to use authenticated endpoints but don't have a token
  // Demo mode should work without authentication
  useEffect(() => {
    // Don't redirect - allow demo usage without authentication
    // The API calls will automatically use /demo endpoints when not authenticated
  }, [token, navigate]);

  const queryClient = useQueryClient();
  const { data: overview, isLoading: isGetLoading, error: getError, refetch } = useGetCompany(token);
  const { mutate: analyzeCompany, isPending: isAnalyzing, error: analyzeError } = useAnalyzeCompany(token);
  const { mutate: updateCompany } = useUpdateCompany(token);

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
    if (apiResponse) {
      console.log("Company: API response found in location.state, setting query data.", apiResponse);
      queryClient.setQueryData(['company'], apiResponse);
    }
  }, [location.state, queryClient]);

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
    
    const { companyId, ...analysis_data } = updatedOverview;

    updateCompany({
      companyId: companyId,
      analysis_data: analysis_data,
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

  if (!overview) return <div>No company data available.</div>;

  const companyName = overview?.companyName || "Company";
  const domain = overview?.companyUrl || "";

  return (
    <>
      <style>{`
        .blue-bullet::marker {
          color: #2563eb;
        }
      `}</style>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Your Company"
          subtitle="Company analysis and insights"
        />
        

        {activeTab === "company" && (
          <div className="flex-1 p-8 space-y-8">
            <OverviewCard
               title={companyName}
               subtitle={domain}
               bodyTitle="Company Overview"
               bodyText={overview?.description || "No description available"}
               showButton={false}
               entityType="company"
             />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {cardConfigs.map(({ key, label, getItems, subtitle, bulleted }) => {
                const items = overview ? getItems(overview) : [];
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
      <ListInfoCardEditModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSave}
        initialItems={editingItems}
        title={`Edit ${editingField?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
        subtitle="Update the list of items below."
      />
    </>
  );
}