import type { TargetAccount } from "../types/api";

export function transformFirmographicsToTable(firmographics: Record<string, any>) {
  const colorMap: { [key: string]: string } = {
    industry: "blue",
    company_size: "green", 
    geography: "purple",
    business_model: "orange",
    funding_stage: "red"
  };

  return Object.entries(firmographics).map(([key, values]) => {
    if (key === "company_size" && typeof values === "object" && values !== null) {
      // Preserve subfields for flattening in the table
      return {
        id: key,
        label: "Company Size",
        values: [{ ...values, color: colorMap[key] || "gray" }]
      };
    }
    return {
      id: key,
      label: key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      values: Array.isArray(values)
        ? values.map(value => ({
            text: value,
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

export function transformBuyingSignalsToCards(buyingSignals: Record<string, string[]>) {
  const signals: any[] = [];
  let signalId = 0;

  Object.entries(buyingSignals).forEach(([category, items]) => {
    items.forEach(signal => {
      signals.push({
        id: String(signalId++),
        label: signal,
        description: "", // Keep simple - no descriptions needed
        enabled: true,
        category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      });
    });
  });

  return signals;
}

export function transformTargetAccountToDetail(targetAccount: TargetAccount) {
  return {
    id: targetAccount.id,
    title: targetAccount.name,
    subtitle: `Target Account Profile`,
    description: targetAccount.description,
    rationale: targetAccount.rationale,
    firmographics: transformFirmographicsToTable(targetAccount.firmographics || {}),
    buyingSignals: transformBuyingSignalsToCards(targetAccount.buying_signals || {}),
    createdAt: targetAccount.created_at
  };
} 