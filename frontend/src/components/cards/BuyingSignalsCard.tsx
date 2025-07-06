import { Button } from "../ui/button";
import { Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BuyingSignal {
  id: string;
  label: string;
  description: string;
  enabled?: boolean;
  category?: string;
  type?: string;
  priority?: string;
  detectionMethod?: string;
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
  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="group flex flex-col border border-gray-200 rounded-lg transition-all duration-200 overflow-hidden hover:bg-gray-50"
        >
          <div className="flex items-center justify-between px-3 pt-3 pb-0">
            <div className="flex-1 min-w-0 pr-4 px-3">
              <div className="flex items-center text-left">
                <span className="text-sm font-medium text-gray-900">{signal.label}</span>
                {signal.priority && (
                  <span
                    className={
                      `ml-3 px-2 py-0.5 rounded text-xs font-semibold ` +
                      (signal.priority.toLowerCase() === 'hi' || signal.priority.toLowerCase() === 'high'
                        ? 'bg-green-100 text-green-800'
                        : signal.priority.toLowerCase() === 'med' || signal.priority.toLowerCase() === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800')
                    }
                    style={{ marginLeft: 8 }}
                  >
                    {signal.priority.charAt(0).toUpperCase() + signal.priority.slice(1)} Priority
                  </span>
                )}
              </div>
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
          </div>
          {signal.description && (
            <div className="px-6 pt-0 pb-4 text-sm text-gray-600 text-left">
              {signal.description}
            </div>
          )}
          <div className="px-6 pt-2 pb-3 text-xs text-gray-500 border-t border-gray-100 w-full text-left">
            <span className="mr-4"><strong>Type:</strong> {signal.type || signal.category}</span>
            <span><strong>Detection:</strong> {signal.detectionMethod}</span>
          </div>
        </div>
      ))}
    </div>
  );
} 