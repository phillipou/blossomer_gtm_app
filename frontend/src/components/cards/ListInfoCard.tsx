import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Edit3 } from "lucide-react";
import type { ReactNode } from "react";
import ListInfoCardEditModal, { type ListInfoCardItem } from "./ListInfoCardEditModal";

interface ListInfoCardProps {
  title: string;
  items: string[];
  onEdit?: (newItems: string[]) => void;
  renderItem?: (item: string, index: number) => ReactNode;
  editModalSubtitle?: string;
}

export default function ListInfoCard({ title, items, onEdit, renderItem, editModalSubtitle }: ListInfoCardProps) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [localItems, setLocalItems] = useState<string[]>(items);

  // Keep localItems in sync with props
  // (if items prop changes, update localItems)
  // This is important for dashboard updates
  // (optional: can add useEffect if needed)

  // Convert string[] to ListInfoCardItem[]
  const toItemObjects = (arr: string[]): ListInfoCardItem[] =>
    arr.map((text, idx) => ({ id: `${idx}-${text.slice(0, 8)}-${Math.random()}`, text }));
  // Convert ListInfoCardItem[] to string[]
  const toStringArray = (arr: ListInfoCardItem[]): string[] =>
    arr.map((item) => item.text);

  const handleEditClick = () => {
    setModalOpen(true);
  };

  const handleModalSave = (newItems: ListInfoCardItem[]) => {
    const updated = toStringArray(newItems);
    setLocalItems(updated);
    if (onEdit) onEdit(updated);
  };

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
              onClick={handleEditClick}
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
            {localItems.map((item, idx) => (
              renderItem ? renderItem(item, idx) : (
                <li key={idx} className="list-disc list-inside text-sm text-gray-700 blue-bullet">{item}</li>
              )
            ))}
          </ul>
        </CardContent>
      </Card>
      {onEdit && (
        <ListInfoCardEditModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleModalSave}
          title={title}
          initialItems={toItemObjects(localItems)}
          subtitle={editModalSubtitle}
        />
      )}
    </>
  );
} 