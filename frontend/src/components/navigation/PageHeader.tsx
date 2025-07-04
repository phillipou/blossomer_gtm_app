import { Button } from "../ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryActions?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  primaryAction,
  secondaryActions 
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {secondaryActions}
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="bg-blue-600 hover:bg-blue-700">
              {primaryAction.icon || <Plus className="w-4 h-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 