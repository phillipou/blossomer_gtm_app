import { Card } from "./card";
import { Plus } from "lucide-react";
import { getAddCardHoverClasses } from "../../lib/entityColors";

interface AddCardProps {
  onClick: () => void;
  label?: string;
}

export default function AddCard({ onClick, label = "Add New" }: AddCardProps) {
  return (
    <Card
      className={`flex items-center justify-center cursor-pointer border-dashed border-2 border-blue-200 min-h-[180px] ${getAddCardHoverClasses()}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <Plus className="w-8 h-8 text-blue-500 mb-2" />
        <span className="text-blue-600 font-medium">{label}</span>
      </div>
    </Card>
  );
} 