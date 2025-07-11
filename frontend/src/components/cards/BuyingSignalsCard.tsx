import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit2, Target, TrendingUp, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import type { APIBuyingSignal } from '../../types/api';

interface BuyingSignalsCardProps {
  buyingSignals: APIBuyingSignal[];
  onEdit?: (signal: APIBuyingSignal) => void;
  onDelete?: (signal: APIBuyingSignal) => void;
  editable?: boolean;
  className?: string;
}

// Priority color mapping
const priorityColors = {
  High: "text-red-700 bg-red-50 border-red-200",
  Medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  Low: "text-green-700 bg-green-50 border-green-200"
};

// Priority icons
const priorityIcons = {
  High: AlertCircle,
  Medium: TrendingUp,
  Low: CheckCircle
};

// Signal type color mapping
const typeColors = {
  "Company Data": "blue",
  "Website": "green",
  "Tech Stack": "purple",
  "News": "orange",
  "Social Media": "pink",
  "Other": "gray"
};

export default function BuyingSignalsCard({ 
  buyingSignals, 
  onEdit, 
  onDelete,
  editable = false,
  className = ""
}: BuyingSignalsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!buyingSignals || buyingSignals.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No buying signals data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {buyingSignals.map((signal, index) => {
        const PriorityIcon = priorityIcons[signal.priority as keyof typeof priorityIcons];
        const typeColor = typeColors[signal.type as keyof typeof typeColors] || "gray";
        return (
          <div
            key={index}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200 group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{signal.title}</h4>
                <Badge 
                  variant="secondary" 
                  className={`${priorityColors[signal.priority as keyof typeof priorityColors]} text-xs`}
                >
                  {PriorityIcon && <PriorityIcon className="w-3 h-3 mr-1" />}
                  {signal.priority}
                </Badge>
              </div>
              {editable && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit && onEdit(signal)}
                    className="text-blue-600"
                    tabIndex={-1}
                    style={{ pointerEvents: isHovered ? "auto" : "none" }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(signal)}
                      className="text-red-500"
                      tabIndex={-1}
                      style={{ pointerEvents: isHovered ? "auto" : "none" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {signal.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`bg-${typeColor}-50 text-${typeColor}-700 border-${typeColor}-200`}
                >
                  {signal.type}
                </Badge>
              </div>
              <div className="text-right">
                <span className="font-medium">Detection:</span>
                <span className="ml-1">{signal.detection_method}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}