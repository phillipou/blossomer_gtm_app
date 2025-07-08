import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, ArrowLeft, Plus, Edit3, Trash2 } from "lucide-react";
import { CriteriaTable } from "../components/tables/CriteriaTable";
import SubNav from "../components/navigation/SubNav";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import OverviewCard from "../components/cards/OverviewCard";
import { getStoredTargetAccounts, addPersonaToTargetAccount, getPersonasForTargetAccount } from "../lib/accountService";
import { transformFirmographicsToTable, transformBuyingSignalsToCards } from "../utils/targetAccountTransforms";
import { transformKeysToCamelCase } from "../lib/utils";
import type { TargetPersonaResponse, FirmographicRow, BuyingSignal, ApiError, TargetAccountResponse } from "../types/api";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import EditCriteriaModal from "../components/modals/EditCriteriaModal";
import InputModal from "../components/modals/InputModal";
import { generateTargetPersona } from "../lib/accountService";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";
import ListInfoCard from "../components/cards/ListInfoCard";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accountDetail, setAccountDetail] = useState<TargetAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buying signals modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<BuyingSignal | null>(null);
  const [buyingSignals, setBuyingSignals] = useState<BuyingSignal[]>([]);

  const [firmographics, setFirmographics] = useState<FirmographicRow[]>([]);
  const [firmoModalOpen, setFirmoModalOpen] = useState(false);
  const [rationale, setRationale] = useState<string[]>([]);

  // Tab state for sub navigation
  const [activeTab, setActiveTab] = useState<string>("accounts");

  const [personas, setPersonas] = useState<TargetPersonaResponse[]>([]);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<TargetPersonaResponse | null>(null);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // Use the analyzed company website from the overview hook (matches CustomersList.tsx)
  const overview = useCompanyOverview();
  let websiteUrl = overview?.companyUrl || "";
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    websiteUrl = `https://${websiteUrl}`;
  }

  const handlePersonaClick = (personaId: string) => {
    console.log('Navigating to persona:', personaId, 'for account:', id);
    navigate(`/target-accounts/${id}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: TargetPersonaResponse) => {
    setEditingPersona(persona);
    setPersonaModalOpen(true);
  };
  const handleDeletePersona = (id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    try {
      const accounts = getStoredTargetAccounts();
      const account = accounts.find((p) => p.id === id);
      console.log("[AccountDetail] Loaded account: ", account);
      if (account) {
        setAccountDetail(account);
        const firmographicsData = Array.isArray(account.firmographics)
          ? account.firmographics as FirmographicRow[]
          : (account.firmographics ? transformFirmographicsToTable(account.firmographics as unknown as Record<string, string | string[]>) : []);
        setFirmographics(firmographicsData);
        setBuyingSignals(transformBuyingSignalsToCards(account.buyingSignals || []));
        setRationale(account.targetAccountRationale);
      } else {
        setError("Account not found");
      }
    } catch (err) {
      console.error("Error in TargetAccountDetail useEffect:", err);
      setError("Failed to load account data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load personas from localStorage on mount and when id changes
  useEffect(() => {
    if (id) {
      setPersonas(getPersonasForTargetAccount(id));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !accountDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || "Account not found"}</p>
            <Button onClick={() => navigate('/target-accounts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Target Accounts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('AccountDetail render, id:', id);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sub Navigation */}
      <SubNav
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Target Accounts", href: "/target-accounts" },
          { label: accountDetail?.targetAccountName || "Target Account" }
        ]}
        activeSubTab={activeTab}
        setActiveSubTab={setActiveTab}
        subTabs={[
          { label: "Account Details", value: "accounts" },
        ]}
      />
      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {activeTab === "accounts" && (
          <>
            {/* Target Description */}
            <OverviewCard
              title={accountDetail?.targetAccountName}
              bodyText={accountDetail?.targetAccountDescription}
              showButton={false}
              onEdit={({ name, description }) => {
                setAccountDetail((prev) => {
                  if (!prev) return null;
                  const updated: TargetAccountResponse = {
                    ...prev,
                    targetAccountName: name,
                    targetAccountDescription: description,
                    // preserve other canonical fields
                    targetAccountRationale: prev.targetAccountRationale || [],
                    firmographics: prev.firmographics || {},
                    buyingSignals: prev.buyingSignals || [],
                    buyingSignalsRationale: prev.buyingSignalsRationale || [],
                    metadata: prev.metadata || {},
                  };
                  // Update localStorage with canonical shape
                  const accounts = getStoredTargetAccounts();
                  // Only update accounts that are TargetAccountResponse shape
                  const updatedAccounts = accounts
                    .map((p) =>
                      p.targetAccountName === prev.targetAccountName ? updated : p
                    );
                  localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
                  return updated;
                });
              }}
            />
            {/* Firmographics and Why Good Fit Row */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Firmographics Card with edit affordance */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Firmographics</CardTitle>
                  <div className="text-sm text-gray-500">Targeting criteria for prospecting tools</div>
                </CardHeader>
                <CardContent>
                  <CriteriaTable 
                    data={firmographics} 
                    editable={true}
                    onEdit={() => setFirmoModalOpen(true)}
                  />
                </CardContent>
              </Card>
              {/* Why they're a good fit InfoCard with edit affordance */}
              <div className="flex-1">
                <ListInfoCard
                  title={"Why they're a good fit"}
                  items={rationale}
                  onEdit={undefined}
                  renderItem={(item: string, idx: number) => (
                    <span key={idx} className="text-sm text-gray-700">{item}</span>
                  )}
                  editModalSubtitle={"Why this account is a good fit for your solution."}
                />
              </div>
            </div>
            {/* Buying Signals Block */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Buying Signals</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => { setModalEditingSignal(null); setModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </div>
                <div className="text-sm text-gray-500">Indicators that suggest a prospect is ready to buy or engage with your solution</div>
              </CardHeader>
              <CardContent>
                {buyingSignals.length > 0 ? (
                  <BuyingSignalsCard
                    signals={buyingSignals}
                    onEdit={(signal) => { setModalEditingSignal(signal); setModalOpen(true); }}
                    onDelete={(id) => setBuyingSignals(signals => signals.filter(s => s.id !== id))}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No buying signals identified
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Buying Signals Rationale Card (moved below Buying Signals) */}
            <ListInfoCard
              title={"Buying Signals Rationale"}
              items={accountDetail.buyingSignalsRationale || []}
              onEdit={undefined}
              renderItem={(item: string, idx: number) => (
                <span key={idx} className="text-sm text-gray-700">{item}</span>
              )}
              editModalSubtitle={"Logic behind buying signal choices."}
            />
            {/* Personas Section (only show account-specific personas) */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Personas for this Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona) => (
                  <SummaryCard
                    key={persona.id}
                    title={persona.targetPersonaName}
                    description={persona.targetPersonaDescription}
                    parents={[
                      { name: overview?.companyName || "", color: "bg-green-400", label: "Company" },
                      { name: accountDetail?.targetAccountName || "Account", color: "bg-red-400", label: "Account" },
                    ]}
                    onClick={() => handlePersonaClick(persona.id)}
                  >
                    <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditPersona(persona); }} className="text-blue-600">
                      <Edit3 className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeletePersona(persona.id); }} className="text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </SummaryCard>
                ))}
                {/* Add New Persona Card */}
                <AddCard onClick={() => { setEditingPersona(null); setPersonaModalOpen(true); }} label="Add New" />
              </div>
            </div>
          </>
        )}
      </div>
      {/* Buying Signal Modal */}
      <EditBuyingSignalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingSignal={modalEditingSignal || undefined}
        onSave={(values: Record<string, string | boolean>) => {
          const label = String(values.label || '').trim();
          const description = String(values.description || '').trim();
          const priority = String(values.priority || '').trim();
          setBuyingSignals(prevSignals => {
            let updatedSignals;
            if (modalEditingSignal) {
              // Edit
              updatedSignals = prevSignals.map(s =>
                s.id === modalEditingSignal.id ? { ...s, label, description, priority } : s
              );
            } else {
              // Add
              updatedSignals = [
                ...prevSignals,
                { id: String(Date.now()), label, description, priority, enabled: true },
              ];
            }
            // Map to APIBuyingSignal shape for localStorage
            const allowedPriorities = ["Low", "Medium", "High"];
            const apiBuyingSignals = updatedSignals.map(s => {
              let priority = 'priority' in s && typeof s.priority === 'string' ? s.priority : "Low";
              if (!allowedPriorities.includes(priority)) {
                priority = "Low";
              }
              return {
                title: s.label,
                description: s.description,
                type: 'type' in s && typeof s.type === 'string' ? s.type : "",
                priority: priority as "Low" | "Medium" | "High",
                detection_method: 'detection_method' in s && typeof s.detection_method === 'string' ? s.detection_method : (('detectionMethod' in s && typeof s.detectionMethod === 'string') ? s.detectionMethod : ""),
              };
            });
            // Update localStorage for the account
            if (accountDetail && id) {
              const accounts = getStoredTargetAccounts();
              const idx = accounts.findIndex(acc => acc.id === id);
              if (idx !== -1) {
                accounts[idx] = {
                  ...accounts[idx],
                  buyingSignals: apiBuyingSignals,
                };
                localStorage.setItem('target_accounts', JSON.stringify(accounts));
              }
            }
            return updatedSignals;
          });
        }}
      />
      <EditCriteriaModal
        isOpen={firmoModalOpen}
        onClose={() => setFirmoModalOpen(false)}
        initialRows={firmographics}
        onSave={setFirmographics}
        title="Edit Firmographics"
      />
      {/* Persona Creation Modal */}
      <InputModal
        isOpen={personaModalOpen}
        onClose={() => { setPersonaModalOpen(false); setPersonaError(null); setPersonaLoading(false); }}
        onSubmit={async ({ name, description }) => {
          setPersonaLoading(true);
          setPersonaError(null);
          try {
            if (!websiteUrl) {
              setPersonaError("Company website URL is missing. Cannot generate persona.");
              setPersonaLoading(false);
              return;
            }
            if (!overview?.companyName) {
              setPersonaError("Company name is missing from overview. Cannot generate persona.");
              setPersonaLoading(false);
              return;
            }
            // Construct userInputtedContext as an object
            const userInputtedContext = {
              personaName: name,
              personaDescription: description,
            };
            // Build companyContext from overview (as in CustomersList.tsx)
            const companyContext = {
              companyName: overview.companyName || '',
              companyUrl: overview.companyUrl || '',
              ...(overview.companyOverview ? { companyOverview: overview.companyOverview } : {}),
              ...(overview.productDescription ? { productDescription: overview.productDescription } : {}),
              ...(overview.capabilities && overview.capabilities.length ? { capabilities: overview.capabilities } : {}),
              ...(overview.businessModel && overview.businessModel.length ? { businessModel: overview.businessModel } : {}),
              ...(overview.differentiatedValue && overview.differentiatedValue.length ? { differentiatedValue: overview.differentiatedValue } : {}),
              ...(overview.customerBenefits && overview.customerBenefits.length ? { customerBenefits: overview.customerBenefits } : {}),
            };
            // Pass the full target account as targetAccountContext
            let targetAccountContext = undefined;
            const accounts = getStoredTargetAccounts();
            const account = accounts.find((p) => p.id === id);
            if (account) {
              targetAccountContext = {
                ...account, // Send the full account object
                targetAccountName: accountDetail?.targetAccountName || "",
                targetAccountDescription: accountDetail?.targetAccountDescription || "",
              };
            }
            // Debug: log all context objects before API call
            console.log('[Persona Generation] websiteUrl:', websiteUrl);
            console.log('[Persona Generation] userInputtedContext:', userInputtedContext);
            console.log('[Persona Generation] companyContext:', companyContext);
            console.log('[Persona Generation] targetAccountContext (flattened):', targetAccountContext);
            const response = await generateTargetPersona(
              websiteUrl,
              userInputtedContext.personaName,
              userInputtedContext.personaDescription,
              undefined, // additionalContext
              companyContext,
              targetAccountContext // targetAccountContext as TargetAccountResponse
            );
            console.log('[Persona Generation] API response:', response);
            // Transform the API response from snake_case to camelCase
            const transformedResponse = transformKeysToCamelCase<TargetPersonaResponse>(response);
            const newPersona: TargetPersonaResponse = {
              ...transformedResponse,
              id: String(Date.now()),
              createdAt: new Date().toLocaleDateString(),
              targetPersonaName: transformedResponse.targetPersonaName || '',
              targetPersonaDescription: transformedResponse.targetPersonaDescription || '',
            };
            addPersonaToTargetAccount(id!, newPersona);
            setPersonas(getPersonasForTargetAccount(id!));
            setPersonaModalOpen(false);
          } catch (err: unknown) {
            setPersonaError((err as ApiError)?.message || (err as Error).message || "Failed to generate persona.");
          } finally {
            setPersonaLoading(false);
          }
        }}
        title={"Describe a Persona"}
        subtitle={"What type of person is your ideal buyer or user?"}
        nameLabel="Persona Name"
        namePlaceholder="e.g. Startup Founder, Marketing Director, etc."
        descriptionLabel="Persona Description"
        descriptionPlaceholder="Describe the role, responsibilities, and traits of this persona."
        submitLabel={personaLoading ? "Generating..." : "Generate Persona"}
        cancelLabel="Cancel"
        isLoading={personaLoading}
        defaultName={editingPersona ? editingPersona.targetPersonaName : ""}
        defaultDescription={editingPersona ? editingPersona.targetPersonaDescription : ""}
        error={personaError || undefined}
      />
    </div>
  );
} 