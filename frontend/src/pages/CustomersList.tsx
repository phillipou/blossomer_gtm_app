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

function CustomerProfileCard({ profile, onEdit, onDelete }: any) {
  const navigate = useNavigate();
  const formattedDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  return (
    <Card
      className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
      onClick={() => navigate(`/customers/${profile.id}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <span className="inline-block mb-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
              {profile.name}
            </span>
          </span>
          <p className="text-gray-700 text-base mt-2 mb-2 line-clamp-3">{profile.description}</p>
          <p className="text-xs text-gray-400 mt-4">Created: {formattedDate}</p>
        </div>
        <div className="flex space-x-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(profile); }} className="text-blue-600">
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(profile.id); }} className="text-red-500">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
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
      const user_inputted_context = `target_company_name: ${name}\ntarget_company_description: ${description}`;
      const requestPayload = {
        website_url: overview.company_url.trim(),
        user_inputted_context,
      };
      console.log("[AddProfile] API request payload:", requestPayload);
      const response = await generateTargetCompany(requestPayload.website_url, requestPayload.user_inputted_context);
      console.log("[AddProfile] API response:", response);
      const newProfile: CustomerProfile = {
        id: generateCustomerProfileId(),
        name: response.target_company_name,
        role: "Target Account",
        description: response.target_company_description || description,
        firmographics: response.firmographics,
        buying_signals: response.buying_signals,
        rationale: response.rationale,
        confidence_scores: response.confidence_scores,
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
            console.log("Rendering profile card:", profile);
            return (
              <CustomerProfileCard
                key={profile.id}
                profile={profile}
                onEdit={handleEditProfile}
                onDelete={handleDeleteProfile}
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