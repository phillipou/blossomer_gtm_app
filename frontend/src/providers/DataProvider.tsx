import React, { useState, useEffect, useCallback } from 'react';
import DataContext from '../contexts/DataContext';
import { DataSyncService } from '../lib/dataSync';
import { useAuthState } from '../lib/auth';
import { useCompanyContext } from '../lib/hooks/useCompanyContext';

interface DataContextValue {
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
}

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Get auth state - revert to original approach
  const { token } = useAuthState();
  const { companyId, isLoading: isCompanyLoading } = useCompanyContext();

  /**
   * Manual sync function that can be called by components
   */
  const syncData = useCallback(async () => {
    if (!token || !companyId) {
      console.log('[DATA-PROVIDER] Skipping sync - no auth token or company ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[DATA-PROVIDER] Starting manual data sync');
      await DataSyncService.syncAllDataToDraftManager(companyId, token);
      
      setLastSyncTime(new Date());
      console.log('[DATA-PROVIDER] Manual data sync completed successfully');
      
      // Log sync status
      const status = DataSyncService.getSyncStatus();
      console.log('[DATA-PROVIDER] Sync status:', status);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
      setError(errorMessage);
      console.error('[DATA-PROVIDER] Manual data sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, companyId]);

  /**
   * Automatic sync on app start (for authenticated users)
   * Temporarily disabled for debugging
   */
  useEffect(() => {
    console.log('[DATA-PROVIDER] Initialized with:', {
      hasToken: !!token,
      hasCompanyId: !!companyId,
      isCompanyLoading
    });
    
    if (isCompanyLoading) return;
    
    if (token && companyId) {
      console.log('[DATA-PROVIDER] Authenticated user detected - starting automatic sync');
      syncData();
    } else if (!token) {
      console.log('[DATA-PROVIDER] Unauthenticated user - using DraftManager as primary store');
      setIsLoading(false);
      setError(null);
    }
  }, [token, companyId, isCompanyLoading]);

  /**
   * Periodic refresh disabled for debugging
   */
  /*
  useEffect(() => {
    if (!token || !companyId) return;

    const refreshInterval = setInterval(() => {
      console.log('[DATA-PROVIDER] Performing periodic data refresh');
      syncData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [token, companyId, syncData]);
  */

  const contextValue: DataContextValue = {
    isLoading,
    error,
    lastSyncTime,
    syncData
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};