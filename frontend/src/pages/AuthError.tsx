import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { AlertCircle } from 'lucide-react'

export function AuthError() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const errorCode = searchParams.get('errorCode')
  const message = searchParams.get('message')
  const details = searchParams.get('details')

  const isContactChannelError = errorCode === 'CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE'

  const getErrorMessage = () => {
    if (isContactChannelError) {
      return {
        title: 'Account Already Exists',
        description: 'This email is already registered. To link your Google account, please sign in with your existing credentials first, then add Google as a connected provider.',
        action: 'Sign in with your existing account to link providers'
      }
    }
    
    return {
      title: 'Authentication Error',
      description: message || 'An error occurred during authentication.',
      action: 'Please try again'
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">{errorInfo.action}</p>
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => navigate('/auth?mode=signin')}
                  className="w-full"
                >
                  Sign In with Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}