import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, ArrowLeft, Plus, Edit3, Check, X, Trash2 } from "lucide-react";
import { FirmographicsTable } from "../components/tables/FirmographicsTable";
import SubNav from "../components/navigation/SubNav";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import OverviewCard from "../components/cards/OverviewCard";
import { getStoredTargetAccounts, addPersonaToTargetAccount, getPersonasForTargetAccount } from "../lib/accountService";
import { transformTargetAccountToDetail, transformBuyingSignalsToCards } from "../utils/targetAccountTransforms";
import type { TargetPersonaResponse, TargetAccount, FirmographicRow, BuyingSignal, TargetAccountDetail, ApiError } from "../types/api";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import InfoCard from "../components/cards/InfoCard";
import EditFirmographicsModal from "../components/modals/EditFirmographicsModal";
import InputModal from "../components/modals/InputModal";
import { generateTargetPersona } from "../lib/accountService";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import SummaryCard from "../components/cards/SummaryCard";
import AddCard from "../components/ui/AddCard";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accountDetail, setAccountDetail] = useState<TargetAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buying signals modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<BuyingSignal | null>(null);
  const [buyingSignals, setBuyingSignals] = useState<BuyingSignal[]>([]);

  const [firmographics, setFirmographics] = useState<FirmographicRow[]>([]);
  const [firmoModalOpen, setFirmoModalOpen] = useState(false);
  const [hoveredFirmo, setHoveredFirmo] = useState(false);
  // State for rationale editing
  const [rationale, setRationale] = useState("");
  const [editingRationale, setEditingRationale] = useState(false);
  const [editRationaleContent, setEditRationaleContent] = useState("");

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
      const account = accounts.find((p: TargetAccount) => p.id === id);
      if (account) {
        const detailData = transformTargetAccountToDetail(account);
        setAccountDetail(detailData);
        setBuyingSignals(transformBuyingSignalsToCards(detailData.buyingSignals));
        const firmographicsData = Array.isArray(detailData.firmographics) ? detailData.firmographics : [];
        setFirmographics(firmographicsData);
        setRationale(detailData.rationale || "");
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
          { label: accountDetail?.title || "Target Account" }
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
              title={accountDetail.title}
              bodyText={accountDetail.description}
              showButton={false}
              onEdit={({ name, description }) => {
                setAccountDetail((prev: TargetAccountDetail | null) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    title: name,
                    description: description
                  };
                });
                // Also update the stored account
                const accounts = getStoredTargetAccounts();
                const updatedAccounts = accounts.map((p: TargetAccount) => 
                  p.id === id ? { ...p, name: name, description: description } : p
                );
                localStorage.setItem('target_accounts', JSON.stringify(updatedAccounts));
              }}
            />
            {/* Firmographics and Why Good Fit Row */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Firmographics Card with edit affordance */}
              <Card
                className="group relative flex-1"
                onMouseEnter={() => setHoveredFirmo(true)}
                onMouseLeave={() => setHoveredFirmo(false)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Firmographics</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setFirmoModalOpen(true)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
                    tabIndex={-1}
                    style={{ pointerEvents: hoveredFirmo ? "auto" : "none" }}
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <FirmographicsTable data={firmographics} />
                </CardContent>
              </Card>
              {/* Why they're a good fit InfoCard with edit affordance */}
              <div className="flex-1">
                {editingRationale ? (
                  <div className="space-y-4 group relative rounded-xl border bg-card text-card-foreground shadow p-6">
                    <label className="font-semibold">Why they're a good fit</label>
                    <textarea
                      value={editRationaleContent}
                      onChange={e => setEditRationaleContent(e.target.value)}
                      className="min-h-[120px] w-full border rounded p-2"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => { setRationale(editRationaleContent); setEditingRationale(false); }}>
                        <Check className="w-4 h-4 mr-2" />Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingRationale(false)}>
                        <X className="w-4 h-4 mr-2" />Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group relative h-full"
                  >
                    <InfoCard
                      title={"Why they're a good fit"}
                      items={[rationale]}
                      onEdit={() => { setEditRationaleContent(rationale); setEditingRationale(true); }}
                    />
                  </div>
                )}
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
            {/* Personas Section (only show account-specific personas) */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Personas for this Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona) => (
                  <SummaryCard
                    key={persona.id}
                    title={persona.name}
                    description={persona.description}
                    parents={[
                      { name: overview?.companyName || "", color: "bg-green-400", label: "Company" },
                      { name: accountDetail?.title || "Account", color: "bg-red-400", label: "Account" },
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
          if (modalEditingSignal) {
            // Edit
            setBuyingSignals(signals => signals.map(s => s.id === modalEditingSignal.id ? { ...s, label, description } : s));
          } else {
            // Add
            setBuyingSignals(signals => [
              ...signals,
              { id: String(Date.now()), label, description, enabled: true },
            ]);
          }
        }}
      />
      <EditFirmographicsModal
        isOpen={firmoModalOpen}
        onClose={() => setFirmoModalOpen(false)}
        initialRows={firmographics}
        onSave={setFirmographics}
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
            const account = accounts.find((p: TargetAccount) => p.id === id);
            if (account) {
              targetAccountContext = {
                ...account, // Send the full account object
                targetAccountName: accountDetail.title || "",
                targetAccountDescription: accountDetail.description || "",
              };
            }
            // Debug: log all context objects before API call
            console.log('[Persona Generation] websiteUrl:', websiteUrl);
            console.log('[Persona Generation] userInputtedContext:', userInputtedContext);
            console.log('[Persona Generation] companyContext:', companyContext);
            console.log('[Persona Generation] targetAccountContext (flattened):', targetAccountContext);
            const response = await generateTargetPersona(websiteUrl, userInputtedContext, companyContext, targetAccountContext as unknown as Record<string, string | string[]>);
            console.log('[Persona Generation] API response:', response);
            const newPersona: TargetPersonaResponse = {
              id: String(Date.now()),
              name: response.personaName,
              description: response.personaDescription,
              createdAt: new Date().toLocaleDateString(),
              overview: response.overview,
              painPoints: response.painPoints,
              profile: response.profile,
              likelyJobTitles: response.likelyJobTitles,
              primaryResponsibilities: response.primaryResponsibilities,
              statusQuo: response.statusQuo,
              useCases: response.useCases,
              desiredOutcomes: response.desiredOutcomes,
              keyConcerns: response.keyConcerns,
              whyWeMatter: response.whyWeMatter,
              buyingSignals: response.personaBuyingSignals || response.buyingSignals || [],
              // Add the required API response properties
              personaName: response.personaName,
              personaDescription: response.personaDescription,
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
        defaultName={editingPersona ? editingPersona.name : ""}
        defaultDescription={editingPersona ? editingPersona.description : ""}
        error={personaError || undefined}
      />
    </div>
  );
} 