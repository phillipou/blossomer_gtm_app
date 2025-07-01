import { useState } from "react";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit3, Trash2, Building2 } from "lucide-react";

// TODO: Move to backend integration
const MOCK_CUSTOMERS = [
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

function CompanyOverviewCard({ companyName, domain, description }: { companyName: string; domain: string; description: string }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{companyName}</h2>
              <p className="text-sm text-gray-500">{domain}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
          >
            View Details
          </Button>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">COMPANY DESCRIPTION</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerProfileCard({ profile, onEdit, onDelete }: any) {
  return (
    <Card
      className="group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer"
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
          <Button size="icon" variant="ghost" onClick={() => onEdit(profile)} className="text-blue-600">
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(profile.id)} className="text-red-500">
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

function AddCustomerModal({ isOpen, onClose, onSave, editingProfile }: any) {
  // TODO: Implement modal using a UI primitive or Radix Dialog
  // For now, just a placeholder
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {editingProfile ? "Edit Customer" : "Add Customer"}
        </h2>
        {/* TODO: Add form fields for name, role, description */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default function Customers({ companyName = "blossomer.io", domain = "https://blossomer.io", description = "This company provides expertly built, fully managed outbound sales systems specifically for early-stage B2B founders. They focus on establishing a predictable customer acquisition pipeline before a startup needs to hire a full-time sales team. Their approach blends AI-powered outreach with human-led strategy and personalization to secure qualified customer meetings." }) {
  const [customerProfiles, setCustomerProfiles] = useState(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const handleAddProfile = () => {
    // TODO: Implement add logic (and backend integration)
    setIsAddModalOpen(false);
  };
  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setIsAddModalOpen(true);
  };
  const handleDeleteProfile = (id: number) => {
    // TODO: Implement delete logic (and backend integration)
    setCustomerProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <CompanyOverviewCard companyName={companyName} domain={domain} description={description} />
        {/* Customer Profiles Grid */}
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