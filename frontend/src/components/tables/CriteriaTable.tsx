import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Edit3 } from "lucide-react";
import { useState } from "react";

interface Value {
  text: string;
  color: string;
}

interface Row {
  label: string;
  values: Value[];
}

// Helper to flatten data with subcategories
function flattenData(data: Row[]): Row[] {
  const result: Row[] = [];
  if (!data || !Array.isArray(data)) {
    return result;
  }
  data.forEach((row) => {
    if (row.label.toLowerCase() === "company size") {
      // Special handling for company size to show each subcategory separately
      row.values.forEach((v: Value) => {
        result.push({
          label: row.label,
          values: [{ text: v.text, color: v.color || "gray" }],
        });
      });
    } else {
      result.push(row);
    }
  });
  return result;
}

interface CriteriaTableProps {
  data: Row[] | undefined;
  onEdit?: () => void;
  editable?: boolean;
}

export function CriteriaTable({ data, onEdit, editable = false }: CriteriaTableProps) {
  const [hovered, setHovered] = useState(false);
  
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
    indigo: "bg-indigo-100 text-indigo-800",
  };
  
  const flatData = flattenData(data || []);
  
  return (
    <div 
      className={`space-y-3 ${editable ? 'group relative' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editable && onEdit && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 z-10"
          tabIndex={-1}
          style={{ pointerEvents: hovered ? "auto" : "none" }}
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      )}
      {flatData.map((row: Row) => (
        <div
          key={row.label}
          className="grid grid-cols-[minmax(140px,1fr)_3fr] gap-2 items-start"
        >
          <div className="text-sm text-gray-600 font-medium flex-shrink-0">{row.label}</div>
          <div className="flex flex-wrap gap-2">
            {row.values.map((v: Value, i: number) => (
              <Badge
                key={i}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${colorMap[v.color] || "bg-gray-100 text-gray-800"}`}
              >
                {v.text}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}