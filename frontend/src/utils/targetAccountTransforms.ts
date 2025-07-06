import type { TargetAccount, TargetAccountResponse, FirmographicRow, APIBuyingSignal, BuyingSignal } from "../types/api";

// These functions are likely used elsewhere to transform raw data into the FirmographicRow[] and BuyingSignal[] formats.
// They are not needed for transforming TargetAccount to TargetAccountDetail if TargetAccount already stores these as arrays.
// Keeping them here for now as they might be used by other parts of the application.

export function transformFirmographicsToTable(firmographics: Record<string, string | string[]>): FirmographicRow[] {
  const colorMap: { [key: string]: string } = {
    industry: "blue",
    employees: "green",
    departmentSize: "green",
    revenue: "green",
    geography: "purple",
    businessModel: "orange",
    fundingStage: "red",
    companyType: "gray",
    keywords: "gray"
  };

  return Object.entries(firmographics)
    .map(([key, values]) => {
      if (!colorMap.hasOwnProperty(key)) return null;
      return {
        id: key,
        label: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace(/_/g, ' '),
        values: Array.isArray(values)
          ? values.map(value => ({
              text: String(value),
              color: colorMap[key] || "gray"
            }))
          : [{
              text: String(values),
              color: colorMap[key] || "gray"
            }]
      };
    })
    .filter((row): row is FirmographicRow => row !== null);
}

// Transform APIBuyingSignal[] to BuyingSignal[] for UI rendering
export function transformBuyingSignalsToCards(buyingSignals: APIBuyingSignal[] | BuyingSignal[]): BuyingSignal[] {
  // If already in UI format, return as is
  if (Array.isArray(buyingSignals) && buyingSignals.length > 0 && 'id' in buyingSignals[0]) {
    return buyingSignals as BuyingSignal[];
  }
  // Map APIBuyingSignal to BuyingSignal for UI
  return (buyingSignals as APIBuyingSignal[]).map((signal, idx) => ({
    id: `${signal.title}_${idx}`,
    label: signal.title,
    description: signal.description,
    enabled: true,
    category: signal.type,
    type: signal.type,
    priority: signal.priority,
    detectionMethod: signal.detectionMethod,
  }));
} 