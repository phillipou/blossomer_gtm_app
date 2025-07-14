import { useState, useEffect } from "react";
import { EditDialog as Dialog, EditDialogContent as DialogContent, EditDialogHeader as DialogHeader, EditDialogTitle as DialogTitle, EditDialogFooter as DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Edit3, X, Plus, Trash2 } from "lucide-react";
import { ModalLoadingOverlay, ModalLoadingMessages } from "../ui/modal-loading";

interface CriteriaValue {
  text: string;
  color: string;
}

interface CriteriaRow {
  id: string;
  label: string;
  values: CriteriaValue[];
}

interface EditCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rows: CriteriaRow[]) => void;
  initialRows: CriteriaRow[] | undefined;
  title?: string;
}

const colorOptions: string[] = ["yellow", "blue", "red", "gray", "green", "purple", "indigo"];

const getColorClass = (color: string) => {
  switch (color) {
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    case "gray":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "purple":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "indigo":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function EditCriteriaModal({ isOpen, onClose, onSave, initialRows, title = "Edit Criteria" }: EditCriteriaModalProps) {
  const [rows, setRows] = useState<CriteriaRow[]>([]);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<{ rowId: string; isNew: boolean } | null>(null);
  const [newTagValue, setNewTagValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialRows && Array.isArray(initialRows)) {
        setRows(
          initialRows.map((row, idx) => ({
            ...row,
            id: row.id || String(idx) + "-" + (row.label || "row"),
            values: Array.isArray(row.values) ? [...row.values] : [],
          }))
        );
      } else {
        setRows([]);
      }
      setEditingLabel(null);
      setEditingValue(null);
      setNewTagValue("");
    }
  }, [isOpen, initialRows]);

  const handleAddValue = (rowId: string) => {
    const newValue = newTagValue.trim();
    if (!newValue) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const existingColors = row.values.map((v: { color: string }) => v.color);
          const availableColors = colorOptions.filter((color: string) => !existingColors.includes(color));
          const selectedColor = availableColors.length > 0 ? availableColors[0] : colorOptions[0];
          return {
            ...row,
            values: [...row.values, { text: newValue, color: selectedColor }],
          };
        }
        return row;
      })
    );
    setNewTagValue("");
    setEditingValue(null);
  };

  const handleRemoveValue = (rowId: string, valueIndex: number) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            values: row.values.filter((_: CriteriaValue, index: number) => index !== valueIndex),
          };
        }
        return row;
      })
    );
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleAddRow = () => {
    const newRow: CriteriaRow = {
      id: Date.now().toString(),
      label: "New Category",
      values: [],
    };
    setRows((prev) => [...prev, newRow]);
    setEditingLabel(newRow.id);
  };

  const handleRowLabelChange = (rowId: string, newLabel: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return { ...row, label: newLabel };
        }
        return row;
      })
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onSave(rows);
    setIsLoading(false);
    onClose();
  };

  const handleClose = () => {
    setRows([]);
    setEditingLabel(null);
    setEditingValue(null);
    setNewTagValue("");
    onClose();
  };

  const startAddingTag = (rowId: string) => {
    setEditingValue({ rowId, isNew: true });
    setNewTagValue("");
  };

  const cancelAddingTag = () => {
    setEditingValue(null);
    setNewTagValue("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto px-0 py-0">
        <ModalLoadingOverlay isLoading={isLoading} message={ModalLoadingMessages.saving}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 px-6">
          {rows.map((row) => (
            <div key={row.id} className="flex items-start space-x-4 py-3 border-b border-gray-100 last:border-b-0 group">
              {/* Label Column */}
              <div className="w-32 flex-shrink-0 pt-1">
                {editingLabel === row.id ? (
                  <Input
                    value={row.label}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRowLabelChange(row.id, e.target.value)}
                    onBlur={() => setEditingLabel(null)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        setEditingLabel(null);
                      }
                    }}
                    className="text-sm font-medium h-8"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{row.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLabel(row.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                      type="button"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Values Column */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {row.values.map((value: CriteriaValue, valueIndex: number) => (
                    <Badge
                      key={valueIndex}
                      className={`${getColorClass(value.color)} border flex items-center gap-1 pr-1`}
                    >
                      <span>{value.text}</span>
                      <button
                        onClick={() => handleRemoveValue(row.id, valueIndex)}
                        className="hover:bg-black/10 rounded-full p-0.5 ml-1"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}

                  {/* Add Tag Section */}
                  {editingValue?.rowId === row.id && editingValue.isNew ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter value"
                        value={newTagValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagValue(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            handleAddValue(row.id);
                          } else if (e.key === "Escape") {
                            cancelAddingTag();
                          }
                        }}
                        onBlur={() => {
                          if (newTagValue.trim()) {
                            handleAddValue(row.id);
                          } else {
                            cancelAddingTag();
                          }
                        }}
                        className="w-32 h-7 text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startAddingTag(row.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                      type="button"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Tag
                    </Button>
                  )}
                </div>
              </div>

              {/* Delete Row Button */}
              <div className="flex-shrink-0 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRow(row.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                  type="button"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Row
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRow}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              type="button"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} type="button">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600" type="button">
            Save
          </Button>
        </DialogFooter>
        </ModalLoadingOverlay>
      </DialogContent>
    </Dialog>
  );
}