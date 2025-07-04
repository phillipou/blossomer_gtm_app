import React from "react";

interface CardParentFooterProps {
  parents: Array<{
    name: string;
    color: string; // Tailwind color class, e.g. "bg-green-400"
    label?: string; // Optional label, e.g. "Company", "Account"
  }>;
  className?: string;
}

const CardParentFooter: React.FC<CardParentFooterProps> = ({ parents, className }) => (
  <div className={`mt-auto pt-3 border-t border-gray-100 ${className || ""}`}>
    <div className="flex items-center justify-start gap-x-6 text-xs text-gray-500">
      {parents.map((parent, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${parent.color}`} title={parent.label || parent.name}></div>
          <span className="font-medium">{parent.name}</span>
        </div>
      ))}
    </div>
  </div>
);

export default CardParentFooter; 