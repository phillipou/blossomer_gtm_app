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

  // Helper to render a list item with standard bullet and alignment
  const renderStandardBulletItem = (content: ReactNode, idx: number) => (
    <li key={idx} className="list-disc list-inside text-base text-gray-700 mb-2">
      {content}
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
          <ul className="list-disc list-inside m-0 p-0">
            {localItems.map((item, idx) => renderStandardBulletItem(safeRenderItem(item, idx), idx))}
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