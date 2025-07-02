import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Trash2, Building2 } from "lucide-react";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import OverviewCard from "@/components/cards/OverviewCard";

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
          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); onEdit(profile); }} className="text-blue-600">
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); onDelete(profile.id); }} className="text-red-500">
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

export default function CustomersList({ companyName = "blossomer.io", domain = "https://blossomer.io", description = "This company provides expertly built, fully managed outbound sales systems specifically for early-stage B2B founders. They focus on establishing a predictable customer acquisition pipeline before a startup needs to hire a full-time sales team. Their approach blends AI-powered outreach with human-led strategy and personalization to secure qualified customer meetings." }) {
  const [customerProfiles, setCustomerProfiles] = useState(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const handleAddProfile = () => {
    setIsAddModalOpen(false);
  };
  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setIsAddModalOpen(true);
  };
  const handleDeleteProfile = (id: number) => {
    setCustomerProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <OverviewCard 
          title={companyName}
          subtitle={domain}
          bodyTitle="Company Description"
          bodyText={description}
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
          <AddCustomerCard onClick={() => setIsAddModalOpen(true)} />
        </div>
      </div>
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={editingProfile ? handleAddProfile : handleAddProfile}
        editingProfile={editingProfile}
      />
    </div>
  );
} 