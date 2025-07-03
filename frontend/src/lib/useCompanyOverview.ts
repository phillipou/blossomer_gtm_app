import { useState, useEffect } from "react";

export function useCompanyOverview() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dashboard_overview");
    if (stored) {
      setOverview(JSON.parse(stored));
    }
    // Optionally, add API fetch logic here if you want to always refresh
  }, []);

  return overview;
} 