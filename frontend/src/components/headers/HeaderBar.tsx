import type { ReactNode } from "react";

interface HeaderBarProps {
  companyName: string;
  domain?: string;
  children?: ReactNode;
}

export default function HeaderBar({ companyName, domain, children }: HeaderBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
        {domain && <p className="text-sm text-gray-500">{domain}</p>}
      </div>
      <div className="flex items-center space-x-4">{children}</div>
    </div>
  );
} 