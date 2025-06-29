interface SubNavProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  subTabs: { label: string; value: string }[];
}

export default function SubNav({ activeSubTab, setActiveSubTab, subTabs }: SubNavProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8">
      <div className="flex space-x-8">
        {subTabs.map((tab) => (
          <button
            key={tab.value}
            className={`py-4 border-b-2 ${activeSubTab === tab.value ? "border-blue-500 text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700 border-transparent"}`}
            onClick={() => setActiveSubTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
} 