import { useParams } from "react-router-dom";
import SubNav from "../components/navigation/SubNav";
import React, { useState, useEffect } from "react";
import OverviewCard from "../components/cards/OverviewCard";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import EditCriteriaModal from "../components/modals/EditCriteriaModal";
import ListInfoCard from "../components/cards/ListInfoCard";
import ListInfoCardEditModal, { type ListInfoCardItem } from "../components/cards/ListInfoCardEditModal";
import { CriteriaTable } from "../components/tables/CriteriaTable";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { useGetPersona, useUpdatePersona, useUpdatePersonaPreserveFields, testPersonaCachePatterns } from "../lib/hooks/usePersonas";
import { useGetAccount } from "../lib/hooks/useAccounts";
import type { TargetPersonaResponse, APIBuyingSignal, Demographics, UseCase } from "../types/api";
import UseCasesCard from "../components/cards/UseCasesCard";
import { useAuthState } from "../lib/auth";
import { normalizePersonaResponse } from "../lib/personaService";
import { useQueryClient } from '@tanstack/react-query';

// Standardized error handling - Stage 4 improvement
const handleComponentError = (operation: string, error: any) => {
  console.error(`[COMPONENT-ERROR] ${operation} failed:`, {
    error: error?.message || error,
    operation,
    timestamp: new Date().toISOString(),
    stack: error?.stack
  });
  
  // TODO: Add user-facing error notifications here
  // For now, just log for debugging
};

// Component state synchronization testing - Stage 4 improvement
const testComponentStateSync = (
  queryClient: any, 
  personaId: string, 
  displayPersona: any, 
  operation: string
) => {
  const cachedPersona = queryClient.getQueryData(['persona', personaId]);
  
  console.log(`[STATE-SYNC-TEST] ${operation} synchronization check:`, {
    personaId,
    operation,
    displayPersonaExists: !!displayPersona,
    cachedPersonaExists: !!cachedPersona,
    formatConsistency: {
      displayPersona: displayPersona ? {
        hasTargetPersonaName: !!displayPersona.targetPersonaName,
        isNormalized: !Object.keys(displayPersona).some((k: string) => k.includes('_')),
        fieldCount: Object.keys(displayPersona).length,
        hasComplexFields: !!(displayPersona.demographics || displayPersona.useCases || displayPersona.buyingSignals)
      } : null,
      cachedPersona: cachedPersona ? {
        hasTargetPersonaName: !!(cachedPersona as any).targetPersonaName,
        isNormalized: !Object.keys(cachedPersona as any).some((k: string) => k.includes('_')),
        fieldCount: Object.keys(cachedPersona as any).length,
        hasComplexFields: !!((cachedPersona as any).demographics || (cachedPersona as any).useCases || (cachedPersona as any).buyingSignals)
      } : null
    },
    stateSync: displayPersona && cachedPersona ? 
      JSON.stringify(displayPersona) === JSON.stringify(cachedPersona) : 'partial-data',
    timestamp: new Date().toISOString()
  });
  
  return {
    inSync: displayPersona && cachedPersona && 
           JSON.stringify(displayPersona) === JSON.stringify(cachedPersona),
    bothExist: !!displayPersona && !!cachedPersona
  };
};

export default function PersonaDetail() {
  const { id: routeAccountId, personaId } = useParams<{ id?: string; personaId: string }>();
  const { token } = useAuthState();
  const queryClient = useQueryClient();

  const { data: persona, isLoading, error, refetch } = useGetPersona(personaId!, token) as { data: TargetPersonaResponse | undefined, isLoading: boolean, error: any, refetch: () => void };
  const { mutate: updatePersona } = useUpdatePersona(routeAccountId!, token);
  
  // Field-preserving update hook (for authenticated users)
  const { mutate: updateWithFieldPreservation } = useUpdatePersonaPreserveFields(token, personaId);

  // Determine the correct accountId (from persona or route)
  const accountId = (persona as any)?.accountId || routeAccountId;
  
  // Get the account data reliably using the hook
  const { data: accountData } = useGetAccount(accountId, token);
  const accountDisplayName = accountData?.targetAccountName || accountData?.name || 'Account';
  
  // Dynamic path prefix based on authentication
  const pathPrefix = token ? '/app' : '/playground';
  
  console.log('[PersonaDetail] Account data for breadcrumb:', {
    accountId,
    pathPrefix,
    isAuthenticated: !!token,
    accountData: accountData ? {
      id: accountData.id,
      name: accountData.name,
      targetAccountName: accountData.targetAccountName
    } : null,
    displayName: accountDisplayName
  });

  // Modal state for demographics and buying signals
  const [demographicsModalOpen, setDemographicsModalOpen] = useState(false);
  const [buyingSignalsModalOpen, setBuyingSignalsModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<any>(null);
  const [buyingSignals, setBuyingSignals] = useState<APIBuyingSignal[]>([]);

  // Modal state for list fields
  const [editListField, setEditListField] = useState<null | keyof TargetPersonaResponse>(null);
  const [editListInitialItems, setEditListInitialItems] = useState<ListInfoCardItem[]>([]);
  const [editListModalTitle, setEditListModalTitle] = useState<string>("");
  const [editListModalSubtitle, setEditListModalSubtitle] = useState<string>("");

  // Helper to open the edit modal for a list field
  const openListEditModal = (field: keyof TargetPersonaResponse, items: string[], title: string, subtitle: string) => {
    setEditListField(field);
    setEditListInitialItems((items || []).map((text, idx) => ({ id: String(idx), text })));
    setEditListModalTitle(title);
    setEditListModalSubtitle(subtitle);
  };

  // Handler to save changes from the edit modal
  const handleListModalSave = async (items: ListInfoCardItem[]) => {
    if (token && personaId && persona) {
      const newItems = items.map(item => item.text);
      return new Promise<void>((resolve, reject) => {
        updateWithFieldPreservation({
          currentPersona: persona,
          updates: { [editListField as keyof TargetPersonaResponse]: newItems },
        }, {
          onSuccess: () => {
            setEditListField(null);
            resolve();
          },
          onError: (error) => {
            handleComponentError(`${editListField} update`, error);
            reject(error);
          }
        });
      });
    }
    return Promise.resolve();
  };

  // Handler to close the edit modal
  const handleListModalClose = () => {
    setEditListField(null);
  };

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

  // Populate buying signals state when persona data changes
  useEffect(() => {
    if (persona?.buyingSignals) {
      setBuyingSignals(persona.buyingSignals);
    } else {
      setBuyingSignals([]);
    }
  }, [persona]);

  // Component state synchronization testing - Stage 4 improvement
  useEffect(() => {
    if (personaId && persona) {
      testComponentStateSync(
        queryClient, 
        personaId, 
        persona, 
        'component-mount-or-update'
      );
      
      // Test persona cache patterns - Stage 4 improvement
      testPersonaCachePatterns(queryClient, personaId);
    }
  }, [personaId, persona, queryClient]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  if (!persona) return <div className="p-8 text-center text-gray-500">Persona not found.</div>;

  // Simplified demographics update - Stage 4 improvement
  const handleDemographicsUpdate = (newDemographics: Demographics) => {
    console.log('[COMPONENT-UPDATE] Demographics update initiated:', {
      personaId,
      updateType: 'demographics',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['demographics'],
      timestamp: new Date().toISOString()
    });

    if (token && personaId && persona) {
      // Authenticated update - simplified with new service layer
      updateWithFieldPreservation({
        currentPersona: persona,
        updates: { demographics: newDemographics },
      }, {
        onSuccess: () => {
          console.log('[COMPONENT-UPDATE] Demographics updated successfully');
          setDemographicsModalOpen(false);
        },
        onError: (error) => {
          handleComponentError("Demographics update", error);
        }
      });
    }
  };

  // Simplified buying signals update - Stage 4 improvement  
  const handleBuyingSignalsUpdate = (updatedSignals: APIBuyingSignal[]) => {
    console.log('[COMPONENT-UPDATE] Buying signals update initiated:', {
      personaId,
      updateType: 'buyingSignals',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['buyingSignals'],
      timestamp: new Date().toISOString()
    });

    if (token && personaId && persona) {
      // Authenticated update - simplified with new service layer
      updateWithFieldPreservation({
        currentPersona: persona,
        updates: { buyingSignals: updatedSignals },
      }, {
        onSuccess: () => {
          console.log('[COMPONENT-UPDATE] Buying signals updated successfully');
          setBuyingSignalsModalOpen(false);
        },
        onError: (error) => {
          handleComponentError("Buying signals update", error);
        }
      });
    }
  };

  // Simplified list field update handler
  const handleListEdit = (field: keyof TargetPersonaResponse) => (newItems: string[]) => {
    if (token && personaId && persona) {
      updateWithFieldPreservation({
        currentPersona: persona,
        updates: { [field]: newItems },
      }, {
        onError: (error) => {
          handleComponentError(`${field} update`, error);
        }
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Company", href: `${pathPrefix}/company` },
          { label: "Target Accounts", href: `${pathPrefix}/accounts` },
          { label: accountDisplayName, href: `${pathPrefix}/accounts/${accountId}` },
          { label: persona?.targetPersonaName || "Persona" },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="persona"
      />
      <div className="flex-1 p-8 space-y-8">
        <OverviewCard
          title={persona?.targetPersonaName || ''}
          subtitle={"Account: " + accountDisplayName}
          bodyTitle="Persona Overview"
          bodyText={persona?.targetPersonaDescription || ''}
          showButton={false}
          onEdit={({ name, description }) => {
            if (token && accountId && persona) {
              updateWithFieldPreservation({
                currentPersona: persona,
                updates: { targetPersonaName: name, targetPersonaDescription: description },
              }, {
                onError: (error) => {
                  handleComponentError("Persona overview update", error);
                }
              });
            }
          }}
        >
        </OverviewCard>
        {/* Demographics Section */}
        <Card className="mt-8 group">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Demographics</CardTitle>
              <div className="text-sm text-gray-500">Searchable attributes for prospecting tools and databases</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Edit Demographics"
              onClick={() => setDemographicsModalOpen(true)}
              className="ml-2 invisible group-hover:visible"
            >
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
          </CardHeader>
          <CardContent>
            {persona?.demographics ? (
              <CriteriaTable 
                data={transformDemographicsToCriteria(persona.demographics)}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">No demographics data available</div>
            )}
          </CardContent>
        </Card>
        <ListInfoCard
          title="Target Persona Rationale"
          items={Array.isArray(persona?.targetPersonaRationale) ? persona.targetPersonaRationale : []}
          onEditRequest={(items) => openListEditModal(
            "targetPersonaRationale" as keyof TargetPersonaResponse,
            items,
            "Target Persona Rationale",
            "Why this persona is ideal for your solution."
          )}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Why this persona is ideal for your solution."
        />
        {/* Buying Signals Block */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Buying Signals</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => { setModalEditingSignal(null); setBuyingSignalsModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
            <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
          </CardHeader>
          <CardContent>
            {buyingSignals.length > 0 ? (
              <BuyingSignalsCard
                buyingSignals={buyingSignals}
                editable={true}
                onEdit={(signal) => {
                  setModalEditingSignal(signal);
                  setBuyingSignalsModalOpen(true);
                }}
                onDelete={(signal) => setBuyingSignals(signals => signals.filter(s => s.title !== signal.title))}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">No buying signals identified</div>
            )}
          </CardContent>
        </Card>
        <ListInfoCard
          title="Buying Signals Rationale"
          items={Array.isArray(persona?.buyingSignalsRationale) ? persona.buyingSignalsRationale : []}
          onEditRequest={(items) => openListEditModal(
            "buyingSignalsRationale" as keyof TargetPersonaResponse,
            items,
            "Buying Signals Rationale",
            "Logic behind buying signal choices."
          )}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Logic behind buying signal choices."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ListInfoCard
            title="Persona Goals"
            items={Array.isArray(persona?.goals) ? persona.goals : []}
            onEditRequest={(items) => openListEditModal(
              "goals" as keyof TargetPersonaResponse,
              items,
              "Persona Goals",
              "Objectives this product can help this persona achieve."
            )}
            renderItem={(item: string, idx: number) => (
              <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
            )}
            editModalSubtitle="Objectives this product can help this persona achieve."
          />
          <ListInfoCard
            title="Purchase Journey"
            items={Array.isArray(persona?.purchaseJourney) ? persona.purchaseJourney : []}
            onEditRequest={(items) => openListEditModal(
              "purchaseJourney" as keyof TargetPersonaResponse,
              items,
              "Purchase Journey",
              "Path from awareness to purchase."
            )}
            renderItem={(item: string, idx: number) => (
              <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
            )}
            editModalSubtitle="Path from awareness to purchase."
          />
        </div>
        <ListInfoCard
          title="Likely Objections"
          items={Array.isArray(persona?.objections) ? persona.objections : []}
          onEditRequest={(items) => openListEditModal(
            "objections" as keyof TargetPersonaResponse,
            items,
            "Likely Objections",
            "Common concerns about adopting this solution."
          )}
          renderItem={(item: string, idx: number) => (
            <span key={idx} className="text-sm text-gray-700 blue-bullet">{item}</span>
          )}
          editModalSubtitle="Common concerns about adopting this solution."
        />
        <UseCasesCard
          useCases={persona?.useCases || []}
          onAdd={(newUseCase: UseCase) => {
            const updatedUseCases = persona?.useCases ? [...persona.useCases, newUseCase] : [newUseCase];
            if (token && accountId && persona) {
              updateWithFieldPreservation({
                currentPersona: persona,
                updates: { useCases: updatedUseCases },
              }, {
                onError: (error) => {
                  handleComponentError("Use cases add", error);
                }
              });
            }
          }}
          onEdit={(idx: number, updatedUseCase: UseCase) => {
            const updatedUseCases = persona?.useCases ? persona.useCases.map((uc, i) => i === idx ? updatedUseCase : uc) : [];
            if (token && accountId && persona) {
              updateWithFieldPreservation({
                currentPersona: persona,
                updates: { useCases: updatedUseCases },
              }, {
                onError: (error) => {
                  handleComponentError("Use cases edit", error);
                }
              });
            }
          }}
          onDelete={(idx: number) => {
            const updatedUseCases = persona?.useCases ? persona.useCases.filter((_, i) => i !== idx) : [];
            if (token && accountId && persona) {
              updateWithFieldPreservation({
                currentPersona: persona,
                updates: { useCases: updatedUseCases },
              }, {
                onError: (error) => {
                  handleComponentError("Use cases delete", error);
                }
              });
            }
          }}
        />
        {/* Edit Modals */}
        <EditCriteriaModal
          isOpen={demographicsModalOpen}
          onClose={() => setDemographicsModalOpen(false)}
          initialRows={transformDemographicsToCriteria(persona?.demographics)}
          onSave={(rows: any[]) => {
            console.log('🔍 [PersonaDetail] Converting CriteriaTable rows to Demographics', { rows });
            
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
            
            console.log('🔍 [PersonaDetail] Final demographics object:', newDemographics);
            
            // Handle demographics update using field preservation pattern
            handleDemographicsUpdate(newDemographics);
          }}
          title="Edit Demographics"
        />
        <ListInfoCardEditModal
          isOpen={!!editListField}
          onClose={handleListModalClose}
          onSave={handleListModalSave}
          initialItems={editListInitialItems}
          title={editListModalTitle}
          subtitle={editListModalSubtitle}
        />
      </div>
      <EditBuyingSignalModal
        isOpen={buyingSignalsModalOpen}
        onClose={() => setBuyingSignalsModalOpen(false)}
        editingSignal={modalEditingSignal || undefined}
        onSave={(values: Record<string, string | boolean>) => {
          const title = String(values.label || '').trim();
          const description = String(values.description || '').trim();
          const priority = String(values.priority || 'Low').trim() as "Low" | "Medium" | "High";
          const type = String(values.type || 'Other').trim();
          const detection_method = String(values.detection_method || '').trim();
          const newSignal = { title, description, priority, type, detection_method };
          let updatedSignals: APIBuyingSignal[];
          if (modalEditingSignal) {
            updatedSignals = buyingSignals.map(s => 
              s.title === modalEditingSignal.title ? newSignal : s
            );
          } else {
            updatedSignals = [...buyingSignals, newSignal];
          }
          setBuyingSignals(updatedSignals);
          handleBuyingSignalsUpdate(updatedSignals);
        }}
      />
    </div>
  );
} 