/**
 * Entity Data Mappers
 * 
 * Central export point for all entity mappers.
 * These mappers provide clean separation between raw API types (snake_case)
 * and UI models (camelCase), preventing shape drift between backend and frontend.
 */

// Company mappers
export {
  mapCompanyResponseToUI,
  mapCompanyCreateToAPI,
  mapCompanyUpdateToAPI,
  type CompanyOverviewUI,
  type CompanyCreateUI
} from './companyMapper.js';

// Account mappers  
export {
  mapAccountResponseToUI,
  mapTargetAccountResponseToUI,
  mapAccountCreateToAPI,
  mapAccountUpdateToAPI,
  type AccountUI,
  type FirmographicsUI,
  type BuyingSignalUI as AccountBuyingSignalUI,
  type AccountCreateUI
} from './accountMapper.js';

// Persona mappers
export {
  mapPersonaResponseToUI,
  mapTargetPersonaResponseToUI,
  mapPersonaCreateToAPI,
  mapPersonaUpdateToAPI,
  type PersonaUI,
  type DemographicsUI,
  type UseCaseUI,
  type BuyingSignalUI as PersonaBuyingSignalUI,
  type PersonaCreateUI
} from './personaMapper.js';

// Re-export generated API types for service layer use
export type { components, paths } from '../../types/generated-api.js';