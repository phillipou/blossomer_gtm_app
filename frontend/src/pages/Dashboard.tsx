// Force Tailwind to include these classes: bg-gradient-to-r from-blue-500 to-blue-600
import { useState, useEffect } from "react";
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
  const [overview, setOverview] = useState<any>(() => {
    const stored = localStorage.getItem("dashboard_overview");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState(0);
  const [analysisKey, setAnalysisKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("company");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const url = location.state?.url;
    const icp = location.state?.icp;
    const currentAnalysisKey = url ? `${url}-${icp || ''}` : null;
    // Check if we have meaningful data for this URL
    const hasMeaningfulData = overview && 
      overview.company_url === url && 
      overview.company_name && 
      overview.company_name.trim() !== "" &&
      overview.capabilities && 
      overview.capabilities.length > 0;
    // Only trigger if:
    // 1. We have a URL from navigation state
    // 2. We haven't already processed this exact request (analysisKey check)
    // 3. We're not currently loading
    // 4. We don't already have meaningful data for this URL
    if (url && currentAnalysisKey !== analysisKey && !loading && !hasMeaningfulData) {
      setAnalysisKey(currentAnalysisKey);
      setLoading(true);
      setProgressStage(0);
      setError(null);
      apiFetch("/demo/company/generate", {
        method: "POST",
        body: JSON.stringify({
          website_url: url,
          user_inputted_context: icp || "",
        }),
      })
        .then((data) => {
          console.log("API response:", data);
          // Check if the response has meaningful data
          if (data.company_name && data.company_name.trim() !== "" && 
              data.capabilities && data.capabilities.length > 0) {
            setOverview(data);
            localStorage.setItem("dashboard_overview", JSON.stringify(data));
          } else {
            // If response is empty/meaningless, treat as error
            console.warn("Received empty response, will retry");
            setError("Unable to analyze website. Please try again.");
            setOverview(null);
          }
        })
        .catch(() => {
          setError("Failed to generate analysis. Please try again.");
          setOverview(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [location.state?.url, location.state?.icp, analysisKey, loading]);

  // Animate progress stages during loading
  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setProgressStage(prev => {
        if (prev < STATUS_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [loading]);

  // Reset progress when loading starts
  useEffect(() => {
    if (loading) {
      setProgressStage(0);
    }
  }, [loading]);

  // When overview changes (e.g., after edits), update localStorage
  useEffect(() => {
    if (overview) {
      localStorage.setItem("dashboard_overview", JSON.stringify(overview));
    }
  }, [overview]);

  if (loading) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={STATUS_STAGES[progressStage]?.percent || 0}
        statusMessage={STATUS_STAGES[progressStage]?.label || "Processing..."}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center border border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Rate Limit Reached</h2>
          <p className="text-gray-700 mb-8">
            You've hit your free usage limit for AI-powered GTM analysis.<br />
            <b>Sign up for a free account</b> to unlock higher limits and more features!
          </p>
          <Button
            asChild
            className="w-full mb-3 bg-blue-600 hover:bg-blue-700 !text-white"
            variant="default"
          >
            <a href="/signup">Sign up for an account</a>
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Add fallback for no analysis input
  if (!overview && !loading && !location.state?.url) {
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

  // Add fallback for empty/failed analysis
  if (overview && (!overview.company_name || overview.company_name.trim() === "")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center border border-yellow-200">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Unable to Analyze Website</h2>
          <p className="text-gray-700 mb-8">
            We couldn't extract meaningful information from this website. 
            This might be due to the site being unavailable or having limited content.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setOverview(null);
              localStorage.removeItem("dashboard_overview");
              navigate("/");
            }}
          >
            Try Another Website
          </Button>
        </div>
      </div>
    );
  }

  // Use real API data for company info
  const companyName = overview?.company_name || "Company";
  const domain = overview?.company_url || "";

  // Edit logic for OverviewBlock
  const handleEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditContent(currentContent);
  };
  const handleSave = () => {
    if (
      editingBlock &&
      [
        "capabilities",
        "business_model",
        "alternatives",
        "differentiated_value",
        "testimonials",
        "customer_benefits",
      ].includes(editingBlock)
    ) {
      setOverview((prev: any) => {
        const updated = {
          ...prev,
          [editingBlock]: editContent.split("\n").filter((line) => line.trim() !== ""),
        };
        localStorage.setItem("dashboard_overview", JSON.stringify(updated));
        return updated;
      });
    }
    setEditingBlock(null);
    setEditContent("");
  };
  const handleCancel = () => {
    setEditingBlock(null);
    setEditContent("");
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
                {cardConfigs.map(({ key, title, label, bulleted }) =>
                  editingBlock === key ? (
                    <div className="space-y-4" key={key}>
                      <label className="font-semibold">{label}</label>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSave}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <InfoCard
                      key={key}
                      title={title}
                      items={overview?.[key] || []}
                      onEdit={() => handleEdit(key, (overview?.[key] || []).join("\n"))}
                      renderItem={(item: string, idx: number) => (
                        <li
                          key={idx}
                          className="list-disc list-inside text-sm text-gray-700 blue-bullet"
                        >
                          {item}
                        </li>
                      )}
                    />
                  )
                )}
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