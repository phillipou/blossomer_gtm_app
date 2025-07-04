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
  data: any | null;
  loading: boolean;
  error: ApiError | null;
  hasAttempted: boolean;
  analysisId: string | null;
}

export interface TargetCompanyRequest {
  website_url: string;
  user_inputted_context?: Record<string, any>;
  company_context?: Record<string, any>;
}

export interface TargetCompanyResponse {
  target_company_name: string;
  target_company_description: string;
  firmographics: Record<string, any>;
  buying_signals: Record<string, any>;
  rationale: string;
  confidence_scores: Record<string, number>;
  metadata: Record<string, any>;
}

export interface TargetPersonaRequest {
  website_url: string;
  user_inputted_context?: Record<string, any>;
  company_context?: Record<string, any>;
  target_account_context?: Record<string, any>;
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
  buyingSignals?: { id: string; label: string; description: string; enabled: boolean }[];
}

export interface TargetAccount {
  id: string;
  name: string;
  role: string;
  description: string;
  firmographics?: Record<string, any>;
  buying_signals?: Record<string, any>;
  rationale?: string;
  confidence_scores?: Record<string, number>;
  metadata?: Record<string, any>;
  created_at?: string;
  personas?: TargetPersonaResponse[];
} 