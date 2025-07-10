import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, ArrowLeft, Plus, Edit3, Trash2 } from "lucide-react";
import { CriteriaTable } from "../components/tables/CriteriaTable";
import SubNav from "../components/navigation/SubNav";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import OverviewCard from "../components/cards/OverviewCard";
import { useGetAccount, useUpdateAccount } from "../lib/hooks/useAccounts";
import { useGetPersonas, useCreatePersona, useDeletePersona } from "../lib/hooks/usePersonas";
import useAutoSave from "../lib/hooks/useAutoSave";
import { transformFirmographicsToTable, transformBuyingSignalsToCards } from "../utils/targetAccountTransforms";
import type { Persona, FirmographicRow, BuyingSignal, ApiError, Account } from "../types/api";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import EditCriteriaModal from "../components/modals/EditCriteriaModal";
import InputModal from "../components/modals/InputModal";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";
import ListInfoCard from "../components/cards/ListInfoCard";
import { useAuthState } from '../lib/auth';

export default function AccountDetail() {
  console.log("AccountDetail: Rendering");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthState();
  const overview = useCompanyOverview();

  const { data: account, isLoading, error } = useGetAccount(id!, token);
  const { mutate: updateAccount } = useUpdateAccount(id!, token);
  const { data: personas, isLoading: personasLoading, error: personasError } = useGetPersonas(id!, token);
  const { mutate: createPersona } = useCreatePersona(id!, token);
  const { mutate: deletePersona } = useDeletePersona(id!, "", token);

  const [localAccount, setLocalAccount] = useState<Account | null>(null);

  useEffect(() => {
    console.log("AccountDetail: account data from hook changed", account);
    if (account) {
      setLocalAccount(account);
    }
  }, [account]);

  useEffect(() => {
    console.log("AccountDetail: localAccount state changed", localAccount);
  }, [localAccount]);

  useAutoSave(updateAccount, localAccount, 1000);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<BuyingSignal | null>(null);
  const [buyingSignals, setBuyingSignals] = useState<BuyingSignal[]>([]);

  const [firmographics, setFirmographics] = useState<FirmographicRow[]>([]);
  const [firmoModalOpen, setFirmoModalOpen] = useState(false);
  const [rationale, setRationale] = useState<string[]>([]);

  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);

  const handlePersonaClick = (personaId: string) => {
    console.log("AccountDetail: handlePersonaClick called with personaId", personaId);
    const prefix = token ? '/app' : '/playground';
    navigate(`${prefix}/personas/${id}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: Persona) => {
    console.log("AccountDetail: handleEditPersona called with persona", persona);
    setEditingPersona(persona);
    setPersonaModalOpen(true);
  };
  const handleDeletePersona = (id: string) => {
    console.log("AccountDetail: handleDeletePersona called with id", id);
    deletePersona(id);
  };

  const handleEditRationale = (newItems: string[]) => {
    setLocalAccount(prev => prev ? { ...prev, data: { ...prev.data, rationale: newItems } } : prev);
  };

  const handleEditBuyingSignalsRationale = (newItems: string[]) => {
    setLocalAccount(prev => prev ? { ...prev, data: { ...prev.data, buyingSignalsRationale: newItems } } : prev);
  };

  useEffect(() => {
    if (localAccount) {
      const firmographicsData = localAccount.data && localAccount.data.firmographics
        ? transformFirmographicsToTable(localAccount.data.firmographics)
        : [];
      setFirmographics(firmographicsData);
      setBuyingSignals(transformBuyingSignalsToCards(localAccount.data?.buyingSignals || []));
      setRationale(localAccount.data?.rationale || []);
    }
  }, [localAccount]);

  if (isLoading || personasLoading) {
    console.log("AccountDetail: Loading account or personas...");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const combinedError = error || personasError;
  if (combinedError || !localAccount) {
    console.error("AccountDetail: Error loading data or account not found", combinedError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{combinedError?.message || "Account not found"}</p>
            <Button onClick={() => navigate('/target-accounts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Target Accounts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Company", href: "/company" },
          { label: "Target Accounts", href: "/target-accounts" },
          { label: localAccount?.name || "Target Account" },
        ]}
        activeSubTab={""}
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="account"
      />
      <div className="flex-1 p-8 space-y-8">
        <OverviewCard
          title={localAccount?.name}
          bodyText={localAccount?.data?.description}
          showButton={false}
          onEdit={({ name, description }) => {
            setLocalAccount((prev) => {
              if (!prev) return null;
              return { ...prev, name, data: { ...prev.data, description } };
            });
          }}
        />
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Firmographics</CardTitle>
              <div className="text-sm text-gray-500">Targeting criteria for prospecting tools</div>
            </CardHeader>
            <CardContent>
              <CriteriaTable 
                data={firmographics} 
                editable={true}
                onEdit={() => {
                  console.log("AccountDetail: Firmographics onEdit called");
                  setFirmoModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
          <div className="flex-1">
            <ListInfoCard
              title={"Why they're a good fit"}
              items={localAccount?.data?.rationale || []}
              onEdit={handleEditRationale}
              renderItem={(item: string, idx: number) => (
                <span key={idx} className="text-sm text-gray-700">{item}</span>
              )}
              editModalSubtitle={"Why this account is a good fit for your solution."}
            />
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Buying Signals</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => { 
                console.log("AccountDetail: Add Buying Signal button clicked");
                setModalEditingSignal(null); 
                setModalOpen(true); 
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
            <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
          </CardHeader>
          <CardContent>
            {buyingSignals.length > 0 ? (
              <BuyingSignalsCard
                signals={buyingSignals}
                onEdit={(signal) => { 
                  console.log("AccountDetail: BuyingSignalsCard onEdit called with signal", signal);
                  setModalEditingSignal(signal); 
                  setModalOpen(true); 
                }}
                onDelete={(id) => {
                  console.log("AccountDetail: BuyingSignalsCard onDelete called with id", id);
                  setBuyingSignals(signals => signals.filter(s => s.id !== id));
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">No buying signals identified</div>
            )}
          </CardContent>
        </Card>
        <ListInfoCard
          title={"Buying Signals Rationale"}
          items={localAccount?.data?.buyingSignalsRationale || []}
          onEdit={handleEditBuyingSignalsRationale}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700">{item}</span>
          )}
          editModalSubtitle={"Logic behind buying signal choices."}
        />
        <div>
          <h2 className="text-lg font-semibold mb-4">Personas for this Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas?.map((persona) => (
              <SummaryCard
                key={persona.id}
                title={persona.name}
                description={persona.data?.targetPersonaDescription}
                parents={[
                  { name: overview?.companyName || "", color: "bg-green-400", label: "Company" },
                  { name: localAccount?.name || "Account", color: "bg-red-400", label: "Account" },
                ]}
                onClick={() => handlePersonaClick(persona.id)}
              >
                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditPersona(persona); }} className="text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeletePersona(persona.id); }} className="text-red-500">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </SummaryCard>
            ))}
            <AddCard onClick={() => { 
              console.log("AccountDetail: Add New Persona card clicked");
              setEditingPersona(null); 
              setPersonaModalOpen(true); 
            }} label="Add New" />
          </div>
        </div>
      </div>
      <EditBuyingSignalModal
        isOpen={modalOpen}
        onClose={() => {
          console.log("AccountDetail: EditBuyingSignalModal closed");
          setModalOpen(false);
        }}
        editingSignal={modalEditingSignal || undefined}
        onSave={(values: Record<string, string | boolean>) => {
          console.log("AccountDetail: EditBuyingSignalModal onSave called with values", values);
          const label = String(values.label || '').trim();
          const description = String(values.description || '').trim();
          const priority = String(values.priority || '').trim();
          setBuyingSignals(prevSignals => {
            let updatedSignals;
            if (modalEditingSignal) {
              updatedSignals = prevSignals.map(s =>
                s.id === modalEditingSignal.id ? { ...s, label, description, priority } : s
              );
            } else {
              updatedSignals = [
                ...prevSignals,
                { id: String(Date.now()), label, description, priority, enabled: true },
              ];
            }
            setLocalAccount(prev => prev ? { ...prev, data: { ...prev.data, buyingSignals: updatedSignals } } : prev);
            return updatedSignals;
          });
        }}
      />
      <EditCriteriaModal
        isOpen={firmoModalOpen}
        onClose={() => {
          console.log("AccountDetail: EditCriteriaModal closed");
          setFirmoModalOpen(false);
        }}
        initialRows={firmographics}
        onSave={(rows) => {
          console.log("AccountDetail: EditCriteriaModal onSave called with rows", rows);
          setLocalAccount(prev => prev ? { ...prev, data: { ...prev.data, firmographics: rows } } : prev);
        }}
        title="Edit Firmographics"
      />
      <InputModal
        isOpen={personaModalOpen}
        onClose={() => { 
          console.log("AccountDetail: InputModal (Persona) closed");
          setPersonaModalOpen(false); 
          setPersonaError(null); 
          setPersonaLoading(false); 
        }}
        onSubmit={async ({ name, description }) => {
          console.log("AccountDetail: InputModal (Persona) onSubmit called with", { name, description });
          createPersona({ name, data: { targetPersonaDescription: description } });
          setPersonaModalOpen(false);
        }}
        title={"Describe a Persona"}
        subtitle={"What type of person is your ideal buyer or user?"}
        nameLabel="Persona Name"
        namePlaceholder="e.g. Startup Founder, Marketing Director, etc."
        descriptionLabel="Persona Description"
        descriptionPlaceholder="Describe the role, responsibilities, and traits of this persona."
        submitLabel={personaLoading ? "Generating..." : "Generate Persona"}
        cancelLabel="Cancel"
        isLoading={personaLoading}
        defaultName={editingPersona ? editingPersona.name : ""}
        defaultDescription={editingPersona ? editingPersona.data?.targetPersonaDescription : ""}
        error={personaError || undefined}
      />
    </div>
  );
}
 