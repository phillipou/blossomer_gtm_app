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
  getStoredTargetAccounts as getAllStoredTargetAccounts,
  generateTargetAccountId,
} from "../lib/accountService";
import type { TargetAccountResponse, ApiError } from "../types/api";

import SummaryCard from "../components/cards/SummaryCard";
import PageHeader from "../components/navigation/PageHeader";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";

interface TargetAccountCardProps {
  targetAccount: TargetAccountResponse & { id: string; createdAt: string };
  onEdit: (account: TargetAccountResponse & { id: string; createdAt: string }) => void;
  onDelete: (id: string) => void;
  companyName: string;
}

function TargetAccountCard({ targetAccount, onEdit, onDelete, companyName }: TargetAccountCardProps) {
  const navigate = useNavigate();
  return (
    <SummaryCard
      title={targetAccount.targetAccountName}
      description={targetAccount.targetAccountDescription}
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
  const [targetAccounts, setTargetAccounts] = useState<(TargetAccountResponse & { id: string; createdAt: string })[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<(TargetAccountResponse & { id: string; createdAt: string }) | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  // Load target accounts from localStorage on mount
  useEffect(() => {
    // Only use canonical shape
    const all = getAllStoredTargetAccounts();
    const canonical = all.filter(
      (acc: any): acc is TargetAccountResponse & { id: string; createdAt: string } =>
        typeof acc.targetAccountName === 'string' &&
        typeof acc.targetAccountDescription === 'string' &&
        Array.isArray(acc.targetAccountRationale) &&
        Array.isArray(acc.buyingSignalsRationale) &&
        typeof acc.id === 'string' &&
        typeof acc.createdAt === 'string'
    );
    setTargetAccounts(canonical);
  }, []);

  const handleAddAccount = async ({ name, description }: { name: string; description: string }) => {
    setError(null);
    if (!overview?.companyUrl || !overview.companyUrl.trim()) {
      setError("Company website URL is missing from overview. Cannot generate account.");
      return;
    }
    setIsGenerating(true);
    try {
      // Build companyContext from overview data
      const companyContext: Record<string, string | string[]> = {
        companyName: overview.companyName,
        companyUrl: overview.companyUrl,
        ...(overview.companyOverview ? { companyOverview: overview.companyOverview } : {}),
        ...(overview.productDescription ? { productDescription: overview.productDescription } : {}),
        ...(overview.capabilities && overview.capabilities.length ? { capabilities: overview.capabilities } : {}),
        ...(overview.businessModel && overview.businessModel.length ? { businessModel: overview.businessModel } : {}),
        ...(overview.differentiatedValue && overview.differentiatedValue.length ? { differentiatedValue: overview.differentiatedValue } : {}),
        ...(overview.customerBenefits && overview.customerBenefits.length ? { customerBenefits: overview.customerBenefits } : {}),
      };
      
      // Debug: log the context variables
      console.log("[AddAccount] websiteUrl:", overview.companyUrl.trim());
      console.log("[AddAccount] accountProfileName:", name);
      console.log("[AddAccount] hypothesis:", description);
      console.log("[AddAccount] companyContext:", companyContext);
      const response = await generateTargetCompany(
        overview?.companyUrl.trim() || '',
        name, // account profile name
        description, // hypothesis
        undefined, // additional context
        companyContext
      );
      // Add id and createdAt for local usage
      const newAccount = {
        ...response,
        id: generateTargetAccountId(),
        createdAt: new Date().toISOString(),
      };
      // Save canonical API shape
      const all = getAllStoredTargetAccounts();
      const canonical = all.filter(
        (acc: any): acc is TargetAccountResponse & { id: string; createdAt: string } =>
          typeof acc.targetAccountName === 'string' &&
          typeof acc.targetAccountDescription === 'string' &&
          Array.isArray(acc.targetAccountRationale) &&
          Array.isArray(acc.buyingSignalsRationale) &&
          typeof acc.id === 'string' &&
          typeof acc.createdAt === 'string'
      );
      canonical.push(newAccount);
      localStorage.setItem('target_accounts', JSON.stringify(canonical));
      setTargetAccounts(canonical);
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      console.error("[AddAccount] API error:", err);
      setError((err as ApiError)?.message || (err as Error).message || "Failed to generate target account.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditAccount = (account: TargetAccountResponse & { id: string; createdAt: string }) => {
    setEditingAccount(account);
    setIsAddModalOpen(true);
  };

  const handleUpdateAccount = async ({ name, description }: { name: string; description: string }) => {
    if (!editingAccount) return;
    // Update only the canonical fields
    const updatedAccount = {
      ...editingAccount,
      targetAccountName: name.trim(),
      targetAccountDescription: description.trim(),
    };
    // Update in localStorage
    const all = getAllStoredTargetAccounts();
    const canonical = all.filter(
      (acc: any): acc is TargetAccountResponse & { id: string; createdAt: string } =>
        typeof acc.targetAccountName === 'string' &&
        typeof acc.targetAccountDescription === 'string' &&
        Array.isArray(acc.targetAccountRationale) &&
        Array.isArray(acc.buyingSignalsRationale) &&
        typeof acc.id === 'string' &&
        typeof acc.createdAt === 'string'
    );
    const idx = canonical.findIndex(acc => acc.id === editingAccount.id);
    if (idx !== -1) {
      canonical[idx] = updatedAccount;
      localStorage.setItem('target_accounts', JSON.stringify(canonical));
      setTargetAccounts(canonical);
    }
    setIsAddModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    const filtered = targetAccounts.filter(account => account.id !== id);
    localStorage.setItem('target_accounts', JSON.stringify(filtered));
    setTargetAccounts(filtered);
  };

  // Filtered accounts based on search and filter
  const filteredAccounts = targetAccounts.filter(
    (account) => {
      const matchesSearch =
        account.targetAccountName.toLowerCase().includes(search.toLowerCase()) ||
        (account.targetAccountDescription && account.targetAccountDescription.toLowerCase().includes(search.toLowerCase()));
      if (filterBy === "all") return matchesSearch;
      return matchesSearch;
    }
  );

  if (!overview) {
    return <div>Loading...</div>;
  }

  const company_name = overview?.companyName || '';
  const company_url = overview?.companyUrl || '';
  const company_overview = overview?.companyOverview;
  const product_description = overview?.productDescription;
  const capabilities = overview?.capabilities;
  const business_model = overview?.businessModel;
  const differentiated_value = overview?.differentiatedValue;
  const customer_benefits = overview?.customerBenefits;

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
      <div className="flex-1 p-8 space-y-8">
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
                      companyName={overview.companyName}
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
        defaultName={editingAccount ? editingAccount.targetAccountName : ""}
        defaultDescription={editingAccount ? editingAccount.targetAccountDescription : ""}
        isLoading={editingAccount ? false : isGenerating}
      />
    </div>
  );
} 