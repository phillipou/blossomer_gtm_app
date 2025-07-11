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
// Field-Preserving Update Functions (for Entity Abstraction)
// =================================================================

/**
 * Merge updates with existing account data, preserving all other fields
 */
function mergeAccountUpdates(
  currentAccount: TargetAccountResponse,
  updates: { name?: string; description?: string; [key: string]: any }
): AccountUpdate {
  const frontendData = {
    targetAccountName: updates.name || currentAccount.targetAccountName,
    targetAccountDescription: updates.description || currentAccount.targetAccountDescription,
    // Preserve all existing analysis data
    targetAccountRationale: currentAccount.targetAccountRationale,
    buyingSignalsRationale: currentAccount.buyingSignalsRationale,
    // Preserve complex types
    firmographics: currentAccount.firmographics,
    buyingSignals: currentAccount.buyingSignals,
    metadata: currentAccount.metadata,
  };
  
  return {
    name: updates.name || currentAccount.targetAccountName,
    data: frontendData,
  };
}

/**
 * Merge list field updates with existing account data, preserving all other fields
 */
function mergeAccountListFieldUpdates(
  currentAccount: TargetAccountResponse,
  listFieldUpdates: Record<string, string[]>
): AccountUpdate {
  const frontendData = {
    targetAccountName: currentAccount.targetAccountName,
    targetAccountDescription: currentAccount.targetAccountDescription,
    // Preserve all existing fields, but allow list field updates
    targetAccountRationale: listFieldUpdates.targetAccountRationale || currentAccount.targetAccountRationale,
    buyingSignalsRationale: listFieldUpdates.buyingSignalsRationale || currentAccount.buyingSignalsRationale,
    // Preserve complex types
    firmographics: currentAccount.firmographics,
    buyingSignals: currentAccount.buyingSignals,
    metadata: currentAccount.metadata,
  };
  
  return {
    name: currentAccount.targetAccountName,
    data: frontendData,
  };
}

/**
 * Update account with field preservation - preserves all analysis data
 */
export async function updateAccountPreserveFields(
  accountId: string,
  currentAccount: TargetAccountResponse,
  updates: { name?: string; description?: string; [key: string]: any },
  token?: string | null
): Promise<Account> {
  const mergedData = mergeAccountUpdates(currentAccount, updates);
  console.log('[PRESERVE-FIELDS] Account update with field preservation:', mergedData);
  return updateAccount(accountId, mergedData, token);
}

/**
 * Update account list fields with field preservation
 */
export async function updateAccountListFieldsPreserveFields(
  accountId: string,
  currentAccount: TargetAccountResponse,
  listFieldUpdates: Record<string, string[]>,
  token?: string | null
): Promise<Account> {
  const mergedData = mergeAccountListFieldUpdates(currentAccount, listFieldUpdates);
  console.log('[PRESERVE-LIST-FIELDS] Account list fields update with field preservation:', mergedData);
  return updateAccount(accountId, mergedData, token);
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
 