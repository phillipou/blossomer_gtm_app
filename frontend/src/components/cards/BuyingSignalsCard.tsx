import { Button } from "../ui/button";
import { Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BuyingSignal {
  id: string;
  label: string;
  description: string;
  enabled?: boolean;
  category?: string;
}

interface BuyingSignalsCardProps {
  signals: BuyingSignal[];
  onEdit: (signal: BuyingSignal) => void;
  onDelete: (id: string) => void;
}

export default function BuyingSignalsCard({
  signals,
  onEdit,
  onDelete,
}: BuyingSignalsCardProps) {
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedSignals(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {signals.map((signal) => {
        const isExpanded = expandedSignals.has(signal.id);
        return (
          <div
            key={signal.id}
            className="group flex flex-col border border-gray-200 rounded-lg transition-all duration-200 overflow-hidden hover:bg-gray-50 cursor-pointer"

            onClick={() => handleToggleExpand(signal.id)}
          >
            <div className="flex items-center justify-between p-3 gap-2">
              <div className="flex-1 min-w-0 pr-4">
                <span className="text-sm font-medium text-gray-900">{signal.label}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={e => { e.stopPropagation(); onEdit(signal); }}
                  className="text-blue-600"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={e => { e.stopPropagation(); onDelete(signal.id); }}
                  className="text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              <span className="ml-2 pointer-events-none">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </span>
            </div>
            {isExpanded && signal.description && (
              <div className="px-6 pb-3 text-sm text-gray-600">
                {signal.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 