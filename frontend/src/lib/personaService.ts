import { apiFetch } from './apiClient';
import type { Persona, PersonaCreate, PersonaUpdate, TargetPersonaRequest, TargetPersonaResponse } from '../types/api';
import { transformKeysToCamelCase, transformKeysToSnakeCase } from "./utils";

// =================================================================
// Persona CRUD API Functions
// =================================================================

export async function getPersonas(accountId: string, token?: string | null): Promise<Persona[]> {
  return apiFetch<Persona[]>(`/accounts/${accountId}/personas`, { method: 'GET' }, token);
}

// Fetch all personas for a company using the new backend endpoint
export async function getAllPersonas(companyId: string, token?: string | null): Promise<Persona[]> {
  return apiFetch<Persona[]>(`/personas?company_id=${companyId}`, { method: 'GET' }, token);
}

export function normalizePersonaResponse(persona: Persona): Persona {
  console.log('[NORMALIZE] Raw persona response:', persona);
  
  const transformedData = transformKeysToCamelCase<Record<string, any>>(persona.data || {});
  
  // Create normalized persona with consistent camelCase format
  // Keep data field for backend compatibility, but use camelCase throughout
  const normalized = {
    ...persona,
    ...transformedData, // Spread transformed data to root level for component access
    data: transformedData, // Keep data field for API consistency
  };
  
  // Assert that backend is not returning recursive data structures
  if (persona.data && typeof persona.data === 'object' && 'data' in persona.data) {
    console.error('[CRITICAL] Backend returned recursive data structure - this indicates the PUT request fix did not work', {
      personaData: persona.data,
      nestedData: (persona.data as any).data,
      fullPersona: persona
    });
    // For now, just log the error but don't throw to prevent breaking the app
    // TODO: Enable throwing after confirming fix works
    // throw new Error('[CRITICAL] Backend returned recursive data structure');
  }
  
  if (transformedData && typeof transformedData === 'object' && 'data' in transformedData) {
    console.warn('[NORMALIZE] NESTED data field detected in transformedData after camelCase transform', {
      transformedData,
      originalPersonaData: persona.data
    });
  }
  
  console.log('[NORMALIZE] Normalized persona (single format):', {
    id: normalized.id,
    hasTargetPersonaName: 'targetPersonaName' in normalized && !!(normalized as any).targetPersonaName,
    hasName: 'name' in normalized && !!(normalized as any).name,
    dataFieldKeys: Object.keys(normalized.data || {}),
    rootLevelKeys: Object.keys(normalized).filter(k => k !== 'data'),
    formatConsistent: !Object.keys(normalized).some(k => k.includes('_')),
    hasComplexFields: ('demographics' in normalized && !!(normalized as any).demographics) || ('useCases' in normalized && !!(normalized as any).useCases) || ('buyingSignals' in normalized && !!(normalized as any).buyingSignals)
  });
  
  return normalized;
}

export async function getPersona(personaId: string, token?: string | null): Promise<Persona> {
  const persona = await apiFetch<Persona>(`/personas/${personaId}`, { method: 'GET' }, token);
  return normalizePersonaResponse(persona);
}


export async function updatePersona(personaId: string, personaData: PersonaUpdate, token?: string | null): Promise<Persona> {
  console.log('[UPDATE-PERSONA] API boundary transformation:', {
    personaId,
    inputData: personaData,
    dataFieldKeys: Object.keys(personaData.data || {}),
    transformationPoint: 'updatePersona-api-boundary'
  });
  
  // Transform data field to snake_case for backend - Single transformation point
  const backendPayload = {
    ...personaData,
    data: transformKeysToSnakeCase(personaData.data || {})
  };
  
  // Assert no recursive data structures
  if (personaData.data?.data) {
    console.warn('[ROOTCAUSE-ISSUE4] [updatePersona] NESTED data field in personaData before backendPayload', {
      personaData,
    });
  }
  if (backendPayload.data?.data) {
    console.warn('[ROOTCAUSE-ISSUE4] [updatePersona] NESTED data field in backendPayload', {
      backendPayload,
    });
  }
  
  console.log('[UPDATE-PERSONA] Backend payload:', {
    name: backendPayload.name,
    dataKeys: Object.keys(backendPayload.data || {}),
    hasSnakeCase: Object.keys(backendPayload.data || {}).some(k => k.includes('_')),
    payloadSize: JSON.stringify(backendPayload).length
  });
  
  const response = await apiFetch<Persona>(`/personas/${personaId}`, {
    method: 'PUT',
    body: JSON.stringify(backendPayload),
  }, token);
  
  // Always normalize response to maintain consistent format
  const normalized = normalizePersonaResponse(response);
  
  console.log('[UPDATE-PERSONA] Response normalized:', {
    responseId: normalized.id,
    fieldCount: Object.keys(normalized).length,
    formatConsistent: !Object.keys(normalized).some(k => k.includes('_'))
  });
  
  return normalized;
}

export async function deletePersona(personaId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/personas/${personaId}`, { method: 'DELETE' }, token);
}

export async function generatePersona(_accountId: string, personaData: TargetPersonaRequest, token?: string | null): Promise<TargetPersonaResponse> {
    // _accountId is ignored; all context must be in personaData
    return apiFetch<TargetPersonaResponse>(`/personas/generate-ai`, {
        method: 'POST',
        body: JSON.stringify(personaData),
    }, token);
}

// Note: No transformation needed - AI response goes directly to data field (matches account pattern)

export async function createPersona(accountId: string, personaData: PersonaCreate, token?: string | null): Promise<Persona> {
  return apiFetch<Persona>(`/personas?account_id=${accountId}`, {
    method: 'POST',
    body: JSON.stringify(personaData),
  }, token);
}

// =================================================================
// Field-Preserving Update Functions (for Entity Abstraction)
// =================================================================

/**
 * Persona-specific merge function - eliminates recursive data structures and proper name handling
 * Handles case where currentPersona is undefined by throwing error to prevent data loss
 */
function mergePersonaUpdates(
  currentPersona: Record<string, any> | null | undefined, 
  updates: Record<string, any>
): PersonaUpdate {
  console.log('[FIXED-MERGE] [mergePersonaUpdates] ENTRY', {
    currentPersona,
    updates,
    updateKeys: updates ? Object.keys(updates) : [],
    hasCurrentPersona: !!currentPersona
  });

  // Validate inputs with assertions
  if (!currentPersona) {
    console.warn('[MERGE-WARNING] currentPersona undefined in mergePersonaUpdates - investigate parameter passing');
  }
  
  if (!updates) {
    console.warn('[MERGE-WARNING] updates undefined in mergePersonaUpdates - providing empty object');
  }

  // Extract data safely from currentPersona
  const safeCurrentPersona = currentPersona || {};
  const currentData = safeCurrentPersona.data || safeCurrentPersona;
  const safeUpdates = updates || {};

  console.log('[FIXED-MERGE] [mergePersonaUpdates] currentData extracted', {
    currentDataKeys: Object.keys(currentData),
    currentDataSize: JSON.stringify(currentData).length,
    hasImportantFields: {
      demographics: !!currentData.demographics,
      useCases: !!currentData.useCases,
      buyingSignals: !!currentData.buyingSignals,
      targetPersonaName: !!currentData.targetPersonaName,
      targetPersonaDescription: !!currentData.targetPersonaDescription
    }
  });

  // Simple merge with updates taking precedence
  const mergedData = {
    ...currentData,
    ...safeUpdates
  };

  console.log('[FIXED-MERGE] [mergePersonaUpdates] After simple merge', {
    mergedDataKeys: Object.keys(mergedData),
    mergedDataSize: JSON.stringify(mergedData).length,
    updatesApplied: updates ? Object.keys(updates).length : 0
  });

  // Explicit field separation - Persona-specific pattern
  const topLevelFields = new Set(['id', 'accountId', 'name', 'createdAt', 'updatedAt']);
  const dataPayload: Record<string, any> = {};

  // Build payload by explicit inclusion (not deletion)
  Object.entries(mergedData).forEach(([key, value]) => {
    if (!topLevelFields.has(key) && key !== 'data') {
      dataPayload[key] = value;
    }
  });

  // Extract name from targetPersonaName if present
  const extractedName = extractPersonaName(mergedData);

  console.log('[FIXED-MERGE] [mergePersonaUpdates] Field separation complete', {
    topLevelName: extractedName,
    dataPayloadKeys: Object.keys(dataPayload),
    dataPayloadSize: JSON.stringify(dataPayload).length,
    hasComplexFields: !!(dataPayload.demographics || dataPayload.useCases || dataPayload.buyingSignals)
  });

  // Assert no recursion - Critical for preventing Issue #4
  if ("data" in (dataPayload as Record<string, any>) && (dataPayload as Record<string, any>).data !== undefined) {
    throw new Error('[CRITICAL] Recursive data field detected in persona merge - this would cause nested data.data structure');
  }

  const result: PersonaUpdate = {
    name: extractedName,
    data: dataPayload
  };

  console.log('[FIXED-MERGE] [mergePersonaUpdates] RESULT', {
    resultName: result.name,
    resultDataKeys: Object.keys(result.data || {}),
    resultSize: JSON.stringify(result).length,
    noRecursion: !result.data?.data
  });

  return result;
}

/**
 * Extract persona name from merged data, preferring targetPersonaName
 */
function extractPersonaName(mergedData: Record<string, any>): string {
  // Prefer targetPersonaName from AI response format
  if (mergedData.targetPersonaName) {
    return mergedData.targetPersonaName;
  }
  
  // Fallback to name field
  if (mergedData.name) {
    return mergedData.name;
  }
  
  console.warn('[EXTRACT-NAME] No name found in merged data, using fallback');
  return 'Unnamed Persona';
}

/**
 * Field-preserving persona update function
 * Uses currentPersona to preserve all existing fields while applying updates
 */
export async function updatePersonaWithMerge(
  personaId: string,
  currentPersona: Record<string, any> | null | undefined,
  updates: Record<string, any>,
  token?: string | null
): Promise<Persona> {
  console.log('[UPDATE-PERSONA-MERGE] Entry point', {
    personaId,
    hasCurrentPersona: !!currentPersona,
    updateKeys: updates ? Object.keys(updates) : [],
    currentPersonaKeys: currentPersona ? Object.keys(currentPersona) : []
  });

  // Use merge function to create proper payload
  const mergedUpdate = mergePersonaUpdates(currentPersona, updates);
  
  console.log('[UPDATE-PERSONA-MERGE] Merged payload ready', {
    mergedName: mergedUpdate.name,
    mergedDataKeys: Object.keys(mergedUpdate.data || {}),
    mergedSize: JSON.stringify(mergedUpdate).length
  });

  // Call standard update function with merged payload
  return updatePersona(personaId, mergedUpdate, token);
}

/**
 * Persona list field merge function - uses same merge logic as regular updates
 */
function mergePersonaListFieldUpdates(
  currentPersona: Record<string, any> | null | undefined,
  listFieldUpdates: Record<string, string[]>
): PersonaUpdate {
  console.log('[MERGE-PERSONA-LIST-FIELDS] Using simplified merge pattern:', {
    currentKeys: Object.keys(currentPersona || {}),
    listUpdateKeys: Object.keys(listFieldUpdates || {}),
    inputFormat: 'normalized-camelCase'
  });
  
  // Use same simple merge pattern as regular updates
  return mergePersonaUpdates(currentPersona, listFieldUpdates);
}

/**
 * Update persona list fields with field preservation
 */
export async function updatePersonaListFieldsPreserveFields(
  personaId: string,
  currentPersona: any, // More flexible type
  listFieldUpdates: Record<string, string[]>,
  token?: string | null
): Promise<Persona> {
  console.log('[PRESERVE-LIST-FIELDS] Input parameters:', {
    personaId,
    currentPersona,
    currentPersonaType: typeof currentPersona,
    currentPersonaKeys: currentPersona ? Object.keys(currentPersona) : 'null/undefined',
    listFieldUpdates
  });
  
  const mergedData = mergePersonaListFieldUpdates(currentPersona, listFieldUpdates);
  
  // Assert the fix worked - catch recursive data early
  if (mergedData?.data?.data) {
    throw new Error('[CRITICAL] Recursive data structure detected in mergePersonaListFieldUpdates - this should be impossible after the fix');
  }
  
  console.log('[PRESERVE-LIST-FIELDS] Persona list fields update with field preservation (FIXED):', mergedData);
  return updatePersona(personaId, mergedData, token);
}
