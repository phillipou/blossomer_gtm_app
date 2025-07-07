import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/card";
import type { CompanyOverviewResponse, TargetAccountResponse, TargetPersonaResponse } from "../../types/api";

// Accept EditingMode as a type for value and setEditingMode
export type EditingMode = "component" | "writing";

interface ModeTab {
  label: string;
  value: EditingMode;
  icon: ReactNode;
}

interface CampaignDetailHeaderProps {
  subject: string;
  timestamp: string;
  modeTabs: ModeTab[];
  editingMode: EditingMode;
  setEditingMode: (mode: EditingMode) => void;
  company: { companyName: string; companyUrl: string } | null;
  account: { id: string; targetAccountName: string; targetAccountDescription: string } | null;
  persona: { id: string; targetPersonaName: string; targetPersonaDescription: string } | null;
}

export default function CampaignDetailHeader({
  subject,
  timestamp,
  modeTabs,
  editingMode,
  setEditingMode,
  company,
  account,
  persona,
}: CampaignDetailHeaderProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-2 mb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subject}</h1>
              <div className="text-sm text-gray-500">Generated on {timestamp}</div>
            </div>
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
              {modeTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setEditingMode(tab.value)}
                  className={cn(
                    "flex flex-row items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    editingMode === tab.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Parent indicators */}
          <div className="flex flex-row items-center gap-8 mt-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
              <span className="text-sm text-gray-700">{company?.companyName || "Company"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
              <span className="text-sm text-gray-700">{account?.targetAccountName || "Account"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
              <span className="text-sm text-gray-700">{persona?.targetPersonaName || "Persona"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 