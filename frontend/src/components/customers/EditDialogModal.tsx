import React, { useState, useEffect } from "react";
import {
  EditDialog,
  EditDialogContent,
  EditDialogDescription,
  EditDialogFooter,
  EditDialogHeader,
  EditDialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface EditDialogField {
  name: string;
  label: string;
  type: "input" | "textarea" | "switch";
  placeholder?: string;
  required?: boolean;
}

interface EditDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
  title: string;
  description?: string;
  fields: EditDialogField[];
  initialValues?: Record<string, any>;
  isLoading?: boolean;
  saveLabel?: string;
  editLabel?: string;
  editing?: boolean;
}

export function EditDialogModal({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  fields,
  initialValues = {},
  isLoading = false,
  saveLabel = "Save",
  editLabel = "Update",
  editing = false,
}: EditDialogModalProps) {
  const [form, setForm] = useState<Record<string, any>>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues, isOpen]);

  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    for (const field of fields) {
      if (field.required && !form[field.name]?.toString().trim()) return;
    }
    onSave(form);
  };

  const handleClose = () => {
    setForm(initialValues);
    onClose();
  };

  return (
    <EditDialog open={isOpen} onOpenChange={handleClose}>
      <EditDialogContent className="sm:max-w-[500px]">
        <EditDialogHeader>
          <EditDialogTitle>{title}</EditDialogTitle>
          {description && <EditDialogDescription>{description}</EditDialogDescription>}
        </EditDialogHeader>
        <div className="space-y-4 py-4 px-6">
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "input" && (
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="focus:border-blue-500 focus:ring-blue-500"
                />
              )}
              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="min-h-[100px] focus:border-blue-500 focus:ring-blue-500"
                />
              )}
              {field.type === "switch" && (
                <Switch
                  checked={!!form[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                />
              )}
            </div>
          ))}
        </div>
        <EditDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={fields.some(f => f.required && !form[f.name]?.toString().trim()) || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? "Saving..." : editing ? editLabel : saveLabel}
          </Button>
        </EditDialogFooter>
      </EditDialogContent>
    </EditDialog>
  );
} 