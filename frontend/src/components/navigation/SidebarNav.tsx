import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Building2, Users, TrendingUp, Home, Settings, UserCheck } from "lucide-react";
import { Sparkles } from "lucide-react";

interface SidebarNavProps {
  companyName?: string;
}

export default function SidebarNav({ companyName }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Robustly determine active tab
  let activeTab = "";
  if (/^\/dashboard/.test(location.pathname)) {
    activeTab = "company";
  } else if (/^\/target-accounts\/[^/]+\/personas\//.test(location.pathname)) {
    // Persona detail route
    activeTab = "target-personas";
  } else if (location.pathname.startsWith("/target-accounts")) {
    activeTab = "target-accounts";
  } else if (location.pathname.startsWith("/target-personas")) {
    activeTab = "target-personas";
  } else if (location.pathname.startsWith("/campaigns")) {
    activeTab = "campaigns";
  }
  return (
    <div className="bg-white border-r border-gray-200 flex flex-col h-screen min-h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">{companyName || "Blossomer"}</span>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Button
            variant={activeTab === "company" ? "secondary" : "ghost"}
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-left transition-colors relative ${activeTab === "company" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/dashboard")}
          >
            <Building2 className="w-5 h-5" />
            <span>Your Company</span>
            {activeTab === "company" && <div className="absolute right-2 w-2 h-2 bg-orange-500 rounded-full"></div>}
          </Button>
          <Button
            variant={activeTab === "target-accounts" ? "secondary" : "ghost"}
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === "target-accounts" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/target-accounts")}
          >
            <Users className="w-5 h-5" />
            <span>Target Accounts</span>
          </Button>
          <Button
            variant={activeTab === "target-personas" ? "secondary" : "ghost"}
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === "target-personas" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/target-personas")}
          >
            <UserCheck className="w-5 h-5" />
            <span>Target Personas</span>
          </Button>
          <Button
            variant={activeTab === "campaigns" ? "secondary" : "ghost"}
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === "campaigns" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/campaigns")}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Campaigns</span>
          </Button>
        </div>
      </nav>
      {/* Bottom navigation */}
      <div className="p-2 border-t border-gray-200">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 