import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  items: any[];
  onEdit?: () => void;
  renderItem?: (item: any, index: number) => ReactNode;
}

export default function InfoCard({ title, items, onEdit, renderItem }: InfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {onEdit && (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx}>{renderItem ? renderItem(item, idx) : <span className="text-sm text-gray-700">{item}</span>}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 