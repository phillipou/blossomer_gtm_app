import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  generatePersona,
} from '../personaService';
import type { Persona, PersonaCreate, PersonaUpdate, TargetPersonaRequest } from '../../types/api';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_QUERY_KEY, accountId] });
    },
  });
}

export function useUpdatePersona(accountId: string, token?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<Persona, Error, { personaId: string; personaData: PersonaUpdate }>({
    mutationFn: ({ personaId, personaData }) => updatePersona(personaId, personaData, token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PERSONA_QUERY_KEY, accountId] });
      queryClient.invalidateQueries({ queryKey: [PERSONA_QUERY_KEY, data.id] });
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
    return useMutation<Persona, Error, TargetPersonaRequest>({
        mutationFn: (personaData) => generatePersona(accountId, personaData, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PERSONA_QUERY_KEY, accountId] });
        },
    });
}
