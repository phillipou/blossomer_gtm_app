import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Edit3, Check, X, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { FirmographicsTable } from "../components/dashboard/FirmographicsTable";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { EditBuyingSignalModal } from "../components/customers/EditBuyingSignalModal";
import EditFirmographicsModal from "../components/dashboard/EditFirmographicsModal";

// Import types and mock data from CustomersList
import { MOCK_CUSTOMERS } from "./CustomersList";
import type { CustomerProfile } from "./CustomersList";

const MOCK_CUSTOMER_DETAILS = {
  id: "1",
  title: "Technical B2B SaaS Founder-Led Startups",
  subtitle: "External Facing Name: Technical B2B SaaS Founder-Led Startups",
  description: `Early-stage, founder-led B2B software startups are driven by technical leaders who are building innovative products for business customers. These companies typically operate with lean teams and limited revenue, often relying on prioritizing product development over formalized sales processes. They frequently lack dedicated sales expertise, relying instead on the founders to lead outreach and customer discovery. Their focus is on rapidly validating product-market fit and establishing scalable, repeatable revenue systems to support future growth and fundraising.`,
  firmographics: [
    { label: "Revenue", values: [ { text: "$0-1M", color: "yellow" }, { text: "$1M-5M", color: "yellow" } ] },
    { label: "Industry", values: [ { text: "Software", color: "blue" }, { text: "Technology", color: "blue" }, { text: "Information Services", color: "blue" } ] },
    { label: "Employees", values: [ { text: "0-10", color: "red" }, { text: "10-50", color: "red" } ] },
    { label: "Geography", values: [ { text: "US", color: "gray" }, { text: "North America", color: "gray" }, { text: "EMEA", color: "gray" }, { text: "APAC", color: "gray" }, { text: "Global", color: "gray" } ] },
    { label: "Business model", values: [ { text: "B2B", color: "yellow" }, { text: "SaaS", color: "blue" } ] },
  ],
  buyingSignals: [
    "Recently raised seed or Series A funding",
    "Hiring for sales or marketing roles",
    "Posting about customer acquisition challenges on social media",
    "Attending sales and marketing conferences",
    "Implementing new CRM or sales tools",
    "Founder actively networking and seeking sales advice",
    "Company showing rapid user growth but struggling with monetization",
    "Recent product launches or feature announcements",
  ],
  createdAt: "Jul 1, 2025",
  updatedAt: "Jul 1, 2025",
  creator: "Phil Ou",
};

interface BuyingSignal {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Find customer by id (mock)
  const customer = MOCK_CUSTOMERS.find((c) => String(c.id) === String(id));
  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Customer not found.</div>;
  }
  // Adapt the mock customer to the detail shape
  const detailData = {
    ...customer,
    id: String(customer.id),
    firmographics: [
      { label: "Revenue", values: [{ text: "$0-1M", color: "yellow" }] },
      { label: "Industry", values: [{ text: "Software", color: "blue" }] },
      { label: "Employees", values: [{ text: "0-10", color: "red" }] },
      { label: "Geography", values: [{ text: "US", color: "gray" }] },
      { label: "Business model", values: [{ text: "B2B", color: "yellow" }] },
    ],
    buyingSignals: [
      "Recently raised seed or Series A funding",
      "Hiring for sales or marketing roles",
      "Posting about customer acquisition challenges on social media",
      "Attending sales and marketing conferences",
      "Implementing new CRM or sales tools",
      "Founder actively networking and seeking sales advice",
      "Company showing rapid user growth but struggling with monetization",
      "Recent product launches or feature announcements",
    ],
    createdAt: "Jul 1, 2025",
    updatedAt: "Jul 1, 2025",
    creator: "Phil Ou",
    title: customer.name,
    subtitle: customer.role,
    description: customer.description,
  };

  // --- CustomerDetailView logic below ---
  const [activeTab, setActiveTab] = useState("accounts");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  // Buying signals state
  const [buyingSignals, setBuyingSignals] = useState(
    detailData.buyingSignals.map((label, i) => ({
      id: String(i),
      label,
      description: "",
      enabled: true,
    }))
  );
  // Firmographics state
  const [firmographics, setFirmographics] = useState(detailData.firmographics);
  const [firmoModalOpen, setFirmoModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<BuyingSignal | null>(null);
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());

  const enabledCount = buyingSignals.filter(s => s.enabled).length;
  const totalCount = buyingSignals.length;

  const handleToggleSignal = (id: string) => {
    setBuyingSignals(signals => signals.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

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
    <div className="flex flex-col min-h-screen">
      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`py-4 border-b-2 font-medium ${activeTab === "accounts" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("personas")}
            className={`py-4 border-b-2 font-medium ${activeTab === "personas" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Personas
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Description Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Description</span>
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => handleEdit("description", detailData.description)}>
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {editingBlock === "description" ? (
              <div className="space-y-4">
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
              <p className="text-gray-700 leading-relaxed">{detailData.description}</p>
            )}
          </CardContent>
        </Card>
        {/* Firmographics Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Firmographics</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setFirmoModalOpen(true)}>
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <FirmographicsTable data={firmographics} />
          </CardContent>
        </Card>
        {/* Buying Signals Block */}
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center space-x-3">
              <CardTitle className="flex items-center space-x-2">
                <span>Buying Signals</span>
                <Badge className="bg-blue-100 text-blue-800">{enabledCount}/{totalCount}</Badge>
              </CardTitle>
            </div>
            {hovered && (
              <Button size="sm" variant="ghost" onClick={() => { setModalEditingSignal(null); setModalOpen(true); }}>
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <div className="px-6 pb-4 text-sm text-gray-500">
            Indicators that suggest a prospect is ready to buy or engage with your solution
          </div>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {buyingSignals.map(signal => {
                const isExpanded = expandedSignals.has(signal.id);
                return (
                  <div
                    key={signal.id}
                    className={`flex flex-col border border-gray-200 rounded-lg transition-all duration-200 overflow-hidden ${isExpanded ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onMouseEnter={() => setHoveredSignal(signal.id)}
                    onMouseLeave={() => setHoveredSignal(null)}
                    onClick={() => {
                      setExpandedSignals(prev => {
                        const next = new Set(prev);
                        if (next.has(signal.id)) {
                          next.delete(signal.id);
                        } else {
                          next.add(signal.id);
                        }
                        return next;
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${signal.enabled ? "text-gray-900" : "text-gray-500"}`}>{signal.label}</span>
                          <div style={{ width: 32, display: "inline-block" }}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className={`ml-2 transition-opacity duration-150 ${hoveredSignal === signal.id ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                              onClick={e => { e.stopPropagation(); setModalEditingSignal(signal); setModalOpen(true); }}
                              tabIndex={-1}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                      <Switch
                        checked={signal.enabled}
                        onChange={e => { e.stopPropagation(); handleToggleSignal(signal.id); }}
                        aria-label={`Toggle ${signal.label}`}
                      />
                        <span className="ml-2 pointer-events-none">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </span>
                      </div>
                    </div>
                    {isExpanded && signal.description && (
                      <div className="px-6 pb-3 text-sm text-gray-600">
                        {signal.description}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                  onClick={() => { setModalEditingSignal(null); setModalOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Buying Signal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditBuyingSignalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingSignal={modalEditingSignal}
        onSave={(values: Record<string, any>) => {
          const { label, description } = values;
          if (modalEditingSignal) {
            // Edit
            setBuyingSignals(signals => signals.map(s => s.id === modalEditingSignal.id ? { ...s, label, description } : s));
          } else {
            // Add
            setBuyingSignals(signals => [
              ...signals,
              { id: String(Date.now()), label, description, enabled: true },
            ]);
          }
        }}
      />
      <EditFirmographicsModal
        isOpen={firmoModalOpen}
        onClose={() => setFirmoModalOpen(false)}
        initialRows={firmographics}
        onSave={setFirmographics}
      />
    </div>
  );
} 