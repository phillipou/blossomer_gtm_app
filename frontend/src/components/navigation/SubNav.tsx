import { type EntityType, getEntityColors } from "../../lib/entityColors";

interface SubNavProps {
  breadcrumbs: { label: string; href?: string }[];
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  subTabs: { label: string; value: string }[];
  entityType?: EntityType; // Optional entity type for context-aware colors
}

export default function SubNav({ breadcrumbs, activeSubTab, setActiveSubTab, subTabs, entityType }: SubNavProps) {
  // Get colors based on entity type, fallback to blue (default)
  const getTabColors = () => {
    if (!entityType) return { active: '#1e40af', hover: '#1e40af' }; // Default blue
    
    const colors = getEntityColors(entityType);
    // Extract color values from Tailwind classes (simplified mapping)
    const colorMap: Record<string, string> = {
      'text-green-700': '#15803d',
      'text-red-700': '#b91c1c', 
      'text-blue-700': '#1d4ed8',
      'text-purple-700': '#7c3aed'
    };
    
    const activeColor = colorMap[colors.cardTitle] || '#1e40af';
    return { active: activeColor, hover: activeColor };
  };

  const tabColors = getTabColors();

  return (
    <div className="bg-white border-b border-gray-200 px-8">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center text-sm pt-5 pb-3 select-none mb-4"
        style={{ color: '#6b7280' }}
      >
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.label} className="flex items-center">
            {crumb.href && idx !== breadcrumbs.length - 1 ? (
              <a
                href={crumb.href}
                className="hover:underline"
                style={{ color: '#6b7280' }}
              >
                {crumb.label}
              </a>
            ) : (
              <span style={{ color: '#111827', fontWeight: 600 }}>{crumb.label}</span>
            )}
            {idx < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
          </span>
        ))}
      </nav>
      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-200">
        {subTabs.map((tab) => (
          <span
            key={tab.value}
            className="cursor-pointer pb-4 px-1 border-b-2 transition-colors text-sm font-medium select-none"
            role="tab"
            tabIndex={0}
            onClick={() => setActiveSubTab(tab.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setActiveSubTab(tab.value); }}
            style={{
              color: activeSubTab === tab.value ? tabColors.active : '#6b7280',
              borderBottomColor: activeSubTab === tab.value ? tabColors.active : 'transparent',
              fontWeight: activeSubTab === tab.value ? 600 : 500
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== tab.value) {
                e.currentTarget.style.color = tabColors.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== tab.value) {
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
} 