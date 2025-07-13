/**
 * Persona Data Mapper
 * 
 * Transforms between raw API types (snake_case) and UI models (camelCase).
 * Handles both CRUD Persona entities and AI-generated TargetPersona responses.
 */

import type { components } from '../../types/generated-api.js';

// Raw API types from OpenAPI generation
type PersonaResponseRaw = components['schemas']['PersonaResponse'];
type PersonaCreateRaw = components['schemas']['PersonaCreate'];
type TargetPersonaResponseRaw = components['schemas']['TargetPersonaResponse'];

// UI Model types (camelCase for frontend consumption)
export interface PersonaUI {
  id: string;
  accountId: string;
  name: string;
  targetPersonaName?: string;
  targetPersonaDescription?: string;
  targetPersonaRationale?: string[];
  demographics?: DemographicsUI;
  useCases?: UseCaseUI[];
  buyingSignals?: BuyingSignalUI[];
  buyingSignalsRationale?: string[];
  objections?: string[];
  goals?: string[];
  purchaseJourney?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DemographicsUI {
  jobTitles?: string[];
  departments?: string[];
  seniority?: string[];
  buyingRoles?: string[];
  jobDescriptionKeywords?: string[];
}

export interface UseCaseUI {
  useCase: string;
  painPoints: string;
  capability: string;
  desiredOutcome: string;
}

export interface BuyingSignalUI {
  title: string;
  description: string;
  type: string;
  priority: "Low" | "Medium" | "High";
  detectionMethod: string;
}

export interface PersonaCreateUI {
  name: string;
  personaData?: Record<string, unknown>;
}

/**
 * Transform raw API Persona response to UI model
 */
export function mapPersonaResponseToUI(raw: PersonaResponseRaw): PersonaUI {
  const personaData = raw.persona_data || {};
  
  return {
    id: raw.id,
    accountId: raw.account_id,
    name: raw.name,
    targetPersonaName: personaData.target_persona_name as string,
    targetPersonaDescription: personaData.target_persona_description as string,
    targetPersonaRationale: personaData.target_persona_rationale as string[],
    demographics: transformDemographics(personaData.demographics as any),
    useCases: transformUseCases(personaData.use_cases as any[]),
    buyingSignals: transformBuyingSignals(personaData.buying_signals as any[]),
    buyingSignalsRationale: personaData.buying_signals_rationale as string[],
    objections: personaData.objections as string[],
    goals: personaData.goals as string[],
    purchaseJourney: personaData.purchase_journey as string[],
    metadata: personaData.metadata as Record<string, unknown>,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at
  };
}

/**
 * Transform AI-generated TargetPersona response to UI model
 * Used when converting AI analysis results to Persona format
 */
export function mapTargetPersonaResponseToUI(raw: TargetPersonaResponseRaw, personaId?: string): PersonaUI {
  return {
    id: personaId || `temp_${Date.now()}`,
    accountId: '', // Will be set by service layer
    name: raw.target_persona_name,
    targetPersonaName: raw.target_persona_name,
    targetPersonaDescription: raw.target_persona_description,
    targetPersonaRationale: raw.target_persona_rationale,
    demographics: transformDemographics(raw.demographics as any),
    useCases: transformUseCases(raw.use_cases as any[]),
    buyingSignals: transformBuyingSignals(raw.buying_signals as any[]),
    buyingSignalsRationale: raw.buying_signals_rationale,
    objections: raw.objections,
    goals: raw.goals,
    purchaseJourney: raw.purchase_journey,
    metadata: raw.metadata as Record<string, unknown>,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Transform UI model to API create request
 */
export function mapPersonaCreateToAPI(ui: PersonaCreateUI, personaData?: Partial<PersonaUI>): PersonaCreateRaw {
  // Build persona_data from provided persona data
  const apiPersonaData: Record<string, unknown> = {
    ...(ui.personaData || {}),
    ...(personaData?.targetPersonaName && { target_persona_name: personaData.targetPersonaName }),
    ...(personaData?.targetPersonaDescription && { target_persona_description: personaData.targetPersonaDescription }),
    ...(personaData?.targetPersonaRationale && { target_persona_rationale: personaData.targetPersonaRationale }),
    ...(personaData?.demographics && { demographics: transformDemographicsToAPI(personaData.demographics) }),
    ...(personaData?.useCases && { use_cases: transformUseCasesToAPI(personaData.useCases) }),
    ...(personaData?.buyingSignals && { buying_signals: transformBuyingSignalsToAPI(personaData.buyingSignals) }),
    ...(personaData?.buyingSignalsRationale && { buying_signals_rationale: personaData.buyingSignalsRationale }),
    ...(personaData?.objections && { objections: personaData.objections }),
    ...(personaData?.goals && { goals: personaData.goals }),
    ...(personaData?.purchaseJourney && { purchase_journey: personaData.purchaseJourney }),
    ...(personaData?.metadata && { metadata: personaData.metadata })
  };

  return {
    name: ui.name,
    persona_data: apiPersonaData
  };
}

/**
 * Transform UI update data to API request format
 */
export function mapPersonaUpdateToAPI(ui: Partial<PersonaUI>): { name?: string; persona_data?: Record<string, unknown> } {
  const update: { name?: string; persona_data?: Record<string, unknown> } = {};
  
  // Top-level name field
  if (ui.name !== undefined) {
    update.name = ui.name;
  }
  
  // Persona data fields
  if (shouldUpdatePersonaData(ui)) {
    update.persona_data = {
      ...(ui.targetPersonaName !== undefined && { target_persona_name: ui.targetPersonaName }),
      ...(ui.targetPersonaDescription !== undefined && { target_persona_description: ui.targetPersonaDescription }),
      ...(ui.targetPersonaRationale !== undefined && { target_persona_rationale: ui.targetPersonaRationale }),
      ...(ui.demographics !== undefined && { demographics: transformDemographicsToAPI(ui.demographics) }),
      ...(ui.useCases !== undefined && { use_cases: transformUseCasesToAPI(ui.useCases) }),
      ...(ui.buyingSignals !== undefined && { buying_signals: transformBuyingSignalsToAPI(ui.buyingSignals) }),
      ...(ui.buyingSignalsRationale !== undefined && { buying_signals_rationale: ui.buyingSignalsRationale }),
      ...(ui.objections !== undefined && { objections: ui.objections }),
      ...(ui.goals !== undefined && { goals: ui.goals }),
      ...(ui.purchaseJourney !== undefined && { purchase_journey: ui.purchaseJourney }),
      ...(ui.metadata !== undefined && { metadata: ui.metadata })
    };
  }
  
  return update;
}

/**
 * Transform demographics from API format to UI format
 */
function transformDemographics(raw: any): DemographicsUI | undefined {
  if (!raw) return undefined;
  
  return {
    jobTitles: raw.job_titles,
    departments: raw.departments,
    seniority: raw.seniority,
    buyingRoles: raw.buying_roles,
    jobDescriptionKeywords: raw.job_description_keywords
  };
}

/**
 * Transform demographics from UI format to API format
 */
function transformDemographicsToAPI(ui: DemographicsUI): any {
  return {
    job_titles: ui.jobTitles,
    departments: ui.departments,
    seniority: ui.seniority,
    buying_roles: ui.buyingRoles,
    job_description_keywords: ui.jobDescriptionKeywords
  };
}

/**
 * Transform use cases from API format to UI format
 */
function transformUseCases(raw: any[]): UseCaseUI[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  
  return raw.map(useCase => ({
    useCase: useCase.use_case,
    painPoints: useCase.pain_points,
    capability: useCase.capability,
    desiredOutcome: useCase.desired_outcome
  }));
}

/**
 * Transform use cases from UI format to API format
 */
function transformUseCasesToAPI(ui: UseCaseUI[]): any[] {
  return ui.map(useCase => ({
    use_case: useCase.useCase,
    pain_points: useCase.painPoints,
    capability: useCase.capability,
    desired_outcome: useCase.desiredOutcome
  }));
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
 * Helper to determine if persona_data should be updated
 */
function shouldUpdatePersonaData(ui: Partial<PersonaUI>): boolean {
  const personaDataFields = [
    'targetPersonaName',
    'targetPersonaDescription', 
    'targetPersonaRationale',
    'demographics',
    'useCases',
    'buyingSignals',
    'buyingSignalsRationale',
    'objections',
    'goals',
    'purchaseJourney',
    'metadata'
  ];
  
  return personaDataFields.some(field => ui[field as keyof PersonaUI] !== undefined);
}