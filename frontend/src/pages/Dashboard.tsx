import { useState } from "react";
import { useLocation } from "react-router-dom";
import SidebarNav from "@/components/dashboard/SidebarNav";
import HeaderBar from "@/components/dashboard/HeaderBar";
import SubNav from "@/components/dashboard/SubNav";
import OverviewBlock from "@/components/dashboard/OverviewBlock";
import InfoCard from "@/components/dashboard/InfoCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function Dashboard() {
  const location = useLocation();
  const overview = location.state?.overview;
  const [activeTab, setActiveTab] = useState("company");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!overview) {
    return <div className="flex min-h-screen items-center justify-center text-xl">No GTM analysis found. Please generate one from the landing page.</div>;
  }

  // Example: companyName and domain from overview (customize as needed)
  const companyName = overview.company_profiles?.[0] || "Company";
  const domain = overview.metadata?.domain || "";

  // Business model, testimonials, etc. would come from overview or future endpoints
  // For now, use available overview fields for features, personas, use cases, pain points, etc.

  // Edit logic for OverviewBlock
  const handleEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditContent(currentContent);
  };
  const handleSave = () => {
    // Save logic here (API call, etc.)
    setEditingBlock(null);
    setEditContent("");
  };
  const handleCancel = () => {
    setEditingBlock(null);
    setEditContent("");
  };

  return (
    <div className="min-h-screen bg-gray-50 grid grid-cols-[260px_1fr]">
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} companyName={companyName} />
      <div className="flex flex-col">
        <HeaderBar companyName={companyName} domain={domain}>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {domain || "domain.com"}
          </Badge>
          <Button size="sm" variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Invite Team
          </Button>
        </HeaderBar>
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
          <OverviewBlock
            description={overview.product_description}
            editingBlock={editingBlock}
            editContent={editContent}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onEditContentChange={setEditContent}
          />
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InfoCard title="Key Features" items={overview.key_features || []} />
            <InfoCard title="Persona Profiles" items={overview.persona_profiles || []} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InfoCard title="Use Cases" items={overview.use_cases || []} />
            <InfoCard title="Pain Points" items={overview.pain_points || []} />
          </div>
          {/* Optionally add more InfoCards for pricing, confidence scores, etc. */}
        </div>
      </div>
    </div>
  );
} 