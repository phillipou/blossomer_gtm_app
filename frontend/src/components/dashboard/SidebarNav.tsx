import { Building2, Users, TrendingUp, Home, Settings, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarNavProps {
  companyName?: string;
}

export default function SidebarNav({ companyName }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab =
    location.pathname.startsWith("/dashboard")
      ? "company"
      : location.pathname.startsWith("/customers")
      ? "customers"
      : location.pathname.startsWith("/campaigns")
      ? "campaigns"
      : "";
  return (
    <div className="bg-white border-r border-gray-200 flex flex-col h-full min-h-screen">
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
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors relative ${activeTab === "company" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/dashboard")}
          >
            <Building2 className="w-5 h-5" />
            <span>Company</span>
            {activeTab === "company" && <div className="absolute right-2 w-2 h-2 bg-orange-500 rounded-full"></div>}
          </Button>
          <Button
            variant={activeTab === "customers" ? "secondary" : "ghost"}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === "customers" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/customers")}
          >
            <Users className="w-5 h-5" />
            <span>Customers</span>
          </Button>
          <Button
            variant={activeTab === "campaigns" ? "secondary" : "ghost"}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === "campaigns" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            onClick={() => navigate("/campaigns")}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Campaigns</span>
          </Button>
        </div>
      </nav>
      {/* Bottom navigation */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 