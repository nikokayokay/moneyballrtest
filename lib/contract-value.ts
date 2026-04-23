export interface ContractValueInput {
  playerId: string | number;
  name: string;
  team?: string;
  salaryMillions?: number;
  valueScore: number;
  projectedWar?: number;
}

export interface ContractValueResult extends ContractValueInput {
  valuePerMillion: number;
  surplusScore: number;
  label: "surplus" | "fair" | "expensive" | "unknown cost";
}

export function calculateContractValue(input: ContractValueInput): ContractValueResult {
  if (!input.salaryMillions || input.salaryMillions <= 0) {
    return { ...input, valuePerMillion: input.valueScore, surplusScore: input.valueScore, label: "unknown cost" };
  }
  const valuePerMillion = Number((input.valueScore / input.salaryMillions).toFixed(2));
  const warValue = (input.projectedWar || input.valueScore / 18) * 8.5;
  const surplusScore = Math.round((warValue - input.salaryMillions) * 4 + 50);
  return {
    ...input,
    valuePerMillion,
    surplusScore,
    label: surplusScore >= 62 ? "surplus" : surplusScore <= 42 ? "expensive" : "fair",
  };
}
