import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import SubNav from "../components/dashboard/SubNav";
import InfoCard from "../components/dashboard/InfoCard";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Check, X } from "lucide-react";
import React from "react";

// Mock persona data (in real app, fetch by accountId/personaId)
const MOCK_PERSONAS = [
  {
    id: "1",
    name: "Startup Founder",
    description:
      "A visionary business leader who identifies market opportunities and builds innovative solutions. Typically...",
    createdAt: "Jan 29, 2025",
    painPoints: [
      "Lack of sales expertise",
      "Difficulty scaling outreach",
      "Limited marketing budget",
    ],
    profile: [
      "Technical Founder",
      "Sales-Oriented Founder",
      "Product Manager",
    ],
  },
  {
    id: "2",
    name: "Marketing Director",
    description:
      "Senior marketing professional responsible for driving customer acquisition and brand growth. Work...",
    createdAt: "Jan 29, 2025",
    painPoints: [
      "Brand awareness challenges",
      "Budget constraints",
    ],
    profile: ["Marketing Director"],
  },
];

export default function PersonaDetail() {
  const { id: accountId, personaId } = useParams();
  const navigate = useNavigate();
  // In real app, fetch persona by accountId/personaId
  const [persona, setPersona] = React.useState(() => {
    return MOCK_PERSONAS.find((p) => p.id === personaId) || null;
  });
  const [editingBlock, setEditingBlock] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  // Mock account name for breadcrumbs
  const accountName = "Account " + accountId;

  if (!persona) {
    return <div className="p-8 text-center text-gray-500">Persona not found.</div>;
  }

  const handleEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditContent(currentContent);
  };
  const handleSave = () => {
    if (!persona) return;
    if (editingBlock === "profile") {
      setPersona({ ...persona, profile: editContent.split("\n").map(s => s.trim()).filter(Boolean) });
    } else if (editingBlock === "painPoints") {
      setPersona({ ...persona, painPoints: editContent.split("\n").map(s => s.trim()).filter(Boolean) });
    }
    setEditingBlock(null);
    setEditContent("");
  };
  const handleCancel = () => {
    setEditingBlock(null);
    setEditContent("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SubNav
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: accountName, href: `/customers/${accountId}` },
          { label: persona.name },
        ]}
        activeSubTab=""
        setActiveSubTab={() => {}}
        subTabs={[]}
      />
      <div className="flex-1 p-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              <Badge className="bg-blue-100 text-blue-800 font-semibold text-base px-3 py-1 w-fit">
                {persona.name}
              </Badge>
            </CardTitle>
            <div className="text-xs text-gray-400">Created: {persona.createdAt}</div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-800 text-base mb-4">{persona.description}</div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {editingBlock === "profile" ? (
            <div className="space-y-4">
              <label className="font-semibold">Persona Profiles</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <InfoCard
              title="Persona Profiles"
              items={persona.profile || ["No persona profiles available."]}
              onEdit={() => handleEdit("profile", (persona.profile || []).join("\n"))}
              renderItem={(profile) => <span className="text-sm text-gray-700">{profile}</span>}
            />
          )}
          {editingBlock === "painPoints" ? (
            <div className="space-y-4">
              <label className="font-semibold">Pain Points</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <InfoCard
              title="Pain Points"
              items={persona.painPoints || ["No pain points available."]}
              onEdit={() => handleEdit("painPoints", (persona.painPoints || []).join("\n"))}
              renderItem={(point) => <span className="text-sm text-gray-700">{point}</span>}
            />
          )}
        </div>
      </div>
    </div>
  );
} 