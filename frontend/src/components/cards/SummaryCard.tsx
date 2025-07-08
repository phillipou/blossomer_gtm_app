import React from "react";
import { Card, CardHeader } from "../ui/card";
import CardParentFooter from "./CardParentFooter";
import { type EntityType, getEntityDotColor, getCardHoverClasses } from "../../lib/entityColors";

interface SummaryCardProps {
  title: string;
  description: string;
  parents?: Array<{ name: string; color: string; label?: string }>;
  children?: React.ReactNode; // For action buttons, etc.
  onClick?: () => void;
  className?: string;
  entityType?: EntityType; // Optional entity type for consistent styling
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  description,
  parents,
  children,
  onClick,
  className = "",
  entityType,
}) => {
  // Get entity-specific color for the colored bar and border
  const entityColor = entityType ? getEntityDotColor(entityType) : 'bg-blue-400';
  // Convert bg color to border color
  const borderColor = entityColor.replace('bg-', 'border-');

  return (
    <Card
      className={`group relative cursor-pointer border-0 border-l-4 ${borderColor} ${getCardHoverClasses()} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="w-full">
          <div className="mb-3">
            <h3 className="text-black text-base font-semibold mb-2">{title}</h3>
            <div className={`h-1 w-16 ${entityColor} rounded-full`}></div>
          </div>
          <p className="text-gray-700 text-sm mb-2 line-clamp-3">{description}</p>
          {parents && <CardParentFooter parents={parents} />}
        </div>
        {children && (
          <div className="flex space-x-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {children}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

export default SummaryCard; 