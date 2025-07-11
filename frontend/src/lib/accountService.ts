import { apiFetch } from './apiClient';
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  TargetAccountAPIRequest,
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
  currentAccount: any, // More flexible type to handle both database and AI response formats
  updates: { name?: string; description?: string; [key: string]: any }
): AccountUpdate {
  // Handle null/undefined currentAccount
  if (!currentAccount) {
    console.warn('[MERGE-ACCOUNT-UPDATES] currentAccount is null/undefined, using defaults');
    currentAccount = {};
  }
  
  // Handle both database format (Account) and AI response format (TargetAccountResponse)
  const currentName = currentAccount.targetAccountName || currentAccount.name || 'Untitled Account';
  const currentDescription = currentAccount.targetAccountDescription || currentAccount.description || 'No description';
  
  const frontendData = {
    // Start with ALL existing fields from currentAccount
    ...currentAccount,
    // Override with specific updates
    targetAccountName: updates.name || currentName,
    targetAccountDescription: updates.description || currentDescription,
    // Apply any complex type updates
    ...(updates.firmographics && { firmographics: updates.firmographics }),
    ...(updates.buyingSignals && { buyingSignals: updates.buyingSignals }),
    // Ensure we don't lose these essential fields if they weren't in updates
    firmographics: updates.firmographics || currentAccount.firmographics,
    buyingSignals: updates.buyingSignals || currentAccount.buyingSignals,
    metadata: currentAccount.metadata,
  };
  
  return {
    name: updates.name || currentName,
    data: frontendData,
  };
}

/**
 * Merge list field updates with existing account data, preserving all other fields
 */
function mergeAccountListFieldUpdates(
  currentAccount: any, // More flexible type to handle both database and AI response formats
  listFieldUpdates: Record<string, string[]>
): AccountUpdate {
  // Handle null/undefined currentAccount
  if (!currentAccount) {
    console.warn('[MERGE-ACCOUNT-LIST-FIELDS] currentAccount is null/undefined, using defaults');
    currentAccount = {};
  }
  
  // Handle both database format (Account) and AI response format (TargetAccountResponse)
  const currentName = currentAccount.targetAccountName || currentAccount.name || 'Untitled Account';
  const currentDescription = currentAccount.targetAccountDescription || currentAccount.description || 'No description';
  
  const frontendData = {
    // Start with ALL existing fields from currentAccount
    ...currentAccount,
    // Override with standard fields
    targetAccountName: currentName,
    targetAccountDescription: currentDescription,
    // Apply list field updates only for specified fields
    ...(listFieldUpdates.targetAccountRationale && { targetAccountRationale: listFieldUpdates.targetAccountRationale }),
    ...(listFieldUpdates.buyingSignalsRationale && { buyingSignalsRationale: listFieldUpdates.buyingSignalsRationale }),
    // Ensure we don't lose these essential fields
    firmographics: currentAccount.firmographics,
    buyingSignals: currentAccount.buyingSignals,
    metadata: currentAccount.metadata,
  };
  
  return {
    name: currentName,
    data: frontendData,
  };
}

/**
 * Update account with field preservation - preserves all analysis data
 */
export async function updateAccountPreserveFields(
  accountId: string,
  currentAccount: any, // More flexible type
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
  currentAccount: any, // More flexible type
  listFieldUpdates: Record<string, string[]>,
  token?: string | null
): Promise<Account> {
  console.log('[PRESERVE-LIST-FIELDS] Input parameters:', {
    accountId,
    currentAccount,
    currentAccountType: typeof currentAccount,
    currentAccountKeys: currentAccount ? Object.keys(currentAccount) : 'null/undefined',
    listFieldUpdates
  });
  
  const mergedData = mergeAccountListFieldUpdates(currentAccount, listFieldUpdates);
  console.log('[PRESERVE-LIST-FIELDS] Account list fields update with field preservation:', mergedData);
  return updateAccount(accountId, mergedData, token);
}

// =================================================================
// AI Generation Service Functions
// =================================================================

export async function generateAccount(
  request: TargetAccountAPIRequest,
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
 