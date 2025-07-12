import { useAuthState } from '../auth';
import { useAuthAwareNavigation } from './useAuthAwareNavigation';
import { DraftManager, type EntityType } from '../draftManager';
import { useQueryClient } from '@tanstack/react-query';

// Service imports for each entity type
import { createCompany, normalizeCompanyResponse } from '../companyService';
import { createAccount, normalizeAccountResponse } from '../accountService';
import { createPersona, normalizePersonaResponse } from '../personaService';
// import { createCampaign, normalizeCampaignResponse } from '../campaignService';

import type { 
  CompanyOverviewResponse, 
  TargetAccountResponse, 
  TargetPersonaResponse,
  // CampaignResponse,
  Account,
  Persona,
  CompanyResponse
} from '../../types/api';

/**
 * Universal dual-path data flow hook
 * Enforces transformation lockstep for ALL entities across auth and unauth flows
 * 
 * Critical Pattern: "Transformations and Saves Must Be In Lockstep"
 * - Auth Flow: AI Response → Backend Transform → Save → Normalize → Cache
 * - Unauth Flow: AI Response → Frontend Transform → Save → Same Format → Cache
 * 
 * Usage:
 * const { saveEntity, updateEntity } = useDualPathDataFlow<CompanyOverviewResponse>('company');
 * const result = await saveEntity(aiGeneratedData, { parentId: 'company123' });
 */
export function useDualPathDataFlow<T>(entityType: EntityType) {
  const { token } = useAuthState();
  const { navigateToEntity } = useAuthAwareNavigation();
  const queryClient = useQueryClient();
  
  /**
   * Save entity with consistent transformation patterns across auth states
   * @param aiResponse - Raw AI-generated data
   * @param options - Additional options (parentId for nested entities, etc.)
   */
  const saveEntity = async (aiResponse: T, options?: { parentId?: string; companyId?: string }): Promise<{
    id: string;
    normalized: T;
    isTemporary: boolean;
  }> => {
    console.log('[DUAL-PATH-SAVE] Starting save operation:', {
      entityType,
      isAuthenticated: !!token,
      hasParentId: !!options?.parentId,
      hasCompanyId: !!options?.companyId
    });
    
    if (token) {
      // AUTH FLOW: AI → Backend → Normalize → Cache → Navigate
      return await saveAuthenticatedEntity(aiResponse, options);
    } else {
      // UNAUTH FLOW: AI → Frontend Transform → Save → Same Format → Cache
      return await saveUnauthenticatedEntity(aiResponse, options);
    }
  };
  
  /**
   * Authenticated save flow - uses backend APIs
   */
  const saveAuthenticatedEntity = async (aiResponse: T, options?: { parentId?: string; companyId?: string }) => {
    try {
      let savedEntity: any;
      let normalized: T;
      
      switch (entityType) {
        case 'company':
          savedEntity = await createCompany(aiResponse as CompanyOverviewResponse, token);
          normalized = normalizeCompanyResponse(savedEntity as CompanyResponse) as T;
          break;
          
        case 'account':
          if (!options?.companyId) {
            throw new Error('Account creation requires companyId');
          }
          // Note: createAccount expects different signature - need to adapt
          savedEntity = await createAccount(options.companyId, aiResponse as any, token);
          normalized = normalizeAccountResponse(savedEntity as Account) as T;
          break;
          
        case 'persona':
          if (!options?.parentId) {
            throw new Error('Persona creation requires parentId (accountId)');
          }
          savedEntity = await createPersona(options.parentId, aiResponse as any, token);
          normalized = normalizePersonaResponse(savedEntity as Persona) as T;
          break;
          
        // case 'campaign':
        //   savedEntity = await createCampaign(aiResponse as any, token);
        //   normalized = normalizeCampaignResponse(savedEntity) as T;
        //   break;
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Update cache with normalized data
      updateCache(savedEntity.id, normalized);
      
      console.log('[DUAL-PATH-AUTH] Successfully saved entity:', {
        entityType,
        entityId: savedEntity.id,
        normalizedFormat: !!normalized
      });
      
      return {
        id: savedEntity.id,
        normalized,
        isTemporary: false
      };
      
    } catch (error) {
      console.error('[DUAL-PATH-AUTH] Failed to save entity:', { entityType, error });
      throw error;
    }
  };
  
  /**
   * Unauthenticated save flow - uses DraftManager
   * CRITICAL: Must create exact database structure to maintain cache-database consistency
   */
  const saveUnauthenticatedEntity = async (aiResponse: T, options?: { parentId?: string; companyId?: string }) => {
    try {
      // Apply same normalization that backend would do
      // IMPORTANT: Creates database-identical structure for cache consistency
      let normalized: T;
      
      switch (entityType) {
        case 'company':
          // Create database-identical CompanyResponse structure
          // Top-level fields: id, name, url, created_at, updated_at
          // JSON data field: all AI analysis content  
          const fakeCompanyResponse = {
            id: `temp_${Date.now()}`,
            name: (aiResponse as any).company_name || (aiResponse as any).companyName,
            url: (aiResponse as any).company_url || (aiResponse as any).companyUrl,
            data: aiResponse, // Entire AI response stored in JSONB data column
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          normalized = normalizeCompanyResponse(fakeCompanyResponse) as T;
          break;
          
        case 'account':
          // Create database-identical Account structure  
          // Top-level fields: id, name, company_id, created_at, updated_at
          // JSON data field: targetAccountDescription, firmographics, buyingSignals
          const fakeAccountResponse = {
            id: `temp_${Date.now()}`,
            name: (aiResponse as any).targetAccountName || (aiResponse as any).name,
            company_id: options?.companyId || 'temp_company',
            data: aiResponse, // AI analysis stored in JSONB data column (NOT in top-level)
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          normalized = normalizeAccountResponse(fakeAccountResponse) as T;
          break;
          
        case 'persona':
          // Create database-identical Persona structure
          // Top-level fields: id, name, account_id, created_at, updated_at  
          // JSON data field: demographics, useCases, buyingSignals (preserved complex structures)
          const fakePersonaResponse = {
            id: `temp_${Date.now()}`,
            name: (aiResponse as any).targetPersonaName || (aiResponse as any).name,
            account_id: options?.parentId || 'temp_account',
            data: aiResponse, // Complex nested structures preserved in JSONB data column
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          normalized = normalizePersonaResponse(fakePersonaResponse) as T;
          break;
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Save normalized data to DraftManager
      const tempId = DraftManager.saveDraft(entityType, normalized, options?.parentId);
      
      // CRITICAL: Validate cache-database field consistency
      console.log('[DUAL-PATH-UNAUTH] Successfully saved draft entity:', {
        entityType,
        tempId,
        normalizedFormat: !!normalized,
        parentId: options?.parentId,
        // Validate field structure matches database expectations
        fieldStructureValidation: validateEntityFieldStructure(entityType, normalized),
        cacheConsistency: 'normalized_data_matches_database_structure'
      });
      
      return {
        id: tempId,
        normalized,
        isTemporary: true
      };
      
    } catch (error) {
      console.error('[DUAL-PATH-UNAUTH] Failed to save draft entity:', { entityType, error });
      throw error;
    }
  };
  
  /**
   * Update cache with normalized data
   */
  const updateCache = (entityId: string, normalized: T) => {
    const queryKey = getQueryKey(entityType, entityId);
    queryClient.setQueryData(queryKey, normalized);
    
    // Also invalidate list queries
    const listQueryKey = getListQueryKey(entityType);
    queryClient.invalidateQueries({ queryKey: listQueryKey });
  };
  
  /**
   * Get appropriate query key for entity
   */
  const getQueryKey = (type: EntityType, id: string) => {
    switch (type) {
      case 'company':
        return ['company', id];
      case 'account':
        return ['account', id];
      case 'persona':
        return ['persona', id];
      case 'campaign':
        return ['campaign', id];
      default:
        return [type, id];
    }
  };
  
  /**
   * Get appropriate list query key for entity type
   */
  const getListQueryKey = (type: EntityType) => {
    switch (type) {
      case 'company':
        return ['companies'];
      case 'account':
        return ['accounts'];
      case 'persona':
        return ['personas'];
      case 'campaign':
        return ['campaigns'];
      default:
        return [type + 's'];
    }
  };
  
  /**
   * Update existing entity (placeholder for future implementation)
   */
  const updateEntity = async (entityId: string, updates: Partial<T>): Promise<T> => {
    // TODO: Implement update patterns with same lockstep principle
    throw new Error('updateEntity not implemented yet - will be added in Stage 2');
  };
  
  /**
   * Delete entity (placeholder for future implementation)
   */
  const deleteEntity = async (entityId: string): Promise<void> => {
    // TODO: Implement delete patterns for both auth states
    throw new Error('deleteEntity not implemented yet - will be added in Stage 2');
  };
  
  return {
    saveEntity,
    updateEntity,
    deleteEntity,
    isAuthenticated: !!token,
    entityType
  };
}

/**
 * Validate entity field structure matches database expectations
 * CRITICAL: Ensures cache data has same shape as database for consistency
 */
function validateEntityFieldStructure(entityType: EntityType, normalized: any): {
  isValid: boolean;
  issues: string[];
  expectedFields: string[];
  actualFields: string[];
} {
  const issues: string[] = [];
  const actualFields = Object.keys(normalized || {});
  
  let expectedFields: string[];
  
  switch (entityType) {
    case 'company':
      // Company normalized format: companyId, companyName, companyUrl, description, + analysis fields
      expectedFields = ['companyId', 'companyName', 'companyUrl', 'description', 'businessProfileInsights', 'capabilities'];
      
      if (!normalized.companyId) issues.push('Missing companyId (database: id)');
      if (!normalized.companyName) issues.push('Missing companyName (database: name)');
      if (!normalized.companyUrl) issues.push('Missing companyUrl (database: url)');
      break;
      
    case 'account':
      // Account normalized format: id, targetAccountName, + analysis fields from data column
      expectedFields = ['id', 'targetAccountName', 'targetAccountDescription', 'firmographics', 'buyingSignals'];
      
      if (!normalized.id) issues.push('Missing id (database: id)');
      if (!normalized.targetAccountName) issues.push('Missing targetAccountName (database: name)');
      break;
      
    case 'persona':
      // Persona normalized format: id, targetPersonaName, + complex analysis fields preserved
      expectedFields = ['id', 'targetPersonaName', 'demographics', 'useCases', 'buyingSignals'];
      
      if (!normalized.id) issues.push('Missing id (database: id)');
      if (!normalized.targetPersonaName) issues.push('Missing targetPersonaName (database: name)');
      
      // CRITICAL: Complex structures must be preserved for UI rendering
      if (normalized.demographics && typeof normalized.demographics !== 'object') {
        issues.push('Demographics must be object (for CriteriaTable rendering)');
      }
      if (normalized.useCases && !Array.isArray(normalized.useCases)) {
        issues.push('UseCases must be array (for UseCasesCard rendering)');
      }
      break;
      
    default:
      expectedFields = [];
      issues.push(`Unknown entity type: ${entityType}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    expectedFields,
    actualFields
  };
}