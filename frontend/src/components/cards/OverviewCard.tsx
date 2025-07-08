import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Building2, Edit3 } from "lucide-react";
import { useState } from "react";
import InputModal from "../modals/InputModal";

import type { EntityType } from "../../lib/entityColors";

interface OverviewCardProps {
  title: string;
  subtitle?: string;
  buttonTitle?: string;
  bodyTitle?: string;
  bodyText?: string;
  showButton?: boolean;
  onButtonClick?: () => void;
  onEdit?: (values: { name: string; description: string }) => void;
  children?: React.ReactNode;
  entityType?: EntityType;
}

import { getEntityDotColor } from "../../lib/entityColors";

export default function OverviewCard({
  title,
  subtitle,
  buttonTitle = "View Details",
  bodyTitle = "DESCRIPTION",
  bodyText = "",
  showButton = true,
  onButtonClick,
  onEdit,
  children,
  entityType,
}: OverviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = (values: { name: string; description: string }) => {
    onEdit?.(values);
    setEditModalOpen(false);
  };

  // Determine border color class
  const entityColor = entityType ? getEntityDotColor(entityType) : 'bg-blue-400';
  const borderColor = entityColor.replace('bg-', 'border-');

  return (
    <>
      <Card
        className={`mb-6 group relative border-0 border-l-4 ${borderColor}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-black">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleEdit}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
                  tabIndex={-1}
                  style={{ pointerEvents: isHovered ? "auto" : "none" }}
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              )}
              {showButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                  onClick={onButtonClick}
                >
                  {buttonTitle}
                </Button>
              )}
            </div>
          </div>
          <div>
            {bodyTitle && <h3 className="text-sm font-medium text-gray-700 mb-2">{bodyTitle}</h3>}
            <p className="text-gray-600 text-sm leading-relaxed">{bodyText}</p>
          </div>
          {children}
        </CardContent>
      </Card>

      {onEdit && (
        <InputModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleSaveEdit}
          title="Edit Overview"
          subtitle="Update the title and description"
          nameLabel="Title"
          descriptionLabel="Description"
          namePlaceholder="Enter title..."
          descriptionPlaceholder="Enter description..."
          submitLabel="Save Changes"
          cancelLabel="Cancel"
          defaultName={title}
          defaultDescription={bodyText}
        />
      )}
    </>
  );
} 