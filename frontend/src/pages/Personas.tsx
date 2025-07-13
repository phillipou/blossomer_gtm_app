import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Edit3, Trash2, Wand2 } from "lucide-react";
import { useGetAllPersonas, useUpdatePersona, useDeletePersona, useCreatePersona, useGeneratePersona } from "../lib/hooks/usePersonas";
import { useGetAccounts } from "../lib/hooks/useAccounts";
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

export default function TargetPersonas() {
  const navigate = useNavigate();
  const { navigateWithPrefix, navigateToEntity, isAuthenticated } = useAuthAwareNavigation();

  // Universal company context detection
  const { overview, companyId, isLoading: isCompanyLoading } = useCompanyContext();

  // Step 2: Always call hooks first (Rules of Hooks)
  const { data: accounts, isLoading: isAccountsLoading, error: accountsError } = useGetAccounts(companyId || "");
  const { data: personas, isLoading: isPersonasLoading, error: personasError } = useGetAllPersonas(companyId || "");

  // Update mutation hooks to use correct types for TargetPersonaResponse
  const updatePersonaMutation = useUpdatePersona("");
  const { mutate: deletePersona } = useDeletePersona("");
  const createPersonaMutation = useCreatePersona();
  const generatePersonaMutation = useGeneratePersona();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [generatedPersonaData, setGeneratedPersonaData] = useState<TargetPersonaResponse | null>(null);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get draft personas for all accounts
  const allDraftPersonas = accounts?.flatMap(account => 
    DraftManager.getDraftsByParent('persona', account.id).map(draft => ({
      ...draft.data,
      id: draft.tempId,
      accountId: account.id,
      isDraft: true,
    }))
  ) || [];

  // Combine saved and draft personas
  const allPersonasWithDrafts = [
    ...(personas || []),
    ...(allDraftPersonas || [])
  ];

  // Effect: When generatedPersonaData is set, immediately create the persona
  // This useEffect is removed as per the edit hint.

  // Step 3: THEN check for early returns
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

  // Check for no accounts available (personas need accounts)
  if (!isAccountsLoading && (!accounts || accounts.length === 0)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Target Personas"
          subtitle="Manage buyer personas across all target accounts"
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-semibold mb-2">No Accounts Found</h2>
          <p className="text-gray-600 mb-4">You need to create target accounts before managing personas.</p>
          <Button onClick={() => navigateWithPrefix('/accounts')}>
            Go to Accounts Page
          </Button>
        </div>
      </div>
    );
  }
  
  const handlePersonaClick = (customerId: string, personaId: string) => {
    navigate(`${isAuthenticated ? '/app' : '/playground'}/accounts/${customerId}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setEditModalOpen(true);
  };

  const handleSavePersona = async ({ name, description }: { name: string; description: string }) => {
    if (!editingPersona) return;
    const data: PersonaUpdate = {
      name: name,
      data: {
        ...editingPersona.data,
        targetPersonaName: name,
        targetPersonaDescription: description,
      }
    };
    updatePersonaMutation.mutate({ personaId: editingPersona.id, data });
    setEditModalOpen(false);
    setEditingPersona(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingPersona(null);
  };

  const handleDeletePersona = (personaId: string) => {
    deletePersona(personaId);
  };

  // Error handling for accounts and personas
  if (accountsError) {
    return <div>Error: {accountsError.message}</div>;
  }
  
  if (personasError) {
    return <div>Error: {personasError.message}</div>;
  }

  // Loading states (moved to end like Accounts.tsx)
  if (isCompanyLoading || isAccountsLoading || isPersonasLoading || isSavingPersona) {
    return <div>Loading...</div>;
  }

  if (saveError) {
    return <div>Error: {saveError}</div>;
  }

  // Use allPersonasWithDrafts for filtering and rendering
  const filteredPersonas = allPersonasWithDrafts.filter((persona) => {
    const matchesSearch =
      getPersonaName(persona).toLowerCase().includes(search.toLowerCase()) ||
      getPersonaDescription(persona).toLowerCase().includes(search.toLowerCase());
    if (filterBy === "all") return matchesSearch;
    return matchesSearch;
  });

  // Restore handleOpenAddModal to open the modal
  const handleOpenAddModal = () => {
    setAddModalOpen(true);
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
                  {allPersonasWithDrafts?.length} personas across all target accounts
                  {allDraftPersonas.length > 0 && (
                    <span className="text-orange-600"> ({allDraftPersonas.length} draft{allDraftPersonas.length !== 1 ? 's' : ''})</span>
                  )}
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
                      { name: accounts?.find(a => a.id === persona.accountId)?.name || 'Account', color: getEntityColorForParent('account'), label: "Account" },
                      { name: overview?.companyName || "Company", color: getEntityColorForParent('company'), label: "Company" },
                      ...(persona.isDraft ? [{ name: "Draft", color: "bg-orange-100 text-orange-800", label: "Status" }] : [])
                    ]}
                    onClick={() => handlePersonaClick(persona.accountId, persona.id)}
                    entityType="persona"
                  >
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={e => { 
                        e.stopPropagation(); 
                        handleEditPersona(persona);
                      }} 
                      className="text-blue-600"
                    >
                      <Edit3 className="w-5 h-5" />
                    </Button>
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
                  <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Persona</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create your first target persona with our AI-powered wizard. Configure your target audience and let us help you generate detailed buyer insights.
                  </p>
                  <Button onClick={handleOpenAddModal} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Your First Persona
                  </Button>
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
        descriptionLabel="Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel={updatePersonaMutation.isPending ? "Saving..." : "Update"}
        cancelLabel="Cancel"
        defaultName={editingPersona?.name || ""}
        defaultDescription={editingPersona?.data?.targetPersonaDescription as string || ""}
        isLoading={updatePersonaMutation.isPending}
      />
      <InputModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setSelectedAccountId(""); }}
        onSubmit={async ({ name, description, accountId }) => {
          if (!accountId || !overview) return;
          
          // Get the selected account data for context
          const selectedAccount = accounts?.find(acc => acc.id === accountId);
          
          // Step 1: Generate AI data (matching account pattern)
          setIsSavingPersona(true);
          setSaveError(null);
          
          generatePersonaMutation.mutate(
            { 
              accountId, 
              personaData: {
                websiteUrl: overview?.companyUrl || '',
                personaProfileName: name,
                hypothesis: description,
                companyContext: overview, // Company data
                targetAccountContext: selectedAccount // Selected account data
              }
            },
            {
              onSuccess: (generatedData) => {
                console.log("Persona generated successfully", generatedData);
                
                // Step 2: Create persona directly (matching account pattern)
                const personaToSave = {
                  name: generatedData.targetPersonaName || name,
                  data: generatedData, // Direct assignment like accounts
                };
                
                createPersonaMutation.mutate(
                  { accountId, personaData: personaToSave },
                  {
                    onSuccess: (savedPersona) => {
                      console.log("Persona created successfully", savedPersona);
                      setAddModalOpen(false);
                      setIsSavingPersona(false);
                      navigate(`${isAuthenticated ? '/app' : '/playground'}/accounts/${accountId}/personas/${savedPersona.id}`);
                    },
                    onError: (error) => {
                      setIsSavingPersona(false);
                      setSaveError(error?.message || "Failed to save persona");
                    }
                  }
                );
              },
              onError: (error) => {
                setIsSavingPersona(false);
                setSaveError(error?.message || "Failed to generate persona");
              }
            }
          );
        }}
        title="Generate Target Persona"
        subtitle="Describe a new buyer persona to generate detailed insights."
        nameLabel="Persona Name"
        namePlaceholder="e.g., Marketing Director, Sales Manager..."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel={<><Wand2 className="w-4 h-4 mr-2" />Generate Persona</>}
        cancelLabel="Cancel"
        isLoading={isSavingPersona || createPersonaMutation.isPending}
        accounts={accounts?.map(a => ({ id: a.id, name: a.name }))}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountLabel="Target Account"
        accountPlaceholder="None"
      />
    </div>
  );
} 