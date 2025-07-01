import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Building2, ArrowLeft, Check, X } from "lucide-react";
import { FirmographicsTable } from "../components/dashboard/FirmographicsTable";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import HeaderBar from "../components/dashboard/HeaderBar";

// TODO: Move to backend integration
const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: "Acme Corp",
    role: "Startup Founder",
    description:
      "A visionary business leader who identifies market opportunities and builds innovative solutions. Typically leads early-stage companies with 5-50 employees, focused on rapid growth.",
  },
  {
    id: 2,
    name: "Beta Inc",
    role: "Marketing Director",
    description:
      "Senior marketing professional responsible for driving customer acquisition and brand growth. Works at mid-market companies with established products looking to scale their reach.",
  },
];

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

function CompanyOverviewCard({ companyName, domain, description }: { companyName: string; domain: string; description: string }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{companyName}</h2>
              <p className="text-sm text-gray-500">{domain}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
          >
            View Details
          </Button>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">COMPANY DESCRIPTION</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerProfileCard({ profile, onEdit, onDelete }: any) {
  const navigate = useNavigate();
  return (
    <Card
      className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
      onClick={() => navigate(`/customers/${profile.id}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <span className="inline-block mb-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
              {profile.role}
            </span>
          </span>
          <p className="text-gray-700 text-base mt-2 mb-2 line-clamp-3">{profile.description}</p>
          <p className="text-xs text-gray-400 mt-4">Created: Jan 29, 2025</p>
        </div>
        <div className="flex space-x-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); onEdit(profile); }} className="text-blue-600">
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); onDelete(profile.id); }} className="text-red-500">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

function AddCustomerCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 hover:bg-blue-50 min-h-[180px]"
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <Plus className="w-8 h-8 text-blue-500 mb-2" />
        <span className="text-blue-600 font-medium">Add New</span>
      </div>
    </Card>
  );
}

function AddCustomerModal({ isOpen, onClose, onSave, editingProfile }: any) {
  // TODO: Implement modal using a UI primitive or Radix Dialog
  // For now, just a placeholder
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {editingProfile ? "Edit Customer" : "Add Customer"}
        </h2>
        {/* TODO: Add form fields for name, role, description */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailView({ customer }: { customer: typeof MOCK_CUSTOMER_DETAILS }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("accounts");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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
            <Button size="sm" variant="ghost" onClick={() => handleEdit("description", customer.description)}>
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
              <p className="text-gray-700 leading-relaxed">{customer.description}</p>
            )}
          </CardContent>
        </Card>
        {/* Firmographics Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Firmographics</CardTitle>
            <Button size="sm" variant="ghost">
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <FirmographicsTable data={customer.firmographics} />
          </CardContent>
        </Card>
        {/* Buying Signals Block */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Buying Signals</CardTitle>
            <Button size="sm" variant="ghost">
              <Edit3 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {customer.buyingSignals.map((signal, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{signal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Customers({ companyName = "blossomer.io", domain = "https://blossomer.io", description = "This company provides expertly built, fully managed outbound sales systems specifically for early-stage B2B founders. They focus on establishing a predictable customer acquisition pipeline before a startup needs to hire a full-time sales team. Their approach blends AI-powered outreach with human-led strategy and personalization to secure qualified customer meetings." }) {
  const [customerProfiles, setCustomerProfiles] = useState(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const { id } = useParams();

  const handleAddProfile = () => {
    // TODO: Implement add logic (and backend integration)
    setIsAddModalOpen(false);
  };
  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setIsAddModalOpen(true);
  };
  const handleDeleteProfile = (id: number) => {
    // TODO: Implement delete logic (and backend integration)
    setCustomerProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  // If a customer id is present in the route, show the detail view
  if (id) {
    // TODO: Replace with real data lookup
    return <CustomerDetailView customer={MOCK_CUSTOMER_DETAILS} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <CompanyOverviewCard companyName={companyName} domain={domain} description={description} />
        {/* Customer Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerProfiles.map((profile) => (
            <CustomerProfileCard
              key={profile.id}
              profile={profile}
              onEdit={handleEditProfile}
              onDelete={handleDeleteProfile}
            />
          ))}
          <AddCustomerCard onClick={() => setIsAddModalOpen(true)} />
        </div>
      </div>
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={editingProfile ? handleAddProfile : handleAddProfile}
        editingProfile={editingProfile}
      />
    </div>
  );
} 