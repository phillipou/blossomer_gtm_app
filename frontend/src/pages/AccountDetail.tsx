import React from 'react';
import { useEntityPage } from '../lib/hooks/useEntityPage';
import { accountConfig, generationModalConfigs } from '../lib/entityConfigs';
import EntityPageLayout from '../components/EntityPageLayout';
import { 
  useGetAccount, 
  useGenerateAccount, 
  useUpdateAccount, 
  useUpdateAccountPreserveFields, 
  useUpdateAccountListFieldsPreserveFields, 
  useGetAccounts, 
  useCreateAccount 
} from '../lib/hooks/useAccounts';
import type { TargetAccountResponse } from '../types/api';

export default function AccountDetail() {
  // Initialize entity page hook
  const entityPageState = useEntityPage<TargetAccountResponse>({
    config: accountConfig,
    hooks: {
      useGet: useGetAccount,
      useGetList: useGetAccounts,
      useGenerateWithAI: useGenerateAccount,
      useCreate: useCreateAccount,
      useUpdate: useUpdateAccount,
      useUpdatePreserveFields: useUpdateAccountPreserveFields,
      useUpdateListFieldsPreserveFields: useUpdateAccountListFieldsPreserveFields,
    },
  });

  // Generation handler
  const handleGenerate = ({ name, description }: { name: string; description: string }) => {
    entityPageState.generateEntity(
      { 
        accountProfileName: name, 
        hypothesis: description,
        // TODO: Add company context from parent company
      },
      {
        onSuccess: (response: TargetAccountResponse) => {
          console.log('Account generation successful', response);
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
        title: accountName,
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