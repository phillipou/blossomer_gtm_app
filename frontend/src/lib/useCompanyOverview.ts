import { useState, useEffect } from "react";
import type { TargetCompanyResponse } from "../types/api";

export function useCompanyOverview() {
  const [overview, setOverview] = useState<TargetCompanyResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dashboard_overview");
    if (stored) {
      setOverview(JSON.parse(stored));
    }
    // Optionally, add API fetch logic here if you want to always refresh
  }, []);

  return overview;
} 