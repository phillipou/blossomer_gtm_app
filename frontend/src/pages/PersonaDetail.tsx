import { useParams, useNavigate } from "react-router-dom";
import SubNav from "@/components/navigation/SubNav";
import InfoCard from "@/components/cards/InfoCard";
import React from "react";
import OverviewCard from "@/components/cards/OverviewCard";
import BuyingSignalsCard from "../components/cards/BuyingSignalsCard";

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
    overview: "Startup founders are driven, resourceful, and constantly seeking ways to bring their vision to life. They balance product innovation with the realities of market fit, often wearing multiple hats to push their company forward.",
    likelyJobTitles: [
      "Founder & CEO",
      "Co-Founder",
      "Chief Technology Officer (CTO)",
      "Head of Product",
      "Managing Director"
    ],
    primaryResponsibilities: [
      "Set company vision and strategy",
      "Build and iterate on the core product",
      "Drive early customer acquisition and validate product-market fit"
    ],
    statusQuo: [
      "Manual outreach via email and LinkedIn",
      "Ad-hoc sales processes managed in spreadsheets",
      "Relying on founder's personal network for leads"
    ],
    useCases: [
      "Automate outbound prospecting to save time",
      "Identify high-potential customer segments",
      "Test new messaging and campaigns quickly",
      "Track outreach performance in one dashboard"
    ],
    desiredOutcomes: [
      "Consistent pipeline of qualified leads",
      "Faster validation of product-market fit",
      "More meetings with ideal customers"
    ],
    keyConcerns: [
      "Will this tool actually save me time?",
      "Is onboarding complex or disruptive?",
      "Will it integrate with my existing tools?",
      "How accurate is the targeting?"
    ],
    whyWeMatter: [
      "Purpose-built for founder-led sales",
      "Fast setup and minimal learning curve",
      "Combines AI with human personalization",
      "Transparent pricing, no long-term contracts"
    ],
    buyingSignals: [
        { id: "0", label: "Recently raised seed or Series A funding", description: "boop", enabled: true },
        { id: "1", label: "Hiring for sales or marketing roles", description: "", enabled: true },
        { id: "2", label: "Posting about customer acquisition challenges on social media", description: "", enabled: true },
        { id: "3", label: "Attending sales and marketing conferences", description: "", enabled: true },
        { id: "4", label: "Implementing new CRM or sales tools", description: "", enabled: true },
        { id: "5", label: "Founder actively networking and seeking sales advice", description: "", enabled: true },
        { id: "6", label: "Company showing rapid user growth but struggling with monetization", description: "", enabled: true },
        { id: "7", label: "Recent product launches or feature announcements", description: "", enabled: true },
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
        {/* Overview Card */}
        <OverviewCard
          title={persona.name}
          subtitle={persona.createdAt}
          bodyTitle="Persona Overview"
          bodyText={persona.overview}
          showButton={false}
        />
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InfoCard
            title="Likely Job Titles"
            items={persona.likelyJobTitles || []}
            onEdit={() => handleEdit("likelyJobTitles", (persona.likelyJobTitles || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Primary Responsibilities"
            items={persona.primaryResponsibilities || []}
            onEdit={() => handleEdit("primaryResponsibilities", (persona.primaryResponsibilities || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Status Quo"
            items={persona.statusQuo || []}
            onEdit={() => handleEdit("statusQuo", (persona.statusQuo || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Use Cases"
            items={persona.useCases || []}
            onEdit={() => handleEdit("useCases", (persona.useCases || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Pain Points"
            items={persona.painPoints || []}
            onEdit={() => handleEdit("painPoints", (persona.painPoints || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Desired Outcomes"
            items={persona.desiredOutcomes || []}
            onEdit={() => handleEdit("desiredOutcomes", (persona.desiredOutcomes || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Key Concerns"
            items={persona.keyConcerns || []}
            onEdit={() => handleEdit("keyConcerns", (persona.keyConcerns || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
          <InfoCard
            title="Why We Matter to Them"
            items={persona.whyWeMatter || []}
            onEdit={() => handleEdit("whyWeMatter", (persona.whyWeMatter || []).join("\n"))}
            renderItem={(item: string, idx: number) => (
              <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
            )}
          />
        </div>
        <div className="mt-8">
          <BuyingSignalsCard
            signals={persona.buyingSignals || []}
            onEdit={() => {}}
            onDelete={() => {}}
            onAdd={() => {}}
            title="Buying Signals"
            description="Indicators that suggest a prospect is ready to buy or engage with your solution"
          />
        </div>
      </div>
    </div>
  );
} 