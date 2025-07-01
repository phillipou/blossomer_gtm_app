import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Building2, ArrowLeft, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { FirmographicsTable } from "../components/dashboard/FirmographicsTable";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import HeaderBar from "../components/dashboard/HeaderBar";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  EditDialog,
  EditDialogContent,
  EditDialogDescription,
  EditDialogFooter,
  EditDialogHeader,
  EditDialogTitle,
} from "../components/ui/dialog";

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

interface BuyingSignal {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface EditDialogField {
  name: string;
  label: string;
  type: "input" | "textarea" | "switch";
  placeholder?: string;
  required?: boolean;
}

interface EditDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
  title: string;
  description?: string;
  fields: EditDialogField[];
  initialValues?: Record<string, any>;
  isLoading?: boolean;
  saveLabel?: string;
  editLabel?: string;
  editing?: boolean;
}

function EditDialogModal({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  fields,
  initialValues = {},
  isLoading = false,
  saveLabel = "Save",
  editLabel = "Update",
  editing = false,
}: EditDialogModalProps) {
  const [form, setForm] = useState<Record<string, any>>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues, isOpen]);

  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    for (const field of fields) {
      if (field.required && !form[field.name]?.toString().trim()) return;
    }
    onSave(form);
  };

  const handleClose = () => {
    setForm(initialValues);
    onClose();
  };

  return (
    <EditDialog open={isOpen} onOpenChange={handleClose}>
      <EditDialogContent className="sm:max-w-[500px]">
        <EditDialogHeader>
          <EditDialogTitle>{title}</EditDialogTitle>
          {description && <EditDialogDescription>{description}</EditDialogDescription>}
        </EditDialogHeader>
        <div className="space-y-4 py-4 px-6">
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "input" && (
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="focus:border-blue-500 focus:ring-blue-500"
                />
              )}
              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="min-h-[100px] focus:border-blue-500 focus:ring-blue-500"
                />
              )}
              {field.type === "switch" && (
                <Switch
                  checked={!!form[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                />
              )}
            </div>
          ))}
        </div>
        <EditDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={fields.some(f => f.required && !form[f.name]?.toString().trim()) || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? "Saving..." : editing ? editLabel : saveLabel}
          </Button>
        </EditDialogFooter>
      </EditDialogContent>
    </EditDialog>
  );
}

// Move and update EditBuyingSignalModalProps
type EditBuyingSignalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
  editingSignal?: BuyingSignal | null;
};

function EditBuyingSignalModal({ isOpen, onClose, onSave, editingSignal }: EditBuyingSignalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const editing = !!editingSignal;
  const initialValues = editingSignal
    ? { label: editingSignal.label, description: editingSignal.description }
    : { label: "", description: "" };

  const handleSave = (values: Record<string, any>) => {
    setIsLoading(true);
    onSave({
      label: values.label.trim(),
      description: values.description.trim(),
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <EditDialogModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={editing ? "Edit Buying Signal" : "Add Buying Signal"}
      description="Define indicators that suggest a prospect is ready to engage with your solution."
      fields={[
        { name: "label", label: "Signal", type: "input", placeholder: "e.g., Recently raised funding, Hiring sales roles...", required: true },
        { name: "description", label: "Description", type: "textarea", placeholder: "Provide context about when this signal indicates buying intent..." },
      ]}
      initialValues={initialValues}
      isLoading={isLoading}
      saveLabel="Add Signal"
      editLabel="Update Signal"
      editing={editing}
    />
  );
}

function CustomerDetailView({ customer }: { customer: typeof MOCK_CUSTOMER_DETAILS }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("accounts");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  // Buying signals state
  const [buyingSignals, setBuyingSignals] = useState(
    customer.buyingSignals.map((label, i) => ({
      id: String(i),
      label,
      description: "",
      enabled: true,
    }))
  );
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
        {/* Buying Signals Block (refined) */}
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
    </div>
  );
}

export default function Customers({ companyName = "blossomer.io", domain = "https://blossomer.io", description = "This company provides expertly built, fully managed outbound sales systems specifically for early-stage B2B founders. They focus on establishing a predictable customer acquisition pipeline before a startup needs to hire a full-time sales team. Their approach blends AI-powered outreach with human-led strategy and personalization to secure qualified customer meetings." }) {
  const [customerProfiles, setCustomerProfiles] = useState(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const { id } = useParams();

  const handleAddProfile = () => {
    setIsAddModalOpen(false);
  };
  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setIsAddModalOpen(true);
  };
  const handleDeleteProfile = (id: number) => {
    setCustomerProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  // If a customer id is present in the route, show the detail view for that customer
  if (id) {
    const customer = customerProfiles.find((c) => String(c.id) === String(id));
    if (!customer) {
      return <div className="p-8 text-center text-gray-500">Customer not found.</div>;
    }
    // Adapt the mock customer to the CustomerDetailView shape
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
    return <CustomerDetailView customer={detailData} />;
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