export interface TargetAccount {
  id: string;
  name: string; // target_company_name
  role: string; // "Target Account"
  description: string; // target_company_description
  firmographics: Record<string, string[]>;
  buying_signals: Record<string, string[]>;
  rationale: string;
  created_at: string;
} 