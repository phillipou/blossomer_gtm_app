import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Check, X } from "lucide-react";

interface OverviewBlockProps {
  description: string;
  editingBlock: string | null;
  editContent: string;
  onEdit: (blockId: string, currentContent: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditContentChange: (val: string) => void;
}

export default function OverviewBlock({
  description,
  editingBlock,
  editContent,
  onEdit,
  onSave,
  onCancel,
  onEditContentChange,
}: OverviewBlockProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <span>Description</span>
          </CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onEdit("description", description)}>
          <Edit3 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {editingBlock === "description" ? (
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={onSave}>
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed">{description}</p>
        )}
      </CardContent>
    </Card>
  );
} 