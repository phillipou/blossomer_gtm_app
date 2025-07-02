import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, Check, X, Plus, Trash2 } from "lucide-react";
import { FirmographicsTable } from "@/components/tables/FirmographicsTable";
import { Textarea } from "@/components/ui/textarea";
import EditBuyingSignalModal from "@/components/modals/EditBuyingSignalModal";
import EditFirmographicsModal from "@/components/modals/EditFirmographicsModal";
import SubNav from "@/components/navigation/SubNav";
import BuyingSignalsCard from "@/components/cards/BuyingSignalsCard";
import OverviewCard from "@/components/cards/OverviewCard";

// Import types and mock data from CustomersList
import { MOCK_CUSTOMERS } from "./CustomersList";

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
    { id: "0", label: "Recently raised seed or Series A funding", description: "", enabled: true },
    { id: "1", label: "Hiring for sales or marketing roles", description: "", enabled: true },
    { id: "2", label: "Posting about customer acquisition challenges on social media", description: "", enabled: true },
    { id: "3", label: "Attending sales and marketing conferences", description: "", enabled: true },
    { id: "4", label: "Implementing new CRM or sales tools", description: "", enabled: true },
    { id: "5", label: "Founder actively networking and seeking sales advice", description: "", enabled: true },
    { id: "6", label: "Company showing rapid user growth but struggling with monetization", description: "", enabled: true },
    { id: "7", label: "Recent product launches or feature announcements", description: "", enabled: true },
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
      { id: "revenue", label: "Revenue", values: [{ text: "$0-1M", color: "yellow" }] },
      { id: "industry", label: "Industry", values: [{ text: "Software", color: "blue" }] },
      { id: "employees", label: "Employees", values: [{ text: "0-10", color: "red" }] },
      { id: "geography", label: "Geography", values: [{ text: "US", color: "gray" }] },
      { id: "business_model", label: "Business model", values: [{ text: "B2B", color: "yellow" }] },
    ],
    buyingSignals: [
      { id: "0", label: "Recently raised seed or Series A funding", description: "test description", enabled: true },
      { id: "1", label: "Hiring for sales or marketing roles", description: "", enabled: true },
      { id: "2", label: "Posting about customer acquisition challenges on social media", description: "", enabled: true },
      { id: "3", label: "Attending sales and marketing conferences", description: "", enabled: true },
      { id: "4", label: "Implementing new CRM or sales tools", description: "", enabled: true },
      { id: "5", label: "Founder actively networking and seeking sales advice", description: "", enabled: true },
      { id: "6", label: "Company showing rapid user growth but struggling with monetization", description: "", enabled: true },
      { id: "7", label: "Recent product launches or feature announcements", description: "", enabled: true },
    ],
    createdAt: "Jul 1, 2025",
    updatedAt: "Jul 1, 2025",
    creator: "Phil Ou",
    title: customer.name,
    subtitle: customer.role,
    description: customer.description,
    personaProfiles: [
      "Technical Founder",
      "Sales-Oriented Founder",
      "Product Manager",
    ],
    painPoints: [
      "Lack of sales expertise",
      "Difficulty scaling outreach",
      "Limited marketing budget",
    ],
  };

  // --- CustomerDetailView logic below ---
  const [activeTab, setActiveTab] = useState("accounts");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  // Buying signals state
  const [buyingSignals, setBuyingSignals] = useState<BuyingSignal[]>(detailData.buyingSignals);
  // Firmographics state
  const [firmographics, setFirmographics] = useState(detailData.firmographics);
  const [firmoModalOpen, setFirmoModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<BuyingSignal | null>(null);
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [hoveredFirmo, setHoveredFirmo] = useState(false);

  // Mock personas data
  const [personas, setPersonas] = useState([
    {
      id: "1",
      name: "Startup Founder",
      description:
        "A visionary business leader who identifies market opportunities and builds innovative solutions. Typically...",
      createdAt: "Jan 29, 2025",
    },
    {
      id: "2",
      name: "Marketing Director",
      description:
        "Senior marketing professional responsible for driving customer acquisition and brand growth. Work...",
      createdAt: "Jan 29, 2025",
    },
  ]);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  const handlePersonaClick = (personaId: string) => {
    navigate(`/customers/${detailData.id}/persona/${personaId}`);
  };

  const enabledCount = Array.isArray(buyingSignals) && buyingSignals.length > 0 && typeof buyingSignals[0] === 'object'
    ? buyingSignals.filter((s: any) => s.enabled).length
    : 0;
  const totalCount = Array.isArray(buyingSignals) && buyingSignals.length > 0 && typeof buyingSignals[0] === 'object'
    ? buyingSignals.length
    : 0;

  const handleToggleSignal = (id: string) => {
    setBuyingSignals(signals => signals.map((s: BuyingSignal) => s.id === id ? { ...s, enabled: !s.enabled } : s));
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

  type Persona = {
    id: string;
    name: string;
    description: string;
    createdAt: string;
  };
  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setPersonaModalOpen(true);
  };
  const handleDeletePersona = (id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sub Navigation */}
      <SubNav
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: detailData.name }
        ]}
        activeSubTab={activeTab}
        setActiveSubTab={setActiveTab}
        subTabs={[
          { label: "Accounts", value: "accounts" },
          { label: "Personas", value: "personas" },
        ]}
      />
      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Description Block */}
        {activeTab === "accounts" && (
          <>
            {editingBlock === "description" ? (
              <div className="space-y-4">
                <label className="font-semibold">Description</label>
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
              <OverviewCard
                title={"Title"}
                subtitle={"Subtitle"}
                bodyTitle="Description"
                bodyText={detailData.description}
                showButton={true}
                buttonTitle="Edit"
                onButtonClick={() => handleEdit("description", detailData.description)}
              />
            )}
            {/* Firmographics Block */}
            <Card
              className="group relative"
              onMouseEnter={() => setHoveredFirmo(true)}
              onMouseLeave={() => setHoveredFirmo(false)}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Firmographics</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setFirmoModalOpen(true)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
                  tabIndex={-1}
                  style={{ pointerEvents: hoveredFirmo ? "auto" : "none" }}
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <FirmographicsTable data={firmographics} />
              </CardContent>
            </Card>
            {/* Buying Signals Block */}
            <BuyingSignalsCard
              signals={buyingSignals}
              onEdit={(signal) => { setModalEditingSignal(signal); setModalOpen(true); }}
              onDelete={(id) => setBuyingSignals(signals => signals.filter(s => s.id !== id))}
              onAdd={() => { setModalEditingSignal(null); setModalOpen(true); }}
            />
            {/* Personas Section (moved below Buying Signals, styled like CustomersList) */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Personas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona) => (
                  <Card
                    key={persona.id}
                    className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
                    onClick={() => handlePersonaClick(persona.id)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <span className="inline-block mb-2">
                          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
                            {persona.name}
                          </span>
                        </span>
                        <p className="text-gray-700 text-base mt-2 mb-2 line-clamp-3">{persona.description}</p>
                        <p className="text-xs text-gray-400 mt-4">Created: {persona.createdAt}</p>
                      </div>
                      <div className="flex space-x-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditPersona(persona); }} className="text-blue-600">
                          <Edit3 className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeletePersona(persona.id); }} className="text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {/* Add New Persona Card */}
                <Card
                  className="flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 hover:bg-blue-50 min-h-[180px]"
                  onClick={() => { setEditingPersona(null); setPersonaModalOpen(true); }}
                >
                  <div className="flex flex-col items-center">
                    <Plus className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-blue-600 font-medium">Add New</span>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
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