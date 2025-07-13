import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { accountConfig, generationModalConfigs } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
import SubNav from '../components/navigation/SubNav';
import InputModal from '../components/modals/InputModal';
import { 
  useGetAccount, 
  useGetAccountForEntityPage,
  useGetAccountsForEntityPage,
  useGenerateAccount, 
  useUpdateAccount, 
  useUpdateAccountPreserveFields, 
  useUpdateAccountListFieldsPreserveFields, 
  useGetAccounts, 
  useCreateAccount 
} from '../lib/hooks/useAccounts';
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { normalizeAccountResponse } from '../lib/accountService';
import { useGetCompany, useGetUserCompany } from '../lib/hooks/useCompany';
import { useAuthState } from '../lib/auth';
import { useCompanyContext } from '../lib/hooks/useCompanyContext';
import { Wand2, Plus, Pencil } from 'lucide-react';
import type { TargetAccountResponse, AccountCreate, TargetAccountAPIRequest, APIBuyingSignal, Firmographics } from '../types/api';
import BuyingSignalsCard from '../components/cards/BuyingSignalsCard';
import EditBuyingSignalModal from '../components/modals/EditBuyingSignalModal';
import EditCriteriaModal from '../components/modals/EditCriteriaModal';
import { CriteriaTable } from '../components/tables/CriteriaTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DraftManager } from '../lib/draftManager';
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
  accountId: string, 
  displayEntity: any, 
  operation: string
) => {
  const cachedAccount = queryClient.getQueryData(['account', accountId]);
  
  console.log(`[STATE-SYNC-TEST] ${operation} synchronization check:`, {
    accountId,
    operation,
    displayEntityExists: !!displayEntity,
    cachedAccountExists: !!cachedAccount,
    formatConsistency: {
      displayEntity: displayEntity ? {
        hasTargetAccountName: !!displayEntity.targetAccountName,
        isNormalized: !Object.keys(displayEntity).some((k: string) => k.includes('_')),
        fieldCount: Object.keys(displayEntity).length
      } : null,
      cachedAccount: cachedAccount ? {
        hasTargetAccountName: !!(cachedAccount as any).targetAccountName,
        isNormalized: !Object.keys(cachedAccount as any).some((k: string) => k.includes('_')),
        fieldCount: Object.keys(cachedAccount as any).length
      } : null
    },
    stateSync: displayEntity && cachedAccount ? 
      JSON.stringify(displayEntity) === JSON.stringify(cachedAccount) : 'partial-data',
    timestamp: new Date().toISOString()
  });
  
  return {
    inSync: displayEntity && cachedAccount && 
           JSON.stringify(displayEntity) === JSON.stringify(cachedAccount),
    bothExist: !!displayEntity && !!cachedAccount
  };
};

export default function AccountDetail() {
  const { token } = useAuthState();
  const { id: accountId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  
  // Modal state for firmographics and buying signals
  const [firmographicsModalOpen, setFirmographicsModalOpen] = useState(false);
  const [buyingSignalsModalOpen, setBuyingSignalsModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<any>(null);
  const [buyingSignals, setBuyingSignals] = useState<APIBuyingSignal[]>([]);
  
  // Handle "new" route - show creation modal
  const isNewAccount = accountId === 'new';
  
  // Get company data for context using universal hook (supports both auth and unauth)
  const { overview, companyId, hasValidContext } = useCompanyContext();
  
  // Universal hooks for consistent CRUD operations
  const { create: createAccountUniversal } = useEntityCRUD<TargetAccountResponse>('account');
  const { navigateWithPrefix } = useAuthAwareNavigation();
  
  // For existing accounts, get account data
  const { data: account } = useGetAccount(isNewAccount ? undefined : accountId, token);
  const existingCompanyId = account?.companyId;
  
  // Get company data for context (use account's companyId for existing accounts)
  const { data: company } = useGetCompany(token, existingCompanyId || companyId);
  
  // Generation hook
  const { mutate: generateAccount, isPending: isGenerating } = useGenerateAccount(companyId, token);
  const { mutate: createAccount, isPending: isCreating } = useCreateAccount(companyId, token);
  
  // Field-preserving update hook (for authenticated users)
  const { mutate: updateWithFieldPreservation } = useUpdateAccountPreserveFields(token, accountId);
  
  // Initialize entity page hook
  const entityPageState = useEntityPage<TargetAccountResponse>({
    config: accountConfig,
    hooks: {
      useGet: (token, entityId) => {
        const { data, isLoading, error, refetch } = useGetAccountForEntityPage(token, entityId);
        // Cast normalized Account to TargetAccountResponse for compatibility
        return {
          data: data as unknown as TargetAccountResponse | undefined,
          isLoading,
          error,
          refetch: () => { refetch(); }
        };
      },
      useGetList: (token) => {
        // useGetAccountsForEntityPage returns { data, isLoading, error }
        return useGetAccountsForEntityPage(token);
      },
      useGenerateWithAI: (token, entityId) => {
        // useGenerateAccount expects (companyId, token), but we don't have companyId here, so return dummy
        return { mutate: () => {}, isPending: false, error: null };
      },
      useCreate: (token) => {
        // useCreateAccount expects (companyId, token), but we don't have companyId here, so return dummy
        return {};
      },
      useUpdate: (token, entityId) => {
        // useUpdateAccount expects (companyId, token), but we don't have companyId here, so return dummy
        return {};
      },
      useUpdatePreserveFields: (token, entityId) => {
        return useUpdateAccountPreserveFields(token, entityId);
      },
      useUpdateListFieldsPreserveFields: (token, entityId) => {
        return useUpdateAccountListFieldsPreserveFields(token, entityId);
      },
    },
  });

  console.log('🔍 [AccountDetail] Component rendered with accountId:', accountId);
  console.log('🔍 [AccountDetail] Token:', token ? 'exists' : 'missing');
  console.log('🔍 [AccountDetail] Entity display data:', entityPageState.displayEntity);
  console.log('🔍 [AccountDetail] Entity display data keys:', entityPageState.displayEntity ? Object.keys(entityPageState.displayEntity) : 'no entity');

  // Transform function for firmographics to CriteriaTable format
  const transformFirmographicsToCriteria = (firmographics: any) => {
    if (!firmographics) return [] as any[];
    const criteria: any[] = [];
    
    console.log('🔍 [AccountDetail] Transforming firmographics to criteria table:', firmographics);
    
    // Helper function to safely handle arrays and single values
    const safeMapArray = (value: any, color: string) => {
      if (Array.isArray(value)) {
        return value.map(item => ({ text: item, color }));
      } else if (value && typeof value === 'string') {
        return [{ text: value, color }];
      }
      return [];
    };
    
    // Handle all fields dynamically
    Object.entries(firmographics).forEach(([key, value]) => {
      if (value && (Array.isArray(value) || typeof value === 'string')) {
        // Convert snake_case to Title Case
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Map different field types to colors
        const colorMap: Record<string, string> = {
          'industry': 'blue',
          'geography': 'purple',
          'business_model': 'orange',
          'funding_stage': 'red',
          'company_type': 'gray',
          'keywords': 'yellow',
          'employees': 'green',
          'department_size': 'green',
          'revenue': 'green'
        };
        
        const color = colorMap[key] || 'blue'; // Default to blue
        const values = safeMapArray(value, color);
        
        if (values.length > 0) {
          criteria.push({ label, values });
        }
      }
    });
    
    return criteria.map((item, index) => ({ ...item, id: String(index) }));
  };

  // Transform function from CriteriaTable format back to dynamic firmographics structure
  const transformCriteriaToFirmographics = (rows: any[]): Record<string, any> => {
    const result: Record<string, any> = {};
    
    (rows as any[]).forEach((row: any) => {
      const values = row.values.map((v: any) => v.text);
      const fieldKey = row.label.toLowerCase().replace(/\s+/g, '_'); // Convert to snake_case key
      
      // If multiple values, store as array; if single value, store as string
      if (values.length === 1) {
        result[fieldKey] = values[0];
      } else if (values.length > 1) {
        result[fieldKey] = values;
      }
    });
    
    return result;
  };
  
  // Show creation modal for new accounts (only once)
  useEffect(() => {
    if (isNewAccount && !isCreationModalOpen) {
      console.log('[ACCOUNT-DETAIL] Opening creation modal for new account');
      setIsCreationModalOpen(true);
    }
  }, [isNewAccount, isCreationModalOpen]);

  // Populate buying signals state when account data changes
  useEffect(() => {
    if (entityPageState.displayEntity?.buyingSignals) {
      setBuyingSignals(entityPageState.displayEntity.buyingSignals);
    } else {
      setBuyingSignals([]);
    }
  }, [entityPageState.displayEntity]);

  // Component state synchronization testing - Stage 4 improvement
  useEffect(() => {
    if (accountId && entityPageState.displayEntity) {
      testComponentStateSync(
        queryClient, 
        accountId, 
        entityPageState.displayEntity, 
        'component-mount-or-update'
      );
    }
  }, [accountId, entityPageState.displayEntity, queryClient]);
  
  // Handle creation modal close
  const handleCreationModalClose = () => {
    setIsCreationModalOpen(false);
    navigate(-1); // Go back to accounts list
  };
  
  // Handle account creation using universal hooks
  const handleCreateAccount = async ({ name, description }: { name: string; description: string }) => {
    if (!hasValidContext || !overview) {
      console.error("Cannot generate account without company context.", {
        hasValidContext,
        overview: !!overview,
        companyId,
        isAuthenticated: !!token
      });
      handleComponentError("Account creation", "Missing company context. Please create a company first.");
      return;
    }
    
    console.log('[ACCOUNT-CREATION] Starting universal account creation:', {
      name,
      description,
      companyId,
      isAuthenticated: !!token
    });
    
    // Create the account data in the AI request format
    const accountProfileData = {
      website_url: overview.companyUrl || '',
      account_profile_name: name,
      hypothesis: description,
      company_context: {
        companyName: overview.companyName || '',
        description: overview.description || '',
        businessProfileInsights: overview.businessProfileInsights || [],
        capabilities: overview.capabilities || [],
        useCaseAnalysisInsights: overview.useCaseAnalysisInsights || [],
        positioningInsights: overview.positioningInsights || [],
        targetCustomerInsights: overview.targetCustomerInsights || [],
      },
    };

    try {
      // Universal create handles both auth and unauth flows automatically
      const result = await createAccountUniversal(accountProfileData, {
        customCompanyId: companyId,
        navigateOnSuccess: false // Handle navigation manually for modal closing
      });
      
      console.log('[ACCOUNT-CREATION] Universal create successful:', {
        accountId: result.id,
        isTemporary: result.isTemporary,
        isAuthenticated: !!token,
        fullResult: result
      });
      
      // Close modal and navigate appropriately
      setIsCreationModalOpen(false);
      
      // For temporary/draft accounts, navigate to accounts list instead of detail
      if (result.isTemporary || !token) {
        console.log('[ACCOUNT-CREATION] Navigating to accounts list for unauthenticated user');
        navigateWithPrefix('/accounts');
      } else {
        console.log('[ACCOUNT-CREATION] Navigating to account detail for authenticated user');
        navigateWithPrefix(`/accounts/${result.id}`);
      }
      
    } catch (error) {
      console.error('[ACCOUNT-CREATION] Universal create failed:', error);
      handleComponentError("Account creation", error);
    }
  };
  
  // If this is a new account, show creation modal
  if (isNewAccount) {
    // Check for valid company context before allowing account creation
    if (!hasValidContext) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-xl font-semibold mb-2">Company Required</h2>
          <p className="text-gray-600 mb-4">You need to create a company before adding target accounts.</p>
          <Button onClick={() => navigate(token ? '/app/company' : '/playground/company')}>
            Create Company First
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div>Creating new account...</div>
        <InputModal
          isOpen={isCreationModalOpen}
          onClose={handleCreationModalClose}
          onSubmit={handleCreateAccount}
          title="Create Target Account"
          subtitle="Create a detailed analysis of your ideal customer account."
          nameLabel="Account Profile Name"
          namePlaceholder="Mid-market SaaS companies"
          descriptionLabel="Account Hypothesis"
          descriptionPlaceholder="e.g., Companies with 100-500 employees in the software industry..."
          submitLabel={<><Wand2 className="w-4 h-4 mr-2" />Generate Account</>}
          cancelLabel="Cancel"
          defaultName=""
          defaultDescription=""
          isLoading={isGenerating || isCreating}
        />
      </div>
    );
  }

  // Generation handler with company context
  const handleGenerate = ({ name, description }: { name: string; description: string }) => {
    const companyContext = company ? {
      companyName: company.companyName || '',
      description: company.description || '',
      businessProfileInsights: company.businessProfileInsights || [],
      capabilities: company.capabilities || [],
      useCaseAnalysisInsights: company.useCaseAnalysisInsights || [],
      positioningInsights: company.positioningInsights || [],
      targetCustomerInsights: company.targetCustomerInsights || [],
    } : {};

    entityPageState.generateEntity({
      accountProfileName: name, 
      hypothesis: description,
      companyContext,
    });
  };

  // Simplified firmographics update - Stage 4 improvement
  const handleFirmographicsUpdate = (newFirmographics: any) => {
    console.log('[COMPONENT-UPDATE] Firmographics update initiated:', {
      accountId,
      updateType: 'firmographics',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['firmographics'],
      timestamp: new Date().toISOString()
    });

    if (token && accountId && entityPageState.displayEntity) {
      // Authenticated update - simplified with new service layer
      updateWithFieldPreservation({
        currentAccount: entityPageState.displayEntity,
        updates: { firmographics: newFirmographics },
      }, {
        onSuccess: () => {
          console.log('[COMPONENT-UPDATE] Firmographics updated successfully');
          setFirmographicsModalOpen(false);
        },
        onError: (error) => {
          handleComponentError("Firmographics update", error);
        }
      });
    } else {
      // Draft update for unauthenticated users
      const draftAccounts = DraftManager.getDrafts('account');
      const currentDraft = draftAccounts.find(draft => draft.tempId);
      
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          'account',
          currentDraft.tempId,
          { firmographics: newFirmographics }
        );
        
        if (updateSuccess) {
          console.log('✅ [AccountDetail] Draft updated successfully');
          
          // Update React Query cache using normalization - Stage 3 improvement
          const currentAccount = queryClient.getQueryData(['account', accountId]) as any;
          if (currentAccount) {
            const updatedAccount = normalizeAccountResponse({
              ...currentAccount,
              firmographics: newFirmographics,
              data: {
                ...currentAccount.data,
                firmographics: newFirmographics
              }
            });
            
            console.log('[CACHE-UPDATE] Firmographics cache update via normalization:', {
              accountId,
              fieldUpdated: 'firmographics',
              cacheUpdateMethod: 'normalized',
              preservedFieldCount: Object.keys(updatedAccount).length
            });
            
            queryClient.setQueryData(['account', accountId], updatedAccount);
          }
          
          // Close the modal
          setFirmographicsModalOpen(false);
        } else {
          console.error('❌ [AccountDetail] Failed to update draft');
        }
      } else {
        console.error('❌ [AccountDetail] No current draft found for unauthenticated user');
      }
    }
  };

  // Simplified buying signals update - Stage 4 improvement  
  const handleBuyingSignalsUpdate = (updatedSignals: APIBuyingSignal[]) => {
    console.log('[COMPONENT-UPDATE] Buying signals update initiated:', {
      accountId,
      updateType: 'buyingSignals',
      currentFormat: 'normalized-camelCase',
      updateKeys: ['buyingSignals'],
      timestamp: new Date().toISOString()
    });

    if (token && accountId && entityPageState.displayEntity) {
      // Authenticated update - simplified with new service layer
      updateWithFieldPreservation({
        currentAccount: entityPageState.displayEntity,
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
    } else {
      // Draft update for unauthenticated users
      const draftAccounts = DraftManager.getDrafts('account');
      const currentDraft = draftAccounts.find(draft => draft.tempId);
      
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          'account',
          currentDraft.tempId,
          { buyingSignals: updatedSignals }
        );
        
        if (updateSuccess) {
          console.log('✅ [AccountDetail] Draft updated successfully with buying signals');
          
          // Update React Query cache using normalization - Stage 3 improvement
          const currentAccount = queryClient.getQueryData(['account', accountId]) as any;
          if (currentAccount) {
            const updatedAccount = normalizeAccountResponse({
              ...currentAccount,
              buyingSignals: updatedSignals,
              data: {
                ...currentAccount.data,
                buyingSignals: updatedSignals
              }
            });
            
            console.log('[CACHE-UPDATE] Buying signals cache update via normalization:', {
              accountId,
              fieldUpdated: 'buyingSignals',
              cacheUpdateMethod: 'normalized',
              preservedFieldCount: Object.keys(updatedAccount).length
            });
            
            queryClient.setQueryData(['account', accountId], updatedAccount);
          }
          
          // Close the modal
          setBuyingSignalsModalOpen(false);
        } else {
          console.error('❌ [AccountDetail] Failed to update draft with buying signals');
        }
      } else {
        console.error('❌ [AccountDetail] No current draft found for unauthenticated user');
      }
    }
  };

  // Get account name for display
  const accountName = entityPageState.displayEntity?.targetAccountName || 'Target Account';
  
  // Get company name for breadcrumb
  const companyDisplayName = company?.companyName || overview?.companyName || 'Company';
  
  // Dynamic path prefix based on authentication
  const pathPrefix = token ? '/app' : '/playground';
  
  console.log('[AccountDetail] Breadcrumb data:', {
    accountId,
    accountName,
    companyDisplayName,
    pathPrefix,
    isAuthenticated: !!token,
    companyData: company ? { id: company.id, companyName: company.companyName } : null,
    overviewData: overview ? { companyName: overview.companyName } : null
  });

  return (
    <>
      <SubNav
        breadcrumbs={[
          { label: "Company", href: `${pathPrefix}/company` },
          { label: "Target Accounts", href: `${pathPrefix}/accounts` },
          { label: accountName },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
        entityType="account"
      />
      <EntityPageLayout
      config={accountConfig}
      entityPageState={entityPageState}
      onGenerate={handleGenerate}
      generateModalProps={generationModalConfigs.account}
      overviewProps={{
        pageTitle: "Target Account",
        pageSubtitle: "Account analysis and insights",
        overviewTitle: entityPageState.displayEntity?.targetAccountName || "Target Account",
        bodyTitle: 'Account Profile',
        bodyText: entityPageState.displayEntity?.targetAccountDescription || 'No description available',
        entityType: 'account',
      }}
    >
      {/* Firmographics Section */}
      <Card className="mt-8 group">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Firmographics</CardTitle>
            <div className="text-sm text-gray-500">Searchable attributes for prospecting tools and databases</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit Firmographics"
            onClick={() => setFirmographicsModalOpen(true)}
            className="ml-2 invisible group-hover:visible"
          >
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
        </CardHeader>
        <CardContent>
          {entityPageState.displayEntity?.firmographics ? (
            <CriteriaTable 
              data={transformFirmographicsToCriteria(entityPageState.displayEntity.firmographics)}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No firmographics data available</div>
          )}
        </CardContent>
      </Card>

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
    </EntityPageLayout>

    {/* Edit Modals */}
    <EditCriteriaModal
      isOpen={firmographicsModalOpen}
      onClose={() => setFirmographicsModalOpen(false)}
      initialRows={transformFirmographicsToCriteria(entityPageState.displayEntity?.firmographics)}
      onSave={(rows: any[]) => {
        console.log('🔍 [AccountDetail] Converting CriteriaTable rows to Firmographics', { rows });
        
        // Use the flexible transformation function
        const newFirmographics = transformCriteriaToFirmographics(rows);
        
        console.log('🔍 [AccountDetail] Final firmographics object:', newFirmographics);
        
        // Handle firmographics update using the same pattern as Company.tsx
        handleFirmographicsUpdate(newFirmographics);
      }}
      title="Edit Firmographics"
    />

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
        
        // Update local state immediately
        setBuyingSignals(updatedSignals);
        
        // Handle buying signals update with field preservation
        handleBuyingSignalsUpdate(updatedSignals);
      }}
    />
    </>
  );
}