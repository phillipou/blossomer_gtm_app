import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Wand2, RefreshCw } from "lucide-react";
import { ModalLoadingOverlay, ModalLoadingMessages } from "../ui/modal-loading";

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string; accountId: string }) => void;
  title: string;
  subtitle?: string;
  nameLabel?: string;
  descriptionLabel?: string;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  submitLabel?: React.ReactNode;
  cancelLabel?: string;
  isLoading?: boolean;
  defaultName?: string;
  defaultDescription?: string;
  error?: string;
  accounts?: Array<{ id: string; name: string }>;
  selectedAccountId?: string;
  onAccountChange?: (accountId: string) => void;
  accountLabel?: string;
  accountPlaceholder?: string;
  // New generic props
  nameType?: 'text' | 'url';
  nameRequired?: boolean;
  descriptionRequired?: boolean;
  showDescription?: boolean;
  customNameValidation?: (value: string) => string | null;
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
  accounts = [],
  selectedAccountId = "",
  onAccountChange,
  accountLabel = "Target Account",
  accountPlaceholder = "Select target account...",
  nameType = 'text',
  nameRequired = true,
  descriptionRequired = true,
  showDescription = true,
  customNameValidation,
}: InputModalProps) {
  const [name, setName] = useState<string>(defaultName);
  const [description, setDescription] = useState<string>(defaultDescription);
  const [accountId, setAccountId] = useState<string>(selectedAccountId);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName(defaultName);
      setDescription(defaultDescription);
      setAccountId(selectedAccountId);
      setNameError(null);
    }
  }, [isOpen, defaultName, defaultDescription, selectedAccountId]);

  const handleAccountChange = (value: string) => {
    setAccountId(value);
    if (onAccountChange) onAccountChange(value);
  };

  // Removed complex validation useEffect entirely - following Bug_tracking.md "Remove, Don't Fix" pattern
  // Validation now happens only on submit for better typing performance

  const handleSubmit = () => {
    // Simple validation on submit only - no complex useEffect validation during typing
    if (accounts.length > 0 && !accountId) return;
    if (nameRequired && !name.trim()) {
      setNameError('This field is required');
      return;
    }
    if (nameType === 'url' && name) {
      try {
        new URL(name.startsWith('http') ? name : `https://${name}`);
      } catch {
        setNameError('Please enter a valid URL');
        return;
      }
    }
    if (customNameValidation) {
      const error = customNameValidation(name);
      if (error) {
        setNameError(error);
        return;
      }
    }
    if (showDescription && descriptionRequired && !description.trim()) return;
    
    setNameError(null); // Clear any previous errors
    onSubmit({ name: name.trim(), description: description.trim(), accountId });
  };

  const handleClose = () => {
    setName(defaultName);
    setDescription(defaultDescription);
    setAccountId(selectedAccountId);
    setNameError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <EditDialog open={isOpen} onOpenChange={handleClose}>
      <EditDialogContent className="sm:max-w-[500px]">
        <ModalLoadingOverlay isLoading={isLoading} message={ModalLoadingMessages.generating}>
        <EditDialogHeader>
          <EditDialogTitle>{title}</EditDialogTitle>
          {subtitle && <EditDialogDescription>{subtitle}</EditDialogDescription>}
        </EditDialogHeader>
        <div className="py-4 px-6 space-y-4">
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="input-modal-account">{accountLabel}</Label>
              <Select
                value={accountId}
                onValueChange={handleAccountChange}
              >
                <SelectTrigger id="input-modal-account" className="w-full">
                  <SelectValue placeholder={accountPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="input-modal-name">{nameLabel}{nameRequired ? ' *' : ''}</Label>
            <Input
              id="input-modal-name"
              type={nameType}
              placeholder={namePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            {nameError && (
              <p className="text-sm text-red-600">{nameError}</p>
            )}
          </div>
          {showDescription && (
            <div className="space-y-2">
              <Label htmlFor="input-modal-description">{descriptionLabel}{descriptionRequired ? ' *' : ''}</Label>
              <Textarea
                id="input-modal-description"
                placeholder={descriptionPlaceholder}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="min-h-[100px] focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          )}
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
            disabled={
              isLoading ||
              (accounts.length > 0 && !accountId) ||
              (nameRequired && !name.trim()) ||
              (showDescription && descriptionRequired && !description.trim())
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitLabel}
          </Button>
        </EditDialogFooter>
        </ModalLoadingOverlay>
      </EditDialogContent>
    </EditDialog>
  );
} 