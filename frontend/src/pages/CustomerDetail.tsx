import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, ArrowLeft, Plus, Edit3, Check, X, Trash2 } from "lucide-react";
import { FirmographicsTable } from "../components/tables/FirmographicsTable";
import SubNav from "../components/navigation/SubNav";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";
import OverviewCard from "../components/cards/OverviewCard";
import { getStoredCustomerProfiles, addPersonaToCustomer, getPersonasForCustomer, transformBuyingSignals } from "../lib/customerService";
import { transformTargetAccountToDetail } from "../utils/targetAccountTransforms";
import type { CustomerProfile, TargetPersonaResponse } from "../types/api";
import EditBuyingSignalModal from "../components/modals/EditBuyingSignalModal";
import InfoCard from "../components/cards/InfoCard";
import EditFirmographicsModal from "../components/modals/EditFirmographicsModal";
import InputModal from "../components/modals/InputModal";
import { generateTargetPersona } from "../lib/customerService";
import { useCompanyOverview } from "../lib/useCompanyOverview";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buying signals modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingSignal, setModalEditingSignal] = useState<any>(null);
  const [buyingSignals, setBuyingSignals] = useState<any[]>([]);

  const [firmographics, setFirmographics] = useState<any[]>([]);
  const [firmoModalOpen, setFirmoModalOpen] = useState(false);
  const [hoveredFirmo, setHoveredFirmo] = useState(false);
  // State for rationale editing
  const [rationale, setRationale] = useState("");
  const [editingRationale, setEditingRationale] = useState(false);
  const [editRationaleContent, setEditRationaleContent] = useState("");
  const [hoveredRationale, setHoveredRationale] = useState(false);

  // Tab state for sub navigation
  const [activeTab, setActiveTab] = useState<string>("accounts");

  const [personas, setPersonas] = useState<TargetPersonaResponse[]>([]);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<TargetPersonaResponse | null>(null);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // Use the analyzed company website from the overview hook (matches CustomersList.tsx)
  const overview = useCompanyOverview();
  let websiteUrl = overview?.company_url || "";
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    websiteUrl = `https://${websiteUrl}`;
  }

  const handlePersonaClick = (personaId: string) => {
    console.log('Navigating to persona:', personaId, 'for account:', id);
    navigate(`/customers/${id}/personas/${personaId}`);
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
      const profiles = getStoredCustomerProfiles();
      const profile = profiles.find((p: any) => p.id === id);
      if (profile) {
        const detailData = transformTargetAccountToDetail(profile);
        setCustomerDetail(detailData);
        setBuyingSignals(transformBuyingSignals(detailData.buyingSignals));
        setFirmographics(detailData.firmographics || []);
        setRationale(detailData.rationale || "");
      } else {
        setError("Target account profile not found");
      }
    } catch (err) {
      console.error("Error in CustomerDetail useEffect:", err);
      setError("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load personas from localStorage on mount and when id changes
  useEffect(() => {
    if (id) {
      setPersonas(getPersonasForCustomer(id));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !customerDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
            <Button onClick={() => navigate('/customers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('CustomerDetail render, id:', id);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sub Navigation */}
      <SubNav
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: customerDetail?.title || "Target Account" }
        ]}
        activeSubTab={activeTab}
        setActiveSubTab={setActiveTab}
        subTabs={[
          { label: "Accounts", value: "accounts" },
          { label: "Personas", value: "personas" },
        ]}
      />
      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {activeTab === "accounts" && (
          <>
            {/* Target Description */}
            <OverviewCard
              title={customerDetail.title}
              bodyText={customerDetail.description}
              showButton={false}
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
                    onMouseEnter={() => setHoveredRationale(true)}
                    onMouseLeave={() => setHoveredRationale(false)}
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
                    onAdd={() => { setModalEditingSignal(null); setModalOpen(true); }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No buying signals identified
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Personas Section (also shown in accounts tab) */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Personas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona) => (
                  <Card
                    key={persona.id}
                    className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
                    onClick={() => handlePersonaClick(persona.id)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <span className="inline-block mb-2">
                          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
                            {persona.name}
                          </span>
                        </span>
                        <p className="text-gray-700 text-base mt-2 mb-2 line-clamp-3">{persona.description}</p>
                        <p className="text-xs text-gray-400 mt-4">Created: {persona.createdAt}</p>
                      </div>
                      <div className="flex space-x-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditPersona(persona); }} className="text-blue-600">
                          <Edit3 className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeletePersona(persona.id); }} className="text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {/* Add New Persona Card */}
                <Card
                  className="flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 hover:bg-blue-50 min-h-[180px]"
                  onClick={() => { setEditingPersona(null); setPersonaModalOpen(true); }}
                >
                  <div className="flex flex-col items-center">
                    <Plus className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-blue-600 font-medium">Add New</span>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
        {activeTab === "personas" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Personas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <Card
                  key={persona.id}
                  className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
                  onClick={() => handlePersonaClick(persona.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <span className="inline-block mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
                          {persona.name}
                        </span>
                      </span>
                      <p className="text-gray-700 text-base mt-2 mb-2 line-clamp-3">{persona.description}</p>
                      <p className="text-xs text-gray-400 mt-4">Created: {persona.createdAt}</p>
                    </div>
                    <div className="flex space-x-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleEditPersona(persona); }} className="text-blue-600">
                        <Edit3 className="w-5 h-5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeletePersona(persona.id); }} className="text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {/* Add New Persona Card */}
              <Card
                className="flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 hover:bg-blue-50 min-h-[180px]"
                onClick={() => { setEditingPersona(null); setPersonaModalOpen(true); }}
              >
                <div className="flex flex-col items-center">
                  <Plus className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-blue-600 font-medium">Add New</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      {/* Buying Signal Modal */}
      <EditBuyingSignalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingSignal={modalEditingSignal}
        onSave={(values: Record<string, any>) => {
          const { label, description } = values;
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
            const user_inputted_context = `persona_name: ${name}\npersona_description: ${description}`;
            console.log('Persona API request:', { website_url: websiteUrl, user_inputted_context });
            const response = await generateTargetPersona(websiteUrl, user_inputted_context);
            console.log('generateTargetPersona response:', response);
            const newPersona: TargetPersonaResponse = {
              id: String(Date.now()),
              name: response.persona_name,
              description: response.persona_description,
              createdAt: new Date().toLocaleDateString(),
              overview: response.overview,
              painPoints: response.pain_points,
              profile: response.profile,
              likelyJobTitles: response.likely_job_titles,
              primaryResponsibilities: response.primary_responsibilities,
              statusQuo: response.status_quo,
              useCases: response.use_cases,
              desiredOutcomes: response.desired_outcomes,
              keyConcerns: response.key_concerns,
              whyWeMatter: response.why_we_matter,
              buyingSignals: response.persona_buying_signals,
            };
            addPersonaToCustomer(id!, newPersona);
            setPersonas(getPersonasForCustomer(id!));
            setPersonaModalOpen(false);
          } catch (err: any) {
            setPersonaError(err?.body?.error || err.message || "Failed to generate persona.");
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