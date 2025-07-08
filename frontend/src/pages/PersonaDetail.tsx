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
import { getPersonasForTargetAccount, getStoredTargetAccounts, updatePersonaForTargetAccount } from "../lib/accountService";
import type { TargetPersonaResponse, BuyingSignal, Demographics, UseCase } from "../types/api";
import UseCasesCard from "../components/cards/UseCasesCard";

export default function PersonaDetail() {
  const { id: accountId, personaId } = useParams();

  const [persona, setPersona] = React.useState<TargetPersonaResponse | null>(null);
  const [accountName, setAccountName] = React.useState<string>("");

  // Buying signals modal state (copied from CustomerDetail)
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

  // Helper function to transform demographics to criteria table format
  const transformDemographicsToCriteria = (demographics: Demographics | undefined) => {
    if (!demographics) return [];
    
    const criteria = [];
    
    if (demographics.jobTitles?.length) {
      criteria.push({
        label: "Job Titles",
        values: demographics.jobTitles.map(title => ({ text: title, color: "blue" }))
      });
    }
    
    if (demographics.departments?.length) {
      criteria.push({
        label: "Departments", 
        values: demographics.departments.map(dept => ({ text: dept, color: "green" }))
      });
    }
    
    if (demographics.seniority?.length) {
      criteria.push({
        label: "Seniority",
        values: demographics.seniority.map(level => ({ text: level, color: "purple" }))
      });
    }
    
    if (demographics.buyingRoles?.length) {
      criteria.push({
        label: "Buying Roles",
        values: demographics.buyingRoles.map(role => ({ text: role, color: "indigo" }))
      });
    }
    
    if (demographics.jobDescriptionKeywords?.length) {
      criteria.push({
        label: "Keywords",
        values: demographics.jobDescriptionKeywords.map(keyword => ({ text: keyword, color: "yellow" }))
      });
    }
    
    return criteria.map((item, index) => ({ ...item, id: String(index) }));
  };

  React.useEffect(() => {
    if (accountId && personaId) {
      const personas = getPersonasForTargetAccount(accountId);
      const found = personas.find((p) => p.id === personaId) || null;
      setPersona(found);
              // Fetch account name from target account
      const profiles = getStoredTargetAccounts();
      const profile = profiles.find((p) => p.id === accountId);
      setAccountName(profile?.targetAccountName || "Account");
      console.log('Loaded persona object:', found);
    }
  }, [accountId, personaId]);

  React.useEffect(() => {
    // Handle buying signals structure
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

  if (!persona) {
    return <div className="p-8 text-center text-gray-500">Persona not found.</div>;
  }


  const handleListEdit = (field: keyof TargetPersonaResponse) => (newItems: string[]) => {
    setPersona(persona => persona ? { ...persona, [field]: newItems } : persona);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Company", href: "/company" },
          { label: "Target Accounts", href: "/target-accounts" },
          { label: accountName, href: `/target-accounts/${accountId}` },
          { label: persona.targetPersonaName },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
      />
      <div className="flex-1 p-8 space-y-8">
        {/* Overview Card */}
        <OverviewCard
          title={persona.targetPersonaName}
          subtitle={"Account: " + accountName}
          bodyTitle="Persona Overview"
          bodyText={persona.targetPersonaDescription}
          showButton={false}
          onEdit={({ name, description }) => {
            setPersona(prev => prev ? {
              ...prev,
              targetPersonaName: name,
              targetPersonaDescription: description
            } : null);
            // Also update the stored persona
            if (accountId && persona) {
              const updatedPersona = { ...persona, targetPersonaName: name, targetPersonaDescription: description };
              updatePersonaForTargetAccount(accountId, updatedPersona);
            }
          }}
        >
        </OverviewCard>
        {/* Targeting Criteria Section */}
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
              <div className="text-center py-8 text-gray-500">
                No demographics data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Persona Rationale Section */}
        <ListInfoCard
          title="Target Persona Rationale"
          items={Array.isArray(persona.targetPersonaRationale) ? persona.targetPersonaRationale : []}
          onEdit={handleListEdit("targetPersonaRationale")}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Why this persona is ideal for your solution."
        />

        {/* Buying Signals Section */}
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
              <div className="text-center py-8 text-gray-500">
                No buying signals identified
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buying Signals Rationale Section */}
        <ListInfoCard
          title="Buying Signals Rationale"
          items={Array.isArray(persona.buyingSignalsRationale) ? persona.buyingSignalsRationale : []}
          onEdit={handleListEdit("buyingSignalsRationale")}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Logic behind buying signal choices."
        />

        {/* Persona Goals & Purchase Journey - Two Column Split */}
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

        {/* Likely Objections Section */}
        <ListInfoCard
          title="Likely Objections"
          items={Array.isArray(persona.objections) ? persona.objections : []}
          onEdit={handleListEdit("objections")}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Common concerns about adopting this solution."
        />

        {/* Use Cases Section */}
        <UseCasesCard
          useCases={persona.useCases || []}
          onAdd={(newUseCase: UseCase) => {
            setPersona(prev => prev ? {
              ...prev,
              useCases: prev.useCases ? [...prev.useCases, newUseCase] : [newUseCase]
            } : prev);
            if (accountId && persona) {
              const updatedPersona = {
                ...persona,
                useCases: persona.useCases ? [...persona.useCases, newUseCase] : [newUseCase]
              };
              updatePersonaForTargetAccount(accountId, updatedPersona);
            }
          }}
          onEdit={(idx: number, updatedUseCase: UseCase) => {
            setPersona(prev => prev ? {
              ...prev,
              useCases: prev.useCases ? prev.useCases.map((uc, i) => i === idx ? updatedUseCase : uc) : []
            } : prev);
            if (accountId && persona) {
              const updatedPersona = {
                ...persona,
                useCases: persona.useCases ? persona.useCases.map((uc, i) => i === idx ? updatedUseCase : uc) : []
              };
              updatePersonaForTargetAccount(accountId, updatedPersona);
            }
          }}
          onDelete={(idx: number) => {
            setPersona(prev => prev ? {
              ...prev,
              useCases: prev.useCases ? prev.useCases.filter((_, i) => i !== idx) : []
            } : prev);
            if (accountId && persona) {
              const updatedPersona = {
                ...persona,
                useCases: persona.useCases ? persona.useCases.filter((_, i) => i !== idx) : []
              };
              updatePersonaForTargetAccount(accountId, updatedPersona);
            }
          }}
        />
        
        {/* Demographics Edit Modal */}
        <EditCriteriaModal
          isOpen={demographicsModalOpen}
          onClose={() => setDemographicsModalOpen(false)}
          initialRows={transformDemographicsToCriteria(persona?.demographics)}
          onSave={(rows: any[]) => {
            // Convert criteria rows back to Demographics format
            const newDemographics: Demographics = {};
            
            rows.forEach((row: any) => {
              const values = row.values.map((v: any) => v.text);
              switch (row.label.toLowerCase()) {
                case 'job titles':
                  newDemographics.jobTitles = values;
                  break;
                case 'departments':
                  newDemographics.departments = values;
                  break;
                case 'seniority':
                  newDemographics.seniority = values;
                  break;
                case 'buying roles':
                  newDemographics.buyingRoles = values;
                  break;
                case 'keywords':
                  newDemographics.jobDescriptionKeywords = values;
                  break;
              }
            });
            
            setPersona(prev => prev ? { ...prev, demographics: newDemographics } : prev);
            if (accountId && persona) {
              const updatedPersona = { ...persona, demographics: newDemographics };
              updatePersonaForTargetAccount(accountId, updatedPersona);
            }
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
    </div>
  );
} 