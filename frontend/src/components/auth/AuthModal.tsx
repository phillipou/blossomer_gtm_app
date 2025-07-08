import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, Copy, Check } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signup' | 'login'
  onSuccess: (apiKey: string, userInfo: any) => void
}

export function AuthModal({ isOpen, onClose, mode, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const resetForm = () => {
    setEmail('')
    setName('')
    setApiKey('')
    setError('')
    setShowApiKey(false)
    setCopied(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSignup = async () => {
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed')
      }

      // Show the API key to the user
      setApiKey(data.api_key)
      setShowApiKey(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
      const response = await fetch(`${baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid API key')
      }

      // Success - pass the API key and user info to parent
      onSuccess(apiKey.trim(), data)
      handleClose()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = apiKey
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveApiKey = () => {
    // The API key is already displayed, now they need to save it and continue
    onSuccess(apiKey, { email, name })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showApiKey 
              ? 'Save Your API Key' 
              : mode === 'signup' 
                ? 'Create Account' 
                : 'Sign In'}
          </DialogTitle>
        </DialogHeader>

        {showApiKey ? (
          // API Key Display Screen
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Important:</strong> Save this API key now. It won't be shown again!
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="api-key-display">Your API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="api-key-display"
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyApiKey}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSaveApiKey} className="flex-1">
                I've Saved My Key
              </Button>
            </div>
          </div>
        ) : mode === 'signup' ? (
          // Signup Form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSignup} className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </div>
          </div>
        ) : (
          // Login Form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="bloss_test_sk_..."
                disabled={isLoading}
                className="font-mono text-sm"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleLogin} className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}