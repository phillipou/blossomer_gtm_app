import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { CompanyOverviewResponse, TargetAccountResponse } from '../types/api';

export default function Company() {
  const navigate = useNavigate();
  const { token } = useAuthState();
  const [targetAccounts, setTargetAccounts] = useState<
    (TargetAccountResponse & { id: string; createdAt: string })[]
  >([]);

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

  // Generation handler
  const handleGenerate = ({ name, description }: { name: string; description: string }) => {
    entityPageState.generateEntity(
      { websiteUrl: name, userInputtedContext: description },
      {
        onSuccess: (response: CompanyOverviewResponse) => {
          console.log('Company generation successful', response);
          // The useEntityPage hook handles the auto-save and navigation
        },
        onError: (err: any) => {
          console.error('Company generation failed:', err);
        },
      }
    );
  };

  // Target account handlers with auth-aware routing
  const handleAccountClick = (accountId: string) => {
    const prefix = token ? '/app' : '/playground';
    navigate(`${prefix}/accounts/${accountId}`);
  };

  const handleEditAccount = (account: TargetAccountResponse & { id: string; createdAt: string }) => {
    const prefix = token ? '/app' : '/playground';
    navigate(`${prefix}/accounts/${account.id}`);
  };

  const handleDeleteAccount = (accountId: string) => {
    setTargetAccounts(prev => prev.filter(account => account.id !== accountId));
    const updatedAccounts = getStoredTargetAccounts().filter(account => account.id !== accountId);
    localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
  };

  const handleAddAccount = () => {
    const prefix = token ? '/app' : '/playground';
    navigate(`${prefix}/accounts`);
  };

  // Get company name for target accounts display
  const companyName = entityPageState.displayEntity?.companyName || 'Company';

  return (
    <EntityPageLayout
      config={companyConfig}
      entityPageState={entityPageState}
      onGenerate={handleGenerate}
      generateModalProps={generationModalConfigs.company}
      overviewProps={{
        title: companyName,
        subtitle: entityPageState.displayEntity?.companyUrl || '',
        bodyTitle: 'Company Overview',
        bodyText: entityPageState.displayEntity?.description || 'No description available',
        entityType: 'company',
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