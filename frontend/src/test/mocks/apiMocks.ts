import { CompanyOverviewResponse } from '../../types/api'

export const mockCompanyOverview: CompanyOverviewResponse = {
  companyName: 'Test Company',
  companyUrl: 'https://test.com',
  description: 'A test company for our testing purposes',
  businessProfile: {
    category: 'AI-powered Testing Tool',
    businessModel: 'SaaS subscription model targeting enterprise customers',
    existingCustomers: 'Fortune 500 companies and mid-market businesses'
  },
  capabilities: [
    'AI Testing: Automated test generation and execution',
    'Integration: Seamless CI/CD pipeline integration',
    'Analytics: Real-time testing metrics and insights'
  ],
  useCaseAnalysis: {
    processImpact: 'Transforms manual testing processes into automated workflows',
    problemsAddressed: 'Eliminates time-consuming manual testing and reduces bugs',
    howTheyDoItToday: 'Manual testing and legacy automation tools'
  },
  positioning: {
    keyMarketBelief: 'Traditional testing tools are too slow and error-prone',
    uniqueApproach: 'AI-driven testing that adapts to code changes automatically',
    languageUsed: 'Smart testing, adaptive automation, intelligent QA'
  },
  objections: [
    'Cost: Higher upfront investment than traditional tools',
    'Learning Curve: Team needs training on AI-powered features',
    'Integration: Concerns about fitting into existing workflows'
  ],
  icpHypothesis: {
    targetAccountHypothesis: 'Mid to large software companies with complex testing needs',
    targetPersonaHypothesis: 'QA Directors and Engineering Managers focused on quality and speed'
  },
  metadata: {
    context_quality: 'high',
    sources_used: ['website'],
    assessment_summary: 'Complete analysis based on website content'
  }
}

export const mockApiError = {
  errorCode: 'NETWORK_ERROR',
  message: 'Failed to analyze website',
  retryRecommended: true
}

export const mockApiFetch = vi.fn()