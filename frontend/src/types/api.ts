export interface ApiError {
  error_code: string;
  message: string;
  details?: {
    reason?: string;
    suggestions?: string[];
  };
  retry_recommended?: boolean;
}

export interface AnalysisState {
  data: any | null;
  loading: boolean;
  error: ApiError | null;
  hasAttempted: boolean;
  analysisId: string | null;
} 