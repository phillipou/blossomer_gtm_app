import React from 'react';

interface ModalLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function ModalLoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children 
}: ModalLoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Dimmed content */}
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
      
      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Predefined loading messages for different modal actions
export const ModalLoadingMessages = {
  creating: 'Creating...',
  updating: 'Updating...',
  saving: 'Saving...',
  generating: 'Generating...',
  deleting: 'Deleting...',
  authenticating: 'Authenticating...',
  signIn: 'Signing in...',
  signUp: 'Creating account...',
  loading: 'Loading...',
  
  // Specific entity actions
  creatingAccount: 'Creating account...',
  updatingAccount: 'Updating account...',
  generatingAccount: 'Generating Account...',
  creatingPersona: 'Creating persona...',
  updatingPersona: 'Updating persona...',
  creatingCampaign: 'Creating campaign...',
  updatingCampaign: 'Updating campaign...',
  generatingEmail: 'Generating email...',
  
  // Custom message helper
  custom: (action: string) => `${action}...`,
};