import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { companyConfig, generationModalConfigs } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
import SummaryCard from '../components/cards/SummaryCard';
import AddCard from '../components/ui/AddCard';
import { getEntityColorForParent } from '../lib/entityColors';
import { getStoredTargetAccounts } from '../lib/accountService';
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
import { useEntityCRUD } from '../lib/hooks/useEntityCRUD';
import { useAuthAwareNavigation } from '../lib/hooks/useAuthAwareNavigation';
import type { CompanyOverviewResponse, TargetAccountResponse } from '../types/api';

export default function Company() {
  const { token } = useAuthState();
  const [targetAccounts, setTargetAccounts] = useState<
    (TargetAccountResponse & { id: string; createdAt: string })[]
  >([]);

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


  // Load target accounts
  useEffect(() => {
    const accounts = getStoredTargetAccounts();
    setTargetAccounts(accounts);
  }, []);

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

  // Target account handlers using universal navigation
  const handleAccountClick = (accountId: string) => {
    navigateToEntity('account', accountId);
  };

  const handleEditAccount = (account: TargetAccountResponse & { id: string; createdAt: string }) => {
    navigateToEntity('account', account.id);
  };

  const handleDeleteAccount = (accountId: string) => {
    setTargetAccounts(prev => prev.filter(account => account.id !== accountId));
    const updatedAccounts = getStoredTargetAccounts().filter(account => account.id !== accountId);
    localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
  };

  const handleAddAccount = () => {
    navigateWithPrefix('/accounts');
  };

  // Get company name for target accounts display
  const companyName = entityPageState.displayEntity?.companyName || 'Company';

  return (
    <EntityPageLayout
      config={companyConfig}
      entityPageState={entityPageState}
      onGenerate={handleGenerate}
      generateModalProps={{
        ...generationModalConfigs.company
      }}
      overviewProps={{
        pageTitle: companyName,
        pageSubtitle: entityPageState.displayEntity?.companyUrl || '',
        bodyTitle: 'Company Overview',
        bodyText: entityPageState.displayEntity?.description || 'No description available'
      }}
    >
      {/* Target Accounts Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Target Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
          {targetAccounts.map((account) => (
            <SummaryCard
              key={account.id}
              title={account.targetAccountName}
              description={account.targetAccountDescription}
              parents={[
                { 
                  name: companyName, 
                  color: getEntityColorForParent('company'), 
                  label: 'Company' 
                },
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