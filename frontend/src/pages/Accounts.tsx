import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Wand2 } from "lucide-react";
import { useGetAccounts, useDeleteAccount } from "../lib/hooks/useAccounts";
import type { Account } from "../types/api";
import SummaryCard from "../components/cards/SummaryCard";
import PageHeader from "../components/navigation/PageHeader";
import { getEntityColorForParent, getAddCardHoverClasses } from "../lib/entityColors";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";
import { getAccountName, getAccountDescription } from "../lib/entityDisplayUtils";
import { useCompanyContext } from '../lib/hooks/useCompanyContext';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import InputModal from '../components/modals/InputModal';
import type { TargetAccountResponse } from '../types/api';
import { DraftManager } from '../lib/draftManager';
import { useAuthState } from '../lib/auth';
import { LoadingStates } from '../components/ui/page-loading';
import { useQueryClient } from '@tanstack/react-query';

interface TargetAccountCardProps {
  targetAccount: Account;
  onDelete: (id: string) => void;
  companyName: string;
}

function TargetAccountCard({ targetAccount, onDelete, companyName }: TargetAccountCardProps) {
  const { navigateToEntity } = useAuthAwareNavigation();
  
  return (
    <SummaryCard
      title={getAccountName(targetAccount)}
      description={getAccountDescription(targetAccount)}
      parents={[
        { name: companyName, color: getEntityColorForParent('company'), label: "Company" }
      ]}
      onClick={() => navigateToEntity('account', targetAccount.id)}
      entityType="account"
    >
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
  const navigate = useNavigate();
  const { token } = useAuthState();
  const { navigateWithPrefix, navigateToEntity, isAuthenticated } = useAuthAwareNavigation();
  const queryClient = useQueryClient();
  
  // ALL HOOKS MUST BE CALLED FIRST (Rules of Hooks)
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  
  // Universal company context detection
  const { overview, companyId, isLoading: isCompanyLoading, hasValidContext } = useCompanyContext();
  
  // Universal account creation
  const { create: createAccountUniversal } = useEntityCRUD<TargetAccountResponse>('account');
  
  // Step 2: Always call hooks first (Rules of Hooks)
  const { data: accounts, isLoading, error } = useGetAccounts(companyId || "", token);
  const { mutate: deleteAccount } = useDeleteAccount(companyId);
  
  // Removed old hooks to prevent navigation conflicts - using only useEntityCRUD
  
  // Get draft accounts for unauthenticated users
  const draftAccounts = !isAuthenticated ? DraftManager.getDrafts('account').map(draft => ({
    ...draft.data,
    id: draft.tempId,
    isDraft: true,
  })) : [];
  
  // Combine authenticated accounts with drafts
  const allAccounts = isAuthenticated ? (accounts || []) : [...(accounts || []), ...draftAccounts];
  
  // Step 3: THEN check for early returns
  if (!isCompanyLoading && !companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-xl font-semibold mb-2">No Company Found</h2>
        <p className="text-gray-600 mb-4">You need to create or select a company before managing accounts.</p>
        <Button onClick={() => navigateWithPrefix('/company')}>
          Go to Company Page
        </Button>
      </div>
    );
  }

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this target account?')) {
      // Check if this is a draft account (temp ID format)
      if (id.startsWith('temp_')) {
        // Draft account - remove from DraftManager
        DraftManager.removeDraft('account', id);
        // Force re-render using forceUpdate (following Campaigns.tsx pattern)
        setRefreshKey(prev => prev + 1);
      } else if (isAuthenticated) {
        // Authenticated account - use mutation
        deleteAccount(id);
      } else {
        console.warn('[ACCOUNTS-DELETE] Cannot delete non-draft account for unauthenticated user:', id);
      }
    }
  };

  const handleCreateAccount = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };
  
  // Handle account creation using universal hooks
  const handleSubmitAccount = async ({ name, description }: { name: string; description: string }) => {
    if (!hasValidContext || !companyId) {
      console.error("Cannot create account without company context");
      return;
    }
    
    // Set loading state to show spinner
    setIsCreatingAccount(true);
    
    // Get fresh overview data at submission time
    const currentOverview = overview;
    if (!currentOverview) {
      console.error("No overview data available");
      setIsCreatingAccount(false);
      return;
    }
    
    // Create account data in AI request format
    const accountData = {
      website_url: currentOverview.companyUrl || '',
      account_profile_name: name,
      hypothesis: description,
      company_context: {
        companyName: currentOverview.companyName || '',
        description: currentOverview.description || '',
        businessProfileInsights: currentOverview.businessProfileInsights || [],
        capabilities: currentOverview.capabilities || [],
        useCaseAnalysisInsights: currentOverview.useCaseAnalysisInsights || [],
        positioningInsights: currentOverview.positioningInsights || [],
        targetCustomerInsights: currentOverview.targetCustomerInsights || [],
      },
    };
    
    try {
      const result = await createAccountUniversal(accountData, {
        customCompanyId: companyId,
        navigateOnSuccess: true  // Let useEntityCRUD handle navigation
      });
      
      // Close modal and clear loading state - no manual navigation needed
      setIsCreateModalOpen(false);
      setIsCreatingAccount(false);
      
    } catch (error) {
      console.error('[ACCOUNTS-PAGE] Account creation failed:', error);
      setIsCreatingAccount(false);
    }
  };

  // Get company name
  const companyName = overview?.companyName || 'Company';

  const filteredAccounts = allAccounts.filter((account) => {
    const accountName = getAccountName(account) || '';
    const accountDescription = getAccountDescription(account) || '';
    const matchesSearch =
      accountName.toLowerCase().includes(search.toLowerCase()) ||
      accountDescription.toLowerCase().includes(search.toLowerCase());
    if (filterBy === "all") return matchesSearch;
    return matchesSearch;
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isCompanyLoading || isLoading) {
    return <LoadingStates.accounts />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Accounts"
        subtitle="Identify and manage your ideal target accounts"
      />

      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Accounts</h2>
            <p className="text-sm text-gray-500">
              {filteredAccounts.length} accounts
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
            {filteredAccounts.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500 max-w-md">
                  <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Create Your First Target Account</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create your first target account with our AI-powered wizard. Define your ideal customer profile (ICP) and let us help you identify and manage your best-fit accounts.
                  </p>
                  <Button onClick={handleCreateAccount} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Create Your First Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
                {filteredAccounts.map((account) => (
                  <TargetAccountCard
                    key={account.id}
                    targetAccount={account}
                    onDelete={handleDeleteAccount}
                    companyName={companyName}
                  />
                ))}
                <AddAccountCard onClick={handleCreateAccount} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Account Creation Modal */}
      <InputModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAccount}
        title="Create Target Account"
        subtitle="Create a detailed analysis of your ideal customer account."
        nameLabel="Account Profile Name"
        namePlaceholder="Mid-market SaaS companies"
        descriptionLabel="Account Hypothesis"
        descriptionPlaceholder="Describe what types of companies you're targeting"
        descriptionRequired={false}
        submitLabel={<><Wand2 className="w-4 h-4 mr-2" />Generate Account</>}
        loadingMessage="Generating Account..."
        cancelLabel="Cancel"
        defaultName=""
        defaultDescription=""
        isLoading={isCreatingAccount}
      />
    </div>
  );
}
 