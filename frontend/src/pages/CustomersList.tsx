import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Building2 } from "lucide-react";
import InputModal from "../components/modals/InputModal";
import OverviewCard from "../components/cards/OverviewCard";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import {
  generateTargetCompany,
  getStoredCustomerProfiles,
  saveCustomerProfile,
  deleteCustomerProfile,
  generateCustomerProfileId,
} from "../lib/customerService";
import type { CustomerProfile } from "../types/api";
import CardParentFooter from "../components/cards/CardParentFooter";
import SummaryCard from "../components/cards/SummaryCard";

function CustomerProfileCard({ profile, onEdit, onDelete, companyName }: any) {
  const navigate = useNavigate();
  return (
    <SummaryCard
      title={profile.name}
      description={profile.description}
      parents={[{ name: companyName, color: "bg-green-400", label: "Company" }]}
      onClick={() => navigate(`/customers/${profile.id}`)}
    >
      <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(profile); }} className="text-blue-600">
        <Edit3 className="w-5 h-5" />
      </Button>
      <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(profile.id); }} className="text-red-500">
        <Trash2 className="w-5 h-5" />
      </Button>
    </SummaryCard>
  );
}

function AddCustomerCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 hover:bg-blue-50 min-h-[180px]"
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <Plus className="w-8 h-8 text-blue-500 mb-2" />
        <span className="text-blue-600 font-medium">Add New</span>
      </div>
    </Card>
  );
}

export default function CustomersList() {
  const overview = useCompanyOverview();
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CustomerProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customer profiles from localStorage on mount
  useEffect(() => {
    setCustomerProfiles(getStoredCustomerProfiles());
  }, []);

  const handleAddProfile = async ({ name, description }: { name: string; description: string }) => {
    setError(null);
    if (!overview.company_url || !overview.company_url.trim()) {
      setError("Company website URL is missing from overview. Cannot generate profile.");
      return;
    }
    setIsGenerating(true);
    try {
      // Build user_inputted_context as an object
      const user_inputted_context = {
        target_company_name: name,
        target_company_description: description,
      };
      // Build company_context as an object
      const company_context = {
        company_name: overview.company_name || '',
        company_url: overview.company_url || '',
        ...(overview.company_overview ? { company_overview: overview.company_overview } : {}),
        ...(overview.product_description ? { product_description: overview.product_description } : {}),
        ...(overview.capabilities && overview.capabilities.length ? { capabilities: overview.capabilities } : {}),
        ...(overview.business_model && overview.business_model.length ? { business_model: overview.business_model } : {}),
        ...(overview.differentiated_value && overview.differentiated_value.length ? { differentiated_value: overview.differentiated_value } : {}),
        ...(overview.customer_benefits && overview.customer_benefits.length ? { customer_benefits: overview.customer_benefits } : {}),
      };
      // Debug: log the context variables
      console.log("[AddProfile] user_inputted_context:", user_inputted_context);
      console.log("[AddProfile] company_context:", company_context);
      const requestPayload = {
        website_url: overview.company_url.trim(),
        user_inputted_context,
        company_context,
      };
      console.log("[AddProfile] API request payload:", requestPayload);
      const response = await generateTargetCompany(
        requestPayload.website_url,
        requestPayload.user_inputted_context,
        requestPayload.company_context
      );
      console.log("[AddProfile] API response:", response);
      const newProfile: CustomerProfile = {
        id: generateCustomerProfileId(),
        name: response.target_company_name,
        role: "Target Account",
        description: response.target_company_description || description,
        firmographics: response.firmographics,
        buying_signals: response.buying_signals,
        rationale: response.rationale,
        metadata: response.metadata,
        created_at: new Date().toISOString(),
      };
      saveCustomerProfile(newProfile);
      setCustomerProfiles(getStoredCustomerProfiles());
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("[AddProfile] API error:", err);
      setError(err?.body?.error || err.message || "Failed to generate customer profile.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditProfile = (profile: CustomerProfile) => {
    setEditingProfile(profile);
    setIsAddModalOpen(true);
  };

  // TODO: Implement API call for updating profile
  const handleUpdateProfile = async () => {
    // TODO: Re-run generateTargetCompany with updated info and update localStorage
    setIsAddModalOpen(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = (id: string) => {
    deleteCustomerProfile(id);
    setCustomerProfiles(getStoredCustomerProfiles());
  };

  if (!overview) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <OverviewCard 
          title={overview.company_name}
          subtitle={overview.company_url}
          bodyTitle="Company Overview"
          bodyText={overview.company_overview || overview.product_description}
          showButton={true}
          buttonTitle="View Details"
        />
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerProfiles.map((profile) => {
            return (
              <CustomerProfileCard
                key={profile.id}
                profile={profile}
                onEdit={handleEditProfile}
                onDelete={handleDeleteProfile}
                companyName={overview.company_name}
              />
            );
          })}
          <AddCustomerCard onClick={() => { setIsAddModalOpen(true); setEditingProfile(null); }} />
        </div>
      </div>
      <InputModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingProfile(null); }}
        onSubmit={editingProfile ? handleUpdateProfile : handleAddProfile}
        title={editingProfile ? "Edit Target Account" : "Describe Your Ideal Customer Profile (ICP)"}
        subtitle={editingProfile ? "Update the details for this target account." : "What types of companies do you believe fit your ICP?"}
        nameLabel="Target Account Name"
        namePlaceholder="e.g. SaaS Startups, B2B Fintech Companies, etc."
        descriptionLabel="Description"
        descriptionPlaceholder="Describe the characteristics, size, industry, or other traits that define your ideal target accounts."
        submitLabel={editingProfile ? "Update Profile" : isGenerating ? "Generating..." : "Generate"}
        cancelLabel="Cancel"
        defaultName={editingProfile ? editingProfile.name : ""}
        defaultDescription={editingProfile ? editingProfile.description : ""}
        isLoading={isGenerating}
      />
    </div>
  );
} 