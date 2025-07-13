/**
 * Persona Service V2 - Single-Transform PUT Pipeline
 * 
 * Implements expert memo recommendations:
 * - Single transformation point: UI camelCase → API snake_case only at boundary
 * - No multi-step transformations or merge complexity
 * - Clean separation between raw API types and UI models
 * - Uses auto-generated types and mappers for consistency
 * - Eliminates recursive data field issues from V1
 */

import { apiFetch } from '../apiClient.js';
import { 
  mapPersonaResponseToUI,
  mapTargetPersonaResponseToUI, 
  mapPersonaCreateToAPI, 
  mapPersonaUpdateToAPI,
  type PersonaUI,
  type PersonaCreateUI,
  type components 
} from '../mappers/index.js';

// Raw API types from auto-generated OpenAPI spec
type PersonaResponseRaw = components['schemas']['PersonaResponse'];
type PersonaCreateRaw = components['schemas']['PersonaCreate'];
type TargetPersonaResponseRaw = components['schemas']['TargetPersonaResponse'];

/**
 * Get all personas for an account
 */
export async function getPersonas(accountId: string, token?: string | null): Promise<PersonaUI[]> {
  const rawPersonas = await apiFetch<PersonaResponseRaw[]>(`/personas?account_id=${accountId}`, { method: 'GET' }, token);
  
  // Single transformation point: Raw API → UI Model
  return rawPersonas.map(mapPersonaResponseToUI);
}

/**
 * Get specific persona by ID
 */
export async function getPersona(personaId: string, token?: string | null): Promise<PersonaUI> {
  const rawPersona = await apiFetch<PersonaResponseRaw>(`/personas/${personaId}`, { method: 'GET' }, token);
  
  // Single transformation point: Raw API → UI Model
  return mapPersonaResponseToUI(rawPersona);
}

/**
 * Create new persona from UI data
 * Single transformation: UI Model → API Request → UI Model
 */
export async function createPersona(personaData: PersonaCreateUI, token?: string | null): Promise<PersonaUI> {
  console.log('[PERSONA-CREATE] UI Model Input:', personaData);
  
  // Single transformation point: UI → API
  const apiPayload = mapPersonaCreateToAPI(personaData);
  console.log('[PERSONA-CREATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<PersonaResponseRaw>('/personas', {
    method: 'POST',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[PERSONA-CREATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const uiModel = mapPersonaResponseToUI(rawResponse);
  console.log('[PERSONA-CREATE] Final UI Model:', uiModel);
  
  return uiModel;
}

/**
 * Create persona from AI-generated TargetPersona response
 * Single transformation: AI Response → UI Model → API Request → UI Model
 */
export async function createPersonaFromAI(
  aiResponse: TargetPersonaResponseRaw, 
  accountId: string,
  token?: string | null
): Promise<PersonaUI> {
  console.log('[PERSONA-AI-CREATE] AI Response Input:', aiResponse);
  
  // Transform AI response to UI model first
  const uiModel = mapTargetPersonaResponseToUI(aiResponse);
  uiModel.accountId = accountId; // Set account association
  
  console.log('[PERSONA-AI-CREATE] UI Model from AI:', uiModel);
  
  // Create persona data for API
  const personaCreateData: PersonaCreateUI = {
    name: uiModel.name,
    personaData: undefined // Will be built by mapper
  };
  
  // Single transformation point: UI → API (includes all AI data)
  const apiPayload = mapPersonaCreateToAPI(personaCreateData, uiModel);
  console.log('[PERSONA-AI-CREATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<PersonaResponseRaw>('/personas', {
    method: 'POST',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[PERSONA-AI-CREATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const finalUiModel = mapPersonaResponseToUI(rawResponse);
  console.log('[PERSONA-AI-CREATE] Final UI Model:', finalUiModel);
  
  return finalUiModel;
}

/**
 * Update persona with field preservation
 * Single transformation: Merged UI Model → API Request → UI Model
 * No complex merge logic - just simple spread
 */
export async function updatePersona(
  personaId: string, 
  updates: Partial<PersonaUI>,
  currentPersona?: PersonaUI,
  token?: string | null
): Promise<PersonaUI> {
  console.log('[PERSONA-UPDATE] Starting update:', { personaId, updates, currentPersona });
  
  // Simple merge at UI level - no complex field separation needed
  const mergedPersona = currentPersona ? {
    ...currentPersona,
    ...updates
  } : updates;
  
  console.log('[PERSONA-UPDATE] Merged UI Model:', mergedPersona);
  
  // Single transformation point: UI → API
  const apiPayload = mapPersonaUpdateToAPI(mergedPersona);
  console.log('[PERSONA-UPDATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<PersonaResponseRaw>(`/personas/${personaId}`, {
    method: 'PUT',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[PERSONA-UPDATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const updatedUiModel = mapPersonaResponseToUI(rawResponse);
  console.log('[PERSONA-UPDATE] Final UI Model:', updatedUiModel);
  
  return updatedUiModel;
}

/**
 * Delete persona
 */
export async function deletePersona(personaId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/personas/${personaId}`, { method: 'DELETE' }, token);
}

/**
 * Simple field preservation for React Query integration
 * No complex merge logic - just spread operator
 */
export async function updatePersonaPreserveFields(
  personaId: string,
  updates: Partial<PersonaUI>,
  currentPersona: PersonaUI,
  token?: string | null
): Promise<PersonaUI> {
  return updatePersona(personaId, updates, currentPersona, token);
}

/**
 * Generate target persona using AI
 * Returns raw AI response for further processing
 */
export async function generateTargetPersona(
  websiteUrl: string,
  personaProfileName?: string,
  hypothesis?: string,
  additionalContext?: string,
  companyContext?: Record<string, any>,
  targetAccountContext?: Record<string, any>,
  token?: string | null
): Promise<TargetPersonaResponseRaw> {
  const requestPayload = {
    website_url: websiteUrl,
    persona_profile_name: personaProfileName,
    hypothesis,
    additional_context: additionalContext,
    company_context: companyContext,
    target_account_context: targetAccountContext
  };
  
  console.log('[PERSONA-AI-GENERATE] AI Request:', requestPayload);
  
  const aiResponse = await apiFetch<TargetPersonaResponseRaw>('/personas/generate-ai', {
    method: 'POST', 
    body: JSON.stringify(requestPayload)
  }, token);
  
  console.log('[PERSONA-AI-GENERATE] AI Response:', aiResponse);
  
  return aiResponse;
}