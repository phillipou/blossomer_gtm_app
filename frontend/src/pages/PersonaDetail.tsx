import { useParams } from "react-router-dom";
import SubNav from "../components/navigation/SubNav";
import React from "react";
import OverviewCard from "../components/cards/OverviewCard";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import EditCriteriaModal from "../components/modals/EditCriteriaModal";
import ListInfoCard from "../components/cards/ListInfoCard";
import { CriteriaTable } from "../components/tables/CriteriaTable";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { useGetPersona, useUpdatePersona } from "../lib/hooks/usePersonas";
import type { Persona, BuyingSignal, Demographics, UseCase } from "../types/api";
import UseCasesCard from "../components/cards/UseCasesCard";
import { useAuthState } from "../lib/auth";

export default function PersonaDetail() {
  const { id: accountId, personaId } = useParams<{ accountId: string; personaId: string }>();
  const { token } = useAuthState();

  const { data: persona, isLoading, error, refetch } = useGetPersona(personaId!, token);
  const { mutate: updatePersona } = useUpdatePersona(accountId!, personaId!, token);

  const [accountName, setAccountName] = React.useState<string>("");

  // Buying signals modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalEditingSignal, setModalEditingSignal] = React.useState<BuyingSignal | null>(null);
  const [buyingSignals, setBuyingSignals] = React.useState<BuyingSignal[]>([]);
  
  // Demographics edit modal state
  const [demographicsModalOpen, setDemographicsModalOpen] = React.useState(false);

  const personaCardConfigs = [
    { key: "targetPersonaRationale", title: "Target Persona Rationale", editModalSubtitle: "Why this persona is ideal for your solution." },
    { key: "objections", title: "Likely Objections", editModalSubtitle: "Common concerns about adopting this solution." },
    { key: "goals", title: "Persona Goals", editModalSubtitle: "Objectives this product can help this persona achieve." },
    { key: "purchaseJourney", title: "Purchase Journey", editModalSubtitle: "Path from awareness to purchase." },
    { key: "buyingSignalsRationale", title: "Buying Signals Rationale", editModalSubtitle: "Logic behind buying signal choices." },
  ];

  const transformDemographicsToCriteria = (demographics: Demographics | undefined) => {
    if (!demographics) return [];
    const criteria = [];
    if (demographics.jobTitles?.length) criteria.push({ label: "Job Titles", values: demographics.jobTitles.map(title => ({ text: title, color: "blue" })) });
    if (demographics.departments?.length) criteria.push({ label: "Departments", values: demographics.departments.map(dept => ({ text: dept, color: "green" })) });
    if (demographics.seniority?.length) criteria.push({ label: "Seniority", values: demographics.seniority.map(level => ({ text: level, color: "purple" })) });
    if (demographics.buyingRoles?.length) criteria.push({ label: "Buying Roles", values: demographics.buyingRoles.map(role => ({ text: role, color: "indigo" })) });
    if (demographics.jobDescriptionKeywords?.length) criteria.push({ label: "Keywords", values: demographics.jobDescriptionKeywords.map(keyword => ({ text: keyword, color: "yellow" })) });
    return criteria.map((item, index) => ({ ...item, id: String(index) }));
  };

  React.useEffect(() => {
    if (persona?.buyingSignals) {
      const transformedSignals = persona.buyingSignals.map((signal, idx) => ({
        id: String(idx),
        label: signal.title,
        description: signal.description,
        enabled: true,
        priority: signal.priority,
        detectionMethod: signal.detection_method,
        type: signal.type
      }));
      setBuyingSignals(transformedSignals);
    } else {
      setBuyingSignals([]);
    }
  }, [persona]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  if (!persona) return <div className="p-8 text-center text-gray-500">Persona not found.</div>;

  const handleListEdit = (field: keyof Persona) => (newItems: string[]) => {
    updatePersona({ [field]: newItems });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Company", href: "/company" },
          { label: "Target Accounts", href: "/accounts" },
          { label: accountName, href: `/accounts/${accountId}` },
          { label: persona.targetPersonaName },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="persona"
      />
      <div className="flex-1 p-8 space-y-8">
        <OverviewCard
          title={persona.targetPersonaName}
          subtitle={"Account: " + accountName}
          bodyTitle="Persona Overview"
          bodyText={persona.targetPersonaDescription}
          showButton={false}
          onEdit={({ name, description }) => {
            updatePersona({ targetPersonaName: name, targetPersonaDescription: description });
          }}
        >
        </OverviewCard>
        <Card>
          <CardHeader>
            <CardTitle>Targeting Criteria</CardTitle>
            <div className="text-sm text-gray-500">Searchable attributes for prospecting tools and databases</div>
          </CardHeader>
          <CardContent>
            {persona.demographics ? (
              <CriteriaTable 
                data={transformDemographicsToCriteria(persona.demographics)}
                editable={true}
                onEdit={() => setDemographicsModalOpen(true)}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">No demographics data available</div>
            )}
          </CardContent>
        </Card>

        <ListInfoCard
          title="Target Persona Rationale"
          items={Array.isArray(persona.targetPersonaRationale) ? persona.targetPersonaRationale : []}
          onEdit={handleListEdit("targetPersonaRationale")}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Why this persona is ideal for your solution."
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div>
                <CardTitle className="mb-1">Buying Signals</CardTitle>
                <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setModalEditingSignal(null); setModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {buyingSignals.length > 0 ? (
              <BuyingSignalsCard
                signals={buyingSignals}
                onEdit={(signal) => { setModalEditingSignal(signal); setModalOpen(true); }}
                onDelete={(id) => setBuyingSignals(signals => signals.filter(s => s.id !== id))}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">No buying signals identified</div>
            )}
          </CardContent>
        </Card>

        <ListInfoCard
          title="Buying Signals Rationale"
          items={Array.isArray(persona.buyingSignalsRationale) ? persona.buyingSignalsRationale : []}
          onEdit={handleListEdit("buyingSignalsRationale")}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Logic behind buying signal choices."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ListInfoCard
            title="Persona Goals"
            items={Array.isArray(persona.goals) ? persona.goals : []}
            onEdit={handleListEdit("goals")}
            renderItem={(item: string, idx: number) => (
              <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
            )}
            editModalSubtitle="Objectives this product can help this persona achieve."
          />
          <ListInfoCard
            title="Purchase Journey"
            items={Array.isArray(persona.purchaseJourney) ? persona.purchaseJourney : []}
            onEdit={handleListEdit("purchaseJourney")}
            renderItem={(item: string, idx: number) => (
              <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
            )}
            editModalSubtitle="Path from awareness to purchase."
          />
        </div>

        <ListInfoCard
          title="Likely Objections"
          items={Array.isArray(persona.objections) ? persona.objections : []}
          onEdit={handleListEdit("objections")}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Common concerns about adopting this solution."
        />

        <UseCasesCard
          useCases={persona.useCases || []}
          onAdd={(newUseCase: UseCase) => {
            const updatedUseCases = persona.useCases ? [...persona.useCases, newUseCase] : [newUseCase];
            updatePersona({ useCases: updatedUseCases });
          }}
          onEdit={(idx: number, updatedUseCase: UseCase) => {
            const updatedUseCases = persona.useCases ? persona.useCases.map((uc, i) => i === idx ? updatedUseCase : uc) : [];
            updatePersona({ useCases: updatedUseCases });
          }}
          onDelete={(idx: number) => {
            const updatedUseCases = persona.useCases ? persona.useCases.filter((_, i) => i !== idx) : [];
            updatePersona({ useCases: updatedUseCases });
          }}
        />
        
        <EditCriteriaModal
          isOpen={demographicsModalOpen}
          onClose={() => setDemographicsModalOpen(false)}
          initialRows={transformDemographicsToCriteria(persona?.demographics)}
          onSave={(rows: any[]) => {
            const newDemographics: Demographics = {};
            rows.forEach((row: any) => {
              const values = row.values.map((v: any) => v.text);
              switch (row.label.toLowerCase()) {
                case 'job titles': newDemographics.jobTitles = values; break;
                case 'departments': newDemographics.departments = values; break;
                case 'seniority': newDemographics.seniority = values; break;
                case 'buying roles': newDemographics.buyingRoles = values; break;
                case 'keywords': newDemographics.jobDescriptionKeywords = values; break;
              }
            });
            updatePersona({ demographics: newDemographics });
          }}
          title="Edit Demographics"
        />
      </div>
      <EditBuyingSignalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingSignal={modalEditingSignal || undefined}
        onSave={(values: Record<string, string | boolean>) => {
          const label = String(values.label || '').trim();
          const description = String(values.description || '').trim();
          if (modalEditingSignal) {
            setBuyingSignals(signals => signals.map(s => s.id === modalEditingSignal.id ? { ...s, label, description } : s));
          } else {
            setBuyingSignals(signals => [
              ...signals,
              { id: String(Date.now()), label, description, enabled: true },
            ]);
          }
        }}
      />
    </div>
  );
} 