import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingState {
  message: string
  duration?: number // Duration in milliseconds, undefined = indefinite
}

interface PageLoadingProps {
  states?: LoadingState[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showBackground?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12'
}

export function PageLoading({ 
  states = [{ message: 'Loading...' }],
  className = '',
  size = 'md',
  showBackground = true
}: PageLoadingProps) {
  const [currentStateIndex, setCurrentStateIndex] = useState(0)
  
  useEffect(() => {
    if (states.length <= 1) return
    
    const currentState = states[currentStateIndex]
    if (!currentState.duration) return
    
    const timer = setTimeout(() => {
      setCurrentStateIndex((prev) => {
        const nextIndex = prev + 1
        return nextIndex >= states.length ? prev : nextIndex
      })
    }, currentState.duration)
    
    return () => clearTimeout(timer)
  }, [currentStateIndex, states])
  
  const currentMessage = states[currentStateIndex]?.message || 'Loading...'
  
  const containerClasses = showBackground 
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center py-8'
  
  return (
    <div className={`${containerClasses} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      <span className="ml-4 text-gray-600">{currentMessage}</span>
    </div>
  )
}

// Predefined loading sequences for common use cases
export const LoadingSequences = {
  accounts: [
    { message: 'Loading accounts...', duration: 2000 },
    { message: 'Analyzing account data...', duration: 3000 },
    { message: 'Finalizing...' }
  ],
  
  personas: [
    { message: 'Loading personas...', duration: 1500 },
    { message: 'Processing persona data...' }
  ],
  
  campaigns: [
    { message: 'Loading campaigns...', duration: 2000 },
    { message: 'Fetching campaign metrics...', duration: 2500 },
    { message: 'Preparing dashboard...' }
  ],
  
  dashboard: [
    { message: 'Loading dashboard...', duration: 1000 },
    { message: 'Fetching latest data...', duration: 2000 },
    { message: 'Analyzing metrics...', duration: 2000 },
    { message: 'Finalizing...' }
  ],
  
  generation: [
    { message: 'Preparing...', duration: 1000 },
    { message: 'Generating content...', duration: 3000 },
    { message: 'Finalizing content...', duration: 2000 },
    { message: 'Almost done...' }
  ]
}

// Convenience components for common patterns
export function AccountsLoading() {
  return <PageLoading states={LoadingSequences.accounts} />
}

export function PersonasLoading() {
  return <PageLoading states={LoadingSequences.personas} />
}

export function CampaignsLoading() {
  return <PageLoading states={LoadingSequences.campaigns} />
}

export function DashboardLoading() {
  return <PageLoading states={LoadingSequences.dashboard} />
}

export function GenerationLoading() {
  return <PageLoading states={LoadingSequences.generation} showBackground={false} />
}