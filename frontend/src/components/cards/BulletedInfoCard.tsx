import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Edit3 } from "lucide-react";
import type { ReactNode } from "react";

interface ListInfoCardProps {
  title: string;
  items: string[];
  onEdit?: () => void;
  renderItem?: (item: string, index: number) => ReactNode;
}

export default function ListInfoCard({ title, items, onEdit, renderItem }: ListInfoCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      {/* Scoped style for blue bullets in ListInfoCard only */}
      <style>{`
        .list-infocard-list .blue-bullet::marker {
          color: #2563eb;
        }
      `}</style>
      <Card
        className="group relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              className={
                "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
              }
              tabIndex={-1}
              style={{ pointerEvents: hovered ? "auto" : "none" }}
            >
              <Edit3 className="w-5 h-5" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-infocard-list">
            {items.map((item, idx) => (
              renderItem ? renderItem(item, idx) : (
                <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
              )
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
} 