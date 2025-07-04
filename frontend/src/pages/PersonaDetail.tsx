import { useParams, useNavigate } from "react-router-dom";
import SubNav from "../components/navigation/SubNav";
import InfoCard from "../components/cards/InfoCard";
import React from "react";
import OverviewCard from "../components/cards/OverviewCard";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import ListInfoCard from "../components/cards/ListInfoCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { getPersonasForCustomer, transformBuyingSignals, getStoredCustomerProfiles, updatePersonaForCustomer } from "../lib/customerService";
import type { TargetPersonaResponse } from "../types/api";
import CardParentFooter from "../components/cards/CardParentFooter";

export default function PersonaDetail() {
  const { id: accountId, personaId } = useParams();
  const navigate = useNavigate();
  const [persona, setPersona] = React.useState<TargetPersonaResponse | null>(null);
  const [accountName, setAccountName] = React.useState<string>("");
  const [editingBlock, setEditingBlock] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");

  // Buying signals modal state (copied from CustomerDetail)
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalEditingSignal, setModalEditingSignal] = React.useState<any>(null);
  const [buyingSignals, setBuyingSignals] = React.useState<any[]>([]);

  const personaCardConfigs = [
    { key: "likelyJobTitles", title: "Likely Job Titles", editModalSubtitle: "Job titles this persona is likely to have." },
    { key: "primaryResponsibilities", title: "Primary Responsibilities", editModalSubtitle: "Key responsibilities typically held by this persona." },
    { key: "useCases", title: "Use Cases", editModalSubtitle: "Ways this persona would use your product or service." },
    { key: "painPoints", title: "Pain Points", editModalSubtitle: "Challenges and frustrations this persona faces." },
    { key: "desiredOutcomes", title: "Desired Outcomes", editModalSubtitle: "What this persona hopes to achieve." },
    { key: "keyConcerns", title: "Key Concerns", editModalSubtitle: "Questions or objections this persona may have." },
    { key: "whyWeMatter", title: "Why We Matter to Them", editModalSubtitle: "Reasons your solution is valuable to this persona." },
  ];

  React.useEffect(() => {
    if (accountId && personaId) {
      const personas = getPersonasForCustomer(accountId);
      const found = personas.find((p) => p.id === personaId) || null;
      setPersona(found);
      // Fetch account name from customer profile
      const profiles = getStoredCustomerProfiles();
      const profile = profiles.find((p) => p.id === accountId);
      setAccountName(profile?.name || "Account");
      console.log('Loaded persona object:', found);
    }
  }, [accountId, personaId]);

  React.useEffect(() => {
    setBuyingSignals(transformBuyingSignals(persona?.buyingSignals ?? []));
  }, [persona]);

  if (!persona) {
    return <div className="p-8 text-center text-gray-500">Persona not found.</div>;
  }

  const handleEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditContent(currentContent);
  };
  const handleSave = () => {
    if (!persona) return;
    if (editingBlock === "profile") {
      setPersona({ ...persona, profile: editContent.split("\n").map(s => s.trim()).filter(Boolean) });
    } else if (editingBlock === "painPoints") {
      setPersona({ ...persona, painPoints: editContent.split("\n").map(s => s.trim()).filter(Boolean) });
    } else if (editingBlock === "statusQuo") {
      setPersona({ ...persona, statusQuo: editContent.split("\n").map(s => s.trim()).filter(Boolean) });
    }
    setEditingBlock(null);
    setEditContent("");
  };
  const handleCancel = () => {
    setEditingBlock(null);
    setEditContent("");
  };

  const handleListEdit = (field: keyof TargetPersonaResponse) => (newItems: any[]) => {
    setPersona(persona => persona ? { ...persona, [field]: newItems } : persona);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Target Accounts", href: "/target-accounts" },
          { label: accountName, href: `/target-accounts/${accountId}` },
          { label: persona.name },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
      />
      <div className="flex-1 p-8 space-y-8">
        {/* Overview Card */}
        <OverviewCard
          title={persona.name}
          subtitle={"Account: " + accountName}
          bodyTitle="Persona Overview"
          bodyText={persona.description}
          showButton={false}
          onEdit={({ name, description }) => {
            setPersona(prev => prev ? {
              ...prev,
              name: name,
              description: description
            } : null);
            // Also update the stored persona
            if (accountId && persona) {
              const updatedPersona = { ...persona, name: name, description: description };
              // Use the helper function to update the persona in the customer profile
              updatePersonaForCustomer(accountId, updatedPersona);
            }
          }}
        >
          {/* Show parent company/account in the card footer */}
          <CardParentFooter
            parents={[
              { name: accountName, color: "bg-red-400", label: "Account" },
              { name: "Your Company", color: "bg-green-400", label: "Company" },
            ]}
          />
        </OverviewCard>
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {personaCardConfigs.map(({ key, title, editModalSubtitle }) => (
            <ListInfoCard
              key={key}
              title={title}
              items={Array.isArray(persona[key as keyof typeof persona]) ? persona[key as keyof typeof persona] as string[] : []}
              onEdit={handleListEdit(key as keyof TargetPersonaResponse)}
              renderItem={(item: string, idx: number) => (
                <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
              )}
              editModalSubtitle={editModalSubtitle}
            />
          ))}
          {/* Status Quo InfoCard with edit */}
          <InfoCard
            title="Status Quo"
            items={
              Array.isArray(persona.statusQuo)
                ? persona.statusQuo
                : persona.statusQuo
                  ? [persona.statusQuo]
                  : []
            }
            onEdit={() => handleEdit(
              "statusQuo",
              Array.isArray(persona.statusQuo)
                ? persona.statusQuo.join("\n")
                : persona.statusQuo || ""
            )}
          />
        </div>
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Buying Signals</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => { setModalEditingSignal(null); setModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
            </CardHeader>
            <CardContent>
              {buyingSignals.length > 0 ? (
                <BuyingSignalsCard
                  signals={buyingSignals}
                  onEdit={(signal) => { setModalEditingSignal(signal); setModalOpen(true); }}
                  onDelete={(id) => setBuyingSignals(signals => signals.filter(s => s.id !== id))}
                  onAdd={() => { setModalEditingSignal(null); setModalOpen(true); }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No buying signals identified
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <EditBuyingSignalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          editingSignal={modalEditingSignal}
          onSave={(values: Record<string, any>) => {
            const { label, description } = values;
            if (modalEditingSignal) {
              // Edit
              setBuyingSignals(signals => signals.map(s => s.id === modalEditingSignal.id ? { ...s, label, description } : s));
            } else {
              // Add
              setBuyingSignals(signals => [
                ...signals,
                { id: String(Date.now()), label, description, enabled: true },
              ]);
            }
          }}
        />
        {/* Edit modal for InfoCard fields */}
        {editingBlock === "statusQuo" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Status Quo</h2>
              <textarea
                className="w-full border rounded p-2 mb-4 min-h-[120px]"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Enter each status quo item on a new line"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 