import { apiFetch } from './apiClient';
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  TargetCompanyRequest,
  TargetAccountResponse,
} from '../types/api';
import { transformKeysToCamelCase } from "../lib/utils";

// =================================================================
// Account CRUD API Functions
// =================================================================

export async function getAccounts(companyId: string, token?: string | null): Promise<Account[]> {
  return apiFetch<Account[]>(`/accounts?company_id=${companyId}`, { method: 'GET' }, token);
}

export function normalizeAccountResponse(account: Account): Account {
  console.log('[NORMALIZE] Raw account response:', account);
  const data = transformKeysToCamelCase<Record<string, any>>(account.data || {});
  const normalized = {
    ...account,
    ...data,
    data,
  };
  console.log('[NORMALIZE] Normalized account:', normalized);
  return normalized;
}

export async function getAccount(accountId: string, token?: string | null): Promise<Account> {
  const account = await apiFetch<Account>(`/accounts/${accountId}`, { method: 'GET' }, token);
  return normalizeAccountResponse(account);
}

export async function createAccount(companyId: string, accountData: AccountCreate, token?: string | null): Promise<Account> {
  return apiFetch<Account>(`/accounts?company_id=${companyId}`, {
    method: 'POST',
    body: JSON.stringify(accountData),
  }, token);
}

export async function updateAccount(accountId: string, accountData: AccountUpdate, token?: string | null): Promise<Account> {
  return apiFetch<Account>(`/accounts/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(accountData),
  }, token);
}

export async function deleteAccount(accountId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/accounts/${accountId}`, { method: 'DELETE' }, token);
}

// =================================================================
// AI Generation Service Functions
// =================================================================

export async function generateAccount(
  request: TargetCompanyRequest,
  token?: string | null
): Promise<TargetAccountResponse> {
  return apiFetch<TargetAccountResponse>('/accounts/generate-ai', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token);
}
 
// LocalStorage utilities for legacy data (used in migration and modals)
export function getStoredTargetAccounts(): any[] {
  try {
    const raw = localStorage.getItem('target_accounts');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? transformKeysToCamelCase(parsed) : [];
  } catch {
    return [];
  }
}

export function getAllPersonas(): Array<{ persona: any; accountId: string }> {
  const accounts = getStoredTargetAccounts();
  const personas: Array<{ persona: any; accountId: string }> = [];
  accounts.forEach(account => {
    if (Array.isArray(account.personas)) {
      account.personas.forEach((persona: any) => {
        personas.push({ persona, accountId: account.id });
      });
    }
  });
  return personas;
}
 