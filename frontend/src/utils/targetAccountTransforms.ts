import type { TargetAccount, TargetAccountDetail, FirmographicRow, BuyingSignal } from "../types/api";

export function transformTargetAccountToDetail(targetAccount: TargetAccount): TargetAccountDetail {
  // Transform firmographics from object to array format if needed
  let firmographicsArray: FirmographicRow[] = [];
  if (targetAccount.firmographics) {
    if (Array.isArray(targetAccount.firmographics)) {
      firmographicsArray = targetAccount.firmographics;
    } else {
      // Transform object format to array format
      firmographicsArray = transformFirmographicsToTable(targetAccount.firmographics as Record<string, string | string[] | Record<string, string>>);
    }
  }

  return {
    id: targetAccount.id,
    title: targetAccount.name,
    description: targetAccount.description,
    rationale: targetAccount.rationale || "",
    firmographics: firmographicsArray,
    buyingSignals: targetAccount.buyingSignals || [],
  };
}

// These functions are likely used elsewhere to transform raw data into the FirmographicRow[] and BuyingSignal[] formats.
// They are not needed for transforming TargetAccount to TargetAccountDetail if TargetAccount already stores these as arrays.
// Keeping them here for now as they might be used by other parts of the application.

export function transformFirmographicsToTable(firmographics: Record<string, string | string[] | Record<string, string>>): FirmographicRow[] {
  const colorMap: { [key: string]: string } = {
    industry: "blue",
    company_size: "green", 
    geography: "purple",
    business_model: "orange",
    funding_stage: "red"
  };

  return Object.entries(firmographics).map(([key, values]) => {
    if (key === "company_size" && typeof values === "object" && values !== null) {
      // Handle nested company size object with employees and revenue
      const sizeObj = values as Record<string, string>;
      const sizeValues = Object.entries(sizeObj).map(([subKey, subValue]) => ({
        text: `${subKey.charAt(0).toUpperCase() + subKey.slice(1)}: ${subValue}`,
        color: colorMap[key] || "gray"
      }));
      return {
        id: key,
        label: "Company Size",
        values: sizeValues
      };
    }
    return {
      id: key,
      label: key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      values: Array.isArray(values)
        ? values.map(value => ({
            text: String(value),
            color: colorMap[key] || "gray"
          }))
        : typeof values === "object" && values !== null
          ? Object.values(values).map(value => ({
              text: String(value),
              color: colorMap[key] || "gray"
            }))
          : [{
              text: String(values),
              color: colorMap[key] || "gray"
            }]
    };
  });
}

export function transformBuyingSignalsToCards(buyingSignals: Record<string, string[]> | BuyingSignal[]): BuyingSignal[] {
  // If it's already an array of BuyingSignal objects, return as is
  if (Array.isArray(buyingSignals) && buyingSignals.length > 0 && 'id' in buyingSignals[0]) {
    return buyingSignals;
  }

  const signals: BuyingSignal[] = [];
  
  // Handle nested object structure
  if (!Array.isArray(buyingSignals)) {
    Object.entries(buyingSignals).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(signal => {
          signals.push({
            id: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: signal,
            description: `${category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}: ${signal}`,
            enabled: true,
          });
        });
      }
    });
  }

  return signals;
} 