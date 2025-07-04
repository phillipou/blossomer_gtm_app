import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Plus, Edit3, Trash2 } from "lucide-react";
import OverviewCard from "../components/cards/OverviewCard";
import { getAllPersonas, deletePersonaFromTargetAccount, updatePersonaForTargetAccount, addPersonaToTargetAccount, generateTargetPersona, getStoredTargetAccounts } from "../lib/accountService";
import { useCompanyOverview } from "../lib/useCompanyOverview";

import SummaryCard from "../components/cards/SummaryCard";
import type { TargetPersonaResponse } from "../types/api";
import PageHeader from "../components/navigation/PageHeader";
import AddCard from "../components/ui/AddCard";
import InputModal from "../components/modals/InputModal";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Filter } from "lucide-react";

export default function TargetPersonas() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Array<{ persona: TargetPersonaResponse; accountId: string; accountName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<{ persona: TargetPersonaResponse; accountId: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addPersonaLoading, setAddPersonaLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [targetAccounts, setTargetAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Use the analyzed company website from the overview hook
  const overview = useCompanyOverview();

  useEffect(() => {
    try {
      const allPersonas = getAllPersonas();
      setPersonas(allPersonas);
              // Fetch all target accounts for the dropdown
      const accounts = getStoredTargetAccounts();
      setTargetAccounts(accounts.map(p => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error("Error loading personas:", err);
      setError("Failed to load personas");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePersonaClick = (customerId: string, personaId: string) => {
    console.log('Navigating to persona:', personaId, 'for account:', customerId);
    navigate(`/target-accounts/${customerId}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: TargetPersonaResponse, accountId: string) => {
    setEditingPersona({ persona, accountId });
    setEditModalOpen(true);
  };

  const handleSavePersona = async ({ name, description }: { name: string; description: string }) => {
    if (!editingPersona) return;
    
    setIsSaving(true);
    try {
      const updatedPersona: TargetPersonaResponse = {
        ...editingPersona.persona,
        name: name.trim(),
        description: description.trim(),
      };
      updatePersonaForTargetAccount(editingPersona.accountId, updatedPersona);
      // Refresh the list
      setPersonas(getAllPersonas());
      setEditModalOpen(false);
      setEditingPersona(null);
    } catch (err) {
      console.error("Error updating persona:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingPersona(null);
  };

  const handleDeletePersona = (personaId: string, accountId: string) => {
    deletePersonaFromTargetAccount(accountId, personaId);
    // Refresh the list
    setPersonas(getAllPersonas());
  };

  // Filtered personas based on search and filter
  const filteredPersonas = personas.filter(({ persona }) => {
    const matchesSearch =
      persona.name.toLowerCase().includes(search.toLowerCase()) ||
      (persona.description && persona.description.toLowerCase().includes(search.toLowerCase()));
    if (filterBy === "all") return matchesSearch;
    return matchesSearch;
  });

  if (loading) {
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
            <p className="text-red-600 mb-4">{error}</p>
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
          onClick: () => navigate('/target-accounts')
        }}
      />

      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Company Overview */}
        <OverviewCard
          title={overview?.company_name || "Your Company"}
          subtitle={overview?.company_url || ""}
          bodyTitle="Company Overview"
          bodyText={overview?.company_overview || overview?.product_description}
          showButton={true}
          buttonTitle="View Details"
        />
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
        )}

        {/* Personas Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Personas</h2>
              <p className="text-sm text-gray-500">{personas.length} personas across all target accounts</p>
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
          
          {filteredPersonas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPersonas.map(({ persona, accountId, accountName }) => (
                <SummaryCard
                  key={`${accountId}-${persona.id}`}
                  title={persona.name}
                  description={persona.description}
                  parents={[
                    { name: accountName, color: "bg-red-400", label: "Account" },
                    { name: overview?.company_name || "Company", color: "bg-green-400", label: "Company" },
                  ]}
                  onClick={() => handlePersonaClick(accountId, persona.id)}
                >
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={e => { 
                      e.stopPropagation(); 
                      handleEditPersona(persona, accountId); 
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
                      handleDeletePersona(persona.id, accountId); 
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
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <p className="text-lg font-medium mb-2">No personas created yet</p>
                <p className="text-sm">Create personas for your target accounts to get started</p>
              </div>
              <Button onClick={() => navigate('/target-accounts')}>
                <Plus className="w-4 h-4 mr-2" />
                Go to Target Accounts
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Persona Modal */}
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
        defaultName={editingPersona?.persona?.name || ""}
        defaultDescription={editingPersona?.persona?.description || ""}
        isLoading={isSaving}
      />

      {/* Add Persona Modal */}
      <InputModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setSelectedAccountId(""); }}
        onSubmit={async ({ name, description, accountId }) => {
          if (!accountId) return; // Require account selection
          if (!overview?.company_url || !overview.company_url.trim()) {
            setError("Company website URL is missing from overview. Cannot generate persona.");
            return;
          }
          setAddPersonaLoading(true);
          try {
            const account = getStoredTargetAccounts().find(acc => acc.id === accountId);
            if (!account) throw new Error("Selected account not found");
            const accountIdFinal = account.id;
            const accountName = account.name;
            // Build user_inputted_context as an object
            const user_inputted_context = {
              target_persona_name: name,
              target_persona_description: description,
            };
            // Build company_context as an object
            const company_context = {
              company_name: overview.company_name || '',
              company_url: overview.company_url || '',
              ...(overview.company_overview ? { company_overview: overview.company_overview } : {}),
              ...(overview.product_description ? { product_description: overview.product_description } : {}),
              ...(overview.capabilities && overview.capabilities.length ? { capabilities: overview.capabilities } : {}),
              ...(overview.business_model && overview.business_model.length ? { business_model: overview.business_model } : {}),
              ...(overview.differentiated_value && overview.differentiated_value.length ? { differentiated_value: overview.differentiated_value } : {}),
              ...(overview.customer_benefits && overview.customer_benefits.length ? { customer_benefits: overview.customer_benefits } : {}),
            };
            // Pass the full target account as target_account_context
            const target_account_context = account;
            const response = await generateTargetPersona(
              overview.company_url.trim(),
              user_inputted_context,
              company_context,
              target_account_context
            );
            const newPersona: TargetPersonaResponse = {
              id: String(Date.now()),
              name: response.target_persona_name || name,
              description: response.target_persona_description || description,
              createdAt: new Date().toLocaleDateString(),
              overview: response.overview || "",
              painPoints: response.pain_points || [],
              profile: response.profile || [],
              likelyJobTitles: response.likely_job_titles || [],
              primaryResponsibilities: response.primary_responsibilities || [],
              statusQuo: response.status_quo || [],
              useCases: response.use_cases || [],
              desiredOutcomes: response.desired_outcomes || [],
              keyConcerns: response.key_concerns || [],
              whyWeMatter: response.why_we_matter || [],
              buyingSignals: response.buying_signals || [],
            };
            addPersonaToTargetAccount(accountIdFinal, newPersona);
            setPersonas(getAllPersonas());
            setAddModalOpen(false);
            setSelectedAccountId("");
          } catch (err: any) {
            console.error("Error generating persona:", err);
            setError(err?.body?.error || err.message || "Failed to generate persona.");
          } finally {
            setAddPersonaLoading(false);
          }
        }}
        title="Generate Target Persona"
        subtitle="Describe a new buyer persona to generate detailed insights."
        nameLabel="Persona Name"
        namePlaceholder="e.g., Marketing Director, Sales Manager..."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
        submitLabel={addPersonaLoading ? "Generating..." : "Generate"}
        cancelLabel="Cancel"
        isLoading={addPersonaLoading}
        accounts={targetAccounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountLabel="Target Account"
        accountPlaceholder="None"
      />
    </div>
  );
} 