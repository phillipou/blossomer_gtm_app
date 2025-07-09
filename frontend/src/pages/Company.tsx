import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import CustomersList from "./Accounts";
import OverviewCard from "../components/cards/OverviewCard";
import DashboardLoading from "../components/dashboard/DashboardLoading";
import { ErrorDisplay } from "../components/ErrorDisplay";
import type { CompanyOverviewResponse, TargetAccountResponse } from "../types/api";
import ListInfoCard from "../components/cards/ListInfoCard";
import PageHeader from "../components/navigation/PageHeader";
import { getStoredTargetAccounts } from "../lib/accountService";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";
import { Edit3, Trash2 } from "lucide-react";
import { getEntityColorForParent } from "../lib/entityColors";
import { useGetCompany, useAnalyzeCompany, useUpdateCompany } from "../lib/hooks/useCompany";
import { useAuthState } from "../lib/auth";
import { migrateLocalStorageToDb } from "../lib/migration";

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
  const [hasLegacyData, setHasLegacyData] = useState(() => {
    console.log("Company: Initializing hasLegacyData state");
    return false;
  });
  const [migrationStatus, setMigrationStatus] = useState(() => {
    console.log("Company: Initializing migrationStatus state");
    return "";
  });

  // Log state changes
  useEffect(() => {
    console.log("Company: progressStage state changed to", progressStage);
  }, [progressStage]);

  useEffect(() => {
    console.log("Company: targetAccounts state changed to", targetAccounts);
  }, [targetAccounts]);

  useEffect(() => {
    console.log("Company: hasLegacyData state changed to", hasLegacyData);
  }, [hasLegacyData]);

  useEffect(() => {
    console.log("Company: migrationStatus state changed to", migrationStatus);
  }, [migrationStatus]);

  useEffect(() => {
    console.log("Company: useEffect for legacy data check");
    const legacyAccounts = localStorage.getItem("target_accounts");
    const legacyEmails = localStorage.getItem("emailHistory");
    if (legacyAccounts || legacyEmails) {
      console.log("Company: Legacy data detected.");
      setHasLegacyData(true);
    }
  }, []);

  const handleMigration = async () => {
    console.log("Company: handleMigration called");
    setMigrationStatus("Migrating...");
    try {
      console.log("Company: Attempting to migrate local storage to DB.");
      await migrateLocalStorageToDb(token!);
      setMigrationStatus("Migration complete!");
      setHasLegacyData(false);
      refetch();
      console.log("Company: Migration successful, refetching company data.");
    } catch (error) {
      setMigrationStatus("Migration failed. See console for details.");
      console.error("Company: Migration failed:", error);
    }
  };

  useEffect(() => {
    console.log("Company: useEffect for API response/analysis. location.state:", location.state);
    const apiResponse = location.state?.apiResponse;
    if (apiResponse) {
      console.log("Company: API response found in location.state, setting query data.", apiResponse);
      queryClient.setQueryData(['company'], apiResponse);
    } else {
      console.log("Company: No API response in location.state, checking for URL to analyze.");
      const url = location.state?.url;
      const icp = location.state?.icp;
      if (url) {
        console.log("Company: Analyzing company with URL:", url, "and ICP:", icp);
        analyzeCompany({ websiteUrl: url, userInputtedContext: icp });
      }
    }
  }, [location.state, analyzeCompany, queryClient]);

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

  const handleRetry = useCallback(() => {
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
  }, [location.state, analyzeCompany, refetch]);

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

  const handleListEdit = (field: CardKey) => (newItems: string[]) => {
    console.log("Company: handleListEdit called for field:", field, "with newItems:", newItems);
    if (!overview) {
      console.log("Company: No overview data, returning from handleListEdit.");
      return;
    }

    let updatedData: Partial<any> = {};

    if (field === "business_profile") {
      const category = newItems.find(item => item.startsWith("Category:"))?.replace("Category: ", "") || "";
      const businessModel = newItems.find(item => item.startsWith("Business Model:"))?.replace("Business Model: ", "") || "";
      const existingCustomers = newItems.find(item => item.startsWith("Existing Customers:"))?.replace("Existing Customers: ", "") || "";
      updatedData.businessProfile = { category, businessModel, existingCustomers };
    } else if (field === "capabilities") {
      updatedData.capabilities = newItems;
    } else if (field === "positioning_insights") {
      const keyMarketBelief = newItems.find(item => item.startsWith("Market Belief:"))?.replace("Market Belief: ", "") || "";
      const uniqueApproach = newItems.find(item => item.startsWith("Unique Approach:"))?.replace("Unique Approach: ", "") || "";
      const languageUsed = newItems.find(item => item.startsWith("Language Used:"))?.replace("Language Used: ", "") || "";
      updatedData.positioning = { keyMarketBelief, uniqueApproach, languageUsed };
    } else if (field === "use_case_insights") {
      const processImpact = newItems.find(item => item.startsWith("Process Impact:"))?.replace("Process Impact: ", "") || "";
      const problemsAddressed = newItems.find(item => item.startsWith("Problems Addressed:"))?.replace("Problems Addressed: ", "") || "";
      const howTheyDoItToday = newItems.find(item => item.startsWith("Current State:"))?.replace("Current State: ", "") || "";
      updatedData.useCaseAnalysis = { processImpact, problemsAddressed, howTheyDoItToday };
    } else if (field === "target_customer_insights") {
      const targetAccountHypothesis = newItems.find(item => item.startsWith("Target Accounts:"))?.replace("Target Accounts: ", "") || "";
      const targetPersonaHypothesis = newItems.find(item => item.startsWith("Key Personas:"))?.replace("Key Personas: ", "") || "";
      updatedData.icpHypothesis = { targetAccountHypothesis, targetPersonaHypothesis };
    } else if (field === "objections") {
      updatedData.objections = newItems;
    }

    console.log("Company: Calling updateCompany with data:", updatedData);
    updateCompany(updatedData);
  };

  if (isGetLoading || isAnalyzing) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={isAnalyzing ? (STATUS_STAGES[progressStage]?.percent || 0) : 100}
      />
    );
  }

  const error = getError || analyzeError;
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} onHome={() => navigate("/")} />;
  }

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Analysis Found</h2>
          <p className="text-gray-600 mb-6">Start by analyzing a website from the home page.</p>
          <Button onClick={() => navigate("/")}>Analyze a Website</Button>
        </div>
      </div>
    );
  }

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
        
        {hasLegacyData && (
          <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p>We've detected data from a previous version. Please migrate your data to our new system.</p>
            <Button onClick={handleMigration} className="mt-2">
              Migrate Data
            </Button>
            {migrationStatus && <p className="mt-2">{migrationStatus}</p>}
          </div>
        )}

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
                     onEdit={isEditable ? handleListEdit(key) : undefined}
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
    </>
  );
}