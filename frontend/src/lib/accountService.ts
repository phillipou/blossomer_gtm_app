import { apiFetch } from './apiClient';
import type {
  TargetCompanyRequest,
  TargetAccountResponse,
  TargetCompanyResponse,
  TargetAccount,
  TargetPersonaResponse,
  TargetPersonaRequest,
} from '../types/api';

// API service functions
export async function generateTargetCompany(
  websiteUrl: string,
  accountProfileName?: string,
  hypothesis?: string,
  additionalContext?: string,
  companyContext?: Record<string, string | string[]> // Allow string or string[] for context values
): Promise<TargetAccountResponse> {
  const request: TargetCompanyRequest = {
    websiteUrl,
    ...(accountProfileName ? { accountProfileName } : {}),
    ...(hypothesis ? { hypothesis } : {}),
    ...(additionalContext ? { additionalContext } : {}),
    ...(companyContext ? { companyContext } : {}),
  };

  // Use demo endpoint for now (no API key required)
  return apiFetch<TargetAccountResponse>('/demo/customers/target_accounts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function generateTargetPersona(
  websiteUrl: string,
  userInputtedContext: Record<string, string>,
  companyContext?: Record<string, string | string[]>,
  targetAccountContext?: Record<string, string | string[]>
): Promise<TargetPersonaResponse> {
  const request: TargetPersonaRequest = {
    websiteUrl,
    userInputtedContext,
    ...(companyContext ? { companyContext } : {}),
    ...(targetAccountContext ? { targetAccountContext } : {}),
  };
  // Use demo endpoint for now (no API key required)
  return apiFetch('/demo/customers/target_personas', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Local storage service functions for target accounts
export function getStoredTargetAccounts(): TargetAccount[] {
  const stored = localStorage.getItem('target_accounts');
  return stored ? JSON.parse(stored) : [];
}

export function saveTargetAccount(account: TargetAccount): void {
  const accounts = getStoredTargetAccounts();
  const existingIndex = accounts.findIndex(p => p.id === account.id);
  
  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }
  
  localStorage.setItem('target_accounts', JSON.stringify(accounts));
}

export function deleteTargetAccount(id: string): void {
  const accounts = getStoredTargetAccounts();
  const filtered = accounts.filter(p => p.id !== id);
  localStorage.setItem('target_accounts', JSON.stringify(filtered));
}

export function generateTargetAccountId(): string {
  return `target_account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getPersonasForTargetAccount(accountId: string): TargetPersonaResponse[] {
  const accounts = getStoredTargetAccounts();
  const account = accounts.find(p => p.id === accountId);
  return account?.personas || [];
}

export function addPersonaToTargetAccount(accountId: string, persona: TargetPersonaResponse): void {
  const accounts = getStoredTargetAccounts();
  const idx = accounts.findIndex(p => p.id === accountId);
  if (idx === -1) return;
  const account = accounts[idx];
  if (!account.personas) account.personas = [];
  account.personas.push(persona);
  saveTargetAccount(account);
}

export function updatePersonaForTargetAccount(accountId: string, persona: TargetPersonaResponse): void {
  const accounts = getStoredTargetAccounts();
  const idx = accounts.findIndex(p => p.id === accountId);
  if (idx === -1) return;
  const account = accounts[idx];
  if (!account.personas) return;
  const personaIdx = account.personas.findIndex(p => p.id === persona.id);
  if (personaIdx === -1) return;
  account.personas[personaIdx] = persona;
  saveTargetAccount(account);
}

export function deletePersonaFromTargetAccount(accountId: string, personaId: string): void {
  const accounts = getStoredTargetAccounts();
  const idx = accounts.findIndex(p => p.id === accountId);
  if (idx === -1) return;
  const account = accounts[idx];
  if (!account.personas) return;
  account.personas = account.personas.filter(p => p.id !== personaId);
  saveTargetAccount(account);
}

// Get all personas across all accounts for company-wide view
export function getAllPersonas(): Array<{ persona: TargetPersonaResponse; accountId: string; accountName: string }> {
  const accounts = getStoredTargetAccounts();
  const allPersonas: Array<{ persona: TargetPersonaResponse; accountId: string; accountName: string }> = [];
  
  accounts.forEach(account => {
    if (account.personas) {
      account.personas.forEach(persona => {
        allPersonas.push({
          persona,
          accountId: account.id,
          accountName: account.name
        });
      });
    }
  });
  
  return allPersonas;
}

export function transformBuyingSignals(raw: (string | { id?: string; label?: string; name?: string; description?: string; enabled?: boolean })[]): { id: string; label: string; description: string; enabled: boolean }[] {
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