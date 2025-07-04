import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Plus, Edit3, Trash2 } from "lucide-react";
import OverviewCard from "../components/cards/OverviewCard";
import { getAllPersonas, deletePersonaFromCustomer } from "../lib/customerService";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import CardParentFooter from "../components/cards/CardParentFooter";
import SummaryCard from "../components/cards/SummaryCard";
import type { TargetPersonaResponse } from "../types/api";
import PageHeader from "../components/navigation/PageHeader";

export default function TargetPersonas() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Array<{ persona: TargetPersonaResponse; customerId: string; customerName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the analyzed company website from the overview hook
  const overview = useCompanyOverview();

  useEffect(() => {
    try {
      const allPersonas = getAllPersonas();
      setPersonas(allPersonas);
    } catch (err) {
      console.error("Error loading personas:", err);
      setError("Failed to load personas");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePersonaClick = (customerId: string, personaId: string) => {
    console.log('Navigating to persona:', personaId, 'for account:', customerId);
    navigate(`/target-accounts/${customerId}/personas/${personaId}`);
  };

  const handleEditPersona = (persona: TargetPersonaResponse, customerId: string) => {
    // Navigate to the customer detail page with persona editing
    navigate(`/target-accounts/${customerId}`, { state: { editPersona: persona } });
  };

  const handleDeletePersona = (personaId: string, customerId: string) => {
    deletePersonaFromCustomer(customerId, personaId);
    // Refresh the list
    setPersonas(getAllPersonas());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Target Personas"
        subtitle="Manage buyer personas across all target accounts"
        primaryAction={{
          label: "Add Target Persona",
          onClick: () => navigate('/target-accounts')
        }}
      />

      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Company Overview */}
        <OverviewCard
          title={overview?.company_name || "Your Company"}
          subtitle={overview?.company_url || ""}
          bodyTitle="Company Overview"
          bodyText={overview?.company_overview || overview?.product_description}
          showButton={false}
        />

        {/* Personas Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">All Personas</h2>
            <p className="text-sm text-gray-500">
              {personas.length} persona{personas.length !== 1 ? 's' : ''} across all target accounts
            </p>
          </div>
          
          {personas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map(({ persona, customerId, customerName }) => (
                <SummaryCard
                  key={`${customerId}-${persona.id}`}
                  title={persona.name}
                  description={persona.description}
                  parents={[
                    { name: customerName, color: "bg-red-400", label: "Account" },
                    { name: overview?.company_name || "Company", color: "bg-green-400", label: "Company" },
                  ]}
                  onClick={() => handlePersonaClick(customerId, persona.id)}
                >
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={e => { 
                      e.stopPropagation(); 
                      handleEditPersona(persona, customerId); 
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
                      handleDeletePersona(persona.id, customerId); 
                    }} 
                    className="text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </SummaryCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <p className="text-lg font-medium mb-2">No personas created yet</p>
                <p className="text-sm">Create personas for your target accounts to get started</p>
              </div>
              <Button onClick={() => navigate('/target-accounts')}>
                <Plus className="w-4 h-4 mr-2" />
                Go to Target Accounts
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 