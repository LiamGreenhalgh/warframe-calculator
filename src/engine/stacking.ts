import type { Bonus, CalcResult, EquationTerm, OperationType, StackingClass } from "./types";

const SOURCE = {
  title: "Calculating Bonuses",
  url: "https://wiki.warframe.com/w/Calculating_Bonuses",
};

export interface StackingBreakdown {
  result: number;
  groups: Array<{
    group: string;
    operation: OperationType;
    sum: number;
    multiplier: number;
    bonuses: Bonus[];
    stacking: StackingClass;
  }>;
  flats: Bonus[];
  sets: Bonus[];
  formula: string;
  substituted: string;
  resultAsCalc: CalcResult;
}

/**
 * Apply Warframe bonus stacking.
 *
 * Order of operations (wiki):
 * 1. SET overrides (rare; punch through 0, Acuity locking multishot)
 * 2. STACKING_MULTIPLY groups: each group sums, then groups multiply: Π(1 + Σ group)
 * 3. MULTIPLY entries are each their own multiplicative group
 * 4. ADD flats applied after percentages
 *
 * Percent bonuses are decimals: +165% Serration is 1.65, not 165.
 */
export function applyBonuses(base: number, bonuses: Bonus[]): StackingBreakdown {
  const sets = bonuses.filter((b) => b.operation === "SET");
  if (sets.length > 0) {
    const last = sets[sets.length - 1];
    return {
      result: last.value,
      groups: [],
      flats: [],
      sets,
      formula: "Result = SET(last override)",
      substituted: `Result = ${last.value} (${last.name})`,
      resultAsCalc: makeResult(last.value, base, bonuses, "set", "Result = SET override", `${last.name} sets the stat to ${last.value}`),
    };
  }

  const groups = new Map<
    string,
    { operation: OperationType; bonuses: Bonus[] }
  >();

  for (const bonus of bonuses) {
    if (bonus.operation === "ADD") continue;
    if (bonus.operation === "SET") continue;
    const key =
      bonus.operation === "MULTIPLY"
        ? `multiply:${bonus.id}`
        : bonus.group ?? bonus.stat;
    const existing = groups.get(key);
    if (existing) existing.bonuses.push(bonus);
    else groups.set(key, { operation: bonus.operation, bonuses: [bonus] });
  }

  const groupRows: StackingBreakdown["groups"] = [];
  let product = 1;
  const productParts: string[] = [];

  for (const [group, { operation, bonuses: list }] of groups) {
    const sum = list.reduce((acc, b) => acc + b.value, 0);
    const multiplier = 1 + sum;
    product *= multiplier;
    groupRows.push({
      group,
      operation,
      sum,
      multiplier,
      bonuses: list,
      stacking: operation === "MULTIPLY" ? "multiplicative" : "additive",
    });
    productParts.push(`(1 + ${sum})`);
  }

  const flats = bonuses.filter((b) => b.operation === "ADD");
  const flatSum = flats.reduce((acc, b) => acc + b.value, 0);
  const result = base * product + flatSum;

  const formula =
    "Result = [Base × Π(1 + Σ additive% in group)] + Σ flat";
  const substituted = `Result = [${base} × ${productParts.length ? productParts.join(" × ") : "1"}] + ${flatSum} = ${result}`;

  return {
    result,
    groups: groupRows,
    flats,
    sets,
    formula,
    substituted,
    resultAsCalc: makeResult(
      result,
      base,
      bonuses,
      flats.length && groupRows.length ? "mixed" : flats.length ? "flat" : groupRows.some((g) => g.stacking === "multiplicative") && groupRows.some((g) => g.stacking === "additive") ? "mixed" : groupRows[0]?.stacking ?? "additive",
      formula,
      substituted,
    ),
  };
}

function makeResult(
  value: number,
  base: number,
  bonuses: Bonus[],
  stacking: StackingClass,
  formula: string,
  substituted: string,
): CalcResult {
  const terms: EquationTerm[] = [
    { name: "Base stat", symbol: "B", value: base, stacking: "additive" },
    ...bonuses.map((b) => ({
      name: b.name,
      symbol: b.stat,
      value: b.value,
      stacking: stackingOf(b.operation),
      notes: `${b.operation}${b.group ? ` / group ${b.group}` : ""}`,
    })),
  ];
  return {
    id: "stacking",
    name: "Stacked stat",
    value,
    formula,
    latex: String.raw`R = \left[B \prod_g \left(1 + \sum_{i \in g} b_i\right)\right] + \sum f`,
    substituted,
    stacking,
    terms,
    source: SOURCE,
    kind: "documented",
  };
}

export function stackingOf(op: OperationType): StackingClass {
  switch (op) {
    case "ADD":
      return "flat";
    case "STACKING_MULTIPLY":
      return "additive";
    case "MULTIPLY":
      return "multiplicative";
    case "SET":
      return "set";
  }
}

/** Convert a Warframe +X% card value into a decimal (165 → 1.65). */
export function percentCardToDecimal(cardPercent: number): number {
  return cardPercent / 100;
}

export function additivePercentMultiplier(decimals: number[]): number {
  return 1 + decimals.reduce((a, b) => a + b, 0);
}

export function multiplicativePercentMultiplier(decimals: number[]): number {
  return decimals.reduce((acc, d) => acc * (1 + d), 1);
}

export function compareAdditiveVsMultiplicative(decimals: number[]): {
  additiveMultiplier: number;
  multiplicativeMultiplier: number;
  additiveBonus: number;
  multiplicativeBonus: number;
} {
  const additiveMultiplier = additivePercentMultiplier(decimals);
  const multiplicativeMultiplier = multiplicativePercentMultiplier(decimals);
  return {
    additiveMultiplier,
    multiplicativeMultiplier,
    additiveBonus: additiveMultiplier - 1,
    multiplicativeBonus: multiplicativeMultiplier - 1,
  };
}
