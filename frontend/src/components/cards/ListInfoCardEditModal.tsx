import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import TextareaAutosize from "react-textarea-autosize";
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
  onSave: (items: ListInfoCardItem[]) => Promise<void>;
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

  // Deep debug logging for mount/unmount and prop changes
  useEffect(() => {
    console.log('[MODAL][LIFECYCLE] MOUNTED', {
      isOpen,
      title,
      initialItems,
      subtitle,
      onSave,
      onSaveString: onSave?.toString(),
    });
    return () => {
      console.log('[MODAL][LIFECYCLE] UNMOUNTED', { title });
    };
  }, []);

  useEffect(() => {
    console.log('[MODAL][LIFECYCLE] PROPS CHANGED', {
      isOpen,
      title,
      initialItems,
      subtitle,
      onSave,
      onSaveString: onSave?.toString(),
    });
  }, [isOpen, title, initialItems, subtitle, onSave]);

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
    console.log('[MODAL][DEBUG] === MODAL HANDLE SAVE STARTED ===');
    console.log('[MODAL][DEBUG] isLoading:', isLoading);
    console.log('[MODAL][DEBUG] handleSave closure values:', {
      isOpen,
      title,
      initialItems,
      subtitle,
      onSave,
      onSaveString: onSave?.toString(),
      localItems,
    });
    
    if (isLoading) {
      console.log('[MODAL][DEBUG] Returning early due to isLoading');
      return; // Prevent double-clicks
    }
    
    setIsLoading(true);
    console.log('[MODAL][DEBUG] Save button clicked, isLoading set to true');
    console.log('[MODAL][DEBUG] onSave function type:', typeof onSave);
    console.log('[MODAL][DEBUG] onSave function:', onSave);
    
    try {
      // Clean up empty items before saving
      const cleaned = localItems.filter((item) => item.text.trim() !== "");
      console.log('[MODAL][DEBUG] Cleaned items:', cleaned);
      console.log('[MODAL][DEBUG] About to call onSave...');
      
      // Call the parent's save function and wait for it to complete
      const result = await onSave(cleaned);
      
      console.log('[MODAL][DEBUG] onSave completed successfully, result:', result);
      
      // Close the modal after successful save
      console.log('[MODAL][DEBUG] Calling onClose...');
      onClose();
      console.log('[MODAL][DEBUG] === MODAL HANDLE SAVE COMPLETED ===');
    } catch (error) {
      console.error('[MODAL][DEBUG] Save failed:', error);
      // Don't close the modal if save failed
    } finally {
      console.log('[MODAL][DEBUG] Setting isLoading to false');
      setIsLoading(false);
    }
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
              <div className="flex items-center space-x-3 p-3">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <TextareaAutosize
                      ref={textareaRef}
                      value={item.text}
                      onChange={(e) => handleItemChange(item.id, e.target.value)}
                      onBlur={handleFinishEdit}
                      onKeyDown={(e) => handleKeyPress(e, handleFinishEdit)}
                      minRows={3}
                      maxRows={10}
                      className="w-full resize-none border-none py-3 px-0 focus:ring-0 focus:border-none bg-transparent text-gray-700 leading-relaxed text-base md:text-base"
                      style={{ boxShadow: "none" }}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed cursor-text text-base md:text-base py-3 px-0" onClick={() => handleStartEdit(item.id)}>
                      {item.text}
                    </p>
                  )}
                </div>
                {/* Persistent Controls Area */}
                <div className="flex items-center space-x-1 min-w-[90px] h-8 justify-end">
                  {(hoveredId === item.id || editingId === item.id) && editingId !== item.id ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {/* Add New Item Section */}
          <div className="pt-2">
            {isAddingNew ? (
              <div className="flex items-start space-x-3 p-3 bg-white shadow-sm rounded-lg">
                {/* No bullet when adding a new item */}
                <div className="flex-1">
                  <TextareaAutosize
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
                    minRows={3}
                    maxRows={10}
                    className="w-full resize-none border-none py-3 px-0 focus:ring-0 focus:border-none bg-transparent text-gray-700 leading-relaxed text-base md:text-base"
                    style={{ boxShadow: "none" }}
                  />
                </div>
                {/* Persistent Controls Area for Add New (empty, but reserves space) */}
                <div className="min-w-[90px] h-8"></div>
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
          <Button
            onClick={() => {
              if (editingId) {
                handleFinishEdit();
                setTimeout(() => {
                  handleSave();
                }, 0);
              } else {
                handleSave();
              }
            }}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </EditDialogFooter>
      </EditDialogContent>
    </EditDialog>
  );
} 