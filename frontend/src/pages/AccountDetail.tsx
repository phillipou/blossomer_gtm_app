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
import { Wand2 } from 'lucide-react';
import type { TargetAccountResponse, AccountCreate, TargetAccountAPIRequest } from '../types/api';

export default function AccountDetail() {
  const { token } = useAuthState();
  const { id: accountId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  
  console.log('🔍 [AccountDetail] Component rendered with accountId:', accountId);
  console.log('🔍 [AccountDetail] Token:', token ? 'exists' : 'missing');
  
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
  
  // Show creation modal for new accounts
  useEffect(() => {
    if (isNewAccount) {
      setIsCreationModalOpen(true);
    }
  }, [isNewAccount]);
  
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

  // Generation handler with company context
  const handleGenerate = ({ name, description }: { name: string; description: string }) => {
    const companyContext = company ? {
      companyName: company.companyName || company.name,
      description: company.description || '',
      businessProfileInsights: company.businessProfileInsights || [],
      capabilities: company.capabilities || [],
      useCaseAnalysisInsights: company.useCaseAnalysisInsights || [],
      positioningInsights: company.positioningInsights || [],
      targetCustomerInsights: company.targetCustomerInsights || [],
    } : {};

    entityPageState.generateEntity(
      { 
        accountProfileName: name, 
        hypothesis: description,
        companyContext,
      },
      {
        onSuccess: (response: TargetAccountResponse) => {
          console.log('Account generation successful with company context', response);
          // The useEntityPage hook handles the auto-save and navigation
        },
        onError: (err: any) => {
          console.error('Account generation failed:', err);
        },
      }
    );
  };

  // Get account name for display
  const accountName = entityPageState.displayEntity?.targetAccountName || 'Target Account';

  return (
    <EntityPageLayout
      config={accountConfig}
      entityPageState={entityPageState}
      onGenerate={handleGenerate}
      generateModalProps={generationModalConfigs.account}
      overviewProps={{
        title: "Target Account",
        subtitle: entityPageState.displayEntity?.targetAccountDescription || '',
        bodyTitle: 'Account Profile',
        bodyText: entityPageState.displayEntity?.targetAccountDescription || 'No description available',
        entityType: 'account',
      }}
    >
      {/* Additional account-specific content can go here */}
      {/* For example, firmographics display, buying signals, etc. */}
    </EntityPageLayout>
  );
}