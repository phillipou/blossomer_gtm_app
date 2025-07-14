import { useAuthState } from '../auth';
import { useAuthAwareNavigation } from './useAuthAwareNavigation';
import { DraftManager, type EntityType } from '../draftManager';
import { useQueryClient } from '@tanstack/react-query';

// Service imports for each entity type
import { createCompany, normalizeCompanyResponse } from '../companyService';
import { createAccount, generateAccount, normalizeAccountResponse } from '../accountService';
import { createPersona, generatePersona, normalizePersonaResponse } from '../personaService';
import { createCampaign, generateCampaign, normalizeCampaignResponse } from '../campaignService';

import type { 
  CompanyOverviewResponse, 
  TargetAccountResponse, 
  TargetPersonaResponse,
  EmailGenerationResponse,
  Account,
  Persona,
  Campaign,
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
          
          // Step 1: Generate AI account data (firmographics, buying signals, etc.)
          console.log('[DUAL-PATH-AUTH-ACCOUNT] Generating AI account data:', aiResponse);
          const generatedAccountData = await generateAccount(aiResponse as any, token);
          
          // Step 2: Create account with generated data  
          console.log('[DUAL-PATH-AUTH-ACCOUNT] Creating account with generated data:', generatedAccountData);
          savedEntity = await createAccount(options.companyId, {
            name: generatedAccountData.targetAccountName || (aiResponse as any).account_profile_name,
            data: generatedAccountData
          }, token);
          
          normalized = normalizeAccountResponse(savedEntity as Account) as T;
          break;
          
        case 'persona':
          if (!options?.parentId) {
            throw new Error('Persona creation requires parentId (accountId)');
          }
          
          try {
            // Step 1: Generate AI persona data (demographics, pain points, etc.)
            console.log('[DUAL-PATH-AUTH-PERSONA] Starting Step 1: Generating AI persona data:', aiResponse);
            const generatedPersonaData = await generatePersona(options.parentId, aiResponse as any, token);
            console.log('[DUAL-PATH-AUTH-PERSONA] Step 1 SUCCESS: AI generation complete:', generatedPersonaData);
            
            // Step 2: Create persona with generated data
            const personaCreateData = {
              name: generatedPersonaData.targetPersonaName || (aiResponse as any).personaProfileName,
              data: generatedPersonaData
            };
            console.log('[DUAL-PATH-AUTH-PERSONA] Starting Step 2: Creating persona with data:', {
              accountId: options.parentId,
              personaCreateData,
              hasToken: !!token,
              endpoint: `/personas?account_id=${options.parentId}`
            });
            savedEntity = await createPersona(options.parentId, personaCreateData, token);
            console.log('[DUAL-PATH-AUTH-PERSONA] Step 2 SUCCESS: Persona creation complete:', {
              savedEntityId: savedEntity.id,
              savedEntityKeys: Object.keys(savedEntity),
              savedEntity
            });
            
          } catch (creationError) {
            console.error('[DUAL-PATH-AUTH-PERSONA] CREATION FAILED:', {
              error: creationError,
              errorMessage: creationError.message,
              accountId: options.parentId,
              token: !!token,
              aiResponse
            });
            throw creationError;
          }
          
          normalized = normalizePersonaResponse(savedEntity as Persona) as T;
          break;
          
        case 'campaign':
          if (!options?.parentId) {
            throw new Error('Campaign creation requires parentId (personaId)');
          }
          
          try {
            // Step 1: Generate AI email data (subjects, email body, breakdown)
            console.log('[DUAL-PATH-AUTH-CAMPAIGN] Starting Step 1: Generating AI email data:', aiResponse);
            const generatedEmailData = await generateCampaign(aiResponse as any, token);
            console.log('[DUAL-PATH-AUTH-CAMPAIGN] Step 1 SUCCESS: AI email generation complete:', generatedEmailData);
            
            // Step 2: Create campaign with generated email data
            // Extract accountId from AI response or use companyId as fallback
            const accountId = (aiResponse as any).selectedAccount?.id || (aiResponse as any).targetAccount?.id || options?.companyId;
            const personaId = options.parentId;
            
            console.log('[DUAL-PATH-AUTH-CAMPAIGN] Starting Step 2: Creating campaign with data:', {
              personaId,
              accountId,
              hasToken: !!token,
              endpoint: `/campaigns?account_id=${accountId}&persona_id=${personaId}`
            });
            
            savedEntity = await createCampaign(generatedEmailData, token, {
              accountId,
              personaId
            });
            console.log('[DUAL-PATH-AUTH-CAMPAIGN] Step 2 SUCCESS: Campaign creation complete:', {
              savedEntityId: savedEntity.id,
              savedEntityKeys: Object.keys(savedEntity),
              savedEntity
            });
            
          } catch (creationError) {
            console.error('[DUAL-PATH-AUTH-CAMPAIGN] CREATION FAILED:', {
              error: creationError,
              errorMessage: creationError.message,
              personaId: options.parentId,
              token: !!token,
              aiResponse
            });
            throw creationError;
          }
          
          normalized = normalizeCampaignResponse(savedEntity as Campaign) as T;
          break;
          
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
          // For unauthenticated users, we need to generate AI data first
          console.log('[DUAL-PATH-UNAUTH-ACCOUNT] Generating AI account data for unauthenticated user:', aiResponse);
          
          // Step 1: Generate AI account data using demo endpoint
          const generatedAccountData = await generateAccount(aiResponse as any, null); // null token for demo endpoint
          
          console.log('[DUAL-PATH-UNAUTH-ACCOUNT] Generated account data:', generatedAccountData);
          
          // Step 2: Create database-identical Account structure  
          // Top-level fields: id, name, company_id, created_at, updated_at
          // JSON data field: targetAccountDescription, firmographics, buyingSignals
          const fakeAccountResponse = {
            id: `temp_${Date.now()}`,
            name: generatedAccountData.targetAccountName || (aiResponse as any).account_profile_name,
            company_id: options?.companyId || 'temp_company',
            data: generatedAccountData, // Full AI-generated data with firmographics and buying signals
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          normalized = normalizeAccountResponse(fakeAccountResponse) as T;
          break;
          
        case 'persona':
          console.log('[DUAL-PATH-UNAUTH-PERSONA] Generating AI persona data for unauthenticated user:', aiResponse);
          
          // Step 1: Generate AI persona data using demo endpoint  
          const generatedPersonaData = await generatePersona('', aiResponse as any, null); // null token for demo endpoint
          
          console.log('[DUAL-PATH-UNAUTH-PERSONA] Generated persona data:', generatedPersonaData);
          
          // Step 2: Create database-identical Persona structure
          // Top-level fields: id, name, account_id, created_at, updated_at  
          // JSON data field: demographics, useCases, buyingSignals (preserved complex structures)
          const fakePersonaResponse = {
            id: `temp_${Date.now()}`,
            name: generatedPersonaData.targetPersonaName || (aiResponse as any).personaProfileName,
            account_id: options?.parentId || 'temp_account',
            data: generatedPersonaData, // Full AI-generated data with demographics, pain points, etc.
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          normalized = normalizePersonaResponse(fakePersonaResponse) as T;
          break;
          
        case 'campaign':
          console.log('[DUAL-PATH-UNAUTH-CAMPAIGN] Generating AI email data for unauthenticated user:', aiResponse);
          
          // Step 1: Generate AI email data using demo endpoint  
          const generatedEmailData = await generateCampaign(aiResponse as any, null); // null token for demo endpoint
          
          console.log('[DUAL-PATH-UNAUTH-CAMPAIGN] Generated email data:', generatedEmailData);
          
          // Step 2: Create database-identical Campaign structure
          // Top-level fields: id, name, persona_id, type, created_at, updated_at  
          // JSON data field: emailBody, subjects, breakdown (preserved complex email content)
          const fakeCampaignResponse = {
            id: `temp_${Date.now()}`,
            name: generatedEmailData.subjects?.primary || (aiResponse as any).campaignName || 'Generated Campaign',
            persona_id: options?.parentId || 'temp_persona',
            type: 'email',
            data: generatedEmailData, // Full AI-generated email data with segments, breakdown, metadata
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          normalized = normalizeCampaignResponse(fakeCampaignResponse) as T;
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
   * Update existing entity with dual-path handling and field preservation
   */
  const updateEntity = async (entityId: string, updates: Partial<T>): Promise<T> => {
    console.log('[DUAL-PATH-UPDATE] Starting update operation:', {
      entityType,
      entityId,
      isAuthenticated: !!token,
      updateFields: Object.keys(updates)
    });
    
    if (entityId.startsWith('temp_')) {
      // Draft entity - use DraftManager field preservation
      return updateDraftEntity(entityId, updates);
    } else if (token) {
      // Authenticated entity - use API update with field preservation
      return updateAuthenticatedEntity(entityId, updates);
    } else {
      throw new Error('Cannot update non-draft entity for unauthenticated user');
    }
  };
  
  /**
   * Update authenticated entity via API
   */
  const updateAuthenticatedEntity = async (entityId: string, updates: Partial<T>): Promise<T> => {
    try {
      let updatedEntity: any;
      
      switch (entityType) {
        case 'campaign':
          // Use field-preserving campaign update
          const { updateCampaignPreserveFields, getCampaign } = await import('../campaignService');
          
          // Get current campaign data for field preservation
          const currentCampaign = await getCampaign(entityId, token);
          updatedEntity = await updateCampaignPreserveFields(entityId, currentCampaign, updates as any, token);
          break;
          
        case 'account':
        case 'persona':
        case 'company':
          // TODO: Implement update for other entity types
          throw new Error(`Update not yet implemented for ${entityType}`);
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Normalize and update cache
      let normalized: T;
      switch (entityType) {
        case 'campaign':
          const { normalizeCampaignResponse } = await import('../campaignService');
          normalized = normalizeCampaignResponse(updatedEntity) as T;
          break;
        default:
          normalized = updatedEntity as T;
      }
      
      updateCache(entityId, normalized);
      
      console.log('[DUAL-PATH-UPDATE-AUTH] Successfully updated entity:', {
        entityType,
        entityId
      });
      
      return normalized;
      
    } catch (error) {
      console.error('[DUAL-PATH-UPDATE-AUTH] Failed to update entity:', { entityType, entityId, error });
      throw error;
    }
  };
  
  /**
   * Update draft entity with field preservation
   */
  const updateDraftEntity = async (entityId: string, updates: Partial<T>): Promise<T> => {
    try {
      const success = DraftManager.updateDraftPreserveFields(entityType, entityId, updates);
      
      if (!success) {
        throw new Error(`Failed to update draft ${entityType} with id ${entityId}`);
      }
      
      const updatedDraft = DraftManager.getDraft(entityType, entityId);
      if (!updatedDraft) {
        throw new Error(`Updated draft ${entityType} not found after update`);
      }
      
      console.log('[DUAL-PATH-UPDATE-DRAFT] Successfully updated draft entity:', {
        entityType,
        entityId,
        preservedFieldCount: Object.keys(updatedDraft.data).length
      });
      
      return updatedDraft.data as T;
      
    } catch (error) {
      console.error('[DUAL-PATH-UPDATE-DRAFT] Failed to update draft entity:', { entityType, entityId, error });
      throw error;
    }
  };
  
  /**
   * Delete entity with dual-path handling
   */
  const deleteEntity = async (entityId: string): Promise<void> => {
    console.log('[DUAL-PATH-DELETE] Starting delete operation:', {
      entityType,
      entityId,
      isAuthenticated: !!token
    });
    
    if (entityId.startsWith('temp_')) {
      // Draft entity - remove from DraftManager
      return deleteDraftEntity(entityId);
    } else if (token) {
      // Authenticated entity - use API delete
      return deleteAuthenticatedEntity(entityId);
    } else {
      throw new Error('Cannot delete non-draft entity for unauthenticated user');
    }
  };
  
  /**
   * Delete authenticated entity via API
   */
  const deleteAuthenticatedEntity = async (entityId: string): Promise<void> => {
    try {
      switch (entityType) {
        case 'campaign':
          const { deleteCampaign } = await import('../campaignService');
          await deleteCampaign(entityId, token);
          break;
          
        case 'account':
        case 'persona':
        case 'company':
          // TODO: Implement delete for other entity types
          throw new Error(`Delete not yet implemented for ${entityType}`);
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Remove from cache
      const queryKey = getQueryKey(entityType, entityId);
      queryClient.removeQueries({ queryKey });
      
      // Invalidate list queries
      const listQueryKey = getListQueryKey(entityType);
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      
      console.log('[DUAL-PATH-DELETE-AUTH] Successfully deleted entity:', {
        entityType,
        entityId
      });
      
    } catch (error) {
      console.error('[DUAL-PATH-DELETE-AUTH] Failed to delete entity:', { entityType, entityId, error });
      throw error;
    }
  };
  
  /**
   * Delete draft entity from DraftManager
   */
  const deleteDraftEntity = async (entityId: string): Promise<void> => {
    try {
      DraftManager.removeDraft(entityType, entityId);
      
      console.log('[DUAL-PATH-DELETE-DRAFT] Successfully deleted draft entity:', {
        entityType,
        entityId
      });
      
    } catch (error) {
      console.error('[DUAL-PATH-DELETE-DRAFT] Failed to delete draft entity:', { entityType, entityId, error });
      throw error;
    }
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
      
    case 'campaign':
      // Campaign normalized format: id, name (from subject), + complex email content preserved
      expectedFields = ['id', 'name', 'subjects', 'emailBody', 'breakdown', 'metadata'];
      
      if (!normalized.id) issues.push('Missing id (database: id)');
      if (!normalized.name) issues.push('Missing name (database: name)');
      
      // CRITICAL: Complex email structures must be preserved for UI rendering
      if (normalized.subjects && typeof normalized.subjects !== 'object') {
        issues.push('Subjects must be object with primary/alternatives (for EmailPreview rendering)');
      }
      if (normalized.emailBody && !Array.isArray(normalized.emailBody)) {
        issues.push('EmailBody must be array of segments (for EmailSegments rendering)');
      }
      if (normalized.breakdown && typeof normalized.breakdown !== 'object') {
        issues.push('Breakdown must be object (for EmailBreakdown rendering)');
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