import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useStackApp } from '@stackframe/react'

export function OAuthCallback() {
  const navigate = useNavigate()
  const user = useUser()
  const app = useStackApp()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let hasProcessed = false
    
    const processOAuthCallback = async () => {
      if (hasProcessed) return
      hasProcessed = true
      
      try {
        // Call Stack Auth's OAuth callback processing
        const hasRedirected = await app.callOAuthCallback()
        
        if (!hasRedirected) {
          // If no automatic redirect happened, check if user is now authenticated
          if (user) {
            navigate('/company')
          } else {
            // Redirect to sign-in if OAuth failed
            navigate('/auth?mode=signin')
          }
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError('Authentication failed. Please try again.')
        setIsProcessing(false)
      }
    }

    processOAuthCallback()
  }, [app, navigate, user])

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">Authentication Error</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  )
}