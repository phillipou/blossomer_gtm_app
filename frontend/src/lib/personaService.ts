import { apiFetch } from './apiClient';
import type { Persona, PersonaCreate, PersonaUpdate, TargetPersonaRequest, TargetPersonaResponse } from '../types/api';
import { transformKeysToCamelCase, transformKeysToSnakeCase } from "./utils";

// =================================================================
// Persona CRUD API Functions
// =================================================================

export async function getPersonas(accountId: string, token?: string | null): Promise<Persona[]> {
  return apiFetch<Persona[]>(`/accounts/${accountId}/personas`, { method: 'GET' }, token);
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
  if (persona.data?.data) {
    console.error('[CRITICAL] Backend returned recursive data structure - this indicates the PUT request fix did not work', {
      personaData: persona.data,
      nestedData: persona.data.data,
      fullPersona: persona
    });
    // For now, just log the error but don't throw to prevent breaking the app
    // TODO: Enable throwing after confirming fix works
    // throw new Error('[CRITICAL] Backend returned recursive data structure');
  }
  
  if (transformedData?.data) {
    console.warn('[NORMALIZE] NESTED data field detected in transformedData after camelCase transform', {
      transformedData,
      originalPersonaData: persona.data
    });
  }
  
  console.log('[NORMALIZE] Normalized persona (single format):', {
    id: normalized.id,
    hasTargetPersonaName: !!normalized.targetPersonaName,
    hasName: !!normalized.name,
    dataFieldKeys: Object.keys(normalized.data || {}),
    rootLevelKeys: Object.keys(normalized).filter(k => k !== 'data'),
    formatConsistent: !Object.keys(normalized).some(k => k.includes('_')),
    hasComplexFields: !!(normalized.demographics || normalized.useCases || normalized.buyingSignals)
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

export async function generatePersona(accountId: string, personaData: TargetPersonaRequest, token?: string | null): Promise<TargetPersonaResponse> {
    return apiFetch<TargetPersonaResponse>(`/accounts/${accountId}/personas/generate`, {
        method: 'POST',
        body: JSON.stringify(personaData),
    }, token);
}

// Helper to transform AI response format to backend CRUD format
function transformPersonaToCreateFormat(aiResponse: TargetPersonaResponse): PersonaCreate {
  return {
    name: aiResponse.targetPersonaName,
    data: aiResponse,
  };
}

export async function createPersona(accountId: string, personaData: TargetPersonaResponse, token?: string | null): Promise<Persona> {
  // Transform AI format to backend CRUD format
  const createData = transformPersonaToCreateFormat(personaData);
  
  return apiFetch<Persona>(`/accounts/${accountId}/personas`, {
    method: 'POST',
    body: JSON.stringify(createData),
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
    updateKeys: Object.keys(updates),
    hasCurrentPersona: !!currentPersona
  });

  // Validate inputs with assertions
  if (!currentPersona) {
    console.warn('[MERGE-WARNING] currentPersona undefined in mergePersonaUpdates - investigate parameter passing');
  }

  // Extract data safely from currentPersona
  const safeCurrentPersona = currentPersona || {};
  const currentData = safeCurrentPersona.data || safeCurrentPersona;

  console.log('[FIXED-MERGE] [mergePersonaUpdates] currentData extracted', {
    currentDataKeys: Object.keys(currentData),
    currentDataSize: JSON.stringify(currentData).length,
    hasNestedData: !!currentData.data
  });

  // Simple merge with updates taking precedence
  const mergedData = {
    ...currentData,
    ...updates
  };

  console.log('[FIXED-MERGE] [mergePersonaUpdates] After simple merge', {
    mergedDataKeys: Object.keys(mergedData),
    mergedDataSize: JSON.stringify(mergedData).length,
    updatesApplied: Object.keys(updates).length
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
  if (dataPayload.data) {
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
    updateKeys: Object.keys(updates),
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
