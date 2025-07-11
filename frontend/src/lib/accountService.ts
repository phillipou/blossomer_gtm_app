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
  console.log('[DEBUG-NORMALIZE] Raw account structure from backend:', {
    account,
    hasDataField: !!account.data,
    dataFieldKeys: account.data ? Object.keys(account.data) : undefined,
    dataFieldHasNestedData: account.data?.data ? true : false,
    dataFieldNestedDataKeys: account.data?.data ? Object.keys(account.data.data) : undefined,
    fullAccountJSON: JSON.stringify(account, null, 2)
  });
  
  // Transform the data field to camelCase for frontend use
  const transformedData = transformKeysToCamelCase<Record<string, any>>(account.data || {});
  
  // Create normalized account with consistent camelCase format
  // Keep data field for backend compatibility, but use camelCase throughout
  const normalized = {
    ...account,
    ...transformedData, // Spread transformed data to root level for component access
    data: transformedData, // Keep data field for API consistency
  };
  
  // Assert that backend is not returning recursive data structures
  if (account.data?.data) {
    console.error('[CRITICAL] Backend returned recursive data structure - this indicates the PUT request fix did not work', {
      accountData: account.data,
      nestedData: account.data.data,
      fullAccount: account
    });
    // For now, just log the error but don't throw to prevent breaking the app
    // TODO: Enable throwing after confirming fix works
    // throw new Error('[CRITICAL] Backend returned recursive data structure');
  }
  
  if (transformedData?.data) {
    console.warn('[NORMALIZE] NESTED data field detected in transformedData after camelCase transform', {
      transformedData,
      originalAccountData: account.data
    });
  }
  
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
  
  if (accountData.data?.data) {
    console.warn('[ROOTCAUSE-ISSUE4] [updateAccount] NESTED data field in accountData before backendPayload', {
      accountData,
    });
  }
  if (backendPayload.data?.data) {
    console.warn('[ROOTCAUSE-ISSUE4] [updateAccount] NESTED data field in backendPayload', {
      backendPayload,
    });
  }
  
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
 * Fixed merge function - eliminates recursive data structures and proper name handling
 * Handles case where currentAccount is undefined by throwing error to prevent data loss
 */
function mergeAccountUpdates(
  currentAccount: Record<string, any> | null | undefined, 
  updates: Record<string, any>
): AccountUpdate {
  console.log('[FIXED-MERGE] [mergeAccountUpdates] ENTRY', {
    currentAccount,
    updates,
    currentHasDataField: !!currentAccount?.['data'],
    updatesHasDataField: !!updates?.['data'],
    currentAccountKeys: currentAccount ? Object.keys(currentAccount) : [],
    updatesKeys: updates ? Object.keys(updates) : [],
  });
  
  // Handle null/undefined currentAccount case - but warn if it happens
  if (!currentAccount) {
    console.warn('[MERGE-WARNING] mergeAccountUpdates called with undefined currentAccount - this should not happen after parameter name fix', {
      updates,
      stack: new Error().stack
    });
  }
  
  const safeCurrentAccount = currentAccount || {};
  
  // Extract the actual data from currentAccount.data if it exists, otherwise use root level
  const currentData = safeCurrentAccount.data || safeCurrentAccount;
  
  // Merge updates with current data (avoiding recursive nesting)
  const mergedData = {
    ...currentData,
    ...updates
  };
  
  // FIXED: Proper name handling - preserve existing name if no targetAccountName in updates
  let accountName: string;
  
  if (updates.targetAccountName) {
    // New targetAccountName provided in updates
    accountName = updates.targetAccountName;
  } else if (updates.name) {
    // Direct name update provided
    accountName = updates.name;
  } else if (safeCurrentAccount.targetAccountName) {
    // Preserve existing targetAccountName from current account
    accountName = safeCurrentAccount.targetAccountName;
  } else if (safeCurrentAccount.name) {
    // Preserve existing name from current account
    accountName = safeCurrentAccount.name;
  } else if (currentData.targetAccountName) {
    // Preserve existing targetAccountName from data field
    accountName = currentData.targetAccountName;
  } else if (currentData.name) {
    // Preserve existing name from data field
    accountName = currentData.name;
  } else {
    // Only use default if truly no name exists anywhere
    accountName = 'Untitled Account';
    console.warn('[FIXED-MERGE] No name found anywhere, using default', {
      updates,
      safeCurrentAccount,
      currentData
    });
  }
  
  console.log('[FIXED-MERGE] Name resolution:', {
    finalAccountName: accountName,
    sources: {
      updatesTargetAccountName: updates.targetAccountName,
      updatesName: updates.name,
      currentTargetAccountName: safeCurrentAccount.targetAccountName,
      currentName: safeCurrentAccount.name,
      dataTargetAccountName: currentData.targetAccountName,
      dataName: currentData.name
    }
  });
  
  // FIXED: Explicitly build data payload with only fields that belong in the data JSON
  // This approach is explicit and avoids brittle delete operations
  
  // Top-level database fields (these go to separate columns)
  const topLevelFields = new Set([
    'id', 'name', 'companyId', 'createdAt', 'updatedAt'
  ]);
  
  // Build data payload by explicitly including only non-top-level fields
  const dataPayload: Record<string, any> = {};
  
  Object.entries(mergedData).forEach(([key, value]) => {
    if (!topLevelFields.has(key) && key !== 'data') {
      dataPayload[key] = value;
    }
  });
  
  // Assert that we don't have recursive data
  if (dataPayload.data) {
    throw new Error('[CRITICAL] Recursive data field detected in dataPayload - this should not happen');
  }
  
  console.log('[FIXED-MERGE] Built clean dataPayload:', {
    topLevelFieldsExcluded: Array.from(topLevelFields),
    dataPayloadKeys: Object.keys(dataPayload),
    hasRecursiveData: !!dataPayload.data
  });
  
  console.log('[FIXED-MERGE] AFTER MERGE', {
    dataPayload,
    dataPayloadKeys: Object.keys(dataPayload),
    accountName,
    hasRecursiveData: !!dataPayload.data,
    preservedFieldCount: Object.keys(dataPayload).length
  });
  
  return {
    name: accountName,
    data: dataPayload,
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
  
  // Assert the fix worked - catch issues early
  if (mergedData.data && mergedData.data.data) {
    throw new Error('[CRITICAL] Recursive data structure detected in mergeAccountUpdates - this should be impossible after the fix. Check mergeAccountUpdates implementation.');
  }
  
  if (!(typeof mergedData.data === 'object' && mergedData.data !== null && 'targetAccountName' in mergedData.data)) {
    throw new Error('[CRITICAL] mergedData missing targetAccountName in data field - field preservation failed');
  }
  
  console.log('[PRESERVE-FIELDS] Account update with field preservation (FIXED):', mergedData);
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
  
  // Assert the fix worked - catch recursive data early
  if (mergedData?.data?.data) {
    throw new Error('[CRITICAL] Recursive data structure detected in mergeAccountListFieldUpdates - this should be impossible after the fix');
  }
  
  console.log('[PRESERVE-LIST-FIELDS] Account list fields update with field preservation (FIXED):', mergedData);
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
 