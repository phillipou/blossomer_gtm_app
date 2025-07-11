import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from '../auth';
import { useAutoSave } from './useAutoSave';
import { DraftManager } from '../draftManager';
import { isApiError } from '../utils';
import type { ListInfoCardItem } from '../../components/cards/ListInfoCardEditModal';

export type EntityType = 'company' | 'account' | 'persona' | 'campaign';

export interface EntityCardConfig<T = any> {
  key: string;
  label: string;
  bulleted?: boolean;
  getItems: (entity: T) => string[];
  subtitle: string;
}

export interface EntityPageConfig<T = any> {
  entityType: EntityType;
  cardConfigs: EntityCardConfig<T>[];
  preservedComplexTypes?: string[];
  generateEndpoint: string;
  childEntities?: EntityType[];
  routePrefix: {
    authenticated: string;
    unauthenticated: string;
  };
  emptyStateConfig: {
    pageTitle: string;
    pageSubtitle: string;
    overviewTitle: string;
    overviewSubtitle: string;
    buttonText: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  progressStages?: Array<{ label: string; percent: number }>;
}

export interface EntityPageHooks<T = any> {
  useGet: (token?: string | null, entityId?: string) => {
    data: T | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };
  useGetList: (token?: string | null) => {
    data: T[] | undefined;
    isLoading: boolean;
  };
  useGenerateWithAI: (token?: string | null, entityId?: string) => {
    mutate: (data: any, options?: any) => void;
    isPending: boolean;
    error: any;
  };
  useCreate: (token?: string | null) => any;
  useUpdate: (token?: string | null, entityId?: string) => any;
  useUpdatePreserveFields: (token?: string | null, entityId?: string) => any;
  useUpdateListFieldsPreserveFields: (token?: string | null, entityId?: string) => any;
}

export interface UseEntityPageParams<T = any> {
  config: EntityPageConfig<T>;
  hooks: EntityPageHooks<T>;
}

export interface UseEntityPageReturn<T = any> {
  // Core data
  entity: T | undefined;
  displayEntity: T | undefined;
  isLoading: boolean;
  error: any;
  
  // Auth & routing
  token: string | null;
  entityId: string | undefined;
  isAuthenticatedMode: boolean;
  isUnauthenticatedMode: boolean;
  
  // Generation
  generateEntity: (params: any) => void;
  isGenerating: boolean;
  progressStage: number;
  isGenerationModalOpen: boolean;
  setIsGenerationModalOpen: (open: boolean) => void;
  
  // Field editing
  editingField: string | null;
  editingItems: ListInfoCardItem[];
  isEditDialogOpen: boolean;
  handleListEdit: (field: string, items: string[]) => void;
  handleSave: (newItems: ListInfoCardItem[]) => Promise<void>;
  closeEditDialog: () => void;
  
  // Overview editing
  handleOverviewEdit: (values: { name: string; description: string }) => void;
  
  // Auto-save
  autoSave: {
    isSaving: boolean;
    error: any;
  };
  
  // State for empty states
  showEmptyState: boolean;
  
  // Retry functionality
  handleRetry: () => void;
}

export function useEntityPage<T = any>({
  config,
  hooks
}: UseEntityPageParams<T>): UseEntityPageReturn<T> {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: entityId } = useParams<{ id: string }>();
  const { token } = useAuthState();
  const queryClient = useQueryClient();
  
  // Determine the mode based on route params and auth state
  const isAuthenticatedMode = !!token && !!entityId;
  const isUnauthenticatedMode = !token && !entityId;
  
  // State
  const [generatedEntityData, setGeneratedEntityData] = useState<T | null>(null);
  const [progressStage, setProgressStage] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<ListInfoCardItem[]>([]);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const apiResponseProcessed = useRef(false);
  
  // Get entity list for authenticated mode redirects
  const { data: entityList, isLoading: isLoadingEntityList } = hooks.useGetList(token);
  
  // Route handling for authenticated users - DISABLED
  // This redirect logic was causing too many unintended consequences
  // Components should handle their own navigation logic
  // useEffect(() => {
  //   if (token && !entityId && entityList && entityList.length > 0) {
  //     // Authenticated user without entityId - redirect to most recent entity
  //     const mostRecentEntity = entityList[entityList.length - 1] as any;
  //     console.log(`${config.entityType}: Authenticated user redirecting to most recent entity`);
  //     navigate(`${config.routePrefix.authenticated}/${mostRecentEntity.id}`, { replace: true });
  //     return;
  //   } else if (!token && entityId) {
  //     // Unauthenticated user with entityId - redirect to unauthenticated route
  //     console.log(`${config.entityType}: Unauthenticated user redirecting to playground`);
  //     navigate(config.routePrefix.unauthenticated, { replace: true });
  //     return;
  //   }
  // }, [token, entityId, entityList, navigate, config]);
  
  // Clear cache for authenticated users
  useEffect(() => {
    if (token && entityId) {
      console.log(`${config.entityType}: Clearing stale cache for authenticated user`);
      queryClient.removeQueries({ queryKey: [config.entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: [config.entityType, entityId] });
    }
  }, [token, entityId, queryClient, config.entityType]);
  
  // Fetch entity data
  const { data: entity, isLoading: isGetLoading, error: getError, refetch } = hooks.useGet(token, entityId);
  
  // Generation and mutations
  const { mutate: generateEntity, isPending: isGenerating, error: generateError } = hooks.useGenerateWithAI(token, entityId);
  const createMutation = hooks.useCreate(token);
  const updateMutation = hooks.useUpdate(token, entityId);
  const { mutateAsync: updateListFieldsAsync } = hooks.useUpdateListFieldsPreserveFields(token, entityId);
  const { mutate: updateWithFieldPreservation } = hooks.useUpdatePreserveFields(token, entityId);
  
  // Get draft data
  const draftEntities = DraftManager.getDrafts(config.entityType);
  const draftEntity = draftEntities.length > 0 ? draftEntities[0].data : null;
  
  // Auto-save hook
  const autoSave = useAutoSave({
    entity: config.entityType,
    data: generatedEntityData,
    createMutation,
    updateMutation,
    isAuthenticated: !!token,
    entityId,
    onSaveSuccess: (savedEntity: any) => {
      console.log(`${config.entityType}: Auto-saved successfully`, savedEntity);
      setGeneratedEntityData(null);
      navigate(`${config.routePrefix.authenticated}/${savedEntity.id}`, { replace: true });
    },
    onSaveError: (error: any) => {
      console.error(`${config.entityType}: Auto-save failed`, error);
    },
  });
  
  // Handle API response from location state (for unauthenticated users)
  useEffect(() => {
    const apiResponse = location.state?.apiResponse;
    if (apiResponse && !apiResponseProcessed.current && !token) {
      console.log(`${config.entityType}: Processing API response from location state`);
      apiResponseProcessed.current = true;
      queryClient.setQueryData([config.entityType, entityId], apiResponse);
      setGeneratedEntityData(apiResponse);
    } else if (apiResponse && token) {
      console.log(`${config.entityType}: Ignoring location state for authenticated user`);
    }
  }, [location.state, queryClient, entityId, token, config.entityType]);
  
  // Generation progress handling
  useEffect(() => {
    if (isGenerating && config.progressStages) {
      setProgressStage(0);
      const timer = setInterval(() => {
        setProgressStage(prev => {
          if (prev < config.progressStages!.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isGenerating, config.progressStages]);
  
  // Auth-aware data source selection
  const displayEntity = token ? entity : (entity || draftEntity);
  
  // Debug logging for authenticated users
  if (token && draftEntity && entity !== draftEntity) {
    console.warn(`${config.entityType}: CRITICAL - Authenticated user has localStorage draft that differs from backend!`);
  }
  
  // Field editing handlers
  const handleListEdit = useCallback((field: string, items: string[]) => {
    setEditingField(field);
    setEditingItems(items.map((text, i) => ({ id: i.toString(), text })));
  }, []);
  
  // Open edit dialog when both field and items are set
  useEffect(() => {
    if (editingField && editingItems.length > 0 && !isEditDialogOpen) {
      setIsEditDialogOpen(true);
    }
  }, [editingField, editingItems, isEditDialogOpen]);
  
  // Save handler for list fields
  const handleSave = useCallback(async (newItems: ListInfoCardItem[]): Promise<void> => {
    if (!editingField) return;
    
    const updatedItems = newItems.map(item => item.text);
    const listFieldUpdates: Record<string, string[]> = {};
    listFieldUpdates[editingField] = updatedItems;
    
    if (token && entityId && entity) {
      // Authenticated user - use backend update
      await updateListFieldsAsync({
        currentOverview: entity,
        listFieldUpdates,
      });
      closeEditDialog();
    } else {
      // Unauthenticated user - update draft
      const currentDraft = draftEntities.find(draft => draft.tempId);
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          config.entityType,
          currentDraft.tempId,
          listFieldUpdates
        );
        if (updateSuccess) {
          queryClient.setQueryData([config.entityType, entityId], (prevData: any) => ({
            ...prevData,
            ...listFieldUpdates,
          }));
          closeEditDialog();
        } else {
          throw new Error('Failed to update draft');
        }
      } else {
        throw new Error('No current draft found');
      }
    }
  }, [editingField, entity, token, entityId, draftEntities, queryClient, config.entityType, updateListFieldsAsync]);
  
  // Overview editing handler
  const handleOverviewEdit = useCallback((values: { name: string; description: string }) => {
    if (token && entityId && entity) {
      // Map generic field names to entity-specific field names
      const mappedUpdates = config.entityType === 'account' ? {
        name: values.name, // Use standard name field, not targetAccountName
        targetAccountDescription: values.description, // Only description needs special mapping
      } : values;
      
      console.log('[ENTITY-PAGE] Overview edit field mapping:', {
        entityType: config.entityType,
        originalValues: values,
        mappedUpdates,
      });
      
      // Authenticated user - use field-preserving update
      updateWithFieldPreservation({
        currentAccount: entity, // Fixed: parameter name must match hook signature
        updates: mappedUpdates,
      });
    } else {
      // Map field names for draft updates too
      const mappedUpdates = config.entityType === 'account' ? {
        name: values.name, // Use standard name field, not targetAccountName
        targetAccountDescription: values.description, // Only description needs special mapping
      } : values;
      
      // Unauthenticated user - update draft
      const currentDraft = draftEntities.find(draft => draft.tempId);
      if (currentDraft) {
        const updateSuccess = DraftManager.updateDraftPreserveFields(
          config.entityType,
          currentDraft.tempId,
          mappedUpdates
        );
        if (updateSuccess) {
          queryClient.setQueryData([config.entityType, entityId], (prevData: any) => ({
            ...prevData,
            ...mappedUpdates,
          }));
        }
      }
    }
  }, [token, entityId, entity, draftEntities, queryClient, config.entityType, updateWithFieldPreservation]);
  
  // Close edit dialog
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingField(null);
    setEditingItems([]);
  }, []);
  
  // Retry handler
  const handleRetry = useCallback(() => {
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }
    
    const url = location.state?.url;
    const context = location.state?.context;
    if (url) {
      generateEntity({ websiteUrl: url, userInputtedContext: context });
    } else {
      refetch();
    }
  }, [location.state, generateEntity, refetch, token, navigate]);
  
  // Determine if we should show empty state
  const showEmptyState = (token && !entityId && entityList && entityList.length === 0 && !draftEntity) || 
                        (!displayEntity);
  
  const isLoading = isGetLoading || isGenerating || (token && !entityId && isLoadingEntityList);
  const error = getError || generateError;
  
  return {
    // Core data
    entity,
    displayEntity,
    isLoading,
    error,
    
    // Auth & routing
    token,
    entityId,
    isAuthenticatedMode,
    isUnauthenticatedMode,
    
    // Generation
    generateEntity,
    isGenerating,
    progressStage,
    isGenerationModalOpen,
    setIsGenerationModalOpen,
    
    // Field editing
    editingField,
    editingItems,
    isEditDialogOpen,
    handleListEdit,
    handleSave,
    closeEditDialog,
    
    // Overview editing
    handleOverviewEdit,
    
    // Auto-save
    autoSave,
    
    // State
    showEmptyState,
    
    // Retry
    handleRetry,
  };
}