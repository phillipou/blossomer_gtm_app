import { apiFetch } from './apiClient';
import type {
  Account,
  AccountCreate,
  AccountUpdate,
} from '../types/api';

// =================================================================
// Account CRUD API Functions
// =================================================================

export async function getAccounts(companyId: string, token?: string | null): Promise<Account[]> {
  return apiFetch<Account[]>(`/accounts?company_id=${companyId}`, { method: 'GET' }, token);
}

export async function getAccount(accountId: string, token?: string | null): Promise<Account> {
    return apiFetch<Account>(`/accounts/${accountId}`, { method: 'GET' }, token);
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
 
// LocalStorage utilities for legacy data (used in migration and modals)
export function getStoredTargetAccounts(): any[] {
  try {
    const raw = localStorage.getItem('target_accounts');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Optionally: run through transformKeysToCamelCase if needed
    return Array.isArray(parsed) ? parsed : [];
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
 