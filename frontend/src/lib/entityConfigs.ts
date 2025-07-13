import { Building2, Users, Target, Mail } from 'lucide-react';
import type { EntityPageConfig } from './hooks/useEntityPage';
import type { 
  CompanyOverviewResponse, 
  TargetAccountResponse, 
  TargetPersonaResponse, 
  EmailGenerationResponse 
} from '../types/api';

// Company Configuration
export const companyConfig: EntityPageConfig<CompanyOverviewResponse> = {
  entityType: 'company',
  cardConfigs: [
    {
      key: 'businessProfileInsights',
      label: 'Business Profile',
      bulleted: true,
      getItems: (company) => company.businessProfileInsights || [],
      subtitle: 'Core business information and customer profile.',
    },
    {
      key: 'capabilities',
      label: 'Key Features & Capabilities',
      bulleted: true,
      getItems: (company) => company.capabilities || [],
      subtitle: 'Core features and strengths of the company/product.',
    },
    {
      key: 'positioningInsights',
      label: 'Positioning',
      bulleted: true,
      getItems: (company) => company.positioningInsights || [],
      subtitle: 'How they position themselves in the market.',
    },
    {
      key: 'useCaseAnalysisInsights',
      label: 'Process & Impact Analysis',
      bulleted: true,
      getItems: (company) => company.useCaseAnalysisInsights || [],
      subtitle: 'Analysis of processes and problems this solution addresses.',
    },
    {
      key: 'targetCustomerInsights',
      label: 'Target Customer Insights',
      bulleted: true,
      getItems: (company) => company.targetCustomerInsights || [],
      subtitle: 'Ideal customer profile and decision-maker insights.',
    },
    {
      key: 'objections',
      label: 'Potential Concerns',
      bulleted: true,
      getItems: (company) => company.objections || [],
      subtitle: 'Common concerns prospects might have about this solution.',
    },
  ],
  preservedComplexTypes: ['firmographics', 'demographics', 'buyingSignals'],
  generateEndpoint: '/api/companies/generate-ai',
  childEntities: ['account'],
  routePrefix: {
    authenticated: '/app/company',
    unauthenticated: '/playground/company',
  },
  emptyStateConfig: {
    pageTitle: 'Company Analysis',
    pageSubtitle: 'AI-powered company profiling and business insights',
    overviewTitle: 'Generate Your First Company',
    overviewSubtitle: 'Create your first company profile with our AI-powered wizard. Enter your website URL and let us help you generate detailed business insights.',
    buttonText: 'Generate Your First Company',
    icon: Building2,
  },
  progressStages: [
    { label: 'Loading website...', percent: 20 },
    { label: 'Analyzing company...', percent: 45 },
    { label: 'Researching market...', percent: 70 },
    { label: 'Finalizing...', percent: 90 },
  ],
};

// Account Configuration
export const accountConfig: EntityPageConfig<TargetAccountResponse> = {
  entityType: 'account',
  cardConfigs: [
    {
      key: 'targetAccountRationale',
      label: 'Target Account Rationale',
      bulleted: true,
      getItems: (account) => account.targetAccountRationale || [],
      subtitle: 'Logic behind these targeting filters and firmographic choices.',
    },
    {
      key: 'buyingSignalsRationale',
      label: 'Buying Signals Strategy',
      bulleted: true,
      getItems: (account) => account.buyingSignalsRationale || [],
      subtitle: 'Why these signals indicate purchase readiness and buying intent.',
    },
  ],
  preservedComplexTypes: ['firmographics', 'buyingSignals'],
  generateEndpoint: '/api/accounts/generate-ai',
  childEntities: ['persona'],
  routePrefix: {
    authenticated: '/app/accounts',
    unauthenticated: '/playground/accounts',
  },
  emptyStateConfig: {
    pageTitle: 'Target Accounts',
    pageSubtitle: 'Analyze and prioritize your ideal customer segments',
    overviewTitle: 'Generate Your First Target Account',
    overviewSubtitle: 'Create your first target account profile with detailed analysis of your ideal customer segments.',
    buttonText: 'Generate Your First Account',
    icon: Users,
  },
  progressStages: [
    { label: 'Analyzing market...', percent: 25 },
    { label: 'Researching accounts...', percent: 50 },
    { label: 'Generating insights...', percent: 75 },
    { label: 'Finalizing...', percent: 90 },
  ],
};

// Persona Configuration
export const personaConfig: EntityPageConfig<TargetPersonaResponse> = {
  entityType: 'persona',
  cardConfigs: [
    {
      key: 'targetPersonaRationale',
      label: 'Persona Insights',
      bulleted: true,
      getItems: (persona) => persona.targetPersonaRationale || [],
      subtitle: 'Core characteristics and behavioral patterns.',
    },
    {
      key: 'objections',
      label: 'Pain Points',
      bulleted: true,
      getItems: (persona) => persona.objections || [],
      subtitle: 'Key challenges and frustrations this persona faces.',
    },
    {
      key: 'goals',
      label: 'Motivations',
      bulleted: true,
      getItems: (persona) => persona.goals || [],
      subtitle: 'What drives and motivates this persona.',
    },
    {
      key: 'buyingSignalsRationale',
      label: 'Communication Style',
      bulleted: true,
      getItems: (persona) => persona.buyingSignalsRationale || [],
      subtitle: 'How to effectively communicate with this persona.',
    },
    {
      key: 'purchaseJourney',
      label: 'Decision Factors',
      bulleted: true,
      getItems: (persona) => persona.purchaseJourney || [],
      subtitle: 'Key factors that influence their decision-making.',
    },
  ],
  preservedComplexTypes: ['demographics', 'buyingSignals'],
  generateEndpoint: '/api/personas/generate-ai',
  childEntities: ['campaign'],
  routePrefix: {
    authenticated: '/app/personas',
    unauthenticated: '/playground/personas',
  },
  emptyStateConfig: {
    pageTitle: 'Buyer Personas',
    pageSubtitle: 'Understand your target audience with detailed buyer personas',
    overviewTitle: 'Generate Your First Persona',
    overviewSubtitle: 'Create detailed buyer personas to understand your target audience better.',
    buttonText: 'Generate Your First Persona',
    icon: Target,
  },
  progressStages: [
    { label: 'Analyzing persona...', percent: 30 },
    { label: 'Researching behavior...', percent: 60 },
    { label: 'Generating insights...', percent: 85 },
    { label: 'Finalizing...', percent: 95 },
  ],
};

// Campaign Configuration
export const campaignConfig: EntityPageConfig<EmailGenerationResponse> = {
  entityType: 'campaign',
  cardConfigs: [
    {
      key: 'campaignInsights',
      label: 'Campaign Insights',
      bulleted: true,
      getItems: (campaign) => campaign.campaignInsights || [],
      subtitle: 'Key insights and strategy for this campaign.',
    },
    {
      key: 'messagingStrategy',
      label: 'Messaging Strategy',
      bulleted: true,
      getItems: (campaign) => campaign.messagingStrategy || [],
      subtitle: 'Core messaging and positioning strategy.',
    },
    {
      key: 'channelStrategy',
      label: 'Channel Strategy',
      bulleted: true,
      getItems: (campaign) => campaign.channelStrategy || [],
      subtitle: 'Recommended channels and timing.',
    },
    {
      key: 'contentVariations',
      label: 'Content Variations',
      bulleted: true,
      getItems: (campaign) => campaign.contentVariations || [],
      subtitle: 'Different content approaches and variations.',
    },
    {
      key: 'optimizationTips',
      label: 'Optimization Tips',
      bulleted: true,
      getItems: (campaign) => campaign.optimizationTips || [],
      subtitle: 'Tips for optimizing campaign performance.',
    },
  ],
  preservedComplexTypes: ['emailContent', 'linkedinContent', 'callScript'],
  generateEndpoint: '/api/campaigns/generate-ai',
  childEntities: [],
  routePrefix: {
    authenticated: '/app/campaigns',
    unauthenticated: '/playground/campaigns',
  },
  emptyStateConfig: {
    pageTitle: 'Email Campaigns',
    pageSubtitle: 'Create targeted campaigns with personalized messaging',
    overviewTitle: 'Generate Your First Campaign',
    overviewSubtitle: 'Create targeted campaigns with personalized messaging for your prospects.',
    buttonText: 'Generate Your First Campaign',
    icon: Mail,
  },
  progressStages: [
    { label: 'Analyzing context...', percent: 25 },
    { label: 'Crafting message...', percent: 50 },
    { label: 'Optimizing content...', percent: 75 },
    { label: 'Finalizing...', percent: 90 },
  ],
};

// Generation modal configurations
export const generationModalConfigs = {
  company: {
    title: 'Generate Company Overview',
    subtitle: 'Enter your company\'s website URL to generate a comprehensive analysis and insights.',
    nameLabel: 'Website URL',
    namePlaceholder: 'https://yourcompany.com',
    nameType: 'url',
    nameRequired: true,
    descriptionLabel: 'Additional Context (Optional)',
    descriptionPlaceholder: 'e.g., We\'re a B2B SaaS company focused on marketing automation for small businesses...',
    showDescription: true,
    descriptionRequired: false,
  },
  account: {
    title: 'Generate Target Account',
    subtitle: 'Create a detailed analysis of your ideal customer account.',
    nameLabel: 'Account Profile Name',
    namePlaceholder: 'Mid-market SaaS companies',
    nameRequired: true,
    descriptionLabel: 'Account Hypothesis',
    descriptionPlaceholder: 'e.g., Companies with 100-500 employees in the software industry...',
    showDescription: true,
    descriptionRequired: true,
  },
  persona: {
    title: 'Generate Target Persona',
    subtitle: 'Create a detailed buyer persona for your target audience.',
    nameLabel: 'Persona Name',
    namePlaceholder: 'VP of Engineering',
    nameRequired: true,
    descriptionLabel: 'Persona Hypothesis',
    descriptionPlaceholder: 'e.g., Technical leader responsible for team productivity and tool selection...',
    showDescription: true,
    descriptionRequired: true,
  },
  campaign: {
    title: 'Generate Campaign',
    subtitle: 'Create a targeted campaign with personalized messaging.',
    nameLabel: 'Campaign Name',
    namePlaceholder: 'Q1 Outbound Campaign',
    nameRequired: true,
    descriptionLabel: 'Campaign Objectives',
    descriptionPlaceholder: 'e.g., Generate qualified leads from mid-market SaaS companies...',
    showDescription: true,
    descriptionRequired: false,
  },
};

// Helper function to get configuration by entity type
export function getEntityConfig(entityType: string): EntityPageConfig | null {
  switch (entityType) {
    case 'company':
      return companyConfig;
    case 'account':
      return accountConfig;
    case 'persona':
      return personaConfig;
    case 'campaign':
      return campaignConfig;
    default:
      return null;
  }
}

// Helper function to get generation modal config
export function getGenerationModalConfig(entityType: string) {
  return generationModalConfigs[entityType as keyof typeof generationModalConfigs] || null;
}