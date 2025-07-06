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

export interface APIBuyingSignal {
  title: string;
  description: string;
  type: string;
  priority: string;
  detectionMethod: string;
}

export interface ApiError {
  errorCode: string;
  message: string;
  details?: {
    reason?: string;
    suggestions?: string[];
  };
  retryRecommended?: boolean;
}

export interface AnalysisState {
  data: CompanyOverviewResponse | null;
  loading: boolean;
  error: ApiError | null;
  hasAttempted: boolean;
  analysisId: string | null;
}

export interface TargetCompanyRequest {
  websiteUrl: string;
  accountProfileName?: string;
  hypothesis?: string;
  additionalContext?: string;
  companyContext?: Record<string, string | string[]>;
}

// New API response structure for company overview (camelCase from API transformation)
export interface BusinessProfile {
  category: string;
  businessModel: string;
  existingCustomers: string;
}

export interface UseCaseAnalysis {
  processImpact: string;
  problemsAddressed: string;
  howTheyDoItToday: string;
}

export interface Positioning {
  keyMarketBelief: string;
  uniqueApproach: string;
  languageUsed: string;
}

export interface ICPHypothesis {
  targetAccountHypothesis: string;
  targetPersonaHypothesis: string;
}

export interface CompanyOverviewResponse {
  companyName: string;
  companyUrl: string;
  description: string;
  businessProfile: BusinessProfile;
  capabilities: string[];
  useCaseAnalysis: UseCaseAnalysis;
  positioning: Positioning;
  objections: string[];
  icpHypothesis: ICPHypothesis;
  metadata: Record<string, unknown>;
}

// New target account response structure matching the updated backend (ICP analysis format)
export interface CompanySize {
  employees?: string;
  departmentSize?: string;
  revenue?: string;
}

export interface Firmographics {
  industry: string[];
  employees?: string;
  departmentSize?: string;
  revenue?: string;
  geography?: string[];
  businessModel?: string[];
  fundingStage?: string[];
  companyType?: string[];
  keywords: string[];
}

export interface ConfidenceAssessment {
  overallConfidence: string;
  dataQuality: string;
  inferenceLevel: string;
  recommendedImprovements: string[];
}

export interface ICPMetadata {
  primaryContextSource: string;
  sourcesUsed: string[];
  contextSufficiency: string;
  confidenceAssessment: ConfidenceAssessment;
  processingNotes?: string;
}

export interface TargetAccountResponse {
  targetAccountName: string;
  targetAccountDescription: string;
  targetAccountRationale: string[];
  firmographics: Firmographics;
  buyingSignals: APIBuyingSignal[];
  buyingSignalsRationale: string[];
  metadata: ICPMetadata;
}

// Legacy interface for backward compatibility
export interface CompanySummary {
  description: string;
  category: string;
  businessModel: string;
  existingCustomers: string;
}

// Legacy interface for backward compatibility
export interface TargetCompanyResponse {
  targetCompanyName: string;
  targetCompanyDescription: string;
  firmographics: FirmographicRow[];
  buyingSignals: BuyingSignal[];
  rationale: string;
  confidenceScores: Record<string, number>;
  metadata: Record<string, unknown>;
  // Added properties for useCompanyOverview
  companyName: string;
  companyUrl: string;
  companyOverview?: string;
  productDescription?: string;
  capabilities?: string[];
  businessModel?: string[];
  differentiatedValue?: string[];
  customerBenefits?: string[];
}

export interface TargetPersonaRequest {
  websiteUrl: string;
  userInputtedContext?: Record<string, string | string[]>;
  companyContext?: Record<string, string | string[]>;
  targetAccountContext?: TargetAccount | Record<string, string | string[] | FirmographicRow[] | BuyingSignal[] | TargetPersonaResponse[] | unknown>; // Added index signature
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
  personaName: string;
  personaDescription: string;
  personaBuyingSignals?: BuyingSignal[];
}

export interface TargetAccount {
  id: string;
  name: string;
  role: string;
  description: string;
  firmographics?: FirmographicRow[] | Record<string, string | string[] | Record<string, string>> | Firmographics | any;
  buyingSignals?: BuyingSignal[];
  rationale?: string;
  confidenceScores?: Record<string, number>;
  metadata?: Record<string, unknown> | ICPMetadata;
  createdAt?: string;
  personas?: TargetPersonaResponse[];
  [key: string]: string | string[] | FirmographicRow[] | BuyingSignal[] | TargetPersonaResponse[] | unknown; // Added index signature
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