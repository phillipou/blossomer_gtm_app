import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import { mockCompanyOverview, mockApiError } from '../test/mocks/apiMocks'
import { apiFetch } from '../lib/apiClient'

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockLocation = {
  state: null,
  pathname: '/dashboard',
  search: '',
  hash: ''
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  }
})

// Mock the apiClient module  
vi.mock('../lib/apiClient', () => ({
  apiFetch: vi.fn()
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
)

const mockApiFetch = vi.mocked(apiFetch)

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLocation.state = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('shows no analysis found when no data or URL provided', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      expect(screen.getByText('No Analysis Found')).toBeInTheDocument()
      expect(screen.getByText('Start by analyzing a website from the home page.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Analyze a Website' })).toBeInTheDocument()
    })

    it('loads cached data when available', () => {
      localStorage.setItem('dashboard_overview', JSON.stringify(mockCompanyOverview))
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('https://test.com')).toBeInTheDocument()
      expect(screen.getByText('A test company for our testing purposes')).toBeInTheDocument()
    })

    it('ignores cached data when new URL provided', () => {
      localStorage.setItem('dashboard_overview', JSON.stringify({
        ...mockCompanyOverview,
        _input_url: 'https://old.com'
      }))
      
      mockLocation.state = { url: 'https://new.com' }
      mockApiFetch.mockResolvedValue(mockCompanyOverview)
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      expect(mockApiFetch).toHaveBeenCalledWith('/demo/company/generate', {
        method: 'POST',
        body: JSON.stringify({
          website_url: 'https://new.com',
          user_inputted_context: ''
        })
      })
    })
  })

  describe('API Analysis Flow', () => {
    it('shows loading state during analysis', async () => {
      mockLocation.state = { url: 'https://test.com' }
      mockApiFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Loading website...')).toBeInTheDocument()
      })
    })

    it('displays analysis results after successful API call', async () => {
      mockLocation.state = { url: 'https://test.com' }
      mockApiFetch.mockResolvedValue(mockCompanyOverview)
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument()
        expect(screen.getByText('Business Profile')).toBeInTheDocument()
        expect(screen.getByText('Key Features & Capabilities')).toBeInTheDocument()
        expect(screen.getByText('Positioning')).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      mockLocation.state = { url: 'https://test.com' }
      const apiError = new Error('API Error')
      apiError.status = 500
      apiError.body = mockApiError
      mockApiFetch.mockRejectedValue(apiError)
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to analyze website')).toBeInTheDocument()
      })
    })
  })

  describe('Card Display and Ordering', () => {
    beforeEach(() => {
      localStorage.setItem('dashboard_overview', JSON.stringify(mockCompanyOverview))
    })

    it('displays cards in correct order', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      const cards = screen.getAllByRole('article')
      const cardTitles = cards.map(card => card.querySelector('h3')?.textContent)
      
      expect(cardTitles).toEqual([
        'Business Profile',
        'Key Features & Capabilities', 
        'Positioning',
        'Process & Impact Analysis',
        'Target Customer Insights',
        'Potential Concerns'
      ])
    })

    it('renders all card data correctly', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Business Profile
      expect(screen.getByText('Category: AI-powered Testing Tool')).toBeInTheDocument()
      expect(screen.getByText(/Business Model: SaaS subscription/)).toBeInTheDocument()
      
      // Capabilities
      expect(screen.getByText(/AI Testing: Automated test generation/)).toBeInTheDocument()
      
      // Positioning
      expect(screen.getByText(/Market Belief: Traditional testing tools/)).toBeInTheDocument()
      
      // Objections
      expect(screen.getByText(/Cost: Higher upfront investment/)).toBeInTheDocument()
    })
  })

  describe('Card Editing', () => {
    beforeEach(() => {
      localStorage.setItem('dashboard_overview', JSON.stringify(mockCompanyOverview))
    })

    it('allows editing capabilities', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      const editButton = screen.getAllByText('Edit')[0] // First edit button
      fireEvent.click(editButton)

      const textArea = screen.getByRole('textbox')
      fireEvent.change(textArea, { 
        target: { value: 'New Feature: Updated functionality\nAnother Feature: More improvements' }
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('New Feature: Updated functionality')).toBeInTheDocument()
        expect(screen.getByText('Another Feature: More improvements')).toBeInTheDocument()
      })
    })

    it('persists edits to localStorage', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      const editButton = screen.getAllByText('Edit')[0]
      fireEvent.click(editButton)

      const textArea = screen.getByRole('textbox')
      fireEvent.change(textArea, { 
        target: { value: 'Updated capability' }
      })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        const savedData = JSON.parse(localStorage.getItem('dashboard_overview')!)
        expect(savedData.capabilities).toContain('Updated capability')
      })
    })
  })

  describe('URL Normalization', () => {
    it('normalizes URLs for comparison', () => {
      localStorage.setItem('dashboard_overview', JSON.stringify({
        ...mockCompanyOverview,
        _input_url: 'https://test.com/'
      }))
      
      mockLocation.state = { url: 'http://test.com' }
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Should not trigger new API call since URLs are equivalent
      expect(mockApiFetch).not.toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('navigates to home when analyze button clicked', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      const analyzeButton = screen.getByRole('button', { name: 'Analyze a Website' })
      fireEvent.click(analyzeButton)

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})