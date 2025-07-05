export interface FirmographicValue {
  text: string;
  color: string;
}

export interface FirmographicRow {
  id: string;
  label: string;
  values: FirmographicValue[];
}

export interface BuyingSignal {
  id: string;
  label: string;
  description: string;
  enabled?: boolean;
}

export interface ApiError {
  error_code: string;
  message: string;
  details?: {
    reason?: string;
    suggestions?: string[];
  };
  retry_recommended?: boolean;
}

export interface AnalysisState {
  data: TargetCompanyResponse | null;
  loading: boolean;
  error: ApiError | null;
  hasAttempted: boolean;
  analysisId: string | null;
}

export interface TargetCompanyRequest {
  website_url: string;
  user_inputted_context?: Record<string, string | string[]>;
  company_context?: Record<string, string | string[]>;
}

export interface TargetCompanyResponse {
  target_company_name: string;
  target_company_description: string;
  firmographics: FirmographicRow[];
  buying_signals: BuyingSignal[];
  rationale: string;
  confidence_scores: Record<string, number>;
  metadata: Record<string, unknown>;
  // Added properties for useCompanyOverview
  company_name: string;
  company_url: string;
  company_overview?: string;
  product_description?: string;
  capabilities?: string[];
  business_model?: string[];
  differentiated_value?: string[];
  customer_benefits?: string[];
}

export interface TargetPersonaRequest {
  website_url: string;
  user_inputted_context?: Record<string, string | string[]>;
  company_context?: Record<string, string | string[]>;
  target_account_context?: TargetAccount | Record<string, string | string[] | FirmographicRow[] | BuyingSignal[] | TargetPersonaResponse[] | unknown>; // Added index signature
}

export interface TargetPersonaResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  overview?: string;
  painPoints?: string[];
  profile?: string[];
  likelyJobTitles?: string[];
  primaryResponsibilities?: string[];
  statusQuo?: string[];
  useCases?: string[];
  desiredOutcomes?: string[];
  keyConcerns?: string[];
  whyWeMatter?: string[];
  buyingSignals?: BuyingSignal[];
  // Added properties for API response consistency
  persona_name: string;
  persona_description: string;
  persona_buying_signals?: BuyingSignal[];
}

export interface TargetAccount {
  id: string;
  name: string;
  role: string;
  description: string;
  firmographics?: FirmographicRow[] | Record<string, string | string[] | Record<string, string>>;
  buying_signals?: BuyingSignal[];
  rationale?: string;
  confidence_scores?: Record<string, number>;
  metadata?: Record<string, unknown>;
  created_at?: string;
  personas?: TargetPersonaResponse[];
  [key: string]: string | string[] | FirmographicRow[] | BuyingSignal[] | TargetPersonaResponse[] | unknown; // Added index signature
}

export interface TargetAccountDetail {
  id: string;
  title: string;
  description: string;
  firmographics: FirmographicRow[];
  buyingSignals: BuyingSignal[];
  rationale: string;
}

export interface EmailSegment {
  text: string;
  type: string;
  color: string;
}

export interface EmailBreakdown {
  [key: string]: {
    label: string;
    description: string;
    color: string;
  };
}

export interface EmailConfig {
  selectedAccount: string;
  selectedPersona: string;
  selectedUseCase: string;
  emphasis: string;
  template: string;
  openingLine: string;
  ctaSetting: string;
  companyName?: string;
  accountName?: string;
  personaName?: string;
}

export interface GeneratedEmail {
  id: string;
  timestamp: string;
  subject: string;
  body: string;
  segments: EmailSegment[];
  breakdown: EmailBreakdown;
  config?: EmailConfig;
}