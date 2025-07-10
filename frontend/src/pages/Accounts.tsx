import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Wand2 } from "lucide-react";
import InputModal from "../components/modals/InputModal";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import { useGetAccounts, useUpdateAccount, useDeleteAccount, useGenerateAccount, useCreateAccount } from "../lib/hooks/useAccounts";
import type { Account, AccountUpdate, AccountCreate } from "../types/api";
import SummaryCard from "../components/cards/SummaryCard";
import PageHeader from "../components/navigation/PageHeader";
import { getEntityColorForParent, getAddCardHoverClasses } from "../lib/entityColors";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";
import { useAuthState } from '../lib/auth';
import { useAutoSave } from "../lib/hooks/useAutoSave";
import { DraftManager } from "../lib/draftManager";
import { getAccountName, getAccountDescription } from "../lib/entityDisplayUtils";

interface TargetAccountCardProps {
  targetAccount: Account & { isDraft?: boolean };
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  companyName: string;
}

function TargetAccountCard({ targetAccount, onEdit, onDelete, companyName }: TargetAccountCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = location.pathname.startsWith('/app');
  const prefix = isAuthenticated ? '/app' : '/playground';
  
  return (
    <SummaryCard
      title={getAccountName(targetAccount)}
      description={getAccountDescription(targetAccount)}
      parents={[
        { name: companyName, color: getEntityColorForParent('company'), label: "Company" },
        ...(targetAccount.isDraft ? [{ name: "Draft", color: "bg-orange-100 text-orange-800", label: "Status" }] : [])
      ]}
      onClick={() => navigate(`${prefix}/accounts/${targetAccount.id}`)}
      entityType="account"
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
      className={`flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 min-h-[180px] ${getAddCardHoverClasses()}`}
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
  console.log("AccountsPage: Rendering");
  const overview = useCompanyOverview();
  const { token } = useAuthState();
  const navigate = useNavigate();
  const companyId = overview?.companyId || "";
  
  const { data: accounts, isLoading, error } = useGetAccounts(companyId, token);
  const { mutate: generateAccount, isPending: isGenerating } = useGenerateAccount(companyId, token);
  const createAccountMutation = useCreateAccount(companyId, token);
  const { mutate: createAccount, isPending: isCreating } = createAccountMutation;
  const updateAccountMutation = useUpdateAccount(companyId, token);
  const { mutate: updateAccount, isPending: isUpdating } = updateAccountMutation;
  const { mutate: deleteAccount } = useDeleteAccount(companyId, token);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [generatedAccountData, setGeneratedAccountData] = useState<any>(null);

  // Get draft accounts and combine with saved accounts
  const draftAccounts = DraftManager.getDraftsByParent('account', companyId);
  const allAccounts = [
    ...(accounts || []),
    ...draftAccounts.map(draft => ({
      ...draft.data,
      id: draft.tempId,
      isDraft: true,
    }))
  ];

  // Auto-save hook for generated accounts
  const autoSave = useAutoSave({
    entity: 'account',
    data: generatedAccountData,
    createMutation: createAccountMutation,
    updateMutation: updateAccountMutation,
    isAuthenticated: !!token,
    parentId: companyId,
    onSaveSuccess: (savedAccount) => {
      console.log("AccountsPage: Account auto-saved successfully", savedAccount);
      setGeneratedAccountData(null);
      const prefix = token ? '/app' : '/playground';
      navigate(`${prefix}/accounts/${savedAccount.id}`);
    },
    onSaveError: (error) => {
      console.error("AccountsPage: Auto-save failed", error);
    },
  });

  useEffect(() => {
    console.log("AccountsPage: accounts data changed", accounts);
  }, [accounts]);

  useEffect(() => {
    console.log("AccountsPage: isAddModalOpen changed", isAddModalOpen);
  }, [isAddModalOpen]);

  useEffect(() => {
    console.log("AccountsPage: editingAccount changed", editingAccount);
  }, [editingAccount]);

  const handleAddAccount = async ({ name, description }: { name: string; description: string }) => {
    console.log("AccountsPage: handleAddAccount called with", { name, description });
    if (!overview) {
      console.error("Cannot generate account without company overview.");
      return;
    }
    
    const companyContext = {
      companyName: overview.companyName || '',
      companyUrl: overview.companyUrl || '',
      business_profile: JSON.stringify(overview.businessProfile) || '',
      capabilities: JSON.stringify(overview.capabilities) || '',
      positioning: JSON.stringify(overview.positioning) || '',
      use_case_analysis: JSON.stringify(overview.useCaseAnalysis) || '',
      icp_hypothesis: JSON.stringify(overview.icpHypothesis) || '',
    };

    generateAccount({
      websiteUrl: overview.companyUrl,
      accountProfileName: name,
      hypothesis: description,
      companyContext,
    }, {
      onSuccess: (generatedData) => {
        console.log("AccountsPage: Account generated successfully", generatedData);
        // Convert to AccountCreate format and trigger auto-save
        const accountToSave: AccountCreate = {
          name: generatedData.targetAccountName || name,
          data: generatedData,
        };
        setGeneratedAccountData(accountToSave);
      },
      onError: (error) => {
        console.error("AccountsPage: Account generation failed", error);
      },
    });
    setIsAddModalOpen(false);
  };

  const handleEditAccount = (account: Account) => {
    console.log("AccountsPage: handleEditAccount called with", account);
    setEditingAccount(account);
    setIsAddModalOpen(true);
  };

  const handleUpdateAccount = async ({ name, description }: { name: string; description: string }) => {
    console.log("AccountsPage: handleUpdateAccount called with", { name, description });
    if (!editingAccount) return;
    const data: AccountUpdate = {
      name,
      data: {
        ...editingAccount.data,
        description,
      }
    };
    updateAccount({ accountId: editingAccount.id, data });
    setIsAddModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    console.log("AccountsPage: handleDeleteAccount called with id", id);
    deleteAccount(id);
  };

  const filteredAccounts = allAccounts?.filter(
    (account) => {
      const matchesSearch =
        getAccountName(account).toLowerCase().includes(search.toLowerCase()) ||
        getAccountDescription(account).toLowerCase().includes(search.toLowerCase());
      if (filterBy === "all") return matchesSearch;
      return matchesSearch;
    }
  );

  if (isLoading) {
    console.log("AccountsPage: Loading accounts...");
    return <div>Loading...</div>;
  }

  if (error) {
    console.error("AccountsPage: Error loading accounts", error);
    return <div>Error: {error.message}</div>;
  }

  if (!overview) {
    console.log("AccountsPage: Company overview not available.");
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Accounts"
        subtitle="Identify and manage your ideal target accounts"
        primaryAction={{
          label: "Add Target Account",
          onClick: () => { 
            console.log("AccountsPage: Add Target Account button clicked");
            setIsAddModalOpen(true); 
            setEditingAccount(null); 
          },
        }}
      />

      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Accounts</h2>
            <p className="text-sm text-gray-500">
              {allAccounts?.length} accounts 
              {draftAccounts.length > 0 && (
                <span className="text-orange-600"> ({draftAccounts.length} draft{draftAccounts.length !== 1 ? 's' : ''})</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            {!filteredAccounts || filteredAccounts.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500 max-w-md">
                  <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Target Account</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create your first target account with our AI-powered wizard. Define your ideal customer profile (ICP) and let us help you identify and manage your best-fit accounts.
                  </p>
                  <Button onClick={() => { 
                    console.log("AccountsPage: Generate Your First Account button clicked");
                    setIsAddModalOpen(true); 
                    setEditingAccount(null); 
                  }} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Your First Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
                {filteredAccounts.map((account) => (
                  <TargetAccountCard
                    key={account.id}
                    targetAccount={account}
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                    companyName={overview.companyName}
                  />
                ))}
                <AddAccountCard onClick={() => { 
                  console.log("AccountsPage: Add New Account card clicked");
                  setIsAddModalOpen(true); 
                  setEditingAccount(null); 
                }} />
              </div>
            )}
          </div>
        </div>
      </div>
      <InputModal
        isOpen={isAddModalOpen}
        onClose={() => { 
          console.log("AccountsPage: InputModal closed");
          setIsAddModalOpen(false); 
          setEditingAccount(null); 
        }}
        onSubmit={editingAccount ? handleUpdateAccount : handleAddAccount}
        title={editingAccount ? "Edit Target Account" : "Describe Your Ideal Target Account (ICP)"}
        subtitle={editingAccount ? "Update the name and description for this target account." : "What types of companies do you believe fit your ICP?"}
        nameLabel="Target Account Name"
        namePlaceholder="e.g. SaaS Startups, B2B Fintech Companies, etc."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe the characteristics, size, industry, or other traits that define your ideal target accounts."
        submitLabel={editingAccount ? "Update" : <><Wand2 className="w-4 h-4 mr-2" />Generate Account</>}
        cancelLabel="Cancel"
        defaultName={editingAccount ? editingAccount.name : ""}
        defaultDescription={editingAccount ? editingAccount.data?.description as string || "" : ""}
        isLoading={isGenerating || isCreating || isUpdating || autoSave.isSaving}
      />
    </div>
  );
}
 