import { apiFetch } from './apiClient';
import type { Persona, PersonaCreate, PersonaUpdate, TargetPersonaRequest } from '../types/api';

// =================================================================
// Persona CRUD API Functions
// =================================================================

export async function getPersonas(accountId: string, token?: string | null): Promise<Persona[]> {
  return apiFetch<Persona[]>(`/accounts/${accountId}/personas`, { method: 'GET' }, token);
}

export async function getPersona(personaId: string, token?: string | null): Promise<Persona> {
  return apiFetch<Persona>(`/personas/${personaId}`, { method: 'GET' }, token);
}

export async function createPersona(accountId: string, personaData: PersonaCreate, token?: string | null): Promise<Persona> {
  return apiFetch<Persona>(`/accounts/${accountId}/personas`, {
    method: 'POST',
    body: JSON.stringify(personaData),
  }, token);
}

export async function updatePersona(personaId: string, personaData: PersonaUpdate, token?: string | null): Promise<Persona> {
  return apiFetch<Persona>(`/personas/${personaId}`, {
    method: 'PUT',
    body: JSON.stringify(personaData),
  }, token);
}

export async function deletePersona(personaId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/personas/${personaId}`, { method: 'DELETE' }, token);
}

export async function generatePersona(accountId: string, personaData: TargetPersonaRequest, token?: string | null): Promise<Persona> {
    return apiFetch<Persona>(`/accounts/${accountId}/personas/generate`, {
        method: 'POST',
        body: JSON.stringify(personaData),
    }, token);
}
