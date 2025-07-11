import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { accountConfig, generationModalConfigs } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
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
import { useGetCompany, useGetUserCompany } from '../lib/hooks/useCompany';
import { useAuthState } from '../lib/auth';
import { useCompanyOverview } from '../lib/useCompanyOverview';
import { Wand2, Plus } from 'lucide-react';
import type { TargetAccountResponse, AccountCreate, TargetAccountAPIRequest, APIBuyingSignal, Firmographics } from '../types/api';
import BuyingSignalsCard from '../components/cards/BuyingSignalsCard';
import EditBuyingSignalModal from '../components/modals/EditBuyingSignalModal';
import EditCriteriaModal from '../components/modals/EditCriteriaModal';
import { CriteriaTable } from '../components/tables/CriteriaTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DraftManager } from '../lib/draftManager';
import { useQueryClient } from '@tanstack/react-query';

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
  
  // Get company data for context (needed for both existing and new accounts)
  const cachedOverview = useCompanyOverview();
  const { data: fetchedOverview } = useGetUserCompany(token);
  const overview = cachedOverview || fetchedOverview;
  const companyId = overview?.companyId || "";
  
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
      useGet: useGetAccountForEntityPage,
      useGetList: useGetAccountsForEntityPage,
      useGenerateWithAI: useGenerateAccount,
      useCreate: useCreateAccount,
      useUpdate: useUpdateAccount,
      useUpdatePreserveFields: useUpdateAccountPreserveFields,
      useUpdateListFieldsPreserveFields: useUpdateAccountListFieldsPreserveFields,
    },
  });

  console.log('🔍 [AccountDetail] Component rendered with accountId:', accountId);
  console.log('🔍 [AccountDetail] Token:', token ? 'exists' : 'missing');
  console.log('🔍 [AccountDetail] Entity display data:', entityPageState.displayEntity);
  console.log('🔍 [AccountDetail] Entity display data keys:', entityPageState.displayEntity ? Object.keys(entityPageState.displayEntity) : 'no entity');

  // Transform function for firmographics to CriteriaTable format
  const transformFirmographicsToCriteria = (firmographics: any) => {
    if (!firmographics) return [];
    const criteria = [];
    
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
    
    rows.forEach((row: any) => {
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
  
  // Show creation modal for new accounts
  useEffect(() => {
    if (isNewAccount) {
      setIsCreationModalOpen(true);
    }
  }, [isNewAccount]);

  // Populate buying signals state when account data changes
  useEffect(() => {
    if (entityPageState.displayEntity?.buyingSignals) {
      setBuyingSignals(entityPageState.displayEntity.buyingSignals);
    } else {
      setBuyingSignals([]);
    }
  }, [entityPageState.displayEntity]);
  
  // Handle creation modal close
  const handleCreationModalClose = () => {
    setIsCreationModalOpen(false);
    navigate(-1); // Go back to accounts list
  };
  
  // Handle account creation
  const handleCreateAccount = ({ name, description }: { name: string; description: string }) => {
    if (!overview) {
      console.error("Cannot generate account without company overview.");
      return;
    }
    
    const companyContext = {
      companyName: overview.companyName || '',
      description: overview.description || '',
      businessProfileInsights: overview.businessProfileInsights || [],
      capabilities: overview.capabilities || [],
      useCaseAnalysisInsights: overview.useCaseAnalysisInsights || [],
      positioningInsights: overview.positioningInsights || [],
      targetCustomerInsights: overview.targetCustomerInsights || [],
    };

    generateAccount({
      website_url: overview.companyUrl || '',
      account_profile_name: name,
      hypothesis: description,
      company_context: companyContext,
    }, {
      onSuccess: (generatedData) => {
        console.log("Account generated successfully", generatedData);
        // Create the account
        const accountToSave: AccountCreate = {
          name: generatedData.targetAccountName || name,
          data: generatedData,
        };
        
        createAccount(accountToSave, {
          onSuccess: (savedAccount) => {
            console.log("Account created successfully", savedAccount);
            setIsCreationModalOpen(false);
            navigate(`/app/accounts/${savedAccount.id}`, { replace: true });
          },
          onError: (error) => {
            console.error("Account creation failed", error);
          },
        });
      },
      onError: (error) => {
        console.error("Account generation failed", error);
      },
    });
  };
  
  // If this is a new account, show creation modal
  if (isNewAccount) {
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

  // Handle firmographics update with field preservation (following Company.tsx pattern)
  const handleFirmographicsUpdate = (newFirmographics: any) => {
    console.log('🔍 [AccountDetail] Firmographics update requested', {
      newFirmographics,
      currentAccount: entityPageState.displayEntity,
      currentAccountKeys: entityPageState.displayEntity ? Object.keys(entityPageState.displayEntity) : [],
      isAuthenticated: !!token,
      accountId
    });

    if (token && accountId && entityPageState.displayEntity) {
      // Authenticated user - use field-preserving backend update
      console.log('📡 [AccountDetail] Updating firmographics via backend with field preservation');
      
      updateWithFieldPreservation({
        currentAccount: entityPageState.displayEntity,
        updates: { firmographics: newFirmographics },
      }, {
        onSuccess: (updatedAccount) => {
          console.log('✅ [AccountDetail] Firmographics updated successfully via backend', updatedAccount);
          setFirmographicsModalOpen(false);
        },
        onError: (error) => {
          console.error('❌ [AccountDetail] Failed to update firmographics via backend', error);
          // Keep modal open on error so user can retry
        }
      });
    } else {
      // Unauthenticated user - use localStorage draft update with field preservation
      console.log('💾 [AccountDetail] Updating firmographics via localStorage draft');
      
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
          
          // Update React Query cache to reflect the change
          queryClient.setQueryData(['account', accountId], (prevData: any) => ({
            ...prevData,
            firmographics: newFirmographics,
          }));
          
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

  // Handle buying signals update with field preservation (following same pattern)
  const handleBuyingSignalsUpdate = (updatedSignals: APIBuyingSignal[]) => {
    console.log('🔍 [AccountDetail] Buying signals update requested', {
      updatedSignals,
      currentAccount: entityPageState.displayEntity,
      isAuthenticated: !!token,
      accountId
    });

    if (token && accountId && entityPageState.displayEntity) {
      // Authenticated user - use field-preserving backend update
      console.log('📡 [AccountDetail] Updating buying signals via backend with field preservation');
      
      updateWithFieldPreservation({
        currentAccount: entityPageState.displayEntity,
        updates: { buyingSignals: updatedSignals },
      }, {
        onSuccess: (updatedAccount) => {
          console.log('✅ [AccountDetail] Buying signals updated successfully via backend', updatedAccount);
          setBuyingSignalsModalOpen(false);
        },
        onError: (error) => {
          console.error('❌ [AccountDetail] Failed to update buying signals via backend', error);
          // Keep modal open on error so user can retry
        }
      });
    } else {
      // Unauthenticated user - use localStorage draft update with field preservation
      console.log('💾 [AccountDetail] Updating buying signals via localStorage draft');
      
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
          
          // Update React Query cache to reflect the change
          queryClient.setQueryData(['account', accountId], (prevData: any) => ({
            ...prevData,
            buyingSignals: updatedSignals,
          }));
          
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

  return (
    <>
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
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Firmographics</CardTitle>
          <div className="text-sm text-gray-500">Searchable attributes for prospecting tools and databases</div>
        </CardHeader>
        <CardContent>
          {entityPageState.displayEntity?.firmographics ? (
            <CriteriaTable 
              data={transformFirmographicsToCriteria(entityPageState.displayEntity.firmographics)}
              editable={true}
              onEdit={() => setFirmographicsModalOpen(true)}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No firmographics data available</div>
          )}
        </CardContent>
      </Card>

      {/* Buying Signals Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div>
              <CardTitle className="mb-1">Buying Signals</CardTitle>
              <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setModalEditingSignal(null); setBuyingSignalsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {buyingSignals.length > 0 ? (
            <BuyingSignalsCard
              buyingSignals={buyingSignals}
              editable={true}
              onEdit={(signals) => {
                // For now, just open the modal to add new signals
                setModalEditingSignal(null);
                setBuyingSignalsModalOpen(true);
              }}
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