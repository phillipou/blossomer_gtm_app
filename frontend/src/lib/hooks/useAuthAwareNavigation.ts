import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../auth';
import type { EntityType } from '../draftManager';

/**
 * Universal authentication-aware navigation hook
 * Eliminates hardcoded /app routes and provides single source of truth for routing
 * 
 * Usage:
 * const { navigateWithPrefix, navigateToEntity } = useAuthAwareNavigation();
 * navigateWithPrefix('/company/123');  // → /app/company/123 or /playground/company/123
 * navigateToEntity('account', '456');  // → /app/accounts/456 or /playground/accounts/456
 */
export function useAuthAwareNavigation() {
  const { token } = useAuthState();
  const navigate = useNavigate();
  
  /**
   * Get the authentication-aware route prefix
   * @returns '/app' for authenticated users, '/playground' for unauthenticated
   */
  const getPrefix = () => token ? '/app' : '/playground';
  
  /**
   * Navigate with authentication-aware prefix
   * @param path - Path without prefix (e.g., '/company/123')
   * @param options - React Router navigate options
   */
  const navigateWithPrefix = (path: string, options?: { replace?: boolean; state?: any }) => {
    const fullPath = `${getPrefix()}${path}`;
    console.log('[AUTH-NAV] Navigating with prefix:', { 
      isAuthenticated: !!token, 
      originalPath: path, 
      fullPath 
    });
    navigate(fullPath, options);
  };
  
  /**
   * Navigate to specific entity with auth-aware routing
   * @param entityType - Type of entity (company, account, persona, campaign)
   * @param entityId - ID of the entity
   * @param options - React Router navigate options
   */
  const navigateToEntity = (entityType: EntityType, entityId: string, options?: { replace?: boolean; state?: any }) => {
    const entityPath = getEntityPath(entityType, entityId);
    navigateWithPrefix(entityPath, options);
  };
  
  /**
   * Navigate to entity list page
   * @param entityType - Type of entity
   * @param options - React Router navigate options
   */
  const navigateToEntityList = (entityType: EntityType, options?: { replace?: boolean; state?: any }) => {
    const listPath = getEntityListPath(entityType);
    navigateWithPrefix(listPath, options);
  };
  
  /**
   * Get entity detail path (without prefix)
   * @param entityType - Type of entity
   * @param entityId - ID of the entity
   */
  const getEntityPath = (entityType: EntityType, entityId: string): string => {
    switch (entityType) {
      case 'company':
        return `/company/${entityId}`;
      case 'account':
        return `/accounts/${entityId}`;
      case 'persona':
        // Simplified persona routing (updated to match main.tsx routes)
        return `/personas/${entityId}`;
      case 'campaign':
        return `/campaigns/${entityId}`;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  };
  
  /**
   * Get entity list path (without prefix)
   * @param entityType - Type of entity
   */
  const getEntityListPath = (entityType: EntityType): string => {
    switch (entityType) {
      case 'company':
        return '/company';
      case 'account':
        return '/accounts';
      case 'persona':
        return '/personas';
      case 'campaign':
        return '/campaigns';
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  };
  
  /**
   * Navigate to nested entity (e.g., persona under account)
   * @param parentType - Parent entity type
   * @param parentId - Parent entity ID
   * @param childType - Child entity type
   * @param childId - Child entity ID
   * @param options - React Router navigate options
   */
  const navigateToNestedEntity = (
    parentType: EntityType, 
    parentId: string, 
    childType: EntityType, 
    childId: string, 
    options?: { replace?: boolean; state?: any }
  ) => {
    const nestedPath = `/${getEntityListPath(parentType).slice(1)}/${parentId}/${getEntityListPath(childType).slice(1)}/${childId}`;
    navigateWithPrefix(nestedPath, options);
  };
  
  return {
    prefix: getPrefix(),
    navigateWithPrefix,
    navigateToEntity,
    navigateToEntityList,
    navigateToNestedEntity,
    getEntityPath,
    getEntityListPath,
    isAuthenticated: !!token
  };
}