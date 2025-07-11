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

export default function AccountDetail() {
  const { token } = useAuthState();
  const { id: accountId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  
  // Modal state for firmographics and buying signals
  const [firmographicsModalOpen, setFirmographicsModalOpen] = useState(false);
  const [buyingSignalsModalOpen, setBuyingSignalsModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<any>(null);
  const [buyingSignals, setBuyingSignals] = useState<APIBuyingSignal[]>([]);
  
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

  // Transform function for firmographics to CriteriaTable format
  const transformFirmographicsToCriteria = (firmographics: Firmographics | undefined) => {
    if (!firmographics) return [];
    const criteria = [];
    if (firmographics.industry?.length) criteria.push({ label: "Industry", values: firmographics.industry.map(item => ({ text: item, color: "blue" })) });
    if (firmographics.employees) criteria.push({ label: "Company Size", values: [{ text: firmographics.employees, color: "green" }] });
    if (firmographics.departmentSize) criteria.push({ label: "Department Size", values: [{ text: firmographics.departmentSize, color: "green" }] });
    if (firmographics.revenue) criteria.push({ label: "Revenue", values: [{ text: firmographics.revenue, color: "green" }] });
    if (firmographics.geography?.length) criteria.push({ label: "Geography", values: firmographics.geography.map(item => ({ text: item, color: "purple" })) });
    if (firmographics.businessModel?.length) criteria.push({ label: "Business Model", values: firmographics.businessModel.map(item => ({ text: item, color: "orange" })) });
    if (firmographics.fundingStage?.length) criteria.push({ label: "Funding Stage", values: firmographics.fundingStage.map(item => ({ text: item, color: "red" })) });
    if (firmographics.companyType?.length) criteria.push({ label: "Company Type", values: firmographics.companyType.map(item => ({ text: item, color: "gray" })) });
    if (firmographics.keywords?.length) criteria.push({ label: "Keywords", values: firmographics.keywords.map(item => ({ text: item, color: "yellow" })) });
    return criteria.map((item, index) => ({ ...item, id: String(index) }));
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
        const newFirmographics: Firmographics = {
          industry: [],
          keywords: []
        };
        rows.forEach((row: any) => {
          const values = row.values.map((v: any) => v.text);
          switch (row.label.toLowerCase()) {
            case 'industry': newFirmographics.industry = values; break;
            case 'company size': newFirmographics.employees = values[0]; break;
            case 'department size': newFirmographics.departmentSize = values[0]; break;
            case 'revenue': newFirmographics.revenue = values[0]; break;
            case 'geography': newFirmographics.geography = values; break;
            case 'business model': newFirmographics.businessModel = values; break;
            case 'funding stage': newFirmographics.fundingStage = values; break;
            case 'company type': newFirmographics.companyType = values; break;
            case 'keywords': newFirmographics.keywords = values; break;
          }
        });
        // Update the account with new firmographics
        if (entityPageState.handleOverviewEdit) {
          entityPageState.handleOverviewEdit({
            name: entityPageState.displayEntity?.targetAccountName || '',
            description: entityPageState.displayEntity?.targetAccountDescription || '',
            firmographics: newFirmographics
          });
        }
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
        
        if (modalEditingSignal) {
          setBuyingSignals(signals => signals.map(s => 
            s.title === modalEditingSignal.title ? 
            { ...s, title, description, priority, type, detection_method } : s
          ));
        } else {
          setBuyingSignals(signals => [
            ...signals,
            { title, description, priority, type, detection_method },
          ]);
        }
      }}
    />
    </>
  );
}