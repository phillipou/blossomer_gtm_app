import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Edit3, Trash2, Wand2 } from "lucide-react";
import { useGetAllPersonas, useDeletePersona } from "../lib/hooks/usePersonas";
import { useGetAccounts } from "../lib/hooks/useAccounts";
import { useAuthState } from "../lib/auth";
import SummaryCard from "../components/cards/SummaryCard";
import type { Persona, PersonaUpdate, TargetPersonaResponse } from "../types/api";
import { getEntityColorForParent } from "../lib/entityColors";
import PageHeader from "../components/navigation/PageHeader";
import AddCard from "../components/ui/AddCard";
import InputModal from "../components/modals/InputModal";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";
import { DraftManager } from "../lib/draftManager";
import { getPersonaName, getPersonaDescription } from "../lib/entityDisplayUtils";
import { useCompanyContext } from '../lib/hooks/useCompanyContext';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingStates } from '../components/ui/page-loading';

export default function TargetPersonas() {
  const navigate = useNavigate();
  const { token } = useAuthState();
  const { navigateWithPrefix, navigateToEntity, navigateToNestedEntity, isAuthenticated } = useAuthAwareNavigation();
  const queryClient = useQueryClient();

  // ALL HOOKS MUST BE CALLED FIRST (Rules of Hooks)
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Universal context and CRUD hooks
  const { overview, companyId, isLoading: isCompanyLoading, hasValidContext } = useCompanyContext();
  const { create: createPersonaUniversal, update: updatePersonaUniversal } = useEntityCRUD<TargetPersonaResponse>('persona');
  
  // Delete hook for authenticated personas (universal delete not yet implemented)
  const { mutate: deleteAuthenticatedPersona } = useDeletePersona(companyId || "", token);

  // Data fetching hooks (following Accounts.tsx pattern)
  const { data: accounts, isLoading: isAccountsLoading, error: accountsError } = useGetAccounts(companyId || "", token);
  
  // Get draft accounts ONLY for unauthenticated users (FIXED: following Accounts.tsx pattern)
  const draftAccounts = !isAuthenticated ? DraftManager.getDrafts('account').map(draft => ({
    ...draft.data,
    id: draft.tempId,
    isDraft: true,
  })) : [];
  
  // Combine accounts based on auth state - NO mixing of playground and database data
  const allAccounts = isAuthenticated ? (accounts || []) : draftAccounts;
  
  // Get personas for all accounts (authenticated users only) - following Implementation.md guidance
  const { data: authenticatedPersonas, isLoading: isPersonasLoading } = useGetAllPersonas(companyId || "", token);
  
  // Remove legacy update hook - using universal system now

  // Get draft personas ONLY for unauthenticated users
  const allDraftPersonas = !isAuthenticated ? (allAccounts?.flatMap(account => 
    DraftManager.getDraftsByParent('persona', account.id).map(draft => ({
      ...draft.data,
      id: draft.tempId,
      accountId: account.id,
      isDraft: true,
    }))
  ) || []) : [];

  // NO mixing - authenticated users get only database personas, unauthenticated get only drafts
  const allPersonas = isAuthenticated ? (authenticatedPersonas || []) : [...(authenticatedPersonas || []), ...allDraftPersonas];

  // Filter personas
  const filteredPersonas = allPersonas.filter((persona) => {
    const personaName = getPersonaName(persona) || '';
    const personaDescription = getPersonaDescription(persona) || '';
    const matchesSearch =
      personaName.toLowerCase().includes(search.toLowerCase()) ||
      personaDescription.toLowerCase().includes(search.toLowerCase());
    if (filterBy === "all") return matchesSearch;
    return matchesSearch;
  });

  // Removed problematic useEffect following Issue #26 "Remove, Don't Fix" pattern

  // THEN check for early returns (after ALL hooks)
  if (!isCompanyLoading && !companyId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Target Personas"
          subtitle="Manage buyer personas across all target accounts"
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-semibold mb-2">No Company Found</h2>
          <p className="text-gray-600 mb-4">You need to create or select a company before managing personas.</p>
          <Button onClick={() => navigateWithPrefix('/company')}>
            Go to Company Page
          </Button>
        </div>
      </div>
    );
  }

  // Note: No early return for empty accounts - let the component render and show empty state UI like Accounts.tsx
  
  const handlePersonaClick = (personaId: string) => {
    // Simplified navigation - direct to persona detail page
    navigateToEntity('persona', personaId);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setEditModalOpen(true);
  };

  const handleSavePersona = async ({ name, description }: { name: string; description: string }) => {
    if (!editingPersona) return;
    
    try {
      // Use universal update system (matches Accounts.tsx pattern - Issue #23 resolution)
      const updates = {
        targetPersonaName: name,
        targetPersonaDescription: description,
      };
      
      await updatePersonaUniversal(editingPersona.id, updates);
      
      setEditModalOpen(false);
      setEditingPersona(null);
    } catch (error) {
      console.error('[PERSONAS-UPDATE] Failed:', error);
      // Keep modal open so user can retry
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingPersona(null);
  };

  // Dual-path deletion logic (following Issue #25 pattern)
  const handleDeletePersona = async (id: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      // Check if this is a draft persona (temp ID format)
      if (id.startsWith('temp_')) {
        // Draft persona - remove from DraftManager
        DraftManager.removeDraft('persona', id);
        // Force re-render using forceUpdate (following Campaigns.tsx pattern)
        setForceUpdate(prev => prev + 1);
      } else if (isAuthenticated) {
        // Authenticated persona - use working delete hook
        deleteAuthenticatedPersona(id);
      } else {
        console.warn('[PERSONAS-DELETE] Cannot delete non-draft persona for unauthenticated user:', id);
      }
    }
  };

  // Error handling for accounts and personas
  if (accountsError) {
    return <div>Error: {accountsError.message}</div>;
  }
  
  // Error handling for accounts only (personas errors handled per account)

  // Loading states (moved to end like Accounts.tsx) - exclude isSavingPersona to show modal loading instead
  if (isCompanyLoading || isAccountsLoading || isPersonasLoading) {
    return <LoadingStates.personas />;
  }

  if (saveError) {
    return <div>Error: {saveError}</div>;
  }

  // Persona creation handler
  const handleCreatePersona = async ({ name, description, accountId }: { name: string; description: string; accountId: string }) => {
    console.log('[PERSONAS-DEBUG] Form submitted with:', { 
      name, 
      description, 
      accountId,
      selectedAccountId,
      hasValidContext,
      allAccountsLength: allAccounts?.length,
      allAccounts: allAccounts?.map(a => ({ id: a.id, name: a.name }))
    });
    
    if (!hasValidContext || !accountId) {
      console.error("Cannot create persona without valid context", { hasValidContext, accountId });
      return;
    }
    
    // Get fresh data at submission time
    const currentOverview = overview;
    if (!currentOverview) {
      console.error("No overview data available");
      return;
    }
    
    const selectedAccount = allAccounts?.find(acc => acc.id === accountId);
    if (!selectedAccount) {
      console.error("Selected account not found");
      return;
    }
    
    // Create persona data in AI request format (matches universal pattern)
    const personaData = {
      websiteUrl: currentOverview.companyUrl || '',
      personaProfileName: name,
      hypothesis: description,
      companyContext: {
        companyName: currentOverview.companyName || '',
        description: currentOverview.description || '',
        companyUrl: currentOverview.companyUrl || '',
        industryVertical: (currentOverview as any).industryVertical || '',
        targetMarket: (currentOverview as any).targetMarket || '',
        businessModel: (currentOverview as any).businessModel || '',
        valueProposition: (currentOverview as any).valueProposition || '',
        primaryOffering: (currentOverview as any).primaryOffering || ''
      },
      targetAccountContext: selectedAccount
    };
    
    try {
      setIsSavingPersona(true);
      setSaveError(null);
      
      // Universal create handles both AI generation and saving automatically
      const result = await createPersonaUniversal(personaData as any, {
        parentId: accountId, // CRITICAL: Personas need account parent
        navigateOnSuccess: true  // Let useEntityCRUD handle navigation
      });
      
      // Close modal and clear loading state - no manual navigation needed
      setIsCreateModalOpen(false);
      setIsSavingPersona(false);
      
    } catch (error) {
      console.error('[PERSONAS-PAGE] Persona creation failed:', error);
      setIsSavingPersona(false);
      setSaveError((error as any)?.message || "Failed to create persona");
    }
  };

  // Open modal for persona creation
  const handleOpenAddModal = () => {
    setIsCreateModalOpen(true);
  };

  // Add back the InputModal for adding a persona, with submit logic:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Personas"
        subtitle="Manage buyer personas across all target accounts"
        primaryAction={{
          label: "Add Target Persona",
          onClick: handleOpenAddModal
        }}
      />

      <div className="flex-1 p-8 space-y-8">
        <div className="flex flex-1 gap-8 overflow-auto">
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Personas</h2>
                <p className="text-sm text-gray-500">
                  {allPersonas?.length} personas across all target accounts
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search personas..."
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
                    <SelectItem value="all">All Personas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredPersonas && filteredPersonas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
                {filteredPersonas.map((persona) => (
                  <SummaryCard
                    key={`${persona.accountId}-${persona.id}`}
                    title={getPersonaName(persona)}
                    description={getPersonaDescription(persona)}
                    parents={[
                      { name: overview?.companyName || "Company", color: getEntityColorForParent('company'), label: "Company" },
                      { name: allAccounts?.find(a => a.id === persona.accountId)?.name || 'Account', color: getEntityColorForParent('account'), label: "Account" }
                   ]}
                    onClick={() => handlePersonaClick(persona.id)}
                    entityType="persona"
                  >
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={e => { 
                        e.stopPropagation(); 
                        handleDeletePersona(persona.id);
                      }} 
                      className="text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </SummaryCard>
                ))}
                <AddCard onClick={handleOpenAddModal} label="Add New" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500 max-w-md">
                  {/* Check if we have any accounts at all (following Accounts.tsx pattern) */}
                  {allAccounts.length === 0 ? (
                    // No accounts at all - need to create accounts first
                    <>
                      <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                      <h3 className="text-xl font-medium text-gray-900 mb-3">Create Target Accounts First</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        You need to create target accounts before you can generate personas. Target accounts help us understand your potential customers.
                      </p>
                      <Button onClick={() => navigateWithPrefix('/accounts')} size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Wand2 className="w-5 h-5 mr-2" />
                        Create Your First Account
                      </Button>
                    </>
                  ) : (
                    // Has accounts but no personas yet
                    <>
                      <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                      <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Persona</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Create your first target persona with our AI-powered wizard. Configure your target audience and let us help you generate detailed buyer insights.
                      </p>
                      <Button onClick={handleOpenAddModal} size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate Your First Persona
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InputModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleSavePersona}
        title="Edit Persona"
        subtitle="Update the name and description for this buyer persona."
        nameLabel="Persona Name"
        namePlaceholder="e.g., Marketing Director, Sales Manager..."
        descriptionLabel="Target Persona Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel="Update"
        cancelLabel="Cancel"
        defaultName={editingPersona?.name || ""}
        defaultDescription={editingPersona?.data?.targetPersonaDescription as string || ""}
        isLoading={false}
      />
      <InputModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setSelectedAccountId(""); }}
        onSubmit={handleCreatePersona}
        title="Generate Target Persona"
        subtitle="Describe a new buyer persona to generate detailed insights."
        nameLabel="Persona Name"
        namePlaceholder="e.g., Marketing Director, Sales Manager..."
        descriptionLabel="Target Persona Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel={<><Wand2 className="w-4 h-4 mr-2" />Generate Persona</>}
        loadingMessage="Generating Persona..."
        cancelLabel="Cancel"
        isLoading={isSavingPersona}
        accounts={allAccounts?.map(a => ({ id: a.id, name: a.name }))}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountLabel="Target Account"
        accountPlaceholder="None"
        descriptionRequired={false}
      />
    </div>
  );
} 