import React, { useState } from 'react'
import { useStackApp, useUser } from '@stackframe/react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { User, LogOut, Settings } from 'lucide-react'
import { APIKeyModal } from './APIKeyModal'
import { DraftManager } from '../../lib/draftManager'

export function NeonAuthHeader() {
  const app = useStackApp()
  const user = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)

  const handleSignIn = () => {
    navigate('/auth?mode=signin')
  }

  const handleSignUp = () => {
    navigate('/auth?mode=signup')
  }

  const handleSignOut = async () => {
    console.log('NeonAuthHeader: Signing out user - using selective cache clearing')
    
    // Don't clear cache manually - let auth.ts handle selective clearing on state transition
    // This prevents clearing playground data that the user might want to keep
    
    await app.signOut()
  }

  const handleAPIKeys = () => {
    setApiKeyModalOpen(true)
  }

  if (user) {
    // User is authenticated
    return (
      <>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user.displayName || user.primaryEmail}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleAPIKeys}
            className="text-gray-600 hover:text-gray-900"
          >
            <Settings className="h-4 w-4 mr-1" />
            API Keys
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>

        <APIKeyModal
          isOpen={apiKeyModalOpen}
          onClose={() => setApiKeyModalOpen(false)}
          user={user}
        />
      </>
    )
  }

  // User is not authenticated
  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="sm" onClick={handleSignIn}>
        Sign In
      </Button>
      <Button variant="default" size="sm" onClick={handleSignUp}>
        Sign Up
      </Button>
    </div>
  )
}