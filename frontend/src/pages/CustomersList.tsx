import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Building2 } from "lucide-react";
import InputModal from "../components/modals/InputModal";
import OverviewCard from "../components/cards/OverviewCard";
import { useCompanyOverview } from "../lib/useCompanyOverview";

// Mock data and types (move to shared file if needed)
export const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: "Acme Corp",
    role: "Startup Founder",
    description:
      "A visionary business leader who identifies market opportunities and builds innovative solutions. Typically leads early-stage companies with 5-50 employees, focused on rapid growth.",
  },
  {
    id: 2,
    name: "Beta Inc",
    role: "Marketing Director",
    description:
      "Senior marketing professional responsible for driving customer acquisition and brand growth. Works at mid-market companies with established products looking to scale their reach.",
  },
];

export type CustomerProfile = {
  id: number;
  name: string;
  role: string;
  description: string;
};

function CustomerProfileCard({ profile, onEdit, onDelete }: any) {
  const navigate = useNavigate();
  return (
    <Card
      className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
      onClick={() => navigate(`/customers/${profile.id}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <span className="inline-block mb-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
              {profile.role}
            </span>
          </span>
          <p className="text-gray-700 text-base mt-2 mb-2 line-clamp-3">{profile.description}</p>
          <p className="text-xs text-gray-400 mt-4">Created: Jan 29, 2025</p>
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
  const [customerProfiles, setCustomerProfiles] = useState(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CustomerProfile | null>(null);

  const handleAddProfile = ({ name, description }: { name: string; description: string }) => {
    const newId = Math.max(...customerProfiles.map(p => p.id)) + 1;
    setCustomerProfiles([
      ...customerProfiles,
      {
        id: newId,
        name: name,
        role: "Target Account",
        description: description,
      },
    ]);
    setIsAddModalOpen(false);
  };

  const handleEditProfile = (profile: CustomerProfile) => {
    setEditingProfile(profile);
    setIsAddModalOpen(true);
  };

  const handleUpdateProfile = ({ name, description }: { name: string; description: string }) => {
    if (!editingProfile) return;
    setCustomerProfiles(prev => prev.map(p =>
      p.id === editingProfile.id ? { ...p, name, description } : p
    ));
    setIsAddModalOpen(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = (id: number) => {
    setCustomerProfiles((prev) => prev.filter((p) => p.id !== id));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerProfiles.map((profile) => (
            <CustomerProfileCard
              key={profile.id}
              profile={profile}
              onEdit={handleEditProfile}
              onDelete={handleDeleteProfile}
            />
          ))}
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
        submitLabel={editingProfile ? "Update Profile" : "Generate"}
        cancelLabel="Cancel"
        defaultName={editingProfile ? editingProfile.name : ""}
        defaultDescription={editingProfile ? editingProfile.description : ""}
      />
    </div>
  );
} 