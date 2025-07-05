import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Wand2 } from "lucide-react";
import InputModal from "../components/modals/InputModal";
import OverviewCard from "../components/cards/OverviewCard";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import {
  generateTargetCompany,
  getStoredTargetAccounts,
  saveTargetAccount,
  deleteTargetAccount,
  generateTargetAccountId,
} from "../lib/accountService";
import type { TargetAccount, ApiError } from "../types/api";

import SummaryCard from "../components/cards/SummaryCard";
import PageHeader from "../components/navigation/PageHeader";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";

interface TargetAccountCardProps {
  targetAccount: TargetAccount;
  onEdit: (account: TargetAccount) => void;
  onDelete: (id: string) => void;
  companyName: string;
}

function TargetAccountCard({ targetAccount, onEdit, onDelete, companyName }: TargetAccountCardProps) {
  const navigate = useNavigate();
  return (
    <SummaryCard
      title={targetAccount.name}
      description={targetAccount.description}
      parents={[{ name: companyName, color: "bg-green-400", label: "Company" }]}
      onClick={() => navigate(`/target-accounts/${targetAccount.id}`)}
    >
      <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(targetAccount); }} className="text-blue-600">
        <Edit3 className="w-5 h-5" />
      </Button>
      <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(targetAccount.id); }} className="text-red-500">
        <Trash2 className="w-5 h-5" />
      </Button>
    </SummaryCard>
  );
}

function AddAccountCard({ onClick }: { onClick: () => void }) {
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

export default function TargetAccountsList() {
  const overview = useCompanyOverview();
  const [targetAccounts, setTargetAccounts] = useState<TargetAccount[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TargetAccount | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  // Load target accounts from localStorage on mount
  useEffect(() => {
    setTargetAccounts(getStoredTargetAccounts());
  }, []);

  const handleAddAccount = async ({ name, description }: { name: string; description: string }) => {
    setError(null);
    if (!overview?.company_url || !overview.company_url.trim()) {
      setError("Company website URL is missing from overview. Cannot generate account.");
      return;
    }
    setIsGenerating(true);
    try {
      // Build user_inputted_context as an object
      const user_inputted_context: Record<string, string> = {
        target_company_name: name,
        target_company_description: description,
      };
      // Build company_context as an object
      const company_context: Record<string, string | string[]> = {
        company_name: company_name,
        company_url: company_url,
        ...(company_overview ? { company_overview: company_overview } : {}),
        ...(product_description ? { product_description: product_description } : {}),
        ...(capabilities && capabilities.length ? { capabilities: capabilities } : {}),
        ...(business_model && business_model.length ? { business_model: business_model } : {}),
        ...(differentiated_value && differentiated_value.length ? { differentiated_value: differentiated_value } : {}),
        ...(customer_benefits && customer_benefits.length ? { customer_benefits: customer_benefits } : {}),
      };
      // Debug: log the context variables
      console.log("[AddAccount] websiteUrl:", company_url.trim());
      console.log("[AddAccount] user_inputted_context:", user_inputted_context);
      console.log("[AddAccount] company_context:", company_context);
      const requestPayload = {
        website_url: overview?.company_url.trim() || '',
        user_inputted_context,
        company_context,
      };
      console.log("[AddAccount] API request payload:", requestPayload);
      const response = await generateTargetCompany(
        requestPayload.website_url,
        requestPayload.user_inputted_context,
        requestPayload.company_context
      );
      console.log("[AddAccount] API response:", response);
      const newAccount: TargetAccount = {
        id: generateTargetAccountId(),
        name: response.target_company_name,
        role: "Target Account",
        description: response.target_company_description || description,
        firmographics: response.firmographics,
        buying_signals: response.buying_signals,
        rationale: response.rationale,
        metadata: response.metadata,
        created_at: new Date().toISOString(),
      };
      saveTargetAccount(newAccount);
      setTargetAccounts(getStoredTargetAccounts());
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      console.error("[AddAccount] API error:", err);
      setError((err as ApiError)?.message || (err as Error).message || "Failed to generate target account.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditAccount = (account: TargetAccount) => {
    setEditingAccount(account);
    setIsAddModalOpen(true);
  };

  const handleUpdateAccount = async ({ name, description }: { name: string; description: string }) => {
    if (!editingAccount) return;
    
    // Update only the metadata (name and description) of the existing account
    const updatedAccount: TargetAccount = {
      ...editingAccount,
      name: name.trim(),
      description: description.trim(),
    };
    
    // Save the updated account to localStorage
    saveTargetAccount(updatedAccount);
    setTargetAccounts(getStoredTargetAccounts());
    setIsAddModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    deleteTargetAccount(id);
    setTargetAccounts(getStoredTargetAccounts());
  };

  // Filtered accounts based on search and filter
  const filteredAccounts = targetAccounts.filter(
    (account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(search.toLowerCase()));
      if (filterBy === "all") return matchesSearch;
      return matchesSearch;
    }
  );

  if (!overview) {
    return <div>Loading...</div>;
  }

  const company_name = overview?.company_name || '';
  const company_url = overview?.company_url || '';
  const company_overview = overview?.company_overview;
  const product_description = overview?.product_description;
  const capabilities = overview?.capabilities;
  const business_model = overview?.business_model;
  const differentiated_value = overview?.differentiated_value;
  const customer_benefits = overview?.customer_benefits;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Accounts"
        subtitle="Identify and manage your ideal target accounts"
        primaryAction={{
          label: "Add Target Account",
          onClick: () => { setIsAddModalOpen(true); setEditingAccount(null); }
        }}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-8 space-y-8">
        <OverviewCard 
          title={overview.company_name}
          subtitle={overview.company_url}
          bodyTitle="Company Overview"
          bodyText={overview.company_overview || overview.product_description}
          showButton={true}
          buttonTitle="View Details"
        />
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
        )}
        {/* All Accounts Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Accounts</h2>
            <p className="text-sm text-gray-500">{targetAccounts.length} accounts created</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search accounts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-1 gap-8 overflow-auto">
          <div className="flex flex-col w-full">
            {filteredAccounts.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500 max-w-md">
                  <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Target Account</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create your first target account with our AI-powered wizard. Define your ideal customer profile (ICP) and let us help you identify and manage your best-fit accounts.
                  </p>
                  <Button onClick={() => { setIsAddModalOpen(true); setEditingAccount(null); }} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Your First Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map((account) => {
                  return (
                    <TargetAccountCard
                      key={account.id}
                      targetAccount={account}
                      onEdit={handleEditAccount}
                      onDelete={handleDeleteAccount}
                      companyName={overview.company_name}
                    />
                  );
                })}
                <AddAccountCard onClick={() => { setIsAddModalOpen(true); setEditingAccount(null); }} />
              </div>
            )}
          </div>
        </div>
      </div>
      <InputModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingAccount(null); }}
        onSubmit={editingAccount ? handleUpdateAccount : handleAddAccount}
        title={editingAccount ? "Edit Target Account" : "Describe Your Ideal Target Account (ICP)"}
        subtitle={editingAccount ? "Update the name and description for this target account." : "What types of companies do you believe fit your ICP?"}
        nameLabel="Target Account Name"
        namePlaceholder="e.g. SaaS Startups, B2B Fintech Companies, etc."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe the characteristics, size, industry, or other traits that define your ideal target accounts."
        submitLabel={editingAccount ? "Update" : isGenerating ? "Generating..." : "Generate"}
        cancelLabel="Cancel"
        defaultName={editingAccount ? editingAccount.name : ""}
        defaultDescription={editingAccount ? editingAccount.description : ""}
        isLoading={editingAccount ? false : isGenerating}
      />
    </div>
  );
} 