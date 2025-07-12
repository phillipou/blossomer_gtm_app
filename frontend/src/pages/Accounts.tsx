import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Wand2 } from "lucide-react";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import { useGetUserCompany } from "../lib/hooks/useCompany";
import { useGetAccounts, useDeleteAccount } from "../lib/hooks/useAccounts";
import type { Account } from "../types/api";
import SummaryCard from "../components/cards/SummaryCard";
import PageHeader from "../components/navigation/PageHeader";
import { getEntityColorForParent, getAddCardHoverClasses } from "../lib/entityColors";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";
import { useAuthState } from '../lib/auth';
import { getAccountName, getAccountDescription } from "../lib/entityDisplayUtils";
import { DraftManager } from '../lib/draftManager';

interface TargetAccountCardProps {
  targetAccount: Account;
  onDelete: (id: string) => void;
  companyName: string;
}

function TargetAccountCard({ targetAccount, onDelete, companyName }: TargetAccountCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = location.pathname.startsWith('/app');
  const prefix = isAuthenticated ? '/app' : '/playground';
  
  return (
    <SummaryCard
      title={getAccountName(targetAccount)}
      description={getAccountDescription(targetAccount)}
      parents={[
        { name: companyName, color: getEntityColorForParent('company'), label: "Company" }
      ]}
      onClick={() => navigate(`${prefix}/accounts/${targetAccount.id}`)}
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
  const { token } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ALL HOOKS MUST BE CALLED FIRST (Rules of Hooks)
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  
  // Determine route prefix for navigation
  const isAuthenticated = location.pathname.startsWith('/app');
  const prefix = isAuthenticated ? '/app' : '/playground';
  
  // Step 1: Determine if we have a valid company context
  const cachedOverview = useCompanyOverview();
  const { data: fetchedOverview, isLoading: isCompanyLoading } = useGetUserCompany(token);
  
  // For unauthenticated users, check DraftManager
  let overview = cachedOverview || fetchedOverview;
  if (!token && !overview) {
    const drafts = DraftManager.getDrafts('company');
    if (drafts.length > 0) {
      // DraftManager should already contain normalized CompanyResponse format
      overview = drafts[0].data;
    }
  }
  
  const companyId = overview?.companyId;
  
  // Step 2: Always call hooks first (Rules of Hooks)
  const { data: accounts, isLoading, error } = useGetAccounts(companyId || "", token);
  const { mutate: deleteAccount } = useDeleteAccount(companyId, token);
  
  // Debug logging
  console.log('[ACCOUNTS] Company context debug:', {
    token: !!token,
    cachedOverview: !!cachedOverview,
    fetchedOverview: !!fetchedOverview,
    overview: !!overview,
    companyId,
    isCompanyLoading,
    draftCount: !token ? DraftManager.getDraftCount('company') : 'N/A (authenticated)'
  });
  
  // Step 3: THEN check for early returns
  if (!isCompanyLoading && !companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-xl font-semibold mb-2">No Company Found</h2>
        <p className="text-gray-600 mb-4">You need to create or select a company before managing accounts.</p>
        <Button onClick={() => navigate(`${prefix}/company`)}>
          Go to Company Page
        </Button>
      </div>
    );
  }

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this target account?')) {
      deleteAccount(id);
    }
  };

  // Navigate to create new account (detail view handles generation)
  const handleCreateAccount = () => {
    navigate(`${prefix}/accounts/new`);
  };

  const filteredAccounts = accounts?.filter(
    (account) => {
      console.log("[DEBUG] Filtering account:", account);
      const matchesSearch =
        getAccountName(account).toLowerCase().includes(search.toLowerCase()) ||
        getAccountDescription(account).toLowerCase().includes(search.toLowerCase());
      if (filterBy === "all") return matchesSearch;
      return matchesSearch;
    }
  ) || [];

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isCompanyLoading || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Accounts"
        subtitle="Identify and manage your ideal target accounts"
        primaryAction={{
          label: "Create Target Account",
          onClick: handleCreateAccount,
        }}
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
                    companyName={overview.companyName}
                  />
                ))}
                <AddAccountCard onClick={handleCreateAccount} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 