import React, { useState } from "react";
import EditDialogModal from "./EditDialogModal";

export default function EditBuyingSignalModal({ isOpen, onClose, onSave, editingSignal }: EditBuyingSignalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const editing = !!editingSignal;
  const initialValues = editingSignal
    ? { label: editingSignal.label, description: editingSignal.description }
    : { label: "", description: "" };

  const handleSave = (values: Record<string, any>) => {
    setIsLoading(true);
    onSave({
      label: values.label.trim(),
      description: values.description.trim(),
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