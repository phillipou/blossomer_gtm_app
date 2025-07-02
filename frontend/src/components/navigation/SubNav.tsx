export default function SubNav({ breadcrumbs, activeSubTab, setActiveSubTab, subTabs }: SubNavProps) {
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
            className={`subnav-tab${activeSubTab === tab.value ? " active" : ""}`}
            role="tab"
            tabIndex={0}
            onClick={() => setActiveSubTab(tab.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setActiveSubTab(tab.value); }}
            style={{ userSelect: "none" }}
          >
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
} 