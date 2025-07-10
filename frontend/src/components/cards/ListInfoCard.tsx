import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Edit3 } from "lucide-react";
import type { ReactNode } from "react";
import ListInfoCardEditModal, { type ListInfoCardItem } from "./ListInfoCardEditModal";
import { isValidElement } from "react";

import type { EntityType } from "../../lib/entityColors";
import { getEntityDotColor } from "../../lib/entityColors";

interface ListInfoCardProps {
  title: string;
  items: string[];
  // Remove onEdit, add onEditRequest
  onEditRequest?: (items: string[]) => void;
  renderItem?: (item: string, index: number) => ReactNode;
  editModalSubtitle?: string;
  entityType?: EntityType;
}

export default function ListInfoCard({ title, items, onEditRequest, renderItem, editModalSubtitle, entityType }: ListInfoCardProps) {
  const [hovered, setHovered] = useState(false);
  // Remove modalOpen, localItems, and all modal logic

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
    <Card
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {onEditRequest && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEditRequest(items)}
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
          {items.map((item, idx) => renderStandardBulletItem(safeRenderItem(item, idx), idx))}
        </ul>
      </CardContent>
    </Card>
  );
} 