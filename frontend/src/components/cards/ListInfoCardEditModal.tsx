import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import {
  EditDialog,
  EditDialogContent,
  EditDialogFooter,
  EditDialogHeader,
  EditDialogTitle
} from "../ui/dialog";

export interface ListInfoCardItem {
  id: string;
  text: string;
}

interface ListInfoCardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: ListInfoCardItem[]) => void;
  title: string;
  initialItems: ListInfoCardItem[];
  subtitle?: string;
}

export default function ListInfoCardEditModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialItems,
  subtitle,
}: ListInfoCardEditModalProps) {
  const [localItems, setLocalItems] = useState<ListInfoCardItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newItemRef = useRef<HTMLTextAreaElement>(null);
  const addAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalItems([...initialItems]);
      setEditingId(null);
      setHoveredId(null);
      setIsAddingNew(false);
      setNewItemText("");
    }
  }, [isOpen, initialItems]);

  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [editingId]);

  useEffect(() => {
    if (isAddingNew && newItemRef.current) {
      newItemRef.current.focus();
    }
  }, [isAddingNew]);

  const handleItemChange = (id: string, newText: string) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: newText } : item))
    );
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleFinishEdit = () => {
    setEditingId(null);
  };

  const handleDeleteItem = (id: string) => {
    setLocalItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveItem = (id: string, direction: "up" | "down") => {
    const currentIndex = localItems.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localItems.length) return;
    const updatedItems = [...localItems];
    const [movedItem] = updatedItems.splice(currentIndex, 1);
    updatedItems.splice(newIndex, 0, movedItem);
    setLocalItems(updatedItems);
  };

  const handleAddNewItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ListInfoCardItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
    };
    setLocalItems((prev) => [...prev, newItem]);
    setNewItemText("");
    setIsAddingNew(false);
  };

  const handleStartAddingNew = () => {
    setIsAddingNew(true);
    setNewItemText("");
  };

  const handleCancelAddingNew = () => {
    setIsAddingNew(false);
    setNewItemText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    } else if (e.key === "Escape") {
      if (editingId) {
        handleFinishEdit();
      } else if (isAddingNew) {
        handleCancelAddingNew();
      }
    }
  };

  const handleAddAreaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.length === 1 || e.key === "Backspace") {
      const newItem: ListInfoCardItem = {
        id: Date.now().toString(),
        text: e.key.length === 1 ? e.key : "",
      };
      setLocalItems((prev) => [...prev, newItem]);
      setEditingId(newItem.id);
      setIsAddingNew(false);
      if (e.key.length === 1) {
        e.preventDefault();
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Clean up empty items before saving
    const cleaned = localItems.filter((item) => item.text.trim() !== "");
    onSave(cleaned);
    setIsLoading(false);
    onClose();
  };

  const handleClose = () => {
    setLocalItems([]);
    setEditingId(null);
    setHoveredId(null);
    setIsAddingNew(false);
    setNewItemText("");
    onClose();
  };

  return (
    <EditDialog open={isOpen} onOpenChange={handleClose}>
      <EditDialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <EditDialogHeader>
          <EditDialogTitle>Edit {title}</EditDialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </EditDialogHeader>
        <div className="space-y-3 py-4 px-6 max-h-96 overflow-y-auto bg-gray-100 shadow rounded-xl p-6">
          {localItems.map((item, index) => (
            <div
              key={item.id}
              className={`group relative rounded-lg transition-all duration-200 bg-white shadow-sm ${
                hoveredId === item.id || editingId === item.id ? "ring-1 ring-gray-300" : ""
              }`}
              style={{ marginBottom: '0.5rem' }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-start space-x-3 p-3">
                {/* Blue Circle Bullet */}
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <Textarea
                      ref={textareaRef}
                      value={item.text}
                      onChange={(e) => handleItemChange(item.id, e.target.value)}
                      onBlur={handleFinishEdit}
                      onKeyDown={(e) => handleKeyPress(e, handleFinishEdit)}
                      className="min-h-[60px] resize-none border-none p-0 focus:ring-0 focus:border-none bg-transparent text-gray-700 leading-relaxed text-base md:text-base"
                      style={{ boxShadow: "none" }}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed cursor-text text-base md:text-base" onClick={() => handleStartEdit(item.id)}>
                      {item.text}
                    </p>
                  )}
                </div>
                {/* Hover Controls */}
                {(hoveredId === item.id || editingId === item.id) && editingId !== item.id && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveItem(item.id, "up")}
                      disabled={index === 0}
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                    >
                      <ArrowUp className="w-3 h-3 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveItem(item.id, "down")}
                      disabled={index === localItems.length - 1}
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                    >
                      <ArrowDown className="w-3 h-3 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Add New Item Section */}
          <div className="pt-2">
            {isAddingNew ? (
              <div className="flex items-start space-x-3 p-3 bg-white shadow-sm rounded-lg">
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <Textarea
                    ref={newItemRef}
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onBlur={() => {
                      if (newItemText.trim()) {
                        handleAddNewItem();
                      } else {
                        handleCancelAddingNew();
                      }
                    }}
                    onKeyDown={(e) => handleKeyPress(e, handleAddNewItem)}
                    placeholder="Enter new item..."
                    className="min-h-[60px] resize-none border-none p-0 focus:ring-0 focus:border-none bg-transparent text-gray-700 leading-relaxed text-base md:text-base"
                    style={{ boxShadow: "none" }}
                  />
                </div>
              </div>
            ) : (
              <div
                ref={addAreaRef}
                tabIndex={0}
                onClick={handleStartAddingNew}
                onKeyDown={handleAddAreaKeyDown}
                className="w-full text-left p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Add a new item...
              </div>
            )}
          </div>
        </div>
        <EditDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </EditDialogFooter>
      </EditDialogContent>
    </EditDialog>
  );
} 