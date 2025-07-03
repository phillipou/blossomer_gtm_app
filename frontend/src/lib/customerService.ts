import { apiFetch } from './apiClient';
import type {
  TargetCompanyRequest,
  TargetCompanyResponse,
  CustomerProfile,
  TargetPersonaResponse,
  TargetPersonaRequest,
} from '../types/api';

// API service functions
export async function generateTargetCompany(
  website_url: string,
  user_inputted_context: Record<string, any>,
  company_context?: Record<string, any>
): Promise<TargetCompanyResponse> {
  const request: TargetCompanyRequest = {
    website_url,
    user_inputted_context,
    ...(company_context ? { company_context } : {}),
  };

  // Use demo endpoint for now (no API key required)
  return apiFetch<TargetCompanyResponse>('/demo/customers/target_accounts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function generateTargetPersona(
  website_url: string,
  user_inputted_context: Record<string, any>,
  company_context?: Record<string, any>,
  target_account_context?: Record<string, any>
): Promise<any> {
  const request: TargetPersonaRequest = {
    website_url,
    user_inputted_context,
    ...(company_context ? { company_context } : {}),
    ...(target_account_context ? { target_account_context } : {}),
  };
  // Use demo endpoint for now (no API key required)
  return apiFetch('/demo/customers/target_personas', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Local storage service functions for customer profiles
export function getStoredCustomerProfiles(): CustomerProfile[] {
  const stored = localStorage.getItem('customer_profiles');
  return stored ? JSON.parse(stored) : [];
}

export function saveCustomerProfile(profile: CustomerProfile): void {
  const profiles = getStoredCustomerProfiles();
  const existingIndex = profiles.findIndex(p => p.id === profile.id);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  localStorage.setItem('customer_profiles', JSON.stringify(profiles));
}

export function deleteCustomerProfile(id: string): void {
  const profiles = getStoredCustomerProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  localStorage.setItem('customer_profiles', JSON.stringify(filtered));
}

export function generateCustomerProfileId(): string {
  return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getPersonasForCustomer(customerId: string): TargetPersonaResponse[] {
  const profiles = getStoredCustomerProfiles();
  const profile = profiles.find(p => p.id === customerId);
  return profile?.personas || [];
}

export function addPersonaToCustomer(customerId: string, persona: TargetPersonaResponse): void {
  const profiles = getStoredCustomerProfiles();
  const idx = profiles.findIndex(p => p.id === customerId);
  if (idx === -1) return;
  const profile = profiles[idx];
  if (!profile.personas) profile.personas = [];
  profile.personas.push(persona);
  saveCustomerProfile(profile);
}

export function updatePersonaForCustomer(customerId: string, persona: TargetPersonaResponse): void {
  const profiles = getStoredCustomerProfiles();
  const idx = profiles.findIndex(p => p.id === customerId);
  if (idx === -1) return;
  const profile = profiles[idx];
  if (!profile.personas) return;
  const personaIdx = profile.personas.findIndex(p => p.id === persona.id);
  if (personaIdx === -1) return;
  profile.personas[personaIdx] = persona;
  saveCustomerProfile(profile);
}

export function deletePersonaFromCustomer(customerId: string, personaId: string): void {
  const profiles = getStoredCustomerProfiles();
  const idx = profiles.findIndex(p => p.id === customerId);
  if (idx === -1) return;
  const profile = profiles[idx];
  if (!profile.personas) return;
  profile.personas = profile.personas.filter(p => p.id !== personaId);
  saveCustomerProfile(profile);
}

export function transformBuyingSignals(raw: any[]): { id: string; label: string; description: string; enabled: boolean }[] {
  return (Array.isArray(raw) ? raw : []).map((s, idx) =>
    typeof s === 'string'
      ? { id: String(idx), label: s, description: '', enabled: true }
      : {
          id: s.id || String(idx),
          label: s.label || s.name || '',
          description: s.description || '',
          enabled: s.enabled !== undefined ? s.enabled : true,
        }
  );
} 