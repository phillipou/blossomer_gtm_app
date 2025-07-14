import { useDualPathDataFlow } from './useDualPathDataFlow';
import { useCompanyContext } from './useCompanyContext';
import { useAuthAwareNavigation } from './useAuthAwareNavigation';
import type { EntityType } from '../draftManager';

/**
 * Universal Entity CRUD hook
 * Provides consistent CRUD operations for ALL entities with guaranteed cache-database consistency
 * 
 * CRITICAL FEATURES:
 * - Single source of truth for auth-aware entity operations
 * - Enforced transformation lockstep between auth and unauth flows
 * - Database field structure validation for cache consistency
 * - Automatic navigation with auth-aware routing
 * - Zero code duplication across entity types
 * 
 * Usage:
 * const { create, update, delete, navigate } = useEntityCRUD<CompanyOverviewResponse>('company');
 * const result = await create(aiGeneratedData);
 * navigate.toEntity(result.id);
 */
export function useEntityCRUD<T>(entityType: EntityType) {
  const { saveEntity, updateEntity, deleteEntity, isAuthenticated } = useDualPathDataFlow<T>(entityType);
  const { companyId, hasValidContext } = useCompanyContext();
  const { navigateToEntity, navigateToEntityList, navigateToNestedEntity } = useAuthAwareNavigation();
  
  /**
   * Create new entity with automatic navigation
   * Handles both authenticated and unauthenticated flows with identical result formats
   */
  const create = async (aiData: T, options?: { 
    parentId?: string; 
    navigateOnSuccess?: boolean;
    customCompanyId?: string;
  }): Promise<{
    id: string;
    normalized: T;
    isTemporary: boolean;
  }> => {
    const { parentId, navigateOnSuccess = true, customCompanyId } = options || {};
    
    // Determine context based on entity type
    let saveOptions: { parentId?: string; companyId?: string } = {};
    
    switch (entityType) {
      case 'account':
        // Accounts require company context
        const activeCompanyId = customCompanyId || companyId;
        if (!activeCompanyId) {
          throw new Error('Account creation requires company context. Create a company first.');
        }
        saveOptions.companyId = activeCompanyId;
        break;
        
      case 'persona':
        // Personas require account context (parentId)
        if (!parentId) {
          throw new Error('Persona creation requires account context (parentId).');
        }
        saveOptions.parentId = parentId;
        saveOptions.companyId = customCompanyId || companyId;
        break;
        
      case 'campaign':
        // Campaigns require persona context (parentId)
        if (!parentId) {
          throw new Error('Campaign creation requires persona context (parentId).');
        }
        saveOptions.parentId = parentId;
        saveOptions.companyId = customCompanyId || companyId;
        break;
        
      case 'company':
        // Companies don't need additional context
        break;
        
      default:
        // Future entity types will be handled here
        if (parentId) saveOptions.parentId = parentId;
        if (customCompanyId || companyId) saveOptions.companyId = customCompanyId || companyId;
    }
    
    console.log('[ENTITY-CRUD-CREATE] Starting creation:', {
      entityType,
      isAuthenticated,
      hasCompanyContext: !!companyId,
      saveOptions,
      navigateOnSuccess
    });
    
    try {
      const result = await saveEntity(aiData, saveOptions);
      
      console.log('[ENTITY-CRUD-CREATE] Raw result from saveEntity:', {
        result,
        resultId: result?.id,
        resultKeys: result ? Object.keys(result) : 'null'
      });
      
      // Automatic navigation after successful creation
      if (navigateOnSuccess && result?.id) {
        console.log('[ENTITY-CRUD-CREATE] Navigating to created entity:', {
          entityType,
          entityId: result.id
        });
        // Simplified navigation - all entities use direct routing
        navigateToEntity(entityType, result.id);
      } else if (navigateOnSuccess && !result?.id) {
        console.error('[ENTITY-CRUD-CREATE] Cannot navigate - no ID in result:', {
          entityType,
          result,
          navigateOnSuccess
        });
      }
      
      console.log('[ENTITY-CRUD-CREATE] Successfully created entity:', {
        entityType,
        entityId: result?.id,
        isTemporary: result?.isTemporary,
        navigated: navigateOnSuccess && !!result?.id
      });
      
      return result;
      
    } catch (error) {
      console.error('[ENTITY-CRUD-CREATE] Failed to create entity:', {
        entityType,
        error,
        saveOptions
      });
      throw error;
    }
  };
  
  /**
   * Update existing entity with field preservation patterns
   */
  const update = async (entityId: string, updates: Partial<T>): Promise<T> => {
    console.log('[ENTITY-CRUD-UPDATE] Starting update:', {
      entityType,
      entityId,
      isAuthenticated,
      updateFields: Object.keys(updates)
    });
    
    try {
      const result = await updateEntity(entityId, updates);
      
      console.log('[ENTITY-CRUD-UPDATE] Successfully updated entity:', {
        entityType,
        entityId,
        isAuthenticated
      });
      
      return result;
      
    } catch (error) {
      console.error('[ENTITY-CRUD-UPDATE] Failed to update entity:', {
        entityType,
        entityId,
        error
      });
      throw error;
    }
  };
  
  /**
   * Delete existing entity with dual-path handling
   */
  const remove = async (entityId: string): Promise<void> => {
    console.log('[ENTITY-CRUD-DELETE] Starting deletion:', {
      entityType,
      entityId,
      isAuthenticated
    });
    
    try {
      await deleteEntity(entityId);
      
      console.log('[ENTITY-CRUD-DELETE] Successfully deleted entity:', {
        entityType,
        entityId,
        isAuthenticated
      });
      
    } catch (error) {
      console.error('[ENTITY-CRUD-DELETE] Failed to delete entity:', {
        entityType,
        entityId,
        error
      });
      throw error;
    }
  };
  
  /**
   * Navigation helpers with auth-aware routing
   */
  const navigate = {
    toEntity: (entityId: string) => navigateToEntity(entityType, entityId),
    toList: () => navigateToEntityList(entityType),
    toNested: (parentType: EntityType, parentId: string, childId: string) => 
      navigateToNestedEntity(parentType, parentId, entityType, childId)
  };
  
  /**
   * Context validation helpers
   */
  const validation = {
    hasRequiredContext: (): boolean => {
      switch (entityType) {
        case 'account':
        case 'persona':
        case 'campaign':
          return hasValidContext; // Requires company context
        case 'company':
          return true; // No prerequisites
        default:
          return true;
      }
    },
    getContextError: (): string | null => {
      if (!validation.hasRequiredContext()) {
        switch (entityType) {
          case 'account':
            return 'Account creation requires a company. Please create a company first.';
          case 'persona':
            return 'Persona creation requires a company and account. Please create these first.';
          case 'campaign':
            return 'Campaign creation requires a company, account, and persona. Please create these first.';
          default:
            return `${entityType} creation requires additional context.`;
        }
      }
      return null;
    }
  };
  
  return {
    // Core CRUD operations
    create,
    update,
    delete: remove,
    
    // Navigation helpers
    navigate,
    
    // Context validation
    validation,
    
    // State information
    isAuthenticated,
    entityType,
    hasRequiredContext: validation.hasRequiredContext(),
    contextError: validation.getContextError()
  };
}