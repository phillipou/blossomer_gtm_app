import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import CustomersList from "./Accounts";
import OverviewCard from "../components/cards/OverviewCard";
import DashboardLoading from "../components/dashboard/DashboardLoading";
import { ErrorDisplay } from "../components/ErrorDisplay";
import type { CompanyOverviewResponse, TargetAccountResponse, ApiError } from "../types/api";
import ListInfoCard from "../components/cards/ListInfoCard";
import PageHeader from "../components/navigation/PageHeader";
import { getStoredTargetAccounts } from "../lib/accountService";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";
import { Edit3, Trash2, Building2, Wand2 } from "lucide-react";
import { getEntityColorForParent } from "../lib/entityColors";
import { useGetCompany, useAnalyzeCompany, useUpdateCompany, useUpdateCompanyPreserveFields, useUpdateCompanyListFieldsPreserveFields, useGetCompanies, useCreateCompany } from "../lib/hooks/useCompany";
import { useAuthState } from "../lib/auth";
import { useAutoSave } from "../lib/hooks/useAutoSave";
import { DraftManager } from "../lib/draftManager";
import ListInfoCardEditModal, { type ListInfoCardItem } from '../components/cards/ListInfoCardEditModal';
import InputModal from '../components/modals/InputModal';
import { isApiError } from "../lib/utils";
import { getCompanies } from '../lib/companyService';

const STATUS_STAGES = [
  { label: "Loading website...", percent: 20 },
  { label: "Analyzing company...", percent: 45 },
  { label: "Researching market...", percent: 70 },
  { label: "Finalizing...", percent: 90 },
];

type CardKey =
  | "businessProfileInsights"
  | "capabilities"
  | "positioningInsights"
  | "useCaseAnalysisInsights"
  | "targetCustomerInsights"
  | "objections";

const cardConfigs: {
  key: CardKey;
  label: string;
  bulleted?: boolean;
  getItems: (overview: CompanyOverviewResponse) => string[];
  subtitle: string;
}[] = [
  {
    key: "businessProfileInsights",
    label: "Business Profile",
    bulleted: true,
    getItems: (overview) => overview.businessProfileInsights || [],
    subtitle: "Core business information and customer profile."
  },
  {
    key: "capabilities",
    label: "Key Features & Capabilities",
    bulleted: true,
    getItems: (overview) => overview.capabilities || [],
    subtitle: "Core features and strengths of the company/product."
  },
  {
    key: "positioningInsights",
    label: "Positioning",
    bulleted: true,
    getItems: (overview) => overview.positioningInsights || [],
    subtitle: "How they position themselves in the market."
  },
  {
    key: "useCaseAnalysisInsights",
    label: "Process & Impact Analysis",
    bulleted: true,
    getItems: (overview) => overview.useCaseAnalysisInsights || [],
    subtitle: "Analysis of processes and problems this solution addresses."
  },
  {
    key: "targetCustomerInsights",
    label: "Target Customer Insights",
    bulleted: true,
    getItems: (overview) => overview.targetCustomerInsights || [],
    subtitle: "Ideal customer profile and decision-maker insights."
  },
  {
    key: "objections",
    label: "Potential Concerns",
    bulleted: true,
    getItems: (overview) => overview.objections || [],
    subtitle: "Common concerns prospects might have about this solution."
  },
];

export default function Company() {
  console.log("Company: Component rendered");
  const location = useLocation();
  const navigate = useNavigate();
  const { id: companyId } = useParams<{ id: string }>();
  const { token } = useAuthState();
  const { data: companies } = useGetCompanies(token);

  // Determine the mode based on route params and auth state
  const isAuthenticatedMode = !!token && !!companyId;
  const isUnauthenticatedMode = !token && !companyId;

  // Handle redirect logic for authenticated users on /company
  useEffect(() => {
    if (token && !companyId && companies && companies.length > 0) {
      // Authenticated user on /company with companies - redirect to most recent company
      console.log("Company: Authenticated user on /company route with companies - redirecting to most recent");
      navigate(`/app/company/${companies[companies.length - 1].id}`, { replace: true });
      return;
    } else if (!token && companyId) {
      // Unauthenticated user on /company/:id (invalid state)
      console.log("Company: Unauthenticated user on /company/:id route - redirecting to /company");
      navigate('/playground/company', { replace: true });
      return;
    }
  }, [token, companyId, companies, navigate]);

  const queryClient = useQueryClient();

  // Clear any stale cache data when authenticated user lands on company page
  useEffect(() => {
    if (token && companyId) {
      console.log("Company: Authenticated user with companyId - ensuring fresh data by clearing stale cache");
      // Remove any stale cache entries that might have localStorage contamination
      queryClient.removeQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    }
  }, [token, companyId, queryClient]);
  const { data: overview, isLoading: isGetLoading, error: getError, refetch } = useGetCompany(token, companyId);
  const { mutate: analyzeCompany, isPending: isAnalyzing, error: analyzeError } = useAnalyzeCompany(token, companyId);
  const updateCompanyMutation = useUpdateCompany(token, companyId);
  const { mutate: updateCompany } = updateCompanyMutation;
  const { mutateAsync: updateCompanyListFieldsWithFieldPreservationAsync } = useUpdateCompanyListFieldsPreserveFields(token, companyId);
  const createCompanyMutation = useCreateCompany(token);
  const { mutate: createCompany, isPending: isCreatingCompany } = createCompanyMutation;
  const { isLoading: isLoadingCompanies } = useGetCompanies(token);
  const { mutate: updateCompanyWithFieldPreservation } = useUpdateCompanyPreserveFields(token, companyId);

  const [generatedCompanyData, setGeneratedCompanyData] = useState<any>(null);

  const [progressStage, setProgressStage] = useState(() => {
    console.log("Company: Initializing progressStage state");
    return 0;
  });
  const [activeTab] = useState(() => {
    console.log("Company: Initializing activeTab state");
    return "company";
  });
  const [targetAccounts, setTargetAccounts] = useState<(
    TargetAccountResponse & { id: string; createdAt: string }
  )[]>(() => {
    console.log("Company: Initializing targetAccounts state");
    return [];
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CardKey | null>(null);
  const [editingItems, setEditingItems] = useState<ListInfoCardItem[]>([]);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [companyUrlInput, setCompanyUrlInput] = useState("");
  const [companyContextInput, setCompanyContextInput] = useState("");
  const apiResponseProcessed = useRef(false);

  // Get draft company and combine with existing overview
  const draftCompanies = DraftManager.getDrafts('company');
  const draftOverview = draftCompanies.length > 0 ? draftCompanies[0].data : null;

  console.log('[DEBUG] Before useAutoSave, generatedCompanyData is:', generatedCompanyData);

  // Auto-save hook for generated companies
  const autoSave = useAutoSave({
    entity: 'company',
    data: generatedCompanyData,
    createMutation: createCompanyMutation,
    updateMutation: updateCompanyMutation,
    isAuthenticated: !!token,
    entityId: companyId,
    onSaveSuccess: (savedCompany) => {
      console.log("Company: Company auto-saved successfully", savedCompany);
      setGeneratedCompanyData(null);
      navigate(`/app/company/${savedCompany.id}`, { replace: true });
    },
    onSaveError: (error) => {
      console.error("Company: Auto-save failed", error);
    },
  });

  useEffect(() => {
    console.log('[DEBUG] generatedCompanyData state changed, new value:', generatedCompanyData);
  }, [generatedCompanyData]);

  // Debug modal state
  useEffect(() => {
    console.log("Company: isGenerationModalOpen state changed to", isGenerationModalOpen);
  }, [isGenerationModalOpen]);

  // Log state changes
  useEffect(() => {
    console.log("Company: progressStage state changed to", progressStage);
  }, [progressStage]);

  useEffect(() => {
    console.log("Company: targetAccounts state changed to", targetAccounts);
  }, [targetAccounts]);



  useEffect(() => {
    console.log("Company: useEffect for API response. location.state:", location.state);
    const apiResponse = location.state?.apiResponse;

    // Only process location.state apiResponse for unauthenticated users
    // Authenticated users should not use demo/playground data from navigation state
    if (apiResponse && !apiResponseProcessed.current && !token) {
      console.log("Company: API response found in location.state for unauthenticated user, setting query data.", apiResponse);
      apiResponseProcessed.current = true;
      queryClient.setQueryData(['company', companyId], apiResponse);

      console.log("Company: Unauthenticated user - triggering auto-save for draft creation");
      // Store the full AI response format for consistent display logic
      setGeneratedCompanyData(apiResponse);
    } else if (apiResponse && token) {
      console.log("Company: Ignoring location.state apiResponse for authenticated user - would contaminate database mode");
    }
  }, [location.state, queryClient, companyId, token]);

  useEffect(() => {
    console.log("Company: useEffect for analysis progress. isAnalyzing:", isAnalyzing);
    if (isAnalyzing) {
      setProgressStage(0);
      const timer = setInterval(() => {
        setProgressStage(prev => {
          if (prev < STATUS_STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 4000);
      return () => {
        console.log("Company: Clearing analysis progress timer.");
        clearInterval(timer);
      };
    }
  }, [isAnalyzing]);

  useEffect(() => {
    console.log("Company: useEffect for target accounts from local storage.");
    const accounts = getStoredTargetAccounts();
    setTargetAccounts(accounts);
    console.log("Company: Loaded target accounts:", accounts);
  }, []);

  const handleListEdit = (field: CardKey, items: string[]) => {
    setEditingField(field);
    setEditingItems(items.map((text, i) => ({ id: i.toString(), text })));
    // Do NOT open the modal here; let useEffect handle it
  };

  // Open the edit dialog only after both editingField and editingItems are set
  useEffect(() => {
    if (editingField && editingItems.length > 0 && !isEditDialogOpen) {
      setIsEditDialogOpen(true);
    }
  }, [editingField, editingItems, isEditDialogOpen]);

  // Replace the existing handleSave definition with a useCallback version
  const handleSave = useCallback(async (newItems: ListInfoCardItem[]): Promise<void> => {
    console.log('[LIST-EDIT][DEBUG] === HANDLE SAVE STARTED ===');
    console.log('[LIST-EDIT][DEBUG] Function called with items:', newItems);
    if (!editingField) {
      console.log('[LIST-EDIT][DEBUG] No editingField, returning early');
      return;
    }

    const updatedItems = newItems.map(item => item.text);
    let listFieldUpdates: Record<string, string[]> = {};
    listFieldUpdates[editingField] = updatedItems;
    console.log('[LIST-EDIT][DEBUG] editingField:', editingField);
    console.log('[LIST-EDIT][DEBUG] listFieldUpdates object:', listFieldUpdates);
    console.log('[LIST-EDIT][DEBUG] token:', !!token);
    console.log('[LIST-EDIT][DEBUG] companyId:', companyId);
    console.log('[LIST-EDIT][DEBUG] overview:', !!overview);

    if (token && companyId && overview) {
      console.log('[LIST-EDIT][DEBUG] === AUTHENTICATED PATH ===');
      if (!(editingField in overview)) {
        console.warn(`[LIST-EDIT][DEBUG] WARNING: editingField '${editingField}' not present in overview`, overview);
      } else {
        console.log('[LIST-EDIT][DEBUG] editingField found in overview ✅');
      }
      console.log('[LIST-EDIT][DEBUG] overview before update:', overview);
      console.log('[LIST-EDIT][DEBUG] About to call mutateAsync...');
      try {
        console.log('[LIST-EDIT][DEBUG] Calling mutateAsync with:', {
          currentOverview: overview,
          listFieldUpdates,
        });
        const result = await updateCompanyListFieldsWithFieldPreservationAsync({
          currentOverview: overview,
          listFieldUpdates,
        });
        console.log('[LIST-EDIT][DEBUG] mutateAsync completed successfully:', result);
        closeEditDialog();
        console.log('[LIST-EDIT][DEBUG] === HANDLE SAVE COMPLETED SUCCESSFULLY ===');
      } catch (err) {
        console.error('[LIST-EDIT][DEBUG] mutateAsync failed:', err);
        console.error('[LIST-EDIT][DEBUG] Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          err
        });
        throw err;
      }
    } else {
      console.log('[LIST-EDIT][DEBUG] === UNAUTHENTICATED PATH ===');
      const currentDraft = draftCompanies.find(draft => draft.tempId);
      if (currentDraft) {
        if (!(editingField in currentDraft.data)) {
          console.warn(`[LIST-EDIT][DEBUG] WARNING: editingField '${editingField}' not present in draft data`, currentDraft.data);
        }
        console.log('[LIST-EDIT][DEBUG] draft data before update:', currentDraft.data);
        const updateSuccess = DraftManager.updateDraftPreserveFields('company', currentDraft.tempId, listFieldUpdates);
        const updatedDraft = DraftManager.getDraft('company', currentDraft.tempId);
        if (updateSuccess) {
          console.log('[LIST-EDIT][DEBUG] DraftManager.updateDraftPreserveFields SUCCESS');
          console.log('[LIST-EDIT][DEBUG] draft data after update:', updatedDraft?.data);
          queryClient.setQueryData(['company', companyId], (prevData: any) => {
            const updated = {
              ...prevData,
              ...listFieldUpdates,
            };
            console.log('[LIST-EDIT][DEBUG] Updated React Query cache for draft', updated);
            return updated;
          });
          closeEditDialog();
        } else {
          console.error('[LIST-EDIT][DEBUG] Failed to update draft with field preservation');
          throw new Error('Failed to update draft');
        }
      } else {
        console.error('[LIST-EDIT][DEBUG] No current draft found for unauthenticated update');
        throw new Error('No current draft found');
      }
    }
  }, [editingField, overview, token, companyId, draftCompanies, queryClient]);

  const handleRetry = useCallback(() => {
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }
    console.log("Company: handleRetry called.");
    const url = location.state?.url;
    const icp = location.state?.icp;
    if (url) {
      console.log("Company: Retrying analysis with URL:", url, "and ICP:", icp);
      analyzeCompany({ websiteUrl: url, userInputtedContext: icp });
    } else {
      console.log("Company: No URL in state, refetching company data.");
      refetch();
    }
  }, [location.state, analyzeCompany, refetch, token, navigate]);

  const handleAccountClick = (accountId: string) => {
    console.log("Company: handleAccountClick called with accountId:", accountId);
    navigate(`/target-accounts/${accountId}`);
  };

  const handleEditAccount = (account: TargetAccountResponse & { id: string; createdAt: string }) => {
    console.log("Company: handleEditAccount called with account:", account);
    navigate(`/target-accounts/${account.id}`);
  };

  const handleDeleteAccount = (accountId: string) => {
    console.log("Company: handleDeleteAccount called with accountId:", accountId);
    setTargetAccounts(prev => {
      const updated = prev.filter(account => account.id !== accountId);
      console.log("Company: Updated targetAccounts after deletion:", updated);
      return updated;
    });
    const updatedAccounts = getStoredTargetAccounts().filter(account => account.id !== accountId);
    localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
    console.log("Company: Removed account from local storage.");
  };

  const handleAddAccount = () => {
    console.log("Company: handleAddAccount called.");
    navigate('/target-accounts');
  };


  const handleGenerateCompany = useCallback(({ name, description }: { name: string; description: string }) => {
    console.log("Company: handleGenerateCompany called with:", { websiteUrl: name, userInputtedContext: description });
    analyzeCompany(
      { websiteUrl: name, userInputtedContext: description },
      {
        onSuccess: (response) => {
          console.log("Company: AI analysis/generation successful (from /generate-ai)", response);
          const companyData = {
            ...response,
            companyUrl: name,
            companyName: response.companyName || new URL(name).hostname
          };

          // Use AI response format consistently
          setGeneratedCompanyData(companyData);
          setIsGenerationModalOpen(false);
        },
        onError: (err) => {
          console.error('Company: Company generation failed:', err);
        },
      }
    );
  }, [analyzeCompany]);

  // Show loading while checking for companies (authenticated users on /company)
  if (token && !companyId && isLoadingCompanies) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={100}
      />
    );
  }

  if (isGetLoading || isAnalyzing) {
    return (
      <DashboardLoading
        loading={true}
        progressPercent={isAnalyzing ? (STATUS_STAGES[progressStage]?.percent || 0) : 100}
      />
    );
  }

  const errorToDisplay = getError || analyzeError;
  if (errorToDisplay) {
    if (isApiError(errorToDisplay)) {
      return <ErrorDisplay error={errorToDisplay} onRetry={handleRetry} onHome={() => navigate('/')} />;
    }
    return <ErrorDisplay error={{ errorCode: 'UNKNOWN_ERROR', message: errorToDisplay.message }} onRetry={handleRetry} onHome={() => navigate('/')} />;
  }

  // For authenticated users: ONLY use backend data (never localStorage drafts)
  // For unauthenticated users: use drafts as fallback during generation flow
  const displayOverview = token ? overview : (overview || draftOverview);

  // Debug: Detailed data source analysis for authenticated users
  if (token) {
    console.log("Company: AUTHENTICATED USER DATA ANALYSIS", {
      hasBackendData: !!overview,
      hasLocalStorageDrafts: !!draftOverview,
      backendCompanyName: overview?.companyName,
      backendDescription: overview?.description?.substring(0, 50) + "...",
      draftCompanyName: draftOverview?.companyName,
      draftDescription: draftOverview?.description?.substring(0, 50) + "...",
      finalDisplayName: displayOverview?.companyName,
      finalDisplayDescription: displayOverview?.description?.substring(0, 50) + "...",
      usingBackendData: displayOverview === overview,
      draftCount: draftCompanies.length
    });

    // Critical warning if localStorage data differs from backend
    if (draftOverview && overview !== draftOverview) {
      console.warn("Company: CRITICAL - Authenticated user has localStorage draft data that differs from backend!", {
        backend: overview,
        localStorage: draftOverview,
        willUseBackend: displayOverview === overview
      });
    }
  }

  const handleOverviewEdit = (values: { name: string; description: string }) => {
    console.log('[EDIT-OVERVIEW] handleOverviewEdit called', { values, token, companyId });
    const updatedName = values.name;
    const updatedDescription = values.description;

    if (token && companyId) {
      // Authenticated user - use field-preserving update
      const currentOverview = overview || displayOverview;
      if (!currentOverview) {
        console.error('[EDIT-OVERVIEW] Cannot update - no current overview data available');
        return;
      }
      console.log('[EDIT-OVERVIEW] Calling updateCompanyWithFieldPreservation', { currentOverview, updatedName, updatedDescription });
      updateCompanyWithFieldPreservation({
        currentOverview,
        updates: {
          name: updatedName,
          description: updatedDescription,
        },
      }, {
        onSuccess: (result: any) => {
          console.log('[EDIT-OVERVIEW] updateCompanyWithFieldPreservation SUCCESS', result);
        },
        onError: (err: unknown) => {
          console.error('[EDIT-OVERVIEW] updateCompanyWithFieldPreservation ERROR', err);
        }
      });
    } else {
      // Unauthenticated user - update draft with field preservation
      const currentDraft = draftCompanies.find(draft => draft.tempId);
      if (currentDraft) {
        console.log('[EDIT-OVERVIEW] Calling DraftManager.updateDraftPreserveFields', { tempId: currentDraft.tempId, updatedName, updatedDescription });
        const updateSuccess = DraftManager.updateDraftPreserveFields('company', currentDraft.tempId, {
          name: updatedName,
          description: updatedDescription,
        });
        if (updateSuccess) {
          console.log('[EDIT-OVERVIEW] DraftManager.updateDraftPreserveFields SUCCESS');
          // Update React Query cache to reflect the change
          queryClient.setQueryData(['company', companyId], (prevData: any) => {
            const updated = {
              ...prevData,
              companyName: updatedName,
              description: updatedDescription,
            };
            console.log('[EDIT-OVERVIEW] Updated React Query cache for draft', updated);
            return updated;
          });
        } else {
          console.error('[EDIT-OVERVIEW] Failed to update draft with field preservation');
        }
      } else {
        console.error('[EDIT-OVERVIEW] No current draft found for unauthenticated update');
      }
    }
  };

  // Handle authenticated users with no companies
  const showNoCompanies = token && !companyId && companies && companies.length === 0 && !draftOverview;
  // Handle unauthenticated users with no localStorage data
  const showNoOverview = !displayOverview;

  const companyName = displayOverview?.companyName || "Company";
  const domain = displayOverview?.companyUrl || "";

  console.log("Company: About to render, isGenerationModalOpen =", isGenerationModalOpen);

  // Helper to close and reset edit dialog state
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingField(null);
    setEditingItems([]);
  };

  return (
    <>
      <style>{`
        .blue-bullet::marker {
          color: #2563eb;
        }
      `}</style>
      {showNoCompanies || showNoOverview ? (
        <div className="flex flex-col h-full">
          <PageHeader
            title="Your Company"
            subtitle="Get started by analyzing your first company"
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-3">Generate Your First Company</h2>
                <p className="text-gray-600 mb-6">
                  Create your first company profile with our AI-powered wizard.
                  Enter your website URL and let us help you generate detailed business insights.
                </p>
              </div>
              <Button
                onClick={() => {
                  console.log("Company: Button clicked, opening modal");
                  setIsGenerationModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Your First Company
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <PageHeader
            title="Your Company"
            subtitle={draftOverview && !overview ? "Company analysis and insights (Draft - not yet saved)" : "Company analysis and insights"}
          />
          {activeTab === "company" && (
            <div className="flex-1 p-8 space-y-8">
              <OverviewCard
                title={companyName}
                subtitle={domain}
                bodyTitle="Company Overview"
                bodyText={displayOverview?.description || "No description available"}
                showButton={false}
                onEdit={handleOverviewEdit}
                entityType="company"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {cardConfigs.map(({ key, label, getItems, subtitle, bulleted }) => {
                  const items = displayOverview ? getItems(displayOverview) : [];
                  const isEditable = true;


                  return (
                    <ListInfoCard
                      key={key}
                      title={label}
                      items={items}
                      onEditRequest={isEditable ? (items) => handleListEdit(key, items) : undefined}
                      renderItem={(item: string, idx: number) => (
                        bulleted ? (
                          <span key={idx} className="text-sm text-gray-700 blue-bullet mb-2">{item}</span>
                        ) : (
                          <div key={idx} className="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">{item}</div>
                        )
                      )}
                      editModalSubtitle={subtitle}
                      entityType="company"
                    />
                  );
                })}
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Target Accounts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
                  {targetAccounts.map((account) => (
                    <SummaryCard
                      key={account.id}
                      title={account.targetAccountName}
                      description={account.targetAccountDescription}
                      parents={[
                        { name: companyName, color: getEntityColorForParent('company'), label: "Company" },
                      ]}
                      onClick={() => handleAccountClick(account.id)}
                      entityType="account"
                    >
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditAccount(account); }} className="text-blue-600">
                        <Edit3 className="w-5 h-5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteAccount(account.id); }} className="text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </SummaryCard>
                  ))}
                  <AddCard onClick={handleAddAccount} label="Add New" />
                </div>
              </div>
            </div>
          )}
          {activeTab === "target-accounts" && (
            <div className="flex-1 p-8">
              <CustomersList />
            </div>
          )}
        </div>
      )}
      {/* Only render ListInfoCardEditModal when ready: isEditDialogOpen and editingItems.length > 0 */}
      {isEditDialogOpen && editingItems.length > 0 && (
        <ListInfoCardEditModal
          key={editingField} // Force remount on field change
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          onSave={handleSave}
          initialItems={editingItems}
          // Use the label from cardConfigs for the modal title
          title={(() => {
            const config = cardConfigs.find(cfg => cfg.key === editingField);
            return config ? config.label : '';
          })()}
          subtitle={(() => {
            const config = cardConfigs.find(cfg => cfg.key === editingField);
            return config ? config.subtitle : 'Update the list of items below.';
          })()}
        />
      )}
      {/* Debug: Log the handleSave function reference */}
      {console.log('[LIST-EDIT][DEBUG] Modal onSave prop:', handleSave)}
      <InputModal
        isOpen={isGenerationModalOpen}
        onClose={() => {
          setIsGenerationModalOpen(false);
        }}
        onSubmit={handleGenerateCompany}
        title="Generate Company Overview"
        subtitle="Enter your company's website URL to generate a comprehensive analysis and insights."
        nameLabel="Website URL"
        namePlaceholder="https://yourcompany.com"
        nameType="url"
        nameRequired={true}
        descriptionLabel="Additional Context (Optional)"
        descriptionPlaceholder="e.g., We're a B2B SaaS company focused on marketing automation for small businesses..."
        showDescription={true}
        descriptionRequired={false}
        submitLabel={isAnalyzing || autoSave.isSaving ? (<><Wand2 className="w-4 h-4 mr-2" />Analyzing...</>) : (<><Wand2 className="w-4 h-4 mr-2" />Generate Overview</>)}
        cancelLabel="Cancel"
        isLoading={isAnalyzing || autoSave.isSaving}
        error={typeof analyzeError === 'object' && analyzeError && 'message' in analyzeError ? (analyzeError as any).message : undefined}
      />
    </>
  );
}