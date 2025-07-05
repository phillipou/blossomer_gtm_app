import React from "react";
import { Card, CardHeader } from "../ui/card";
import CardParentFooter from "./CardParentFooter";

interface SummaryCardProps {
  title: string;
  description: string;
  parents?: Array<{ name: string; color: string; label?: string }>;
  children?: React.ReactNode; // For action buttons, etc.
  onClick?: () => void;
  className?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  description,
  parents,
  children,
  onClick,
  className = "",
}) => (
  <Card
    className={`group relative transition-colors duration-200 hover:border-blue-400 cursor-pointer ${className}`}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <span className="inline-block mb-2">
          <span className="text-blue-700 text-base font-semibold">{title}</span>
        </span>
        <p className="text-gray-700 text-sm mt-2 mb-2 line-clamp-3">{description}</p>
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

export default SummaryCard; 