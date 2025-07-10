import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  generatePersona,
  normalizePersonaResponse,
} from '../personaService';
import type { Persona, PersonaCreate, PersonaUpdate, TargetPersonaRequest, TargetPersonaResponse } from '../../types/api';

const PERSONA_QUERY_KEY = 'personas';

export function useGetPersonas(accountId: string, token?: string | null) {
  return useQuery<Persona[], Error>({
    queryKey: [PERSONA_QUERY_KEY, accountId],
    queryFn: () => getPersonas(accountId, token),
    enabled: !!accountId && !!token,
  });
}

export function useGetPersona(personaId: string, token?: string | null) {
    return useQuery<Persona, Error>({
        queryKey: [PERSONA_QUERY_KEY, personaId],
        queryFn: () => getPersona(personaId, token),
        enabled: !!personaId && !!token,
    });
}

export function useCreatePersona(accountId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Persona, Error, PersonaCreate>({
    mutationFn: (personaData) => createPersona(accountId, personaData, token),
    onSuccess: (savedPersona) => {
      const normalized = normalizePersonaResponse(savedPersona);
      console.log('[NORMALIZE] (onCreateSuccess) Normalized persona:', normalized);
      queryClient.invalidateQueries({ queryKey: ['personas', accountId] });
      queryClient.setQueryData(['persona', normalized.id], normalized);
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
      queryClient.setQueryData(['persona', normalized.id], normalized);
    },
  });
}

export function useDeletePersona(accountId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (personaId) => deletePersona(personaId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_QUERY_KEY, accountId] });
    },
  });
}

export function useGeneratePersona(accountId: string, token?: string | null) {
    const queryClient = useQueryClient();
    return useMutation<TargetPersonaResponse, Error, TargetPersonaRequest>({
        mutationFn: (personaData) => generatePersona(accountId, personaData, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PERSONA_QUERY_KEY, accountId] });
        },
    });
}
