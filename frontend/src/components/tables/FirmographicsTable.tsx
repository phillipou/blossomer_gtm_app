import { Badge } from "../ui/badge";

interface Value {
  text: string;
  color: string;
  // Optionally allow subcategory keys (e.g., employees, revenue)
  [key: string]: any;
}
interface Row {
  label: string;
  values: Value[];
}

// Helper to flatten company size subcategories
function flattenFirmographicsData(data: Row[]): Row[] {
  const result: Row[] = [];
  data.forEach((row) => {
    if (row.label.toLowerCase() === "company size") {
      row.values.forEach((v) => {
        if (v.employees) {
          result.push({
            label: "Employees",
            values: [{ text: v.employees, color: v.color || "gray" }],
          });
        }
        if (v.revenue) {
          result.push({
            label: "Revenue",
            values: [{ text: v.revenue, color: v.color || "gray" }],
          });
        }
      });
    } else {
      result.push(row);
    }
  });
  return result;
}

export function FirmographicsTable({ data }: { data: Row[] }) {
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-800",
  };
  const flatData = flattenFirmographicsData(data);
  return (
    <div className="space-y-3">
      {flatData.map((row: Row) => (
        <div key={row.label} className="flex items-center space-x-4">
          <div className="w-32 text-sm text-gray-600 font-medium flex-shrink-0">{row.label}</div>
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