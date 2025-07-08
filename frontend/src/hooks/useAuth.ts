import { useState, useEffect, useCallback } from 'react'
import { 
  getAuthState, 
  setAuthState, 
  clearAuthState, 
  validateApiKey,
  type AuthState,
  type UserInfo 
} from '../lib/auth'

export function useAuth() {
  const [authState, setAuthStateLocal] = useState<AuthState>(getAuthState())
  const [isValidating, setIsValidating] = useState(false)

  // Initialize auth state on mount
  useEffect(() => {
    const storedAuthState = getAuthState()
    setAuthStateLocal(storedAuthState)

    // If user has stored credentials, validate them
    if (storedAuthState.isAuthenticated && storedAuthState.apiKey) {
      validateStoredCredentials(storedAuthState.apiKey)
    }
  }, [])

  const validateStoredCredentials = async (apiKey: string) => {
    setIsValidating(true)
    try {
      const userInfo = await validateApiKey(apiKey)
      // Update auth state with fresh user info
      setAuthState(apiKey, userInfo)
      setAuthStateLocal({
        isAuthenticated: true,
        apiKey,
        userInfo
      })
    } catch (error) {
      console.error('Stored API key validation failed:', error)
      // Clear invalid credentials
      signOut()
    } finally {
      setIsValidating(false)
    }
  }

  const signIn = useCallback(async (apiKey: string, userInfo: UserInfo) => {
    try {
      // Save to localStorage
      setAuthState(apiKey, userInfo)
      
      // Update local state
      setAuthStateLocal({
        isAuthenticated: true,
        apiKey,
        userInfo
      })

      return true
    } catch (error) {
      console.error('Sign in failed:', error)
      return false
    }
  }, [])

  const signOut = useCallback(() => {
    // Clear localStorage
    clearAuthState()
    
    // Update local state
    setAuthStateLocal({
      isAuthenticated: false,
      apiKey: null,
      userInfo: null
    })
  }, [])

  const refreshUserInfo = useCallback(async () => {
    if (!authState.apiKey) return false

    setIsValidating(true)
    try {
      const userInfo = await validateApiKey(authState.apiKey)
      setAuthState(authState.apiKey, userInfo)
      setAuthStateLocal(prev => ({
        ...prev,
        userInfo
      }))
      return true
    } catch (error) {
      console.error('Failed to refresh user info:', error)
      signOut()
      return false
    } finally {
      setIsValidating(false)
    }
  }, [authState.apiKey, signOut])

  return {
    ...authState,
    isValidating,
    signIn,
    signOut,
    refreshUserInfo,
  }
}