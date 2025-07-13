import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useStackApp } from '@stackframe/react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthState } from '../../lib/auth'
import { useGetCompanies } from '../../lib/hooks/useCompany'
import { apiFetch } from '../../lib/apiClient'
import { DraftManager } from '../../lib/draftManager'

export function OAuthCallback() {
  const navigate = useNavigate()
  const user = useUser()
  const app = useStackApp()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuthState()
  const { data: companies } = useGetCompanies(token)
  const processed = useRef(false)
  const cacheCleared = useRef(false)

  // Clear playground cache immediately when user and token are available (before any API calls)
  useEffect(() => {
    if (user && token && !cacheCleared.current) {
      console.log("🚨 OAuthCallback: IMMEDIATE cache clearing on successful auth");
      
      // Clear playground data to prevent contamination
      DraftManager.clearAllPlayground();
      
      // Clear any cached queries that might have playground data
      queryClient.getQueryCache().findAll().forEach((query: any) => {
        const queryKey = query.queryKey;
        if (Array.isArray(queryKey) && !queryKey[0]?.toString().startsWith('db_')) {
          queryClient.removeQueries({ queryKey });
        }
      });
      
      cacheCleared.current = true;
      console.log("✅ OAuthCallback: Playground cache cleared successfully");
    }
  }, [user, token, queryClient]);

  // This effect handles the post-authentication logic: user sync and redirect
  useEffect(() => {
    // Wait until we have both the user from Stack and our own JWT token
    if (user && token) {
      const syncUserAndRedirect = async () => {
        try {
          console.log("OAuthCallback: Syncing user with backend...");
          await apiFetch('/neon-auth/profile', { method: 'GET' }, token);
          console.log("OAuthCallback: User synced successfully.");

          // Redirect to the last company or the main company page
          if (companies && companies.length > 0) {
            navigate(`/app/company/${companies[companies.length - 1].id}`, { replace: true });
          } else {
            navigate('/app/company', { replace: true });
          }
        } catch (err) {
          console.error('OAuthCallback: Failed to sync user or redirect:', err);
          setError('Failed to initialize your profile. Please try again.');
        }
      };
      syncUserAndRedirect();
    }
  }, [user, token, companies, navigate]);


  // This effect handles the one-time processing of the OAuth callback from the URL
  useEffect(() => {
    if (processed.current || user) {
      // Don't process if we already have a user from the session
      // or if we've already tried to process the callback.
      return
    }
    processed.current = true
    
    const processOAuthCallback = async () => {
      try {
        console.log("OAuthCallback: Processing OAuth callback from URL...");
        await app.callOAuthCallback()
        console.log("OAuthCallback: Finished processing callback. Waiting for user and token...");
        // After this succeeds, the `useUser` and `useAuthState` hooks will update,
        // which will trigger the other useEffect to sync and redirect.
      } catch (err: any) {
        console.error('OAuth callback error:', err)
        setError(err.message || 'Authentication failed. Please try again.')
      }
    }

    processOAuthCallback()
  }, [app, user])

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