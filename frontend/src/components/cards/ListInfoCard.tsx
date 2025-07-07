import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Edit3 } from "lucide-react";
import type { ReactNode } from "react";
import ListInfoCardEditModal, { type ListInfoCardItem } from "./ListInfoCardEditModal";
import React, { isValidElement } from "react";

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

  // Helper to render a list item with custom bullet and alignment
  const renderFlexBulletItem = (content: ReactNode, idx: number) => (
    <li key={idx} className="flex items-start text-sm text-gray-700 m-0 p-0" style={{ margin: 0, padding: 0 }}>
      <span className="mt-1 mr-2 text-blue-600" style={{ minWidth: '1em', textAlign: 'center', lineHeight: 1.2 }}>&#8226;</span>
      <span className="flex-1 whitespace-pre-line break-words">{content}</span>
    </li>
  );

  // Wrap renderItem to warn if it returns an <li>
  const safeRenderItem = (item: string, idx: number) => {
    const content = renderItem ? renderItem(item, idx) : item;
    if (
      process.env.NODE_ENV === "development" &&
      isValidElement(content) &&
      content.type === "li"
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ListInfoCard] renderItem should not return an <li>. Return only the content."
      );
    }
    return content;
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
          <ul className="space-y-2 list-infocard-list m-0 p-0" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {localItems.map((item, idx) => renderFlexBulletItem(safeRenderItem(item, idx), idx))}
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