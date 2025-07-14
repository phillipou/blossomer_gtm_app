import { createContext, useContext } from 'react';

interface DataContextValue {
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export default DataContext;