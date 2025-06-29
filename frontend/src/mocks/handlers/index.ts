// Combine all MSW handlers for different API resources
import { authHandlers } from './auth';
import { companyHandlers } from './company';
import { customersHandlers } from './customers';
import { campaignsHandlers } from './campaigns';

export const handlers = [
  ...authHandlers,
  ...companyHandlers,
  ...customersHandlers,
  ...campaignsHandlers,
]; 