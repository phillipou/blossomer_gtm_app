// Force Tailwind to include entity colors: bg-green-400 bg-red-400 bg-blue-400 bg-purple-400 border-green-400 border-red-400 border-blue-400 border-purple-400
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Edit3, Trash2, Wand2 } from "lucide-react";
import OverviewCard from "../components/cards/OverviewCard";
import { getAllPersonas, deletePersonaFromTargetAccount, updatePersonaForTargetAccount, addPersonaToTargetAccount, generateTargetPersona, getStoredTargetAccounts } from "../lib/accountService";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import { transformKeysToCamelCase } from "../lib/utils";

import SummaryCard from "../components/cards/SummaryCard";
import type { TargetPersonaResponse, ApiError } from "../types/api";
import { getEntityColorForParent } from "../lib/entityColors";
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
      setTargetAccounts(accounts.map(p => ({ id: p.id, name: p.targetAccountName })));
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
        targetPersonaName: name.trim(),
        targetPersonaDescription: description.trim(),
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
      persona.targetPersonaName?.toLowerCase().includes(search.toLowerCase()) ||
      (persona.targetPersonaDescription && persona.targetPersonaDescription.toLowerCase().includes(search.toLowerCase()));
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
          onClick: () => setAddModalOpen(true)
        }}
      />

      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Company Overview */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
        )}

        {/* Personas Section */}
        <div className="flex flex-1 gap-8 overflow-auto">
          <div className="flex flex-col w-full">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
                {filteredPersonas.map(({ persona, accountId, accountName }) => (
                  <SummaryCard
                    key={`${accountId}-${persona.id}`}
                    title={persona.targetPersonaName}
                    description={persona.targetPersonaDescription}
                    parents={[
                      { name: accountName, color: getEntityColorForParent('account'), label: "Account" },
                      { name: overview?.companyName || "Company", color: getEntityColorForParent('company'), label: "Company" },
                    ]}
                    onClick={() => handlePersonaClick(accountId, persona.id)}
                    entityType="persona"
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
        defaultName={editingPersona?.persona?.targetPersonaName || ""}
        defaultDescription={editingPersona?.persona?.targetPersonaDescription || ""}
        isLoading={isSaving}
      />

      {/* Add Persona Modal */}
      <InputModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setSelectedAccountId(""); }}
        onSubmit={async ({ name, description, accountId }) => {
          if (!accountId) return; // Require account selection
          if (!overview?.companyUrl || !overview.companyUrl.trim()) {
            setError("Company website URL is missing from overview. Cannot generate persona.");
            return;
          }
          if (!overview?.companyName) {
            setError("Company name is missing from overview. Cannot generate persona.");
            return;
          }
          setAddPersonaLoading(true);
          try {
            const account = getStoredTargetAccounts().find(acc => acc.id === accountId);
            if (!account) throw new Error("Selected account not found");
            const accountIdFinal = account.id;
            // Build userInputtedContext as an object
            const userInputtedContext: Record<string, string> = {
              personaName: name,
              personaDescription: description,
            };
            // Build companyContext as an object
            const companyContext: Record<string, string | string[]> = {
              companyName: overview.companyName || '',
              companyUrl: overview.companyUrl || '',
              ...(overview.companyOverview ? { companyOverview: overview.companyOverview } : {}),
              ...(overview.productDescription ? { productDescription: overview.productDescription } : {}),
              ...(overview.capabilities && overview.capabilities.length ? { capabilities: overview.capabilities } : {}),
              ...(overview.businessModel && overview.businessModel.length ? { businessModel: overview.businessModel } : {}),
              ...(overview.differentiatedValue && overview.differentiatedValue.length ? { differentiatedValue: overview.differentiatedValue } : {}),
              ...(overview.customerBenefits && overview.customerBenefits.length ? { customerBenefits: overview.customerBenefits } : {}),
            };
            // Pass the full target account as targetAccountContext
            const targetAccountContext = account;
            // Debug: log all context objects before API call
            console.log('[Persona Generation] websiteUrl:', overview.companyUrl.trim());
            console.log('[Persona Generation] userInputtedContext:', userInputtedContext);
            console.log('[Persona Generation] companyContext:', companyContext);
            console.log('[Persona Generation] targetAccountContext:', targetAccountContext);
            const response = await generateTargetPersona(
              overview.companyUrl.trim(),
              userInputtedContext.personaName,
              userInputtedContext.personaDescription,
              undefined, // additionalContext
              companyContext,
              targetAccountContext // targetAccountContext as TargetAccountResponse
            );
            console.log('[Persona Generation RESPONSE] response:', response);

            // Transform the API response from snake_case to camelCase
            const transformedResponse = transformKeysToCamelCase<TargetPersonaResponse>(response);
            const newPersona: TargetPersonaResponse = {
              ...transformedResponse,
              id: String(Date.now()),
              createdAt: new Date().toLocaleDateString(),
              targetPersonaName: transformedResponse.targetPersonaName || name,
              targetPersonaDescription: transformedResponse.targetPersonaDescription || description,
            };
            addPersonaToTargetAccount(accountIdFinal, newPersona);
            setPersonas(getAllPersonas());
            setAddModalOpen(false);
            setSelectedAccountId("");
          } catch (err: unknown) {
            console.error("Error generating persona:", err);
            setError((err as ApiError)?.message || (err as Error).message || "Failed to generate persona.");
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