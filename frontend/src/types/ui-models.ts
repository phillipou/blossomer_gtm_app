/**
 * UI Model Types
 * 
 * Clean, camelCase interfaces for frontend consumption.
 * These replace hand-rolled interfaces and are the source of truth for UI state.
 * Auto-generated API types are transformed to these models via mappers.
 */

// Re-export UI models from mappers for centralized access
export type {
  CompanyOverviewUI,
  CompanyCreateUI,
  AccountUI,
  FirmographicsUI,
  AccountBuyingSignalUI,
  AccountCreateUI,
  PersonaUI,
  DemographicsUI,
  UseCaseUI,
  PersonaBuyingSignalUI,
  PersonaCreateUI
} from '../lib/mappers/index.js';

// Legacy compatibility - these will be migrated to UI models above
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
  data: any | null; // TODO: Replace with CompanyOverviewUI after migration
  loading: boolean;
  error: ApiError | null;
  hasAttempted: boolean;
  analysisId: string | null;
}

// AI Request interfaces (these stay as-is since they're input models)
export interface TargetCompanyRequest {
  websiteUrl: string;
  accountProfileName?: string;
  hypothesis?: string;
  additionalContext?: string;
  companyContext?: Record<string, string | string[]>;
}

export interface TargetPersonaRequest {
  websiteUrl: string;
  personaProfileName?: string;
  hypothesis?: string;
  additionalContext?: string;
  companyContext?: Record<string, string | string[]>;
  targetAccountContext?: Record<string, any>;
}

// Email generation interfaces (these stay as-is)
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

export interface EmailPreferences {
  useCase: string;
  emphasis: string;
  openingLine: string;
  ctaSetting: string;
  template: string;
  socialProof?: string;
}

export interface EmailGenerationRequest {
  companyContext: any; // TODO: Replace with CompanyOverviewUI after migration
  targetAccount: any; // TODO: Replace with AccountUI after migration
  targetPersona: any; // TODO: Replace with PersonaUI after migration  
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

// Import will be enabled after migration is complete
// import type { CompanyOverviewUI } from '../lib/mappers/index.js';