import React, { useState, useEffect } from "react";
import {
  EditDialog,
  EditDialogContent,
  EditDialogHeader,
  EditDialogTitle,
  EditDialogFooter,
  EditDialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string }) => void;
  title: string;
  subtitle?: string;
  nameLabel?: string;
  descriptionLabel?: string;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  defaultName?: string;
  defaultDescription?: string;
  error?: string;
}

export default function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  nameLabel = "Profile Title",
  descriptionLabel = "Description",
  namePlaceholder = "Enter name...",
  descriptionPlaceholder = "Enter description...",
  submitLabel = "Enter",
  cancelLabel = "Cancel",
  isLoading = false,
  defaultName = "",
  defaultDescription = "",
  error,
}: InputModalProps) {
  const [name, setName] = useState<string>(defaultName);
  const [description, setDescription] = useState<string>(defaultDescription);

  useEffect(() => {
    setName(defaultName);
    setDescription(defaultDescription);
  }, [defaultName, defaultDescription, isOpen]);

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  const handleClose = () => {
    setName(defaultName);
    setDescription(defaultDescription);
    onClose();
  };

  return (
    <EditDialog open={isOpen} onOpenChange={handleClose}>
      <EditDialogContent className="sm:max-w-[500px]">
        <EditDialogHeader>
          <EditDialogTitle>{title}</EditDialogTitle>
          {subtitle && <EditDialogDescription>{subtitle}</EditDialogDescription>}
        </EditDialogHeader>
        <div className="py-4 px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input-modal-name">{nameLabel}</Label>
            <Input
              id="input-modal-name"
              placeholder={namePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="input-modal-description">{descriptionLabel}</Label>
            <Textarea
              id="input-modal-description"
              placeholder={descriptionPlaceholder}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[100px] focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-sm text-center">
              {error}
            </div>
          )}
        </div>
        <EditDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !description.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? "Saving..." : submitLabel}
          </Button>
        </EditDialogFooter>
      </EditDialogContent>
    </EditDialog>
  );
} 