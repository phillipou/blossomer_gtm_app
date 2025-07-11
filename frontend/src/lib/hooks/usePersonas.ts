import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  updatePersonaWithMerge,
  deletePersona,
  generatePersona,
  normalizePersonaResponse,
  getAllPersonas,
} from '../personaService';
import type { Persona, PersonaCreate, PersonaUpdate, TargetPersonaRequest, TargetPersonaResponse } from '../../types/api';

// Standardized query keys for consistency (matching Account patterns)
const PERSONAS_LIST_KEY = 'personas';
const PERSONA_DETAIL_KEY = 'persona';

// Cache validation utility - Stage 4 improvement
const validateCacheState = (queryClient: any, entityId: string) => {
  const cached = queryClient.getQueryData([PERSONA_DETAIL_KEY, entityId]);
  console.log('[CACHE-VALIDATION] Persona cache state:', {
    entityId,
    exists: !!cached,
    format: cached ? {
      hasTargetPersonaName: !!(cached as any).targetPersonaName,
      hasName: !!(cached as any).name,
      topLevelKeys: Object.keys(cached as any),
      isNormalized: !Object.keys(cached as any).some((k: string) => k.includes('_')),
      fieldCount: Object.keys(cached as any).length,
      hasComplexFields: !!((cached as any).demographics || (cached as any).useCases || (cached as any).buyingSignals)
    } : null,
    timestamp: new Date().toISOString()
  });
  return cached;
};

// Cache consistency test - Stage 4 improvement
export const testPersonaCachePatterns = (queryClient: any, personaId: string) => {
  console.log('[CACHE-TEST] Testing persona cache invalidation and refresh patterns:', { personaId });
  
  // Test 1: Check if persona exists in cache
  const detailCached = queryClient.getQueryData([PERSONA_DETAIL_KEY, personaId]);
  
  // Test 2: Check if personas list exists for any account
  const allQueries = queryClient.getQueryCache().getAll();
  const personasListQueries = allQueries.filter((query: any) => 
    query.queryKey[0] === PERSONAS_LIST_KEY
  );
  
  console.log('[CACHE-TEST] Persona cache pattern results:', {
    detailExists: !!detailCached,
    listQueriesCount: personasListQueries.length,
    cacheConsistency: detailCached ? 'normalized' : 'missing',
    queryKeysUsed: {
      detail: [PERSONA_DETAIL_KEY, personaId],
      lists: personasListQueries.map((q: any) => q.queryKey)
    }
  });
  
  return {
    detailExists: !!detailCached,
    listQueriesCount: personasListQueries.length,
    isConsistent: !!detailCached && !Object.keys(detailCached).some((k: string) => k.includes('_'))
  };
};

export function useGetPersonas(accountId: string, token?: string | null) {
  return useQuery<Persona[], Error>({
    queryKey: [PERSONAS_LIST_KEY, accountId],
    queryFn: () => getPersonas(accountId, token),
    enabled: !!accountId && !!token,
  });
}

export function useGetPersona(personaId: string, token?: string | null) {
    return useQuery<Persona, Error>({
        queryKey: [PERSONA_DETAIL_KEY, personaId],
        queryFn: () => getPersona(personaId, token),
        enabled: !!personaId && !!token,
    });
}

export function useCreatePersona(token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Persona, Error, { accountId: string; personaData: PersonaCreate }>({
    mutationFn: ({ accountId, personaData }) => createPersona(accountId, personaData, token),
    onSuccess: (savedPersona, variables) => {
      const normalized = normalizePersonaResponse(savedPersona);
      console.log('[NORMALIZE] (onCreateSuccess) Normalized persona:', normalized);
      // Invalidate personas list for the relevant account
      if (variables?.accountId) {
        queryClient.invalidateQueries({ queryKey: [PERSONAS_LIST_KEY, variables.accountId] });
      }
      queryClient.setQueryData([PERSONA_DETAIL_KEY, normalized.id], normalized);
      validateCacheState(queryClient, normalized.id);
    },
  });
}

export function useUpdatePersona(accountId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Persona, Error, { personaId: string; data: PersonaUpdate }>({
    mutationFn: ({ personaId, data }) => updatePersona(personaId, data, token),
    onSuccess: (savedPersona) => {
      const normalized = normalizePersonaResponse(savedPersona);
      console.log('[NORMALIZE] (onUpdateSuccess) Normalized persona:', normalized);
      
      // Use consistent key and validate cache - Stage 4 improvement
      queryClient.setQueryData([PERSONA_DETAIL_KEY, normalized.id], normalized);
      validateCacheState(queryClient, normalized.id);
    },
  });
}

export function useDeletePersona(accountId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (personaId) => deletePersona(personaId, token),
    onSuccess: () => {
      // Use consistent key - Stage 4 improvement
      queryClient.invalidateQueries({ queryKey: [PERSONAS_LIST_KEY, accountId] });
    },
  });
}

export function useGeneratePersona(token?: string | null) {
    const queryClient = useQueryClient();
    return useMutation<TargetPersonaResponse, Error, { accountId: string; personaData: TargetPersonaRequest }>({
        mutationFn: ({ accountId, personaData }) => generatePersona(accountId, personaData, token),
        onSuccess: (_data, variables) => {
            // Invalidate personas list for the relevant account
            if (variables?.accountId) {
                queryClient.invalidateQueries({ queryKey: [PERSONAS_LIST_KEY, variables.accountId] });
            }
        },
    });
}

// Fetch all personas for a company
export function useGetAllPersonas(companyId: string, token?: string | null) {
  return useQuery({
    queryKey: ['personas', companyId],
    queryFn: () => getAllPersonas(companyId, token),
    enabled: !!companyId && !!token,
  });
}

// =================================================================
// Field-Preserving Update Functions (matching Account patterns)
// =================================================================

/**
 * Field-preserving persona update hook - preserves all existing fields while applying updates
 * Uses currentPersona to prevent data loss during partial updates
 */
export function useUpdatePersonaPreserveFields(token?: string | null, personaId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation<
    Persona, 
    Error, 
    { currentPersona: Record<string, any> | null | undefined; updates: Record<string, any> }
  >({
    mutationFn: async ({ currentPersona, updates }) => {
      if (!personaId) {
        throw new Error('[HOOK-ERROR] personaId required for updatePersonaWithMerge');
      }
      
      console.log('[HOOK-PRESERVE] useUpdatePersonaPreserveFields entry', {
        personaId,
        hasCurrentPersona: !!currentPersona,
        updateKeys: Object.keys(updates),
        preservationStrategy: 'field-level-merge'
      });
      
      return updatePersonaWithMerge(personaId, currentPersona, updates, token);
    },
    onSuccess: (savedPersona) => {
      const normalized = normalizePersonaResponse(savedPersona);
      
      console.log('[HOOK-PRESERVE] useUpdatePersonaPreserveFields success', {
        personaId: normalized.id,
        fieldCount: Object.keys(normalized).length,
        formatConsistent: !Object.keys(normalized).some(k => k.includes('_')),
        preservedComplexFields: !!(normalized.demographics || normalized.useCases || normalized.buyingSignals)
      });
      
      // Update cache with normalized response - Stage 4 improvement
      queryClient.setQueryData([PERSONA_DETAIL_KEY, normalized.id], normalized);
      validateCacheState(queryClient, normalized.id);
      
      // Invalidate list cache to ensure consistency
      if (normalized.accountId) {
        queryClient.invalidateQueries({ queryKey: [PERSONAS_LIST_KEY, normalized.accountId] });
      }
    },
    onError: (error) => {
      console.error('[HOOK-PRESERVE] useUpdatePersonaPreserveFields failed', {
        personaId,
        error: error.message,
        errorType: error.constructor.name
      });
    }
  });
}
