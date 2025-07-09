import { StackClientApp } from '@stackframe/react'
import { useNavigate } from 'react-router-dom'

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID!,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore: 'cookie', // Use cookies for token storage
  redirectMethod: { useNavigate },
  urls: {
    signIn: '/auth?mode=signin',
    signUp: '/auth?mode=signup',
    afterSignIn: '/handler/oauth-callback',
    afterSignUp: '/handler/oauth-callback',
    afterSignOut: '/',
    error: '/handler/error',
    accountSettings: '/account-settings',
  }
})