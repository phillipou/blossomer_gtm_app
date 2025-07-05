// Force Tailwind to include these classes: bg-gradient-to-r from-blue-500 to-blue-600
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import CustomersList from "./Accounts";
import OverviewCard from "../components/cards/OverviewCard";
import DashboardLoading from "../components/dashboard/DashboardLoading";
import { apiFetch } from "../lib/apiClient";
import { ErrorDisplay } from "../components/ErrorDisplay";
import type { ApiError, AnalysisState } from "../types/api";
import ListInfoCard from "../components/cards/ListInfoCard";
import PageHeader from "../components/navigation/PageHeader";

const STATUS_STAGES = [
  { label: "Loading website...", percent: 20 },
  { label: "Analyzing company...", percent: 45 },
  { label: "Researching market...", percent: 70 },
  { label: "Finalizing...", percent: 90 },
];

type CardKey =
  | "capabilities"
  | "businessModel"
  | "alternatives"
  | "differentiatedValue"
  | "testimonials"
  | "customerBenefits";

const cardConfigs: { key: CardKey; title: string; label: string; bulleted?: boolean }[] = [
  { key: "capabilities", title: "Capabilities", label: "Capabilities", bulleted: true },
  { key: "businessModel", title: "Business Model", label: "Business Model", bulleted: true },
  { key: "alternatives", title: "Alternatives", label: "Alternatives", bulleted: true },
  { key: "differentiatedValue", title: "Differentiated Value", label: "Differentiated Value", bulleted: true },
  { key: "testimonials", title: "Testimonials", label: "Testimonials", bulleted: true },
  { key: "customerBenefits", title: "Customer Benefits", label: "Customer Benefits", bulleted: true },
];

export default function Dashboard() {
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
          data: response as TargetCompanyResponse,
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

  // Success state - render dashboard with real data
  const overview = analysisState.data;
  const companyName = overview?.companyName || "Company";
  const domain = overview?.companyUrl || "";

  // Edit logic for OverviewBlock
  const handleListEdit = (field: CardKey) => (newItems: string[]) => {
    setAnalysisState((prev: AnalysisState) => {
      if (!prev.data) return prev;
      const updated = {
        ...prev.data,
        [field]: newItems,
      };
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
              bodyText={overview?.companyOverview || overview?.productDescription}
              showButton={true}
              buttonTitle="View Details"
            />
            {/* New Info Cards Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {cardConfigs.map(({ key, title }) => (
                <ListInfoCard
                  key={key}
                  title={title}
                  items={overview ? (overview as unknown as Record<string, string[]>)[key] || [] : []}
                  onEdit={handleListEdit(key)}
                  renderItem={(item: string, idx: number) => (
                    <li
                      key={idx}
                      className="list-disc list-inside text-sm text-gray-700 blue-bullet"
                    >
                      {item}
                    </li>
                  )}
                  editModalSubtitle={
                    key === "capabilities" ? "Core features and strengths of the company/product."
                    : key === "businessModel" ? "How the company generates revenue."
                    : key === "alternatives" ? "Competing solutions or approaches."
                    : key === "differentiatedValue" ? "Unique value propositions that set this company apart."
                    : key === "testimonials" ? "Customer quotes or endorsements."
                    : key === "customerBenefits" ? "Key benefits customers receive."
                    : undefined
                  }
                />
              ))}
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