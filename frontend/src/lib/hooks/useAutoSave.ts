import { useEffect, useRef, useCallback, useState } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { DraftManager, EntityType } from '../draftManager';

export interface UseAutoSaveOptions<T, CreateInput, UpdateInput> {
  entity: EntityType;
  data: T | null;
  createMutation: UseMutationResult<T, Error, CreateInput>;
  updateMutation: UseMutationResult<T, Error, UpdateInput>;
  isAuthenticated: boolean;
  entityId?: string; // If entity already exists (for updates)
  parentId?: string; // For nested entities (account->company, persona->account, etc.)
  debounceMs?: number;
  onSaveSuccess?: (savedEntity: T) => void;
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  isDraft: boolean;
  isSaving: boolean;
  saveError: Error | null;
  saveImmediately: () => void;
  tempId?: string;
}

export function useAutoSave<T, CreateInput, UpdateInput>({
  entity,
  data,
  createMutation,
  updateMutation,
  isAuthenticated,
  entityId,
  parentId,
  debounceMs = 500,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T, CreateInput, UpdateInput>): UseAutoSaveReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSaveAttempted = useRef(false);
  const [tempId, setTempId] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<Error | null>(null);

  const isExistingEntity = !!entityId;
  const isDraft = !isExistingEntity && !!tempId;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Immediate save function
  const saveImmediately = useCallback(() => {
    if (!data) return;

    if (isExistingEntity) {
      // Update existing entity
      updateMutation.mutate(data as UpdateInput, {
        onSuccess: (savedEntity) => {
          setSaveError(null);
          onSaveSuccess?.(savedEntity);
        },
        onError: (error) => {
          setSaveError(error);
          onSaveError?.(error);
        },
      });
    } else {
      // Create new entity
      createMutation.mutate(data as CreateInput, {
        onSuccess: (savedEntity) => {
          setSaveError(null);
          // Clean up draft on successful save
          if (tempId) {
            DraftManager.removeDraft(entity, tempId);
            setTempId(undefined);
          }
          onSaveSuccess?.(savedEntity);
        },
        onError: (error) => {
          setSaveError(error);
          // Save to draft on failure
          if (!tempId && data) {
            const newTempId = DraftManager.saveDraft(entity, data, parentId);
            setTempId(newTempId);
          }
          onSaveError?.(error);
        },
      });
    }
  }, [
    data,
    entity,
    tempId,
    parentId,
    isExistingEntity,
    createMutation,
    updateMutation,
    onSaveSuccess,
    onSaveError,
  ]);

  // Debounced save for user edits
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveImmediately();
    }, debounceMs);
  }, [saveImmediately, debounceMs]);

  // Effect for immediate save after AI generation
  useEffect(() => {
    if (!data || initialSaveAttempted.current) return;
    
    console.log(`🚀 useAutoSave (${entity}): Initial save attempt triggered`, {
      data,
      isAuthenticated,
      isExistingEntity,
      parentId
    });
    
    initialSaveAttempted.current = true;

    if (isAuthenticated && !isExistingEntity) {
      // Immediate save for authenticated users with new entities
      console.log(`💾 useAutoSave (${entity}): Attempting immediate save for authenticated user`);
      saveImmediately();
    } else if (!isAuthenticated && !isExistingEntity) {
      // Save to draft for unauthenticated users
      console.log(`📝 useAutoSave (${entity}): Saving to draft for unauthenticated user`);
      const newTempId = DraftManager.saveDraft(entity, data, parentId);
      setTempId(newTempId);
    } else {
      console.log(`⏭️ useAutoSave (${entity}): Skipping save - existing entity or no data`);
    }
  }, [data, isAuthenticated, isExistingEntity, entity, parentId, saveImmediately]);

  // Effect for debounced saves on data changes (after initial save)
  useEffect(() => {
    if (!data || !initialSaveAttempted.current) return;

    // Only auto-save edits to existing entities or drafts that failed to save
    if (isExistingEntity || (tempId && !isAuthenticated)) {
      debouncedSave();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, isExistingEntity, tempId, isAuthenticated, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isDraft,
    isSaving,
    saveError,
    saveImmediately,
    tempId,
  };
}

// Legacy hook for backward compatibility
const useAutoSaveLegacy = <T,>(
  callback: (data: T) => Promise<void>,
  data: T,
  delay = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);

  const debouncedCallback = useCallback(callback, []);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      debouncedCallback(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debouncedCallback, delay]);
};

export default useAutoSaveLegacy;
