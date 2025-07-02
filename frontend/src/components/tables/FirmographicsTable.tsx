import { Badge } from "../ui/badge";

interface Value {
  text: string;
  color: string;
}
interface Row {
  label: string;
  values: Value[];
}

export function FirmographicsTable({ data }: { data: Row[] }) {
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-800",
  };
  return (
    <div className="space-y-3">
      {data.map((row: Row) => (
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