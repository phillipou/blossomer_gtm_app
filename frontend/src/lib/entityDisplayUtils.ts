import type { 
  Persona, 
  TargetPersonaResponse, 
  Campaign, 
  GeneratedEmail,
  Account,
  TargetAccountResponse 
} from '../types/api';

// =================================================================
// Unified Display Utilities
// =================================================================
// These utilities provide a consistent way to access data from both
// AI response format and database entity format

// Persona Display Utilities
export function getPersonaName(persona: (Persona & { isDraft?: boolean }) | TargetPersonaResponse): string {
  if ('targetPersonaName' in persona) {
    // AI response format (TargetPersonaResponse)
    return persona.targetPersonaName;
  }
  // Database entity format (Persona)
  return persona.name;
}

export function getPersonaDescription(persona: (Persona & { isDraft?: boolean }) | TargetPersonaResponse): string {
  if ('targetPersonaDescription' in persona) {
    // AI response format (TargetPersonaResponse)
    return persona.targetPersonaDescription || '';
  }
  // Database entity format (Persona)
  return (persona.data?.targetPersonaDescription as string) || '';
}

// Campaign Display Utilities
export function getCampaignSubject(campaign: (Campaign & { isDraft?: boolean }) | GeneratedEmail | null): string {
  if (!campaign) {
    return '';
  }
  if ('subject' in campaign && typeof campaign.subject === 'string') {
    // AI response format (GeneratedEmail) or direct access
    return campaign.subject;
  }
  // Normalized campaign format - check for subjects.primary
  if ('subjects' in campaign && campaign.subjects && typeof campaign.subjects === 'object') {
    return (campaign.subjects as any).primary || '';
  }
  // Database entity format (Campaign)
  return (campaign.data?.subject as string) || campaign.name || '';
}

export function getCampaignBody(campaign: (Campaign & { isDraft?: boolean }) | GeneratedEmail | null): string {
  if (!campaign) {
    return '';
  }
  if ('body' in campaign && typeof campaign.body === 'string') {
    // AI response format (GeneratedEmail) or direct access
    return campaign.body;
  }
  // Normalized campaign format - check for emailBody array
  if ('emailBody' in campaign && Array.isArray(campaign.emailBody)) {
    return campaign.emailBody.map((segment: any) => segment.text || '').join('\n\n');
  }
  // Database entity format (Campaign)
  return (campaign.data?.body as string) || '';
}

export function getCampaignTimestamp(campaign: (Campaign & { isDraft?: boolean }) | GeneratedEmail | null): string {
  if (!campaign) {
    return '';
  }
  if ('timestamp' in campaign) {
    // AI response format (GeneratedEmail)
    return campaign.timestamp;
  }
  // Database entity format (Campaign)
  return campaign.createdAt || '';
}

// Get parent information for campaigns
export function getCampaignParents(campaign: (Campaign & { isDraft?: boolean }) | GeneratedEmail | null) {
  if (!campaign) {
    return [];
  }
  let parents = [];
  
  if ('companySnapshot' in campaign || 'config' in campaign) {
    // AI response format (GeneratedEmail)
    const email = campaign as GeneratedEmail;
    
    if (email.companySnapshot?.companyName) {
      parents.push({ name: email.companySnapshot.companyName, color: 'bg-blue-100 text-blue-800', label: "Company" });
    } else if (email.config?.companyName) {
      parents.push({ name: email.config.companyName, color: 'bg-blue-100 text-blue-800', label: "Company" });
    } else {
      parents.push({ name: "Demo Company", color: 'bg-blue-100 text-blue-800', label: "Company" });
    }
    
    if (email.accountSnapshot?.targetAccountName) {
      parents.push({ name: email.accountSnapshot.targetAccountName, color: 'bg-green-100 text-green-800', label: "Account" });
    } else if (email.config?.accountName) {
      parents.push({ name: email.config.accountName, color: 'bg-green-100 text-green-800', label: "Account" });
    } else {
      parents.push({ name: "Demo Account", color: 'bg-green-100 text-green-800', label: "Account" });
    }
    
    if (email.personaSnapshot?.targetPersonaName) {
      parents.push({ name: email.personaSnapshot.targetPersonaName, color: 'bg-purple-100 text-purple-800', label: "Persona" });
    } else if (email.config?.personaName) {
      parents.push({ name: email.config.personaName, color: 'bg-purple-100 text-purple-800', label: "Persona" });
    } else {
      parents.push({ name: "Demo Persona", color: 'bg-purple-100 text-purple-800', label: "Persona" });
    }
  } else {
    // Database entity format (Campaign) - extract from data field
    const campaignData = campaign.data;
    
    if (campaignData?.companySnapshot?.companyName) {
      parents.push({ name: campaignData.companySnapshot.companyName, color: 'bg-blue-100 text-blue-800', label: "Company" });
    } else {
      parents.push({ name: "Company", color: 'bg-blue-100 text-blue-800', label: "Company" });
    }
    
    if (campaignData?.accountSnapshot?.targetAccountName) {
      parents.push({ name: campaignData.accountSnapshot.targetAccountName, color: 'bg-green-100 text-green-800', label: "Account" });
    } else {
      parents.push({ name: "Account", color: 'bg-green-100 text-green-800', label: "Account" });
    }
    
    if (campaignData?.personaSnapshot?.targetPersonaName) {
      parents.push({ name: campaignData.personaSnapshot.targetPersonaName, color: 'bg-purple-100 text-purple-800', label: "Persona" });
    } else {
      parents.push({ name: "Persona", color: 'bg-purple-100 text-purple-800', label: "Persona" });
    }
  }
  
  return parents;
}

// Account Display Utilities
export function getAccountName(account: (Account & { isDraft?: boolean }) | TargetAccountResponse): string {
  if ('targetAccountName' in account) {
    // AI response format (TargetAccountResponse)
    return account.targetAccountName;
  }
  // Database entity format (Account)
  return account.name;
}

export function getAccountDescription(account: (Account & { isDraft?: boolean }) | TargetAccountResponse): string {
  if ('targetAccountDescription' in account) {
    // AI response format (TargetAccountResponse)
    return account.targetAccountDescription || '';
  }
  // Database entity format (Account)
  // Try targetAccountDescription first, then fallback to description
  return (
    (account.data?.targetAccountDescription as string) ||
    (account.data?.description as string) ||
    ''
  );
}