import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Edit3, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";

interface BuyingSignal {
  id: string;
  label: string;
  description: string;
  enabled?: boolean;
}

interface BuyingSignalsCardProps {
  signals: BuyingSignal[];
  onEdit: (signal: BuyingSignal) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  title?: string;
  description?: string;
}

export default function BuyingSignalsCard({
  signals,
  onEdit,
  onDelete,
  onAdd,
  title = "Buying Signals",
  description = "Indicators that suggest a prospect is ready to buy or engage with your solution",
}: BuyingSignalsCardProps) {
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  const enabledCount = signals.filter(s => s.enabled !== false).length;
  const totalCount = signals.length;

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <CardTitle className="flex items-center space-x-2">
            <span>{title}</span>
            <Badge className="bg-blue-100 text-blue-800">{enabledCount}/{totalCount}</Badge>
          </CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={onAdd}>
          <Edit3 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <div className="px-6 pb-4 text-sm text-gray-500">{description}</div>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {signals.map(signal => {
            const isExpanded = expandedSignals.has(signal.id);
            return (
              <div
                key={signal.id}
                className={`group flex flex-col border border-gray-200 rounded-lg transition-all duration-200 overflow-hidden ${isExpanded ? "bg-blue-50" : "hover:bg-gray-50"}`}
                onMouseEnter={() => setHoveredSignal(signal.id)}
                onMouseLeave={() => setHoveredSignal(null)}
                onClick={() => {
                  setExpandedSignals(prev => {
                    const next = new Set(prev);
                    if (next.has(signal.id)) {
                      next.delete(signal.id);
                    } else {
                      next.add(signal.id);
                    }
                    return next;
                  });
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="flex items-center justify-between p-3 gap-2">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-sm font-medium text-gray-900">{signal.label}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Buying Signal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 