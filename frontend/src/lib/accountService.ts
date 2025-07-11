import { apiFetch } from './apiClient';
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  TargetAccountAPIRequest,
  TargetAccountResponse,
} from '../types/api';
import { transformKeysToCamelCase, transformKeysToSnakeCase } from "../lib/utils";

// =================================================================
// Account CRUD API Functions
// =================================================================

export async function getAccounts(companyId: string, token?: string | null): Promise<Account[]> {
  return apiFetch<Account[]>(`/accounts?company_id=${companyId}`, { method: 'GET' }, token);
}

export function normalizeAccountResponse(account: Account): Account {
  console.log('[NORMALIZE] Raw account response:', account);
  
  // Transform the data field to camelCase for frontend use
  const transformedData = transformKeysToCamelCase<Record<string, any>>(account.data || {});
  
  // Create normalized account with consistent camelCase format
  // Keep data field for backend compatibility, but use camelCase throughout
  const normalized = {
    ...account,
    ...transformedData, // Spread transformed data to root level for component access
    data: transformedData, // Keep data field for API consistency
  };
  
  console.log('[NORMALIZE] Normalized account (single format):', {
    id: normalized.id,
    hasTargetAccountName: !!normalized.targetAccountName,
    hasName: !!normalized.name,
    dataFieldKeys: Object.keys(normalized.data || {}),
    rootLevelKeys: Object.keys(normalized).filter(k => k !== 'data'),
    formatConsistent: !Object.keys(normalized).some(k => k.includes('_'))
  });
  
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
  console.log('[UPDATE-ACCOUNT] API boundary transformation:', {
    accountId,
    inputData: accountData,
    dataFieldKeys: Object.keys(accountData.data || {}),
    transformationPoint: 'updateAccount-api-boundary'
  });
  
  // Transform data field to snake_case for backend - Single transformation point
  const backendPayload = {
    ...accountData,
    data: transformKeysToSnakeCase(accountData.data || {})
  };
  
  console.log('[UPDATE-ACCOUNT] Backend payload:', {
    name: backendPayload.name,
    dataKeys: Object.keys(backendPayload.data || {}),
    hasSnakeCase: Object.keys(backendPayload.data || {}).some(k => k.includes('_')),
    payloadSize: JSON.stringify(backendPayload).length
  });
  
  const response = await apiFetch<Account>(`/accounts/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(backendPayload),
  }, token);
  
  // Always normalize response to maintain consistent format
  const normalized = normalizeAccountResponse(response);
  
  console.log('[UPDATE-ACCOUNT] Response normalized:', {
    responseId: normalized.id,
    fieldCount: Object.keys(normalized).length,
    formatConsistent: !Object.keys(normalized).some(k => k.includes('_'))
  });
  
  return normalized;
}

export async function deleteAccount(accountId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/accounts/${accountId}`, { method: 'DELETE' }, token);
}

// =================================================================
// Field-Preserving Update Functions (for Entity Abstraction)
// =================================================================

/**
 * Simplified merge function using object spread - no defensive programming
 * Assumes currentAccount is always in normalized camelCase format from cache
 */
function mergeAccountUpdates(
  currentAccount: Record<string, any> | null | undefined, 
  updates: Record<string, any>
): AccountUpdate {
  console.log('[MERGE-ACCOUNT-UPDATES] Simplified merge:', {
    currentKeys: Object.keys(currentAccount || {}),
    updateKeys: Object.keys(updates || {}),
    inputFormat: 'normalized-camelCase',
    hasCurrentAccount: !!currentAccount
  });
  
  // Handle null/undefined currentAccount case
  const safeCurrentAccount = currentAccount || {};
  
  // Simple object spread merge - all fields preserved automatically
  const mergedData = {
    ...safeCurrentAccount,
    ...updates
  };
  
  // Extract name for backend compatibility
  const accountName = updates.targetAccountName || safeCurrentAccount.targetAccountName || 'Untitled Account';
  
  console.log('[MERGE-ACCOUNT-UPDATES] Merge complete:', {
    preservedFieldCount: Object.keys(mergedData).length,
    accountName,
    hasComplexFields: !!(mergedData.firmographics || mergedData.buyingSignals)
  });
  
  return {
    name: accountName,
    data: mergedData,
  };
}

/**
 * Simplified list field merge - now uses same pattern as regular updates
 * No longer needed as separate function, but kept for backward compatibility
 */
function mergeAccountListFieldUpdates(
  currentAccount: Record<string, any> | null | undefined,
  listFieldUpdates: Record<string, string[]>
): AccountUpdate {
  console.log('[MERGE-ACCOUNT-LIST-FIELDS] Using simplified merge pattern:', {
    currentKeys: Object.keys(currentAccount || {}),
    listUpdateKeys: Object.keys(listFieldUpdates || {}),
    inputFormat: 'normalized-camelCase'
  });
  
  // Use same simple merge pattern as regular updates
  return mergeAccountUpdates(currentAccount, listFieldUpdates);
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
 