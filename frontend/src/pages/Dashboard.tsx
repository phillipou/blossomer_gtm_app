// Force Tailwind to include these classes: bg-gradient-to-r from-blue-500 to-blue-600
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarNav from "../components/dashboard/SidebarNav";
import HeaderBar from "../components/dashboard/HeaderBar";
import SubNav from "../components/dashboard/SubNav";
import OverviewBlock from "../components/dashboard/OverviewBlock";
import InfoCard from "../components/dashboard/InfoCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Bell } from "lucide-react";
import { Progress } from "../components/ui/progress";
import CustomersList from "./CustomersList";
import CompanyOverviewCard from "../components/customers/CompanyOverviewCard";

const STATUS_STAGES = [
  { label: "Loading website...", percent: 20 },
  { label: "Analyzing company...", percent: 45 },
  { label: "Researching market...", percent: 70 },
  { label: "Finalizing...", percent: 90 },
];

export default function Dashboard() {
  const location = useLocation();
  const [overview, setOverview] = useState<any>(() => {
    // Try to load from localStorage first
    const stored = localStorage.getItem("dashboard_overview");
    return stored ? JSON.parse(stored) : (location.state?.overview || null);
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [progressStage, setProgressStage] = useState(0);

  // If url/icp are passed, fetch the data (only if not in localStorage)
  useEffect(() => {
    if (!overview && location.state?.url) {
      setLoading(true);
      setProgressStage(0);
      fetch("http://localhost:8000/company/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: location.state.url,
          user_inputted_context: location.state.icp || undefined,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to generate GTM analysis");
          return res.json();
        })
        .then((data) => {
          setOverview(data);
          localStorage.setItem("dashboard_overview", JSON.stringify(data));
        })
        .catch(() => setOverview(null))
        .finally(() => setLoading(false));
    }
  }, [location.state, overview]);

  // When overview changes (e.g., after edits), update localStorage
  useEffect(() => {
    if (overview) {
      localStorage.setItem("dashboard_overview", JSON.stringify(overview));
    }
  }, [overview]);

  // Animate progress bar and status messages
  useEffect(() => {
    if (!loading) return;
    if (progressStage < STATUS_STAGES.length - 1) {
      const timer = setTimeout(() => {
        setProgressStage((s) => s + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progressStage, loading]);

  if (loading || !overview) {
    // Inline skeleton UI here
    return (
      <div className="flex flex-col relative">
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded mb-2 shimmer" />
            <div className="h-4 w-24 bg-gray-100 rounded shimmer" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-24 bg-gray-200 rounded shimmer" />
            <div className="h-8 w-28 bg-gray-100 rounded shimmer" />
          </div>
        </div>
        <div className="bg-white border-b border-gray-200 px-8 h-14 flex items-center">
          <div className="h-6 w-32 bg-gray-200 rounded shimmer" />
        </div>
        <div className="flex-1 p-8 space-y-8">
          {/* Loading card with progress bar and status */}
          <div className="max-w-md w-full mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-0">
              <Progress
                value={STATUS_STAGES[progressStage].percent}
                className="mb-6 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-blue-400 [&>div]:to-blue-600 [&>div]:rounded-l-full"
              />
              <div className="text-lg font-medium text-blue-700 flex items-center gap-2 min-h-[2.5rem]">
                <span className="animate-pulse">{STATUS_STAGES[progressStage].label}</span>
              </div>
            </div>
          </div>
          <div className="h-32 w-full bg-gray-200 rounded-xl shimmer" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-24 bg-gray-100 rounded-xl shimmer" />
            <div className="h-24 bg-gray-100 rounded-xl shimmer" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-24 bg-gray-100 rounded-xl shimmer" />
            <div className="h-24 bg-gray-100 rounded-xl shimmer" />
          </div>
        </div>
        <style>{`
          .shimmer {
            position: relative;
            overflow: hidden;
          }
          .shimmer::after {
            content: '';
            position: absolute;
            top: 0; left: 0; height: 100%; width: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transform: translateX(-100%);
            animation: shimmer-move 1.5s infinite;
          }
          @keyframes shimmer-move {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // Example: companyName and domain from overview (customize as needed)
  const companyName = overview.company_profiles?.[0] || "Company";
  const domain = overview.metadata?.domain || "";

  // Edit logic for OverviewBlock
  const handleEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditContent(currentContent);
  };
  const handleSave = () => {
    setEditingBlock(null);
    setEditContent("");
  };
  const handleCancel = () => {
    setEditingBlock(null);
    setEditContent("");
  };

  return (
    <div className="flex flex-col">
      {/* Remove SidebarNav and HeaderBar, only render main content */}
      {activeTab === "company" && (
        <>
          <SubNav
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            subTabs={[
              { label: "Company Overview", value: "overview" },
              { label: "Market Overview", value: "market" },
            ]}
          />
          <div className="flex-1 p-8 space-y-8">
            {/* Overview Block */}
            <CompanyOverviewCard companyName={companyName} domain={domain} description={overview.product_description} />
            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <InfoCard title="Key Features" items={overview.key_features || []} />
              <InfoCard title="Persona Profiles" items={overview.persona_profiles || []} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <InfoCard title="Use Cases" items={overview.use_cases || []} />
              <InfoCard title="Pain Points" items={overview.pain_points || []} />
            </div>
          </div>
        </>
      )}
      {activeTab === "customers" && (
        <div className="flex-1 p-8">
          <CustomersList
            companyName={companyName}
            domain={domain}
            description={overview.product_description}
          />
        </div>
      )}
      {/* TODO: Add campaigns tab content here */}
    </div>
  );
} 