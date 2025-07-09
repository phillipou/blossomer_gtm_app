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
  priority: "Low" | "Medium" | "High";
  detection_method: string;
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
  companyId: string; // Add companyId
  companyName: string;
  companyUrl: string;
  description: string;
  businessProfile?: BusinessProfile;
  capabilities?: string[];
  useCaseAnalysis?: UseCaseAnalysis;
  positioning?: Positioning;
  objections?: string[];
  icpHypothesis?: ICPHypothesis;
  metadata?: Record<string, unknown>;
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

// =================================================================
// Standard RESTful API Types
// =================================================================

export interface Account {
  id: string;
  companyId: string;
  name: string;
  accountData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountCreate {
  name: string;
  accountData: Record<string, any>;
}

export interface AccountUpdate {
  name?: string;
  accountData?: Record<string, any>;
}

export interface CompanyResponse {
  id: string;
  user_id: string;
  name: string;
  url: string;
  analysis_data: {
    description?: string;
    business_profile?: BusinessProfile;
    capabilities?: string[];
    use_case_analysis?: UseCaseAnalysis;
    positioning?: Positioning;
    objections?: string[];
    icp_hypothesis?: ICPHypothesis;
    metadata?: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface CompanyUpdate {
  companyId: string;
  name?: string;
  url?: string;
  analysis_data?: any;
}

export interface CompanyCreate {
  name: string;
  url: string;
  analysis_data: any;
}

export interface Persona {
  id: string;
  accountId: string;
  name: string;
  personaData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaCreate {
    name: string;
    personaData: Record<string, any>;
}

export interface PersonaUpdate {
    name?: string;
    personaData?: Record<string, any>;
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
  description?: string;
}

export interface TargetPersonaRequest {
  websiteUrl: string;
  personaProfileName?: string;
  hypothesis?: string;
  additionalContext?: string;
  companyContext?: Record<string, string | string[]>;
  targetAccountContext?: Record<string, any>;
}

export interface Demographics {
  jobTitles?: string[];
  departments?: string[];
  seniority?: string[];
  buyingRoles?: string[];
  jobDescriptionKeywords?: string[];
}

export interface UseCase {
  useCase: string;
  painPoints: string;
  capability: string;
  desiredOutcome: string;
}

export interface TargetPersonaResponse {
  id: string;
  createdAt: string;
  // New camelCase structure
  targetPersonaName: string;
  targetPersonaDescription: string;
  targetPersonaRationale?: string[];
  demographics?: Demographics;
  useCases?: UseCase[];
  buyingSignals?: APIBuyingSignal[];
  buyingSignalsRationale?: string[];
  objections?: string[];
  goals?: string[];
  purchaseJourney?: string[];
  metadata?: Record<string, any>;
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
  socialProof?: string;
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
  companySnapshot?: {
    companyName: string;
    companyUrl: string;
  };
  accountSnapshot?: {
    id: string;
    targetAccountName: string;
    targetAccountDescription: string;
  };
  personaSnapshot?: {
    id: string;
    targetPersonaName: string;
    targetPersonaDescription: string;
  };
}

// Email generation API types
export interface EmailPreferences {
  useCase: string;
  emphasis: string;
  openingLine: string;
  ctaSetting: string;
  template: string;
  socialProof?: string;
}

export interface EmailGenerationRequest {
  companyContext: CompanyOverviewResponse;
  targetAccount: TargetAccountResponse;
  targetPersona: TargetPersonaResponse;
  preferences: EmailPreferences;
}

export interface EmailSubjects {
  primary: string;
  alternatives: string[];
}

export interface EmailGenerationMetadata {
  generationId: string;
  confidence: string;
  personalizationLevel: string;
  processingTimeMs?: number;
}

export interface EmailGenerationResponse {
  subjects: EmailSubjects;
  emailBody: EmailSegment[];
  breakdown: EmailBreakdown;
  metadata: EmailGenerationMetadata;
}