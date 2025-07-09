import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Building2, Users, UserCheck, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { getEntityNavActiveClass, getEntityNavHoverClass, type EntityType } from "../../lib/entityColors";
import { useAuthState } from '../../lib/auth';
import { useGetCompanies } from '../../lib/hooks/useCompany';

interface SidebarNavProps {
  companyName?: string;
}

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

// Custom vertical split panel icon as a React component
function SplitPanelIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </svg>
  );
}

export default function SidebarNav({ companyName }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = useAuthState();
  const { data: companies } = useGetCompanies(token);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // Helper to get company navigation path
  const getCompanyPath = () => {
    if (token && companies && companies.length > 0) {
      return `/app/company/${companies[companies.length - 1].id}`;
    } else if (token) {
      return '/app/company';
    }
    return '/playground/company';
  };

  // Determine active tab
  let activeTab = "";
  const prefix = token ? '/app' : '/playground';
  if (location.pathname.startsWith(`${prefix}/company`)) {
    activeTab = "company";
  } else if (new RegExp(`^${prefix}/target-accounts/[^/]+/personas/`).test(location.pathname)) {
    activeTab = "personas";
  } else if (location.pathname.startsWith(`${prefix}/target-accounts`)) {
    activeTab = "accounts";
  } else if (location.pathname.startsWith(`${prefix}/target-personas`)) {
    activeTab = "personas";
  } else if (location.pathname.startsWith(`${prefix}/campaigns`)) {
    activeTab = "campaigns";
  }

  const navItems = [
    {
      key: "company",
      label: "Company",
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => navigate(getCompanyPath()),
      entityType: "company" as EntityType,
    },
    {
      key: "accounts",
      label: "Accounts",
      icon: <Users className="w-5 h-5" />,
      onClick: () => navigate(`${prefix}/target-accounts`),
      entityType: "account" as EntityType,
    },
    {
      key: "personas",
      label: "Personas",
      icon: <UserCheck className="w-5 h-5" />,
      onClick: () => navigate(`${prefix}/target-personas`),
      entityType: "persona" as EntityType,
    },
    {
      key: "campaigns",
      label: "Campaigns",
      icon: <TrendingUp className="w-5 h-5" />,
      onClick: () => navigate(`${prefix}/campaigns`),
      entityType: "campaign" as EntityType,
    },
  ];

  return (
    <div
      className={`bg-gray-50 border-r border-gray-200 flex flex-col h-screen min-h-screen sticky top-0 transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}
    >
      {/* Header with custom SplitPanel icon and Company label */}
      <div className="px-4 py-4">
        <button
          className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start gap-2"} px-2 py-2 rounded-lg text-left transition-colors focus:outline-none bg-transparent border-0 ring-0 focus:border-0 focus:ring-0 hover:border-0 active:border-0 hover:bg-gray-200`}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <SplitPanelIcon className="w-6 h-6 text-gray-700" />
          {!collapsed && <span className="text-base font-semibold text-gray-900">Dashboard</span>}
        </button>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start gap-2"} px-2 py-2 rounded-lg text-left transition-colors relative
                ${activeTab === item.key ? getEntityNavActiveClass(item.entityType) + " ring-0 border-0 outline-none" : "text-gray-600"}
                ${getEntityNavHoverClass(item.entityType)} focus:ring-0 focus:border-0 focus:outline-none border-0 ring-0 hover:border-0 active:border-0`}
              onClick={item.onClick}
              aria-label={item.label}
              tabIndex={0}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
} 