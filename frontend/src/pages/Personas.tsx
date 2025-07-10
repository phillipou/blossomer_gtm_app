import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Edit3, Trash2, Wand2 } from "lucide-react";
import { useGetPersonas, useUpdatePersona, useDeletePersona, useGeneratePersona, useCreatePersona } from "../lib/hooks/usePersonas";
import { useGetAccounts } from "../lib/hooks/useAccounts";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import SummaryCard from "../components/cards/SummaryCard";
import type { Persona, PersonaUpdate, PersonaCreate } from "../types/api";
import { getEntityColorForParent } from "../lib/entityColors";
import PageHeader from "../components/navigation/PageHeader";
import AddCard from "../components/ui/AddCard";
import InputModal from "../components/modals/InputModal";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";
import { useAuthState } from '../lib/auth';
import { useAutoSave } from "../lib/hooks/useAutoSave";
import { DraftManager } from "../lib/draftManager";

export default function TargetPersonas() {
  const navigate = useNavigate();
  const { token } = useAuthState();
  const overview = useCompanyOverview();
  const companyId = overview?.companyId || "";

  const { data: accounts } = useGetAccounts(companyId, token);
  
  // Get personas for all accounts, not just the first one
  const allPersonasData = accounts?.map(account => ({
    accountId: account.id,
    ...useGetPersonas(account.id, token)
  })) || [];
  
  const allPersonas = allPersonasData.flatMap(({ accountId, data }) => 
    (data || []).map(persona => ({ ...persona, accountId }))
  );
  
  const isLoading = allPersonasData.some(({ isLoading }) => isLoading);
  const error = allPersonasData.find(({ error }) => error)?.error;

  const updatePersonaMutation = useUpdatePersona("", token);
  const { mutate: deletePersona } = useDeletePersona("", token);
  const { mutate: generatePersona, isPending: isGenerating } = useGeneratePersona("", token);
  const createPersonaMutation = useCreatePersona("", token);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [generatedPersonaData, setGeneratedPersonaData] = useState<any>(null);

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
  const allPersonasWithDrafts = [...allPersonas, ...allDraftPersonas];

  // Auto-save hook for generated personas
  const autoSave = useAutoSave({
    entity: 'persona',
    data: generatedPersonaData,
    createMutation: createPersonaMutation,
    updateMutation: updatePersonaMutation,
    isAuthenticated: !!token,
    parentId: selectedAccountId,
    onSaveSuccess: (savedPersona) => {
      console.log("PersonasPage: Persona auto-saved successfully", savedPersona);
      setGeneratedPersonaData(null);
      navigate(`/target-accounts/${selectedAccountId}/personas/${savedPersona.id}`);
    },
    onSaveError: (error) => {
      console.error("PersonasPage: Auto-save failed", error);
    },
  });

  const handlePersonaClick = (customerId: string, personaId: string) => {
    navigate(`/target-accounts/${customerId}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setEditModalOpen(true);
  };

  const handleSavePersona = async ({ name, description }: { name: string; description: string }) => {
    if (!editingPersona) return;
    const data: PersonaUpdate = {
      name: editingPersona.name,
      data: {
        ...editingPersona.data,
        targetPersonaName: editingPersona.name,
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

  const filteredPersonas = allPersonasWithDrafts?.filter((persona) => {
    const matchesSearch =
      persona.name?.toLowerCase().includes(search.toLowerCase()) ||
      (persona.data?.targetPersonaDescription as string || "").toLowerCase().includes(search.toLowerCase());
    if (filterBy === "all") return matchesSearch;
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Personas"
        subtitle="Manage buyer personas across all target accounts"
        primaryAction={{
          label: "Add Target Persona",
          onClick: () => setAddModalOpen(true)
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
                    title={persona.name}
                    description={persona.data?.targetPersonaDescription as string || ""}
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
                <AddCard onClick={() => setAddModalOpen(true)} label="Add New" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500 max-w-md">
                  <Wand2 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your First Persona</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create your first target persona with our AI-powered wizard. Configure your target audience and let us help you generate detailed buyer insights.
                  </p>
                  <Button onClick={() => setAddModalOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
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
          const selectedAccount = accounts?.find(acc => acc.id === accountId);
          if (!selectedAccount) return;

          const companyContext = {
            companyName: overview.companyName || '',
            companyUrl: overview.companyUrl || '',
            business_profile: JSON.stringify(overview.businessProfile) || '',
            capabilities: JSON.stringify(overview.capabilities) || '',
            positioning: JSON.stringify(overview.positioning) || '',
            use_case_analysis: JSON.stringify(overview.useCaseAnalysis) || '',
            icp_hypothesis: JSON.stringify(overview.icpHypothesis) || '',
          };

          const targetAccountContext = selectedAccount.data;

          setSelectedAccountId(accountId);
          generatePersona({ 
            websiteUrl: overview.companyUrl,
            personaProfileName: name, 
            hypothesis: description,
            companyContext,
            targetAccountContext,
          }, {
            onSuccess: (generatedData) => {
              console.log("PersonasPage: Persona generated successfully", generatedData);
              // Convert to PersonaCreate format and trigger auto-save
              const personaToSave: PersonaCreate = {
                name: (generatedData.data?.targetPersonaName || name) as string,
                data: generatedData,
              };
              setGeneratedPersonaData(personaToSave);
            },
            onError: (error) => {
              console.error("PersonasPage: Persona generation failed", error);
            },
          });
          setAddModalOpen(false);
        }}
        title="Generate Target Persona"
        subtitle="Describe a new buyer persona to generate detailed insights."
        nameLabel="Persona Name"
        namePlaceholder="e.g., Marketing Director, Sales Manager..."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel={<><Wand2 className="w-4 h-4 mr-2" />Generate Persona</>}
        cancelLabel="Cancel"
        isLoading={isGenerating || createPersonaMutation.isPending || autoSave.isSaving}
        accounts={accounts?.map(a => ({ id: a.id, name: a.name }))}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountLabel="Target Account"
        accountPlaceholder="None"
      />
    </div>
  );
} 