import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Copy, Check, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { User } from '@stackframe/react'

interface APIKey {
  id: string
  name: string
  key_prefix: string
  tier: string
  created_at: string
  last_used?: string
}

interface APIKeyModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export function APIKeyModal({ isOpen, onClose, user }: APIKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newKeyName, setNewKeyName] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState('')
  const [copied, setCopied] = useState('')

  // Load user's API keys
  const loadAPIKeys = async () => {
    setLoading(true)
    setError('')
    
    try {
      const token = await user.getAuthToken()
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
      
      const response = await fetch(`${baseUrl}/api/neon-auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load API keys')
      }

      const data = await response.json()
      setApiKeys(data.api_keys || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  // Create new API key
  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      setError('API key name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await user.getAuthToken()
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
      
      const response = await fetch(`${baseUrl}/api/neon-auth/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          tier: 'free'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create API key')
      }

      const data = await response.json()
      setNewKeyValue(data.api_key)
      setShowNewKey(true)
      setNewKeyName('')
      
      // Reload API keys list
      await loadAPIKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  // Delete API key
  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await user.getAuthToken()
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175'
      
      const response = await fetch(`${baseUrl}/api/neon-auth/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete API key')
      }

      // Reload API keys list
      await loadAPIKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key')
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(id)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  // Load API keys when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAPIKeys()
      setShowNewKey(false)
      setNewKeyValue('')
      setError('')
    }
  }, [isOpen])

  const handleClose = () => {
    setShowNewKey(false)
    setNewKeyValue('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Key Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Show new API key if just created */}
          {showNewKey && newKeyValue && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <strong>Your new API key:</strong>
                  <div className="flex space-x-2">
                    <Input
                      value={newKeyValue}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newKeyValue, 'new-key')}
                      className="shrink-0"
                    >
                      {copied === 'new-key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save this key now - it won't be shown again!
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Create new API key */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="key-name">API Key Name</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createAPIKey} disabled={loading || !newKeyName.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing API keys */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && apiKeys.length === 0 ? (
                <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No API keys created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{key.key_prefix}</div>
                        <div className="text-xs text-gray-400">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                          {key.last_used && ` • Last used: ${new Date(key.last_used).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {key.tier}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAPIKey(key.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}