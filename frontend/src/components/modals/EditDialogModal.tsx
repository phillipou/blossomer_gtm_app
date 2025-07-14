import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { ModalLoadingOverlay, ModalLoadingMessages } from "../ui/modal-loading";

interface EditDialogField {
  name: string;
  label: string;
  type: "input" | "textarea" | "switch" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface EditDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string | boolean>) => void;
  title: string;
  description?: string;
  fields: EditDialogField[];
  initialValues?: Record<string, string | boolean>;
  isLoading?: boolean;
  saveLabel?: string;
  editLabel?: string;
  editing?: boolean;
  children?: ReactNode;
}

export default function EditDialogModal({
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
  children,
}: EditDialogModalProps) {
  const [form, setForm] = useState<Record<string, string | boolean>>(initialValues);
  const lastInitialValuesRef = useRef<Record<string, string | boolean>>();

  useEffect(() => {
    // Deep comparison to prevent unnecessary updates when object reference changes but content is the same
    const hasChanged = !lastInitialValuesRef.current || 
      JSON.stringify(lastInitialValuesRef.current) !== JSON.stringify(initialValues);
    
    if (hasChanged) {
      lastInitialValuesRef.current = initialValues;
      setForm(initialValues);
    }
  }, [initialValues, isOpen]);

  const handleChange = (name: string, value: string | boolean) => {
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
        <ModalLoadingOverlay isLoading={isLoading} message={ModalLoadingMessages.saving}>
        <EditDialogHeader>
          <EditDialogTitle>{title}</EditDialogTitle>
          {description && <EditDialogDescription>{description}</EditDialogDescription>}
        </EditDialogHeader>
        {children ? children : (
          <div className="space-y-4 py-4 px-6">
            {fields.map((field) => (
              <div className="space-y-2 bg-gray-50 rounded-lg px-4 py-3" key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "input" && (
                  <Input
                    id={field.name}
                    placeholder={field.placeholder}
                    value={String(form[field.name] || "")}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={String(form[field.name] || "")}
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
                {field.type === "select" && field.options && (
                  <Select value={String(form[field.name] || "")} onValueChange={val => handleChange(field.name, val)}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}
        <EditDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={fields.some(f => f.required && !form[f.name]?.toString().trim()) || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {editing ? editLabel : saveLabel}
          </Button>
        </EditDialogFooter>
        </ModalLoadingOverlay>
      </EditDialogContent>
    </EditDialog>
  );
} 