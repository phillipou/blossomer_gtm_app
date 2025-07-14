import { useState, useMemo } from "react";
import EditDialogModal from "./EditDialogModal";

interface EditBuyingSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string | boolean>) => void;
  editingSignal?: BuyingSignal;
}

interface BuyingSignal {
  id?: string;
  title: string;
  description: string;
  enabled?: boolean;
  priority?: string;
}

export default function EditBuyingSignalModal({ isOpen, onClose, onSave, editingSignal }: EditBuyingSignalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const editing = !!editingSignal;
  
  // Memoize initialValues to prevent re-render loops
  const initialValues = useMemo(() => {
    return editingSignal
      ? { label: editingSignal.title, description: editingSignal.description, priority: editingSignal.priority || "" }
      : { label: "", description: "", priority: "" };
  }, [editingSignal]);

  const handleSave = (values: Record<string, string | boolean>) => {
    setIsLoading(true);
    onSave({
      label: String(values.label).trim(),
      description: String(values.description).trim(),
      priority: String(values.priority || "").trim(),
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <EditDialogModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={editing ? "Edit Buying Signal" : "Add Buying Signal"}
      description="Define indicators that suggest a prospect is ready to engage with your solution."
      fields={[
        { name: "label", label: "Signal", type: "input", placeholder: "e.g., Recently raised funding, Hiring sales roles...", required: true },
        { name: "priority", label: "Priority", type: "select", options: [
          { label: "High", value: "High" },
          { label: "Medium", value: "Medium" },
          { label: "Low", value: "Low" },
        ], placeholder: "Select priority", required: true },
        { name: "description", label: "Description", type: "textarea", placeholder: "Provide context about when this signal indicates buying intent..." },
      ]}
      initialValues={initialValues}
      isLoading={isLoading}
      saveLabel="Add Signal"
      editLabel="Update Signal"
      editing={editing}
    />
  );
} 