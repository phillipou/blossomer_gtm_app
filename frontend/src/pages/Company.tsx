import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { companyConfig, generationModalConfigs } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
import SummaryCard from '../components/cards/SummaryCard';
import AddCard from '../components/ui/AddCard';
import { getEntityColorForParent } from '../lib/entityColors';
import { useAuthState } from '../lib/auth';
import { 
  useGetCompany, 
  useAnalyzeCompany, 
  useUpdateCompany, 
  useUpdateCompanyPreserveFields, 
  useUpdateCompanyListFieldsPreserveFields, 
  useGetCompanies, 
  useCreateCompany 
} from '../lib/hooks/useCompany';
import { useGetAccounts, useDeleteAccount } from '../lib/hooks/useAccounts';
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import { DraftManager } from '../lib/draftManager';
import type { CompanyOverviewResponse, TargetAccountResponse, Account } from '../types/api';

export default function Company() {
  const { token } = useAuthState();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Universal hooks replace multiple auth-specific patterns
  const { create: createCompanyUniversal, isAuthenticated } = useEntityCRUD<CompanyOverviewResponse>('company');
  const { navigateWithPrefix, navigateToEntity } = useAuthAwareNavigation();

  // Direct hooks for generation and creation flow
  const { mutate: analyzeCompany, isPending: isAnalyzing } = useAnalyzeCompany(token);
  const { isPending: isCreating } = useCreateCompany(token);
  
  // Initialize entity page hook
  const entityPageState = useEntityPage<CompanyOverviewResponse>({
    config: companyConfig,
    hooks: {
      useGet: useGetCompany,
      useGetList: useGetCompanies,
      useGenerateWithAI: useAnalyzeCompany,
      useCreate: useCreateCompany,
      useUpdate: useUpdateCompany,
      useUpdatePreserveFields: useUpdateCompanyPreserveFields,
      useUpdateListFieldsPreserveFields: useUpdateCompanyListFieldsPreserveFields,
    },
  });

  // Get company ID from entity page state
  const companyId = entityPageState.displayEntity?.companyId || entityPageState.displayEntity?.id;

  // Fetch accounts using dual-path pattern from Accounts.tsx
  const { data: accounts, isLoading: isAccountsLoading } = useGetAccounts(companyId || "", token);
  const { mutate: deleteAccount } = useDeleteAccount(companyId);

  // Get draft accounts ONLY for unauthenticated users
  const draftAccounts = !isAuthenticated ? DraftManager.getDrafts('account').map(draft => ({
    ...draft.data,
    id: draft.tempId,
    isDraft: true,
  })) : [];

  // Combine accounts based on auth state - NO mixing of playground and database data
  const allAccounts = isAuthenticated ? (accounts || []) : [...(accounts || []), ...draftAccounts];

  // Simplified generation handler using universal hooks
  const handleGenerate = ({ name, description }: { name: string; description: string }) => {
    console.log('[COMPANY-GENERATION] Starting universal company creation flow:', {
      websiteUrl: name,
      userContext: description,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
    
    // Step 1: Analyze/Generate company data
    analyzeCompany(
      { websiteUrl: name, userInputtedContext: description },
      {
        onSuccess: async (generatedData: CompanyOverviewResponse) => {
          console.log('[COMPANY-GENERATION] Analysis successful, using universal create:', generatedData);
          
          try {
            // Step 2: Universal create handles both auth and unauth flows automatically
            const result = await createCompanyUniversal(generatedData, {
              navigateOnSuccess: false // Handle navigation manually for modal closing
            });
            
            console.log('[COMPANY-CREATION] Universal create successful:', {
              entityId: result.id,
              isTemporary: result.isTemporary,
              isAuthenticated
            });
            
            // Step 3: Close modal and navigate with auth-aware routing
            entityPageState.setIsGenerationModalOpen(false);
            navigateToEntity('company', result.id);
            
          } catch (createError) {
            console.error('[COMPANY-CREATION] Universal create failed:', createError);
            // Keep modal open for retry
          }
        },
        onError: (analyzeError) => {
          console.error('[COMPANY-GENERATION] Company analysis failed:', analyzeError);
          // Keep modal open for retry
        },
      }
    );
  };

  // Target account handlers using universal navigation and dual-path pattern
  const handleAccountClick = (accountId: string) => {
    navigateToEntity('account', accountId);
  };

  const handleEditAccount = (account: Account) => {
    navigateToEntity('account', account.id);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to delete this target account?')) {
      // Check if this is a draft account (temp ID format)
      if (accountId.startsWith('temp_')) {
        // Draft account - remove from DraftManager
        console.log('[COMPANY-DELETE] Deleting draft account:', accountId);
        DraftManager.removeDraft('account', accountId);
        // Force component re-render by updating forceUpdate state
        setForceUpdate(prev => prev + 1);
      } else if (isAuthenticated) {
        // Authenticated account - use mutation
        console.log('[COMPANY-DELETE] Deleting authenticated account:', accountId);
        deleteAccount(accountId);
      } else {
        console.warn('[COMPANY-DELETE] Cannot delete non-draft account for unauthenticated user:', accountId);
      }
    }
  };

  const handleAddAccount = () => {
    navigateWithPrefix('/accounts');
  };

  // Get company name for target accounts display
  const companyName = entityPageState.displayEntity?.companyName || 'Company';

  // Helper functions for account data (similar to Accounts.tsx)
  const getAccountName = (account: Account) => {
    return account.targetAccountName || account.name || 'Unnamed Account';
  };

  const getAccountDescription = (account: Account) => {
    return account.targetAccountDescription || account.description || 'No description available';
  };

  return (
    <EntityPageLayout
      config={companyConfig}
      entityPageState={entityPageState}
      onGenerate={handleGenerate}
      generateModalProps={{
        ...generationModalConfigs.company
      }}
      overviewProps={{
        pageTitle: 'Company Overview',
        pageSubtitle: 'Summary of your company',
        bodyTitle: 'Company Overview',
        bodyText: entityPageState.displayEntity?.description || 'No description available'
      }}
    >
      {/* Target Accounts Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Target Accounts
          {allAccounts.length > 0 && (
            <span className="text-gray-500 ml-2">({allAccounts.length})</span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
          {allAccounts.map((account) => (
            <SummaryCard
              key={account.id}
              title={getAccountName(account)}
              description={getAccountDescription(account)}
              parents={[
                { 
                  name: companyName, 
                  color: getEntityColorForParent('company'), 
                  label: 'Company' 
                }
              ]}
              onClick={() => handleAccountClick(account.id)}
              entityType="account"
            >
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={e => { 
                  e.stopPropagation(); 
                  handleEditAccount(account); 
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
                  handleDeleteAccount(account.id); 
                }} 
                className="text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </SummaryCard>
          ))}
          <AddCard onClick={handleAddAccount} label="Add New" />
        </div>
      </div>
    </EntityPageLayout>
  );
}