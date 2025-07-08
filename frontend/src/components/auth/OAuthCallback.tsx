import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@stackframe/react'

export function OAuthCallback() {
  const navigate = useNavigate()
  const user = useUser()

  useEffect(() => {
    // If user is authenticated, redirect to company page
    if (user) {
      navigate('/company')
    }
  }, [user, navigate])

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  )
}