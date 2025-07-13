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
import { getPersonas } from '../lib/personaService';
import { useGetAccount } from '../lib/hooks/useAccounts';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { useCompanyContext } from '../lib/hooks/useCompanyContext';
import { useAuthState } from '../lib/auth';
import { DraftManager } from '../lib/draftManager';
import { Wand2, Pencil } from 'lucide-react';
import type { TargetPersonaResponse, TargetPersonaRequest, APIBuyingSignal, Demographics } from '../types/api';
import BuyingSignalsCard from '../components/cards/BuyingSignalsCard';
import EditBuyingSignalModal from '../components/modals/EditBuyingSignalModal';
import EditCriteriaModal from '../components/modals/EditCriteriaModal';
import { CriteriaTable } from '../components/tables/CriteriaTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

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
  const { overview: company } = useCompanyContext();
  
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
        const shouldFetchFromAPI = false; // PersonaDetail doesn't need list data - disable to avoid 404s
        const { data, isLoading, error } = useQuery<Persona[], Error>({
          queryKey: [PERSONAS_LIST_KEY, accountId],
          queryFn: () => getPersonas(accountId!, token),
          enabled: shouldFetchFromAPI && !!token && !!accountId,
        });
        
        // For authenticated users with valid accountId, use API data
        if (shouldFetchFromAPI) {
          return { data: data as unknown as TargetPersonaResponse[] || [], isLoading, error };
        }
        
        // For unauthenticated users or invalid accountId, use DraftManager (following Personas.tsx pattern)
        if (accountId && accountId !== '*') {
          const draftPersonas = DraftManager.getDraftsByParent('persona', accountId).map(draft => ({
            ...draft.data,
            id: draft.tempId,
            accountId: accountId,
            isDraft: true,
          })) as TargetPersonaResponse[];
          return { data: draftPersonas, isLoading: false, error: null };
        }
        
        // Fallback for completely invalid accountId
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
  const { mutate: updatePersonaWithFieldPreservation } = useUpdatePersonaPreserveFields(token, personaId);

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
    
    // Use field-preserving update with current persona data
    updatePersonaWithFieldPreservation({
      currentPersona: entityPageState.displayEntity,
      updates: { buyingSignals: updatedSignals }
    });
  }, [entityPageState.displayEntity, updatePersonaWithFieldPreservation, personaId]);

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
    
    // Use field-preserving update with current persona data
    updatePersonaWithFieldPreservation({
      currentPersona: entityPageState.displayEntity,
      updates: { demographics: updatedDemographics }
    });
  }, [entityPageState.displayEntity, updatePersonaWithFieldPreservation, personaId]);

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
    return <div>Loading persona...</div>;
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

        {/* Buying Signals Section */}
        {(entityPageState.displayEntity?.buyingSignals || []).length > 0 ? (
          <BuyingSignalsCard
            buyingSignals={entityPageState.displayEntity?.buyingSignals || []}
            onDelete={(signal) => {
              const updatedSignals = (entityPageState.displayEntity?.buyingSignals || [])
                .filter(s => s.title !== signal.title);
              handleBuyingSignalsUpdate(updatedSignals);
            }}
          />
        ) : (
          <div>No buying signals identified</div>
        )}
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
        onSave={(updatedSignal) => {
          const currentSignals = entityPageState.displayEntity?.buyingSignals || [];
          let updatedSignals;
          
          if (modalEditingSignal) {
            // Edit existing signal
            updatedSignals = currentSignals.map(signal =>
              signal.title === modalEditingSignal.title ? updatedSignal : signal
            );
          } else {
            // Add new signal
            updatedSignals = [...currentSignals, updatedSignal];
          }
          
          handleBuyingSignalsUpdate(updatedSignals);
          setBuyingSignalsModalOpen(false);
          setModalEditingSignal(null);
        }}
        initialSignal={modalEditingSignal}
      />
    </>
  );
}