/**
 * Account Service V2 - Single-Transform PUT Pipeline
 * 
 * Implements expert memo recommendations:
 * - Single transformation point: UI camelCase → API snake_case only at boundary
 * - No multi-step transformations or merge complexity
 * - Clean separation between raw API types and UI models
 * - Uses auto-generated types and mappers for consistency
 * - Eliminates recursive data field issues from V1
 */

import { apiFetch } from '../apiClient.js';
import { 
  mapAccountResponseToUI,
  mapTargetAccountResponseToUI, 
  mapAccountCreateToAPI, 
  mapAccountUpdateToAPI,
  type AccountUI,
  type AccountCreateUI,
  type components 
} from '../mappers/index.js';

// Raw API types from auto-generated OpenAPI spec
type AccountResponseRaw = components['schemas']['AccountResponse'];
type AccountCreateRaw = components['schemas']['AccountCreate'];
type TargetAccountResponseRaw = components['schemas']['TargetAccountResponse'];

/**
 * Get all accounts for a company
 */
export async function getAccounts(companyId: string, token?: string | null): Promise<AccountUI[]> {
  const rawAccounts = await apiFetch<AccountResponseRaw[]>(`/accounts?company_id=${companyId}`, { method: 'GET' }, token);
  
  // Single transformation point: Raw API → UI Model
  return rawAccounts.map(mapAccountResponseToUI);
}

/**
 * Get specific account by ID
 */
export async function getAccount(accountId: string, token?: string | null): Promise<AccountUI> {
  const rawAccount = await apiFetch<AccountResponseRaw>(`/accounts/${accountId}`, { method: 'GET' }, token);
  
  // Single transformation point: Raw API → UI Model
  return mapAccountResponseToUI(rawAccount);
}

/**
 * Create new account from UI data
 * Single transformation: UI Model → API Request → UI Model
 */
export async function createAccount(accountData: AccountCreateUI, token?: string | null): Promise<AccountUI> {
  console.log('[ACCOUNT-CREATE] UI Model Input:', accountData);
  
  // Single transformation point: UI → API
  const apiPayload = mapAccountCreateToAPI(accountData);
  console.log('[ACCOUNT-CREATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<AccountResponseRaw>('/accounts', {
    method: 'POST',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[ACCOUNT-CREATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const uiModel = mapAccountResponseToUI(rawResponse);
  console.log('[ACCOUNT-CREATE] Final UI Model:', uiModel);
  
  return uiModel;
}

/**
 * Create account from AI-generated TargetAccount response
 * Single transformation: AI Response → UI Model → API Request → UI Model
 */
export async function createAccountFromAI(
  aiResponse: TargetAccountResponseRaw, 
  companyId: string,
  token?: string | null
): Promise<AccountUI> {
  console.log('[ACCOUNT-AI-CREATE] AI Response Input:', aiResponse);
  
  // Transform AI response to UI model first
  const uiModel = mapTargetAccountResponseToUI(aiResponse);
  uiModel.companyId = companyId; // Set company association
  
  console.log('[ACCOUNT-AI-CREATE] UI Model from AI:', uiModel);
  
  // Create account data for API
  const accountCreateData: AccountCreateUI = {
    name: uiModel.name,
    accountData: undefined // Will be built by mapper
  };
  
  // Single transformation point: UI → API (includes all AI data)
  const apiPayload = mapAccountCreateToAPI(accountCreateData, uiModel);
  console.log('[ACCOUNT-AI-CREATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<AccountResponseRaw>('/accounts', {
    method: 'POST',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[ACCOUNT-AI-CREATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const finalUiModel = mapAccountResponseToUI(rawResponse);
  console.log('[ACCOUNT-AI-CREATE] Final UI Model:', finalUiModel);
  
  return finalUiModel;
}

/**
 * Update account with field preservation
 * Single transformation: Merged UI Model → API Request → UI Model
 * No complex merge logic - just simple spread
 */
export async function updateAccount(
  accountId: string, 
  updates: Partial<AccountUI>,
  currentAccount?: AccountUI,
  token?: string | null
): Promise<AccountUI> {
  console.log('[ACCOUNT-UPDATE] Starting update:', { accountId, updates, currentAccount });
  
  // Simple merge at UI level - no complex field separation needed
  const mergedAccount = currentAccount ? {
    ...currentAccount,
    ...updates
  } : updates;
  
  console.log('[ACCOUNT-UPDATE] Merged UI Model:', mergedAccount);
  
  // Single transformation point: UI → API
  const apiPayload = mapAccountUpdateToAPI(mergedAccount);
  console.log('[ACCOUNT-UPDATE] API Payload:', apiPayload);
  
  const rawResponse = await apiFetch<AccountResponseRaw>(`/accounts/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(apiPayload)
  }, token);
  
  console.log('[ACCOUNT-UPDATE] Raw API Response:', rawResponse);
  
  // Single transformation point: API → UI
  const updatedUiModel = mapAccountResponseToUI(rawResponse);
  console.log('[ACCOUNT-UPDATE] Final UI Model:', updatedUiModel);
  
  return updatedUiModel;
}

/**
 * Delete account
 */
export async function deleteAccount(accountId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/accounts/${accountId}`, { method: 'DELETE' }, token);
}

/**
 * Simple field preservation for React Query integration
 * No complex merge logic - just spread operator
 */
export async function updateAccountPreserveFields(
  accountId: string,
  updates: Partial<AccountUI>,
  currentAccount: AccountUI,
  token?: string | null
): Promise<AccountUI> {
  return updateAccount(accountId, updates, currentAccount, token);
}

/**
 * Generate target account using AI
 * Returns raw AI response for further processing
 */
export async function generateTargetAccount(
  websiteUrl: string,
  accountProfileName?: string,
  hypothesis?: string,
  additionalContext?: string,
  companyContext?: Record<string, any>,
  token?: string | null
): Promise<TargetAccountResponseRaw> {
  const requestPayload = {
    website_url: websiteUrl,
    account_profile_name: accountProfileName,
    hypothesis,
    additional_context: additionalContext,
    company_context: companyContext
  };
  
  console.log('[ACCOUNT-AI-GENERATE] AI Request:', requestPayload);
  
  const aiResponse = await apiFetch<TargetAccountResponseRaw>('/accounts/generate-ai', {
    method: 'POST', 
    body: JSON.stringify(requestPayload)
  }, token);
  
  console.log('[ACCOUNT-AI-GENERATE] AI Response:', aiResponse);
  
  return aiResponse;
}