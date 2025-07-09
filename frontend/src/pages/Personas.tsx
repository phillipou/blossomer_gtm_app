import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Edit3, Trash2, Wand2 } from "lucide-react";
import { useGetPersonas, useUpdatePersona, useDeletePersona, useGeneratePersona } from "../lib/hooks/usePersonas";
import { useGetAccounts } from "../lib/hooks/useAccounts";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import SummaryCard from "../components/cards/SummaryCard";
import type { Persona, ApiError } from "../types/api";
import { getEntityColorForParent } from "../lib/entityColors";
import PageHeader from "../components/navigation/PageHeader";
import AddCard from "../components/ui/AddCard";
import InputModal from "../components/modals/InputModal";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";
import { useAuthState } from '../lib/auth';

export default function TargetPersonas() {
  const navigate = useNavigate();
  const { token } = useAuthState();
  const overview = useCompanyOverview();

  // TODO: This needs to get all accounts for the company, not just one.
  // For now, we'll just fetch for the first account.
  const { data: accounts } = useGetAccounts(overview?.companyId || "");
  const { data: personas, isLoading, error } = useGetPersonas(accounts?.[0]?.id || "");

  const { mutate: updatePersona, isPending: isSaving } = useUpdatePersona(
    accounts?.[0]?.id || "",
    "", // personaId is set in handleSavePersona
    token
  );
  const { mutate: deletePersona } = useDeletePersona(
    accounts?.[0]?.id || "",
    "", // personaId is set in handleDeletePersona
    token
  );
  const { mutate: generatePersona, isPending: addPersonaLoading } = useGeneratePersona(
    accounts?.[0]?.id || "",
    token
  );

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const handlePersonaClick = (customerId: string, personaId: string) => {
    navigate(`/target-accounts/${customerId}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setEditModalOpen(true);
  };

  const handleSavePersona = async ({ name, description }: { name: string; description: string }) => {
    if (!editingPersona) return;
    updatePersona({ id: editingPersona.id, targetPersonaName: name, targetPersonaDescription: description });
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

  const filteredPersonas = personas?.filter((persona) => {
    const matchesSearch =
      persona.targetPersonaName?.toLowerCase().includes(search.toLowerCase()) ||
      (persona.targetPersonaDescription && persona.targetPersonaDescription.toLowerCase().includes(search.toLowerCase()));
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
                <p className="text-sm text-gray-500">{personas?.length} personas across all target accounts</p>
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
                    title={persona.targetPersonaName}
                    description={persona.targetPersonaDescription}
                    parents={[
                      { name: persona.accountName, color: getEntityColorForParent('account'), label: "Account" },
                      { name: overview?.companyName || "Company", color: getEntityColorForParent('company'), label: "Company" },
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
        submitLabel={isSaving ? "Saving..." : "Update"}
        cancelLabel="Cancel"
        defaultName={editingPersona?.targetPersonaName || ""}
        defaultDescription={editingPersona?.targetPersonaDescription || ""}
        isLoading={isSaving}
      />

      <InputModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setSelectedAccountId(""); }}
        onSubmit={async ({ name, description, accountId }) => {
          if (!accountId) return;
          generatePersona({ personaName: name, personaDescription: description });
          setAddModalOpen(false);
          setSelectedAccountId("");
        }}
        title="Generate Target Persona"
        subtitle="Describe a new buyer persona to generate detailed insights."
        nameLabel="Persona Name"
        namePlaceholder="e.g., Marketing Director, Sales Manager..."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel={<><Wand2 className="w-4 h-4 mr-2" />Generate Persona</>}
        cancelLabel="Cancel"
        isLoading={addPersonaLoading}
        accounts={accounts?.map(a => ({ id: a.id, name: a.name }))}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountLabel="Target Account"
        accountPlaceholder="None"
      />
    </div>
  );
} 