import { apiFetch } from './apiClient';
import type {
  TargetCompanyRequest,
  TargetAccountResponse,
  TargetPersonaResponse,
  TargetPersonaRequest,
  EmailGenerationRequest,
  EmailGenerationResponse,
} from '../types/api';

// API service functions
export async function generateTargetCompany(
  websiteUrl: string,
  accountProfileName?: string,
  hypothesis?: string,
  additionalContext?: string,
  companyContext?: Record<string, string | string[]>, // Allow string or string[] for context values
  token?: string | null
): Promise<TargetAccountResponse> {
  const request: TargetCompanyRequest = {
    websiteUrl,
    ...(accountProfileName ? { accountProfileName } : {}),
    ...(hypothesis ? { hypothesis } : {}),
    ...(additionalContext ? { additionalContext } : {}),
    ...(companyContext ? { companyContext } : {}),
  };

  // Pass token to API client for authentication
  return apiFetch<TargetAccountResponse>('/accounts', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token);
}

export async function generateTargetPersona(
  websiteUrl: string,
  personaProfileName?: string,
  hypothesis?: string,
  additionalContext?: string,
  companyContext?: Record<string, string | string[]>,
  targetAccountContext?: Record<string, any>,
  token?: string | null
): Promise<TargetPersonaResponse> {
  const request: TargetPersonaRequest = {
    websiteUrl,
    ...(personaProfileName ? { personaProfileName } : {}),
    ...(hypothesis ? { hypothesis } : {}),
    ...(additionalContext ? { additionalContext } : {}),
    ...(companyContext ? { companyContext } : {}),
    ...(targetAccountContext ? { targetAccountContext } : {}),
  };
  // Pass token to API client for authentication
  return apiFetch('/personas', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token);
}

// Email campaign generation API function
export async function generateEmailCampaign(
  request: EmailGenerationRequest,
  token?: string | null
): Promise<EmailGenerationResponse> {
  // Log the user prompt/request payload for debugging
  console.log('[generateEmailCampaign] Request payload:', request);
  // Pass token to API client for authentication
  return apiFetch<EmailGenerationResponse>('/campaigns/generate-email', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token);
}

// Local storage service functions for canonical target accounts
export function getStoredTargetAccounts(): (TargetAccountResponse & { id: string; createdAt: string; personas?: TargetPersonaResponse[] })[] {
  const stored = localStorage.getItem('target_accounts');
  if (!stored) return [];
  const parsed = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed as (TargetAccountResponse & { id: string; createdAt: string; personas?: TargetPersonaResponse[] })[] : [];
}

export function saveTargetAccount(account: TargetAccountResponse & { id: string; createdAt: string; personas?: TargetPersonaResponse[] }): void {
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
  return account && Array.isArray(account.personas) ? account.personas : [];
}

export function addPersonaToTargetAccount(accountId: string, persona: TargetPersonaResponse): void {
  const accounts = getStoredTargetAccounts();
  const idx = accounts.findIndex(p => p.id === accountId);
  if (idx === -1) return;
  const account = accounts[idx];
  if (!Array.isArray(account.personas)) account.personas = [];
  account.personas.push(persona);
  localStorage.setItem('target_accounts', JSON.stringify(accounts));
}

export function updatePersonaForTargetAccount(accountId: string, persona: TargetPersonaResponse): void {
  const accounts = getStoredTargetAccounts();
  const idx = accounts.findIndex(p => p.id === accountId);
  if (idx === -1) return;
  const account = accounts[idx];
  if (!Array.isArray(account.personas)) return;
  const personaIdx = account.personas.findIndex((p: any) => p.id === persona.id);
  if (personaIdx === -1) return;
  account.personas[personaIdx] = persona;
  localStorage.setItem('target_accounts', JSON.stringify(accounts));
}

export function deletePersonaFromTargetAccount(accountId: string, personaId: string): void {
  const accounts = getStoredTargetAccounts();
  const idx = accounts.findIndex(p => p.id === accountId);
  if (idx === -1) return;
  const account = accounts[idx];
  if (!Array.isArray(account.personas)) return;
  account.personas = account.personas.filter((p: any) => p.id !== personaId);
  localStorage.setItem('target_accounts', JSON.stringify(accounts));
}

// Get all personas across all accounts for company-wide view
export function getAllPersonas(): Array<{ persona: TargetPersonaResponse; accountId: string; accountName: string }> {
  const accounts = getStoredTargetAccounts();
  const allPersonas: Array<{ persona: TargetPersonaResponse; accountId: string; accountName: string }> = [];
  
  accounts.forEach(account => {
    if (Array.isArray(account.personas)) {
      account.personas.forEach((persona: TargetPersonaResponse) => {
        allPersonas.push({
          persona,
          accountId: account.id,
          accountName: account.targetAccountName
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