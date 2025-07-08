// Force Tailwind to include these classes: bg-gradient-to-r from-blue-500 to-blue-600
// Entity colors - force include: bg-green-400 bg-red-400 bg-blue-400 bg-purple-400 border-green-400 border-red-400 border-blue-400 border-purple-400
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import CustomersList from "./Accounts";
import OverviewCard from "../components/cards/OverviewCard";
import DashboardLoading from "../components/dashboard/DashboardLoading";
import { apiFetch } from "../lib/apiClient";
import { ErrorDisplay } from "../components/ErrorDisplay";
import type { ApiError, AnalysisState, CompanyOverviewResponse, TargetAccountResponse } from "../types/api";
import ListInfoCard from "../components/cards/ListInfoCard";
import PageHeader from "../components/navigation/PageHeader";
import { getStoredTargetAccounts } from "../lib/accountService";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";
import { Edit3, Trash2 } from "lucide-react";
import { getEntityColorForParent } from "../lib/entityColors";

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
  const location = useLocation();
  const navigate = useNavigate();
  // Helper to get cached overview
  const getCachedOverview = useCallback(() => {
    const stored = localStorage.getItem("dashboard_overview");
    return stored ? JSON.parse(stored) : null;
  }, []);
  // Helper to get cached URL
  const getCachedUrl = useCallback(() => {
    const cached = getCachedOverview();
    return cached?._input_url || null;
  }, [getCachedOverview]);
  // Helper to normalize URLs for comparison
  function normalizeUrl(url?: string | null): string {
    if (!url) return "";
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  }
  // Initial state: use cache if no new URL, else null
  const [analysisState, setAnalysisState] = useState<AnalysisState>(() => {
    const urlFromNav = location.state?.url;
    const cached = getCachedOverview();
    // If a new URL is provided and it's different from cached, ignore cache
    if (urlFromNav && urlFromNav !== getCachedUrl()) {
      return {
        data: null,
        loading: false,
        error: null,
        hasAttempted: false,
        analysisId: null
      };
    }
    return {
      data: cached,
      loading: false,
      error: null,
      hasAttempted: false,
      analysisId: null
    };
  });
  const [progressStage, setProgressStage] = useState(0);
  const [activeTab] = useState("company");
  const [targetAccounts, setTargetAccounts] = useState<(TargetAccountResponse & { id: string; createdAt: string })[]>([]);
  const initialMount = useRef(true);

  // Generate unique analysis ID
  const generateAnalysisId = useCallback((url: string, icp?: string) => {
    return `${url}-${icp || ''}-${Date.now()}`;
  }, []);

  // Main analysis function
  const startAnalysis = useCallback(async (url: string, icp?: string) => {
    const analysisId = generateAnalysisId(url, icp);
    setAnalysisState((prev: AnalysisState) => ({
      ...prev,
      loading: true,
      error: null,
      hasAttempted: true,
      analysisId
    }));
    setProgressStage(0);
    try {
      const response = await apiFetch("/company/generate", {
        method: "POST",
        body: JSON.stringify({
          website_url: url,
          user_inputted_context: icp || "",
        }),
      });
      
      // Only update state if this is still the current analysis
      setAnalysisState((prev: AnalysisState) => {
        if (prev.analysisId !== analysisId) return prev;
        return {
          ...prev,
          data: response as CompanyOverviewResponse,
          loading: false,
          error: null
        };
      });
      // Save the original input URL with the response
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        localStorage.setItem(
          "dashboard_overview",
          JSON.stringify({ ...response, _input_url: url })
        );
      } else {
        localStorage.setItem(
          "dashboard_overview",
          JSON.stringify({ _input_url: url, value: response })
        );
      }
    } catch (error: unknown) {
      let apiError: ApiError;
      const hasStatusAndBody = (err: unknown): err is Error & { status: number; body?: ApiError } => {
        return err instanceof Error && 'status' in err && typeof (err as Record<string, unknown>).status === 'number';
      };
      
      if (hasStatusAndBody(error) && error.status === 422 && error.body?.errorCode) {
        apiError = error.body;
      } else if (hasStatusAndBody(error) && error.status === 429) {
        apiError = {
          errorCode: "RATE_LIMITED",
          message: "Rate limit exceeded. Sign up for higher limits!",
          retryRecommended: false
        };
      } else if (error instanceof Error) {
        apiError = {
          errorCode: "NETWORK_ERROR",
          message: "Failed to analyze website. Please check your connection and try again.",
          retryRecommended: true
        };
      } else {
        apiError = {
          errorCode: "UNKNOWN_ERROR",
          message: "An unknown error occurred.",
          retryRecommended: true
        };
      }
      
      // Only update state if this is still the current analysis
      setAnalysisState((prev: AnalysisState) => {
        if (prev.analysisId !== analysisId) return prev;
        return {
          ...prev,
          data: null,
          loading: false,
          error: apiError
        };
      });
    }
  }, [generateAnalysisId]);

  // Effect to trigger analysis from navigation state
  useEffect(() => {

    if (!initialMount.current) return;
    initialMount.current = false;

    const url = location.state?.url;
    const icp = location.state?.icp;
    const cachedUrl = getCachedUrl();
    // If a new URL is provided and it's different from cached (normalized), trigger analysis
    if (
      url &&
      normalizeUrl(url) !== normalizeUrl(cachedUrl) &&
      !analysisState.loading
    ) {
      startAnalysis(url, icp);
    }
  }, [location.state, startAnalysis, analysisState.loading, getCachedUrl]);

  // Reset progress when loading starts
  useEffect(() => {
    if (analysisState.loading) {
      setProgressStage(0);
    }
  }, [analysisState.loading]);

  // Progress animation
  useEffect(() => {
    if (!analysisState.loading) return;
    const timer = setInterval(() => {
      setProgressStage(prev => {
        if (prev < STATUS_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [analysisState.loading]);

  // Load target accounts from localStorage
  useEffect(() => {
    const accounts = getStoredTargetAccounts();
    setTargetAccounts(accounts);
  }, []);

  // Retry function
  const handleRetry = useCallback(() => {
    const url = location.state?.url;
    if (url) {
      setAnalysisState(prev => ({
        ...prev,
        hasAttempted: false,
        error: null
      }));
    }
  }, [location.state?.url]);

  // Target account handlers
  const handleAccountClick = (accountId: string) => {
    navigate(`/target-accounts/${accountId}`);
  };

  const handleEditAccount = (account: TargetAccountResponse & { id: string; createdAt: string }) => {
    // For now, just navigate to the account detail page
    navigate(`/target-accounts/${account.id}`);
  };

  const handleDeleteAccount = (accountId: string) => {
    setTargetAccounts(prev => prev.filter(account => account.id !== accountId));
    // Update localStorage
    const updatedAccounts = getStoredTargetAccounts().filter(account => account.id !== accountId);
    localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
  };

  const handleAddAccount = () => {
    navigate('/target-accounts');
  };

  // Loading state
  if (analysisState.loading) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={STATUS_STAGES[progressStage]?.percent || 0}
      />
    );
  }

  // Error state with specific handling
  if (analysisState.error) {
    return <ErrorDisplay error={analysisState.error} onRetry={handleRetry} onHome={() => navigate("/")} />;
  }

  // No data state
  if (!analysisState.data && !location.state?.url) {
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

  // Success state - render company page with real data
  const overview = analysisState.data;
  const companyName = overview?.companyName || "Company";
  const domain = overview?.companyUrl || "";

  // Edit logic for OverviewBlock
  const handleListEdit = (field: CardKey) => (newItems: string[]) => {
    setAnalysisState((prev: AnalysisState) => {
      if (!prev.data) return prev;
      
      // Update the specific field based on the card type
      let updated = { ...prev.data };
      
      if (field === "business_profile") {
        // For business profile, parse the formatted strings back to individual fields
        const category = newItems.find(item => item.startsWith("Category:"))?.replace("Category: ", "") || "";
        const businessModel = newItems.find(item => item.startsWith("Business Model:"))?.replace("Business Model: ", "") || "";
        const existingCustomers = newItems.find(item => item.startsWith("Existing Customers:"))?.replace("Existing Customers: ", "") || "";
        
        updated = {
          ...updated,
          businessProfile: {
            category,
            businessModel,
            existingCustomers
          }
        };
      } else if (field === "capabilities") {
        updated = { ...updated, capabilities: newItems };
      } else if (field === "positioning_insights") {
        // For positioning insights, we need to parse the formatted strings back to individual fields
        const keyMarketBelief = newItems.find(item => item.startsWith("Market Belief:"))?.replace("Market Belief: ", "") || "";
        const uniqueApproach = newItems.find(item => item.startsWith("Unique Approach:"))?.replace("Unique Approach: ", "") || "";
        const languageUsed = newItems.find(item => item.startsWith("Language Used:"))?.replace("Language Used: ", "") || "";
        
        updated = {
          ...updated,
          positioning: {
            keyMarketBelief,
            uniqueApproach,
            languageUsed
          }
        };
      } else if (field === "use_case_insights") {
        // For use case insights, parse the formatted strings back to individual fields
        const processImpact = newItems.find(item => item.startsWith("Process Impact:"))?.replace("Process Impact: ", "") || "";
        const problemsAddressed = newItems.find(item => item.startsWith("Problems Addressed:"))?.replace("Problems Addressed: ", "") || "";
        const howTheyDoItToday = newItems.find(item => item.startsWith("Current State:"))?.replace("Current State: ", "") || "";
        
        updated = {
          ...updated,
          useCaseAnalysis: {
            processImpact,
            problemsAddressed,
            howTheyDoItToday
          }
        };
      } else if (field === "target_customer_insights") {
        // For target customer insights, parse the formatted strings back to individual fields
        const targetAccountHypothesis = newItems.find(item => item.startsWith("Target Accounts:"))?.replace("Target Accounts: ", "") || "";
        const targetPersonaHypothesis = newItems.find(item => item.startsWith("Key Personas:"))?.replace("Key Personas: ", "") || "";
        
        updated = {
          ...updated,
          icpHypothesis: {
            targetAccountHypothesis,
            targetPersonaHypothesis
          }
        };
      } else if (field === "objections") {
        updated = { ...updated, objections: newItems };
      }
      
      localStorage.setItem("dashboard_overview", JSON.stringify(updated));
      return { ...prev, data: updated };
    });
  };

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
        
        {/* Remove SidebarNav and HeaderBar, only render main content */}
        {activeTab === "company" && (
          <div className="flex-1 p-8 space-y-8">
            {/* Overview Block */}
            <OverviewCard
               title={companyName}
               subtitle={domain}
               bodyTitle="Company Overview"
               bodyText={overview?.description || "No description available"}
               showButton={false}
               entityType="company"
             />
            
            {/* Analysis Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {cardConfigs.map(({ key, label, getItems, subtitle, bulleted }) => {
                const items = overview ? getItems(overview) : [];
                const isEditable = true; // All cards are now editable
                
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
            
            {/* Target Accounts Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Target Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {/* Add New Account Card */}
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
        {/* TODO: Add campaigns tab content here */}
      </div>
    </>
  );
}