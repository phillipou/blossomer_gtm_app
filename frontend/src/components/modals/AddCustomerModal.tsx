import React from "react";
import { Button } from "../ui/button";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingProfile?: any;
}

export default function AddCustomerModal({ isOpen, onClose, onSave, editingProfile }: AddCustomerModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {editingProfile ? "Edit Customer" : "Add Customer"}
        </h2>
        {/* TODO: Add form fields for name, role, description */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
} 