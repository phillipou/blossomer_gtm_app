import React from 'react'
import { StackProvider, StackTheme } from '@stackframe/react'
import { stackClientApp } from '../../lib/stack'

interface NeonAuthWrapperProps {
  children: React.ReactNode
}

export function NeonAuthWrapper({ children }: NeonAuthWrapperProps) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  )
}