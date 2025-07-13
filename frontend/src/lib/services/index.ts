/**
 * Service Layer V2 - Single-Transform PUT Pipeline
 * 
 * Central export point for all entity services implementing:
 * - Single transformation points (UI ↔ API boundary only)
 * - Auto-generated type safety from OpenAPI spec
 * - Clean separation between raw API types and UI models
 * - Simplified field preservation without complex merge logic
 */

// Company services
export {
  getCompanies,
  getCompany, 
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyPreserveFields
} from './companyServiceV2.js';

// Account services
export {
  getAccounts,
  getAccount,
  createAccount,
  createAccountFromAI,
  updateAccount,
  deleteAccount,
  updateAccountPreserveFields,
  generateTargetAccount
} from './accountServiceV2.js';

// Persona services
export {
  getPersonas,
  getPersona,
  createPersona,
  createPersonaFromAI,
  updatePersona,
  deletePersona,
  updatePersonaPreserveFields,
  generateTargetPersona
} from './personaServiceV2.js';

// Re-export UI model types for convenience
export type {
  CompanyOverviewUI,
  CompanyCreateUI,
  AccountUI,
  AccountCreateUI,
  PersonaUI,
  PersonaCreateUI,
  FirmographicsUI,
  DemographicsUI,
  UseCaseUI
} from '../mappers/index.js';