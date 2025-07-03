import { apiFetch } from './apiClient';
import type {
  TargetCompanyRequest,
  TargetCompanyResponse,
  CustomerProfile,
} from '../types/api';

// API service functions
export async function generateTargetCompany(
  website_url: string,
  user_description: string
): Promise<TargetCompanyResponse> {
  const request: TargetCompanyRequest = {
    website_url,
    user_inputted_context: user_description,
  };

  // Use demo endpoint for now (no API key required)
  return apiFetch<TargetCompanyResponse>('/demo/customers/target_accounts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Local storage service functions for customer profiles
export function getStoredCustomerProfiles(): CustomerProfile[] {
  const stored = localStorage.getItem('customer_profiles');
  return stored ? JSON.parse(stored) : [];
}

export function saveCustomerProfile(profile: CustomerProfile): void {
  const profiles = getStoredCustomerProfiles();
  const existingIndex = profiles.findIndex(p => p.id === profile.id);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  localStorage.setItem('customer_profiles', JSON.stringify(profiles));
}

export function deleteCustomerProfile(id: string): void {
  const profiles = getStoredCustomerProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  localStorage.setItem('customer_profiles', JSON.stringify(filtered));
}

export function generateCustomerProfileId(): string {
  return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 