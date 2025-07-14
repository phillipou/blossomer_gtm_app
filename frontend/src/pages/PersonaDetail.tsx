import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { personaConfig } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
import SubNav from '../components/navigation/SubNav';
import InputModal from '../components/modals/InputModal';
import { 
  useGetPersonaForEntityPage, 
  useGetPersonas,
  useGeneratePersona, 
  useUpdatePersonaPreserveFields,
  useUpdatePersonaListFieldsPreserveFields
} from '../lib/hooks/usePersonas';
import { getAllPersonas } from '../lib/personaService';
import { useGetAccount } from '../lib/hooks/useAccounts';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { useCompanyContext } from '../lib/hooks/useCompanyContext';
import { useAuthState } from '../lib/auth';
import { DraftManager } from '../lib/draftManager';
import { useQueryClient } from '@tanstack/react-query';
import { normalizePersonaResponse } from '../lib/personaService';
import { Wand2, Pencil, Plus } from 'lucide-react';
import type { TargetPersonaResponse, TargetPersonaRequest, APIBuyingSignal, Demographics, UseCase } from '../types/api';
import BuyingSignalsCard from '../components/cards/BuyingSignalsCard';
import UseCasesCard from '../components/cards/UseCasesCard';
import EditBuyingSignalModal from '../components/modals/EditBuyingSignalModal';
import EditCriteriaModal from '../components/modals/EditCriteriaModal';
import { CriteriaTable } from '../components/tables/CriteriaTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingStates } from '../components/ui/page-loading';

// Stable references to prevent re-renders
const emptyObject = {};
const emptyMutate = () => {};
const dummyGenerateResult = { mutate: emptyMutate, isPending: false, error: null };

// Query key for consistency
const PERSONAS_LIST_KEY = 'personas';

// Standardized error handling following AccountDetail pattern
const handleComponentError = (operation: string, error: any) => {
  console.error(`[COMPONENT-ERROR] ${operation} failed:`, {
    error: error?.message || error,
    operation,
    timestamp: new Date().toISOString(),
    stack: error?.stack
  });
};

export default function PersonaDetail() {
  const { token } = useAuthState();
  const { id: personaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  
  // Modal state for demographics and buying signals
  const [demographicsModalOpen, setDemographicsModalOpen] = useState(false);
  const [buyingSignalsModalOpen, setBuyingSignalsModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<any>(null);
  
  // Get persona data first to extract accountId
  const { data: personaData } = useGetPersonaForEntityPage(token, personaId);
  const accountId = personaData?.accountId;
  
  // Get account data using the extracted accountId
  const { data: account } = useGetAccount(accountId, token);
  
  // Get company data for context  
  const { overview: company, companyId } = useCompanyContext();
  
  // Initialize entity page hook FIRST (before any conditional logic to avoid hook order issues)
  const entityPageState = useEntityPage<TargetPersonaResponse>({
    config: personaConfig,
    hooks: {
      useGet: (token, entityId) => {
        const { data, isLoading, error, refetch } = useGetPersonaForEntityPage(token, entityId);
        return {
          data: data as unknown as TargetPersonaResponse | undefined,
          isLoading,
          error,
          refetch
        };
      },
      useGetList: (token) => {
        // ALWAYS call hooks first (Rules of Hooks) - but only enable for valid authenticated scenarios
        const shouldFetchFromAPI = !!token && !!companyId; // Enable for authenticated users to prevent redirect issues
        const { data, isLoading, error } = useQuery<Persona[], Error>({
          queryKey: [PERSONAS_LIST_KEY, companyId],
          queryFn: () => getAllPersonas(companyId!, token),
          enabled: shouldFetchFromAPI && !!token && !!companyId,
        });
        
        // For authenticated users with valid accountId, use API data
        if (shouldFetchFromAPI) {
          return { data: data as unknown as TargetPersonaResponse[] || [], isLoading, error };
        }
        
        // For unauthenticated users, use DraftManager (following Personas.tsx pattern)
        if (companyId) {
          const draftPersonas = DraftManager.getDrafts('persona').map(draft => ({
            ...draft.data,
            id: draft.tempId,
            isDraft: true,
          })) as TargetPersonaResponse[];
          return { data: draftPersonas, isLoading: false, error: null };
        }
        
        // Fallback for completely invalid companyId
        return { data: [] as TargetPersonaResponse[], isLoading: false, error: null };
      },
      useGenerateWithAI: () => dummyGenerateResult,
      useCreate: () => emptyObject,
      useUpdate: () => emptyObject,
      useUpdatePreserveFields: (token, entityId) => {
        return useUpdatePersonaPreserveFields(token, entityId);
      },
      useUpdateListFieldsPreserveFields: (token, entityId) => {
        return useUpdatePersonaListFieldsPreserveFields(token, entityId);
      },
    },
  });

  // Generation hooks (after entityPageState to maintain hook order)
  const { mutate: generatePersona, isPending: isGenerating } = useGeneratePersona(token);
  
  // Auth-aware navigation
  const { navigateToEntity } = useAuthAwareNavigation();
  
  // Handle "new" route - show creation modal
  useEffect(() => {
    if (personaId === 'new') {
      setIsCreationModalOpen(true);
    }
  }, [personaId]);

  // Path prefix based on authentication
  const pathPrefix = token ? '/app' : '/playground';
  
  // Account name for breadcrumbs
  const accountDisplayName = account?.name || 'Account';
  
  // Transform demographics to criteria format for table display (following AccountDetail.tsx pattern)
  const transformDemographicsToCriteria = useCallback((demographics: Demographics | undefined) => {
    if (!demographics) return [] as any[];
    const criteria: any[] = [];
    
    // Helper function to safely handle arrays and single values
    const safeMapArray = (value: any, color: string) => {
      if (Array.isArray(value)) {
        return value.map(item => ({ text: item, color }));
      } else if (value && typeof value === 'string') {
        return [{ text: value, color }];
      }
      return [];
    };
    
    // Handle all demographics fields dynamically (following AccountDetail pattern)
    Object.entries(demographics).forEach(([key, value]) => {
      if (value && (Array.isArray(value) || typeof value === 'string')) {
        // Convert camelCase to Title Case
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        // Map different field types to colors for better UX
        const colorMap: Record<string, string> = {
          'jobTitles': 'blue',
          'departments': 'purple',
          'seniority': 'orange',
          'buyingRoles': 'red',
          'jobDescriptionKeywords': 'green'
        };
        
        const color = colorMap[key] || 'blue';
        const values = safeMapArray(value, color);
        
        if (values.length > 0) {
          criteria.push({ label, values });
        }
      }
    });
    
    return criteria.map((item, index) => ({ ...item, id: String(index) }));
  }, []);

  // Transform from CriteriaTable format back to demographics (following AccountDetail pattern)
  const transformCriteriaToDemographics = useCallback((rows: any[]): Demographics => {
    const result: Record<string, any> = {};
    
    (rows as any[]).forEach((row: any) => {
      const values = row.values.map((v: any) => v.text);
      // Convert label back to camelCase key
      const fieldKey = row.label.toLowerCase().replace(/\s+(.)/g, (_, char) => char.toUpperCase());
      
      // Store as array (demographics fields are typically arrays)
      result[fieldKey] = values;
    });
    
    return result as Demographics;
  }, []);

  // Memoize expensive transformations to prevent re-renders (following AccountDetail pattern)
  const demographicsTableData = useMemo(() => 
    transformDemographicsToCriteria(entityPageState.displayEntity?.demographics), 
    [entityPageState.displayEntity?.demographics, transformDemographicsToCriteria]
  );

  // Initialize field-preserving update hooks like AccountDetail.tsx 
  // Always call the hook to follow rules of hooks, but only use it conditionally
  const updateHook = useUpdatePersonaPreserveFields(token, personaId);
  const { mutate: updatePersonaWithFieldPreservation } = updateHook;

  // Handle use cases update (following AccountDetail pattern for unauthenticated users)
  const handleUseCasesUpdate = useCallback((updatedUseCases: UseCase[]) => {
    console.log('[COMPONENT-UPDATE] Use cases update initiated:', {
      personaId,
      updateType: 'useCases',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['useCases'],
      useCaseCount: updatedUseCases.length
    });
    
    if (!entityPageState.displayEntity) {
      console.error('[USE-CASES-UPDATE] No persona entity found');
      return;
    }
    
    if (token && personaId && !personaId.startsWith('temp_')) {
      // Authenticated user with real persona - use API
      try {
        updatePersonaWithFieldPreservation({
          currentPersona: entityPageState.displayEntity,
          updates: { useCases: updatedUseCases }
        });
      } catch (error) {
        console.error('[USE-CASES-UPDATE] API update failed:', error);
      }
    } else {
      // Unauthenticated user or draft persona - use DraftManager
      console.log('[USE-CASES-UPDATE] Updating draft persona');
      const draftPersonas = DraftManager.getDrafts('persona');
      const currentDraft = draftPersonas.find(draft => draft.tempId === personaId);
      
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          'persona',
          currentDraft.tempId,
          { useCases: updatedUseCases }
        );
        
        if (updateSuccess) {
          console.log('✅ [PersonaDetail] Use cases draft updated successfully');
          
          // Update React Query cache using normalization - following AccountDetail pattern
          const currentPersona = queryClient.getQueryData(['persona', personaId]) as any;
          if (currentPersona) {
            const updatedPersona = normalizePersonaResponse({
              ...currentPersona,
              useCases: updatedUseCases,
              data: {
                ...currentPersona.data,
                useCases: updatedUseCases
              }
            });
            
            console.log('[CACHE-UPDATE] Use cases cache update via normalization:', {
              personaId,
              fieldUpdated: 'useCases',
              cacheUpdateMethod: 'normalized',
              preservedFieldCount: Object.keys(updatedPersona).length
            });
            
            queryClient.setQueryData(['persona', personaId], updatedPersona);
          }
        } else {
          console.error('❌ [PersonaDetail] Failed to update use cases draft');
        }
      } else {
        console.error('❌ [PersonaDetail] No draft found for persona:', personaId);
      }
    }
  }, [entityPageState.displayEntity, updatePersonaWithFieldPreservation, personaId, token, queryClient]);

  // Handle buying signals update (following AccountDetail pattern)
  const handleBuyingSignalsUpdate = useCallback((updatedSignals: APIBuyingSignal[]) => {
    console.log('[COMPONENT-UPDATE] Buying signals update initiated:', {
      personaId,
      updateType: 'buyingSignals',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['buyingSignals'],
      signalCount: updatedSignals.length
    });
    
    if (!entityPageState.displayEntity) {
      console.error('[BUYING-SIGNALS-UPDATE] No persona entity found');
      return;
    }
    
    if (token && personaId && !personaId.startsWith('temp_')) {
      // Authenticated user with real persona - use API
      try {
        updatePersonaWithFieldPreservation({
          currentPersona: entityPageState.displayEntity,
          updates: { buyingSignals: updatedSignals }
        });
      } catch (error) {
        console.error('[BUYING-SIGNALS-UPDATE] API update failed:', error);
      }
    } else {
      // Unauthenticated user or draft persona - use DraftManager
      console.log('[BUYING-SIGNALS-UPDATE] Updating draft persona');
      const draftPersonas = DraftManager.getDrafts('persona');
      const currentDraft = draftPersonas.find(draft => draft.tempId === personaId);
      
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          'persona',
          currentDraft.tempId,
          { buyingSignals: updatedSignals }
        );
        
        if (updateSuccess) {
          console.log('✅ [PersonaDetail] Buying signals draft updated successfully');
          
          // Update React Query cache using normalization - following AccountDetail pattern
          const currentPersona = queryClient.getQueryData(['persona', personaId]) as any;
          if (currentPersona) {
            const updatedPersona = normalizePersonaResponse({
              ...currentPersona,
              buyingSignals: updatedSignals,
              data: {
                ...currentPersona.data,
                buyingSignals: updatedSignals
              }
            });
            
            console.log('[CACHE-UPDATE] Buying signals cache update via normalization:', {
              personaId,
              fieldUpdated: 'buyingSignals',
              cacheUpdateMethod: 'normalized',
              preservedFieldCount: Object.keys(updatedPersona).length
            });
            
            queryClient.setQueryData(['persona', personaId], updatedPersona);
          }
        } else {
          console.error('❌ [PersonaDetail] Failed to update buying signals draft');
        }
      } else {
        console.error('❌ [PersonaDetail] No draft found for persona:', personaId);
      }
    }
  }, [entityPageState.displayEntity, updatePersonaWithFieldPreservation, personaId, token, queryClient]);

  // Handle demographics update (following AccountDetail pattern)
  const handleDemographicsUpdate = useCallback((updatedDemographics: Demographics) => {
    console.log('[COMPONENT-UPDATE] Demographics update initiated:', {
      personaId,
      updateType: 'demographics',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['demographics']
    });
    
    if (!entityPageState.displayEntity) {
      console.error('[DEMOGRAPHICS-UPDATE] No persona entity found');
      return;
    }
    
    if (token && personaId && !personaId.startsWith('temp_')) {
      // Authenticated user with real persona - use API
      try {
        updatePersonaWithFieldPreservation({
          currentPersona: entityPageState.displayEntity,
          updates: { demographics: updatedDemographics }
        });
      } catch (error) {
        console.error('[DEMOGRAPHICS-UPDATE] API update failed:', error);
      }
    } else {
      // Unauthenticated user or draft persona - use DraftManager
      console.log('[DEMOGRAPHICS-UPDATE] Updating draft persona');
      const draftPersonas = DraftManager.getDrafts('persona');
      const currentDraft = draftPersonas.find(draft => draft.tempId === personaId);
      
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          'persona',
          currentDraft.tempId,
          { demographics: updatedDemographics }
        );
        
        if (updateSuccess) {
          console.log('✅ [PersonaDetail] Demographics draft updated successfully');
          
          // Update React Query cache using normalization - following AccountDetail pattern
          const currentPersona = queryClient.getQueryData(['persona', personaId]) as any;
          if (currentPersona) {
            const updatedPersona = normalizePersonaResponse({
              ...currentPersona,
              demographics: updatedDemographics,
              data: {
                ...currentPersona.data,
                demographics: updatedDemographics
              }
            });
            
            console.log('[CACHE-UPDATE] Demographics cache update via normalization:', {
              personaId,
              fieldUpdated: 'demographics',
              cacheUpdateMethod: 'normalized',
              preservedFieldCount: Object.keys(updatedPersona).length
            });
            
            queryClient.setQueryData(['persona', personaId], updatedPersona);
          }
        } else {
          console.error('❌ [PersonaDetail] Failed to update demographics draft');
        }
      } else {
        console.error('❌ [PersonaDetail] No draft found for persona:', personaId);
      }
    }
  }, [entityPageState.displayEntity, updatePersonaWithFieldPreservation, personaId, token, queryClient]);

  // Handle persona creation
  const handleCreatePersona = useCallback(async (data: { name: string; description: string }) => {
    if (!company || !accountId) {
      console.error('[PERSONA-DETAIL] Cannot create persona without company and account context');
      return;
    }

    try {
      const personaData = {
        websiteUrl: company.companyUrl || '',
        personaProfileName: data.name,
        hypothesis: data.description,
        companyContext: {
          companyName: company.companyName || '',
          description: company.description || '',
          companyUrl: company.companyUrl || '',
        },
        targetAccountContext: account
      };

      generatePersona({ 
        accountId: accountId, 
        personaData: personaData as TargetPersonaRequest 
      }, {
        onSuccess: (result) => {
          console.log('[PERSONA-DETAIL] Persona generated successfully:', result);
          setIsCreationModalOpen(false);
          navigateToEntity('persona', result.id);
        },
        onError: (error) => {
          handleComponentError('persona-creation', error);
        }
      });
    } catch (error) {
      handleComponentError('persona-creation', error);
    }
  }, [company, accountId, account, generatePersona, navigateToEntity]);

  // Generation handler for EntityPageLayout (following AccountDetail pattern)
  const handleGenerate = ({ name, description }: { name: string; description: string }) => {
    handleCreatePersona({ name, description });
  };

  // Breadcrumb configuration (simplified routing)
  const breadcrumbs = [
    { label: 'Company', href: `${pathPrefix}/company` },
    { label: 'Accounts', href: `${pathPrefix}/accounts` },
    { label: accountDisplayName, href: `${pathPrefix}/accounts/${accountId}` },
    { label: 'Personas', href: `${pathPrefix}/personas` },
    { 
      label: entityPageState.displayEntity?.targetPersonaName || 
             'Persona Detail', 
      href: `${pathPrefix}/personas/${personaId}` 
    },
  ];

  // Loading and error states from entityPageState
  if (entityPageState.isLoading) {
    return <LoadingStates.personaDetail />;
  }

  if (entityPageState.error) {
    return <div>Error loading persona: {entityPageState.error.message}</div>;
  }

  if (!entityPageState.displayEntity && personaId !== 'new') {
    return <div>Persona not found</div>;
  }

  // For "new" persona route, show creation modal
  if (personaId === 'new' || !entityPageState.displayEntity) {
    return (
      <>
        <SubNav breadcrumbs={breadcrumbs} activeSubTab="" setActiveSubTab={() => {}} subTabs={[]} />
        <InputModal
          isOpen={isCreationModalOpen}
          onClose={() => {
            setIsCreationModalOpen(false);
            navigate(`${pathPrefix}/personas`);
          }}
          onSubmit={handleCreatePersona}
          title="Create New Persona"
          subtitle="Generate a detailed buyer persona with AI assistance."
          nameLabel="Persona Name"
          namePlaceholder="e.g., Marketing Director, Sales Manager..."
          descriptionLabel="Description"
          descriptionPlaceholder="Describe this persona's role, responsibilities, and characteristics..."
          submitLabel={
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Persona'}
            </>
          }
          cancelLabel="Cancel"
          isLoading={isGenerating}
        />
      </>
    );
  }

  // Main persona detail view using EntityPageLayout
  return (
    <>
      <SubNav breadcrumbs={breadcrumbs} activeSubTab="" setActiveSubTab={() => {}} subTabs={[]} />
      
      <EntityPageLayout
        config={personaConfig}
        entityPageState={entityPageState}
        onGenerate={handleGenerate}
        overviewProps={{
          pageTitle: "Target Persona",
          pageSubtitle: "Persona analysis and insights",
          overviewTitle: entityPageState.displayEntity?.targetPersonaName || 'Persona',
          bodyTitle: 'Persona Profile',
          bodyText: entityPageState.displayEntity?.targetPersonaDescription || 'No description available',
          entityType: 'persona',
        }}
      >
        {/* Demographics Section */}
        {entityPageState.displayEntity.demographics && (
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Demographics</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDemographicsModalOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <CriteriaTable data={demographicsTableData} />
            </CardContent>
          </Card>
        )}

        {/* Use Cases Section */}
        <UseCasesCard
          useCases={entityPageState.displayEntity?.useCases || []}
          onAdd={(newUseCase: UseCase) => {
            const currentUseCases = entityPageState.displayEntity?.useCases || [];
            const updatedUseCases = [...currentUseCases, newUseCase];
            handleUseCasesUpdate(updatedUseCases);
          }}
          onEdit={(idx: number, updatedUseCase: UseCase) => {
            const currentUseCases = entityPageState.displayEntity?.useCases || [];
            const updatedUseCases = currentUseCases.map((uc, i) => i === idx ? updatedUseCase : uc);
            handleUseCasesUpdate(updatedUseCases);
          }}
          onDelete={(idx: number) => {
            const currentUseCases = entityPageState.displayEntity?.useCases || [];
            const updatedUseCases = currentUseCases.filter((_, i) => i !== idx);
            handleUseCasesUpdate(updatedUseCases);
          }}
        />

        {/* Buying Signals Section */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Buying Signals</CardTitle>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => { 
                  setModalEditingSignal(null); 
                  setBuyingSignalsModalOpen(true); 
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
            <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
          </CardHeader>
          <CardContent>
            {(entityPageState.displayEntity?.buyingSignals || []).length > 0 ? (
              <BuyingSignalsCard
                buyingSignals={entityPageState.displayEntity?.buyingSignals || []}
                editable={true}
                onEdit={(signal) => {
                  setModalEditingSignal(signal);
                  setBuyingSignalsModalOpen(true);
                }}
                onDelete={(signal) => {
                  const updatedSignals = (entityPageState.displayEntity?.buyingSignals || [])
                    .filter(s => s.title !== signal.title);
                  handleBuyingSignalsUpdate(updatedSignals);
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">No buying signals identified</div>
            )}
          </CardContent>
        </Card>
      </EntityPageLayout>

      {/* Demographics Edit Modal */}
      <EditCriteriaModal
        isOpen={demographicsModalOpen}
        onClose={() => setDemographicsModalOpen(false)}
        onSave={(updatedCriteria) => {
          console.log('🔍 [PersonaDetail] Converting CriteriaTable rows to Demographics', { updatedCriteria });
          
          // Use the flexible transformation function (following AccountDetail pattern)
          const updatedDemographics = transformCriteriaToDemographics(updatedCriteria);
          
          console.log('🔍 [PersonaDetail] Final demographics object:', updatedDemographics);
          
          handleDemographicsUpdate(updatedDemographics);
          setDemographicsModalOpen(false);
        }}
        title="Edit Demographics"
        subtitle="Update the demographic information for this persona."
        initialRows={demographicsTableData}
      />

      {/* Buying Signals Edit Modal */}
      <EditBuyingSignalModal
        isOpen={buyingSignalsModalOpen}
        onClose={() => {
          setBuyingSignalsModalOpen(false);
          setModalEditingSignal(null);
        }}
        editingSignal={modalEditingSignal || undefined}
        onSave={(values: Record<string, string | boolean>) => {
          const title = String(values.label || '').trim();
          const description = String(values.description || '').trim();
          const priority = String(values.priority || 'Low').trim() as "Low" | "Medium" | "High";
          const type = String(values.type || 'Other').trim();
          const detection_method = String(values.detection_method || '').trim();
          
          const newSignal = { title, description, priority, type, detection_method };
          
          const currentSignals = entityPageState.displayEntity?.buyingSignals || [];
          let updatedSignals: APIBuyingSignal[];
          if (modalEditingSignal) {
            updatedSignals = currentSignals.map(s => 
              s.title === modalEditingSignal.title ? newSignal : s
            );
          } else {
            updatedSignals = [...currentSignals, newSignal];
          }
          
          handleBuyingSignalsUpdate(updatedSignals);
          setBuyingSignalsModalOpen(false);
          setModalEditingSignal(null);
        }}
      />
    </>
  );
}