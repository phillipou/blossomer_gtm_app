interface PageLoadingProps {
  message?: string;
  background?: 'white' | 'gray' | 'transparent';
}

export default function PageLoading({ 
  message = 'Loading...', 
  background = 'white' 
}: PageLoadingProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent'
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${backgroundClasses[background]}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Predefined loading states for common scenarios
export const LoadingStates = {
  // Page loading states
  accounts: () => <PageLoading message="Loading accounts..." />,
  personas: () => <PageLoading message="Loading personas..." />,
  campaigns: () => <PageLoading message="Loading campaigns..." />,
  company: () => <PageLoading message="Loading company..." />,
  
  // Detail page loading states
  accountDetail: () => <PageLoading message="Loading account..." />,
  personaDetail: () => <PageLoading message="Loading persona..." />,
  campaignDetail: () => <PageLoading message="Loading campaign..." />,
  
  // Authentication states
  auth: () => <PageLoading message="Checking authentication..." />,
  
  // Generic states
  default: () => <PageLoading />,
  
  // Custom message helper
  custom: (message: string) => <PageLoading message={message} />,
  
  // Small inline loading (for modals/components)
  inline: (message?: string) => (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">{message || "Loading..."}</p>
      </div>
    </div>
  ),
  
  // Large prominent loading
  prominent: (message?: string) => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg">{message || "Loading..."}</p>
      </div>
    </div>
  )
};