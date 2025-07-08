import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockCompanyOverview } from '../test/mocks/apiMocks'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Company Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('Data Processing', () => {
    it('should parse cached company overview data correctly', () => {
      const testData = JSON.stringify(mockCompanyOverview)
      localStorageMock.getItem.mockReturnValue(testData)
      
      const cached = localStorage.getItem('dashboard_overview')
      const parsed = cached ? JSON.parse(cached) : null
      
      expect(parsed).toEqual(mockCompanyOverview)
      expect(parsed?.companyName).toBe('Test Company')
      expect(parsed?.capabilities).toHaveLength(3)
      expect(parsed?.businessProfile?.category).toBe('AI-powered Testing Tool')
    })

    it('should handle URL normalization correctly', () => {
      const normalizeUrl = (url?: string | null): string => {
        if (!url) return "";
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      }

      expect(normalizeUrl('https://test.com/')).toBe('test.com')
      expect(normalizeUrl('http://test.com')).toBe('test.com')
      expect(normalizeUrl('https://TEST.COM')).toBe('test.com')
      expect(normalizeUrl('')).toBe('')
      expect(normalizeUrl(null)).toBe('')
    })

    it('should create proper card configurations', () => {
      const overview = mockCompanyOverview
      
      // Test business profile parsing
      const businessProfileItems = [
        `Category: ${overview.businessProfile?.category || 'N/A'}`,
        `Business Model: ${overview.businessProfile?.businessModel || 'N/A'}`,
        `Existing Customers: ${overview.businessProfile?.existingCustomers || 'N/A'}`
      ]
      
      expect(businessProfileItems).toEqual([
        'Category: AI-powered Testing Tool',
        'Business Model: SaaS subscription model targeting enterprise customers',
        'Existing Customers: Fortune 500 companies and mid-market businesses'
      ])

      // Test capabilities
      expect(overview.capabilities).toEqual([
        'AI Testing: Automated test generation and execution',
        'Integration: Seamless CI/CD pipeline integration',
        'Analytics: Real-time testing metrics and insights'
      ])

      // Test positioning parsing
      const positioningItems = [
        `Market Belief: ${overview.positioning?.keyMarketBelief || 'N/A'}`,
        `Unique Approach: ${overview.positioning?.uniqueApproach || 'N/A'}`,
        `Language Used: ${overview.positioning?.languageUsed || 'N/A'}`
      ]
      
      expect(positioningItems[0]).toContain('Traditional testing tools are too slow')
      expect(positioningItems[1]).toContain('AI-driven testing')
      expect(positioningItems[2]).toContain('Smart testing')
    })
  })

  describe('Card Editing Logic', () => {
    it('should parse business profile edits correctly', () => {
      const editedItems = [
        'Category: Updated AI Tool',
        'Business Model: New subscription model',
        'Existing Customers: Updated customer base'
      ]

      const category = editedItems.find(item => item.startsWith("Category:"))?.replace("Category: ", "") || ""
      const businessModel = editedItems.find(item => item.startsWith("Business Model:"))?.replace("Business Model: ", "") || ""
      const existingCustomers = editedItems.find(item => item.startsWith("Existing Customers:"))?.replace("Existing Customers: ", "") || ""

      expect(category).toBe('Updated AI Tool')
      expect(businessModel).toBe('New subscription model')
      expect(existingCustomers).toBe('Updated customer base')
    })

    it('should parse positioning edits correctly', () => {
      const editedItems = [
        'Market Belief: New market belief',
        'Unique Approach: Updated approach',
        'Language Used: Modern terminology'
      ]

      const keyMarketBelief = editedItems.find(item => item.startsWith("Market Belief:"))?.replace("Market Belief: ", "") || ""
      const uniqueApproach = editedItems.find(item => item.startsWith("Unique Approach:"))?.replace("Unique Approach: ", "") || ""
      const languageUsed = editedItems.find(item => item.startsWith("Language Used:"))?.replace("Language Used: ", "") || ""

      expect(keyMarketBelief).toBe('New market belief')
      expect(uniqueApproach).toBe('Updated approach')
      expect(languageUsed).toBe('Modern terminology')
    })

    it('should handle target customer insights parsing', () => {
      const editedItems = [
        'Target Accounts: Enterprise software companies',
        'Key Personas: CTOs and Engineering Directors'
      ]

      const targetAccountHypothesis = editedItems.find(item => item.startsWith("Target Accounts:"))?.replace("Target Accounts: ", "") || ""
      const targetPersonaHypothesis = editedItems.find(item => item.startsWith("Key Personas:"))?.replace("Key Personas: ", "") || ""

      expect(targetAccountHypothesis).toBe('Enterprise software companies')
      expect(targetPersonaHypothesis).toBe('CTOs and Engineering Directors')
    })
  })

  describe('Analysis State Management', () => {
    it('should generate unique analysis IDs', async () => {
      const generateAnalysisId = (url: string, icp?: string) => {
        return `${url}-${icp || ''}-${Date.now()}`
      }

      const id1 = generateAnalysisId('https://test.com', 'enterprise')
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1))
      const id2 = generateAnalysisId('https://test.com', 'enterprise')

      expect(id1).toContain('https://test.com')
      expect(id1).toContain('enterprise')
      expect(id1).not.toBe(id2) // Should be different due to timestamp
    })

    it('should handle localStorage data persistence', () => {
      const testData = { ...mockCompanyOverview, _input_url: 'https://test.com' }
      
      localStorageMock.setItem('dashboard_overview', JSON.stringify(testData))
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashboard_overview',
        JSON.stringify(testData)
      )

      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData))
      const retrieved = localStorage.getItem('dashboard_overview')
      const parsed = retrieved ? JSON.parse(retrieved) : null

      expect(parsed?._input_url).toBe('https://test.com')
      expect(parsed?.companyName).toBe('Test Company')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      const emptyOverview = {
        companyName: '',
        companyUrl: '',
        description: '',
        businessProfile: null,
        capabilities: [],
        useCaseAnalysis: null,
        positioning: null,
        objections: [],
        icpHypothesis: null,
        metadata: {}
      }

      // Test safe access patterns
      const companyName = emptyOverview?.companyName || "Company"
      const domain = emptyOverview?.companyUrl || ""
      const description = emptyOverview?.description || "No description available"

      expect(companyName).toBe("Company")
      expect(domain).toBe("")
      expect(description).toBe("No description available")

      // Test array access
      const capabilities = emptyOverview?.capabilities || []
      expect(capabilities).toEqual([])
    })

    it('should handle malformed localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      let parsed = null
      try {
        const stored = localStorage.getItem('dashboard_overview')
        parsed = stored ? JSON.parse(stored) : null
      } catch (error) {
        parsed = null
      }

      expect(parsed).toBeNull()
    })
  })
})