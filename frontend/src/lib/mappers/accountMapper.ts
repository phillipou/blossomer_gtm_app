/**
 * Account Data Mapper
 * 
 * Transforms between raw API types (snake_case) and UI models (camelCase).
 * Handles both CRUD Account entities and AI-generated TargetAccount responses.
 */

import type { components } from '../../types/generated-api.js';

// Raw API types from OpenAPI generation
type AccountResponseRaw = components['schemas']['AccountResponse'];
type AccountCreateRaw = components['schemas']['AccountCreate'];
type TargetAccountResponseRaw = components['schemas']['TargetAccountResponse'];

// UI Model types (camelCase for frontend consumption)
export interface AccountUI {
  id: string;
  companyId: string;
  name: string;
  targetAccountName?: string;
  targetAccountDescription?: string;
  targetAccountRationale?: string[];
  firmographics?: FirmographicsUI;
  buyingSignals?: BuyingSignalUI[];
  buyingSignalsRationale?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FirmographicsUI {
  industry?: string[];
  employees?: string;
  departmentSize?: string;
  revenue?: string;
  geography?: string[];
  businessModel?: string[];
  fundingStage?: string[];
  companyType?: string[];
  keywords?: string[];
}

export interface BuyingSignalUI {
  title: string;
  description: string;
  type: string;
  priority: "Low" | "Medium" | "High";
  detectionMethod: string;
}

export interface AccountCreateUI {
  name: string;
  accountData?: Record<string, unknown>;
}

/**
 * Transform raw API Account response to UI model
 */
export function mapAccountResponseToUI(raw: AccountResponseRaw): AccountUI {
  const accountData = raw.account_data || {};
  
  return {
    id: raw.id,
    companyId: raw.company_id,
    name: raw.name,
    targetAccountName: accountData.target_account_name as string,
    targetAccountDescription: accountData.target_account_description as string,
    targetAccountRationale: accountData.target_account_rationale as string[],
    firmographics: transformFirmographics(accountData.firmographics as any),
    buyingSignals: transformBuyingSignals(accountData.buying_signals as any[]),
    buyingSignalsRationale: accountData.buying_signals_rationale as string[],
    metadata: accountData.metadata as Record<string, unknown>,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at
  };
}

/**
 * Transform AI-generated TargetAccount response to UI model
 * Used when converting AI analysis results to Account format
 */
export function mapTargetAccountResponseToUI(raw: TargetAccountResponseRaw, accountId?: string): AccountUI {
  return {
    id: accountId || `temp_${Date.now()}`,
    companyId: '', // Will be set by service layer
    name: raw.target_account_name,
    targetAccountName: raw.target_account_name,
    targetAccountDescription: raw.target_account_description,
    targetAccountRationale: raw.target_account_rationale,
    firmographics: transformFirmographics(raw.firmographics as any),
    buyingSignals: transformBuyingSignals(raw.buying_signals as any[]),
    buyingSignalsRationale: raw.buying_signals_rationale,
    metadata: raw.metadata as Record<string, unknown>,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Transform UI model to API create request
 */
export function mapAccountCreateToAPI(ui: AccountCreateUI, accountData?: Partial<AccountUI>): AccountCreateRaw {
  // Build account_data from provided account data
  const apiAccountData: Record<string, unknown> = {
    ...(ui.accountData || {}),
    ...(accountData?.targetAccountName && { target_account_name: accountData.targetAccountName }),
    ...(accountData?.targetAccountDescription && { target_account_description: accountData.targetAccountDescription }),
    ...(accountData?.targetAccountRationale && { target_account_rationale: accountData.targetAccountRationale }),
    ...(accountData?.firmographics && { firmographics: transformFirmographicsToAPI(accountData.firmographics) }),
    ...(accountData?.buyingSignals && { buying_signals: transformBuyingSignalsToAPI(accountData.buyingSignals) }),
    ...(accountData?.buyingSignalsRationale && { buying_signals_rationale: accountData.buyingSignalsRationale }),
    ...(accountData?.metadata && { metadata: accountData.metadata })
  };

  return {
    name: ui.name,
    account_data: apiAccountData
  };
}

/**
 * Transform UI update data to API request format
 */
export function mapAccountUpdateToAPI(ui: Partial<AccountUI>): { name?: string; account_data?: Record<string, unknown> } {
  const update: { name?: string; account_data?: Record<string, unknown> } = {};
  
  // Top-level name field
  if (ui.name !== undefined) {
    update.name = ui.name;
  }
  
  // Account data fields
  if (shouldUpdateAccountData(ui)) {
    update.account_data = {
      ...(ui.targetAccountName !== undefined && { target_account_name: ui.targetAccountName }),
      ...(ui.targetAccountDescription !== undefined && { target_account_description: ui.targetAccountDescription }),
      ...(ui.targetAccountRationale !== undefined && { target_account_rationale: ui.targetAccountRationale }),
      ...(ui.firmographics !== undefined && { firmographics: transformFirmographicsToAPI(ui.firmographics) }),
      ...(ui.buyingSignals !== undefined && { buying_signals: transformBuyingSignalsToAPI(ui.buyingSignals) }),
      ...(ui.buyingSignalsRationale !== undefined && { buying_signals_rationale: ui.buyingSignalsRationale }),
      ...(ui.metadata !== undefined && { metadata: ui.metadata })
    };
  }
  
  return update;
}

/**
 * Transform firmographics from API format to UI format
 */
function transformFirmographics(raw: any): FirmographicsUI | undefined {
  if (!raw) return undefined;
  
  return {
    industry: raw.industry,
    employees: raw.employees,
    departmentSize: raw.department_size,
    revenue: raw.revenue,
    geography: raw.geography,
    businessModel: raw.business_model,
    fundingStage: raw.funding_stage,
    companyType: raw.company_type,
    keywords: raw.keywords
  };
}

/**
 * Transform firmographics from UI format to API format
 */
function transformFirmographicsToAPI(ui: FirmographicsUI): any {
  return {
    industry: ui.industry,
    employees: ui.employees,
    department_size: ui.departmentSize,
    revenue: ui.revenue,
    geography: ui.geography,
    business_model: ui.businessModel,
    funding_stage: ui.fundingStage,
    company_type: ui.companyType,
    keywords: ui.keywords
  };
}

/**
 * Transform buying signals from API format to UI format
 */
function transformBuyingSignals(raw: any[]): BuyingSignalUI[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  
  return raw.map(signal => ({
    title: signal.title,
    description: signal.description,
    type: signal.type,
    priority: signal.priority,
    detectionMethod: signal.detection_method
  }));
}

/**
 * Transform buying signals from UI format to API format
 */
function transformBuyingSignalsToAPI(ui: BuyingSignalUI[]): any[] {
  return ui.map(signal => ({
    title: signal.title,
    description: signal.description,
    type: signal.type,
    priority: signal.priority,
    detection_method: signal.detectionMethod
  }));
}

/**
 * Helper to determine if account_data should be updated
 */
function shouldUpdateAccountData(ui: Partial<AccountUI>): boolean {
  const accountDataFields = [
    'targetAccountName',
    'targetAccountDescription', 
    'targetAccountRationale',
    'firmographics',
    'buyingSignals',
    'buyingSignalsRationale',
    'metadata'
  ];
  
  return accountDataFields.some(field => ui[field as keyof AccountUI] !== undefined);
}