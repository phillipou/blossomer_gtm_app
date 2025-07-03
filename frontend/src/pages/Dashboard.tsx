// Force Tailwind to include these classes: bg-gradient-to-r from-blue-500 to-blue-600
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SubNav from "@/components/navigation/SubNav";
import InfoCard from "@/components/cards/InfoCard";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import CustomersList from "./CustomersList";
import OverviewCard from "@/components/cards/OverviewCard";
import { Textarea } from "@/components/ui/textarea";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { apiFetch } from "@/lib/apiClient";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import type { ApiError, AnalysisState } from "@/types/api";
import ListInfoCard from "@/components/cards/ListInfoCard";

const STATUS_STAGES = [
  { label: "Loading website...", percent: 20 },
  { label: "Analyzing company...", percent: 45 },
  { label: "Researching market...", percent: 70 },
  { label: "Finalizing...", percent: 90 },
];

type CardKey =
  | "capabilities"
  | "business_model"
  | "alternatives"
  | "differentiated_value"
  | "testimonials"
  | "customer_benefits";

const cardConfigs: { key: CardKey; title: string; label: string; bulleted?: boolean }[] = [
  { key: "capabilities", title: "Capabilities", label: "Capabilities", bulleted: true },
  { key: "business_model", title: "Business Model", label: "Business Model", bulleted: true },
  { key: "alternatives", title: "Alternatives", label: "Alternatives", bulleted: true },
  { key: "differentiated_value", title: "Differentiated Value", label: "Differentiated Value", bulleted: true },
  { key: "testimonials", title: "Testimonials", label: "Testimonials", bulleted: true },
  { key: "customer_benefits", title: "Customer Benefits", label: "Customer Benefits", bulleted: true },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  // Helper to get cached overview
  const getCachedOverview = () => {
    const stored = localStorage.getItem("dashboard_overview");
    return stored ? JSON.parse(stored) : null;
  };
  // Helper to get cached URL
  const getCachedUrl = () => {
    const cached = getCachedOverview();
    return cached?._input_url || null;
  };
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
  const [activeTab, setActiveTab] = useState("company");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
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
      const response = await apiFetch("/demo/company/generate", {
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
          data: response,
          loading: false,
          error: null
        };
      });
      // Save the original input URL with the response
      localStorage.setItem(
        "dashboard_overview",
        JSON.stringify({ ...response, _input_url: url })
      );
    } catch (error: any) {
      let apiError: ApiError;
      if (error.status === 422 && error.body?.error_code) {
        apiError = error.body;
      } else if (error.status === 429) {
        apiError = {
          error_code: "RATE_LIMITED",
          message: "Rate limit exceeded. Sign up for higher limits!",
          retry_recommended: false
        };
      } else {
        apiError = {
          error_code: "NETWORK_ERROR",
          message: "Failed to analyze website. Please check your connection and try again.",
          retry_recommended: true
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
  }, [location.state, startAnalysis]);

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

  // Retry function
  const handleRetry = useCallback(() => {
    const url = location.state?.url;
    const icp = location.state?.icp;
    if (url) {
      setAnalysisState(prev => ({
        ...prev,
        hasAttempted: false,
        error: null
      }));
    }
  }, [location.state?.url, location.state?.icp]);

  // Loading state
  if (analysisState.loading) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={STATUS_STAGES[progressStage]?.percent || 0}
        statusMessage={STATUS_STAGES[progressStage]?.label || "Processing..."}
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

  // Success state - render dashboard with real data
  const overview = analysisState.data;
  const companyName = overview?.company_name || "Company";
  const domain = overview?.company_url || "";

  // Edit logic for OverviewBlock
  const handleEdit = (blockId: string, newItems: string[]) => {
    setAnalysisState((prev: AnalysisState) => {
      if (!prev.data) return prev;
      const updated = {
        ...prev.data,
        [blockId]: newItems,
      };
      localStorage.setItem("dashboard_overview", JSON.stringify(updated));
      return { ...prev, data: updated };
    });
  };

  // Define subTabs for company section
  const subTabs = [
    { label: "Company Overview", value: "overview" },
    { label: "Market Overview", value: "market" },
  ];

  return (
    <>
      <style>{`
        .blue-bullet::marker {
          color: #2563eb;
        }
      `}</style>
      <div className="flex flex-col">
        {/* Remove SidebarNav and HeaderBar, only render main content */}
        {activeTab === "company" && (
          <>
            <SubNav
              breadcrumbs={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Company", href: "/dashboard" },
                { label: subTabs.find((tab) => tab.value === activeSubTab)?.label || "" },
              ]}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              subTabs={subTabs}
            />
            <div className="flex-1 p-8 space-y-8">
              {/* Overview Block */}
              <OverviewCard
                title={companyName}
                subtitle={domain}
                bodyTitle="Company Overview"
                bodyText={overview?.company_overview || overview?.product_description}
                showButton={true}
                buttonTitle="View Details"
              />
              {/* New Info Cards Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {cardConfigs.map(({ key, title, label }) => (
                  <ListInfoCard
                    key={key}
                    title={title}
                    items={overview?.[key] || []}
                    onEdit={(newItems) => handleEdit(key, newItems)}
                    renderItem={(item: string, idx: number) => (
                      <li
                        key={idx}
                        className="list-disc list-inside text-sm text-gray-700 blue-bullet"
                      >
                        {item}
                      </li>
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        {activeTab === "customers" && (
          <div className="flex-1 p-8">
            {/* Add SubNav for Customers */}
            <SubNav
              breadcrumbs={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Customers", href: "/customers" },
              ]}
              activeSubTab={"list"}
              setActiveSubTab={() => {}}
              subTabs={[]}
            />
            <CustomersList
              companyName={companyName}
              domain={domain}
              description={overview?.product_description}
            />
          </div>
        )}
        {/* TODO: Add campaigns tab content here */}
      </div>
    </>
  );
}