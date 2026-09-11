import type { CalcResult, CritTierName } from "./types";

const SOURCE = {
  title: "Damage/Calculation — Average Shot / Critical Hit",
  url: "https://wiki.warframe.com/w/Damage/Calculation",
};

/**
 * Crit chance is a decimal (1.0 = 100%, 2.5 = 250%).
 * Tier n ∈ {0,1,2,...} maps to white / yellow / orange / red+.
 * Multiplier for tier t: 1 + t × (critMult − 1)
 */
export function critTierName(tier: number): CritTierName {
  if (tier <= 0) return "white";
  if (tier === 1) return "yellow";
  if (tier === 2) return "orange";
  return "red";
}

export function critMultiplierForTier(tier: number, critMultiplier: number): number {
  return 1 + tier * (critMultiplier - 1);
}

export function critTiers(moddedCritChance: number): {
  lowTier: number;
  highTier: number;
  highChance: number;
  lowChance: number;
} {
  const lowTier = Math.floor(moddedCritChance);
  const highTier = Math.ceil(moddedCritChance);
  const highChance = moddedCritChance - lowTier;
  const lowChance = 1 - highChance;
  return { lowTier, highTier, highChance, lowChance };
}

export function averageCritMultiplier(
  moddedCritChance: number,
  critMultiplier: number,
): number {
  return 1 + moddedCritChance * (critMultiplier - 1);
}

export function normalShotMultiplier(
  moddedCritChance: number,
  critMultiplier: number,
): number {
  return 1 + Math.floor(moddedCritChance) * (critMultiplier - 1);
}

export function criticalShotMultiplier(
  moddedCritChance: number,
  critMultiplier: number,
): number {
  return 1 + Math.ceil(moddedCritChance) * (critMultiplier - 1);
}

export function describeCrit(moddedCritChance: number, critMultiplier: number): {
  average: CalcResult;
  yellow: CalcResult;
  orange: CalcResult;
  red: CalcResult;
  mix: string;
} {
  const { lowTier, highTier, highChance, lowChance } = critTiers(moddedCritChance);
  const avg = averageCritMultiplier(moddedCritChance, critMultiplier);
  const mk = (id: string, name: string, tier: number): CalcResult => ({
    id,
    name,
    value: critMultiplierForTier(tier, critMultiplier),
    formula: "CritMult_t = 1 + t × (M − 1)",
    latex: String.raw`C_t = 1 + t(M-1)`,
    substituted: `t=${tier}, M=${critMultiplier} → ${critMultiplierForTier(tier, critMultiplier)}`,
    stacking: "multiplicative",
    terms: [
      { name: "Crit tier", symbol: "t", value: tier, stacking: "flat" },
      { name: "Modded crit multiplier", symbol: "M", value: critMultiplier, stacking: "additive" },
    ],
    source: SOURCE,
    kind: "documented",
  });

  return {
    average: {
      id: "avg-crit",
      name: "Average crit multiplier",
      value: avg,
      formula: "Avg = 1 + CC × (M − 1)",
      latex: String.raw`\bar{C} = 1 + CC(M-1)`,
      substituted: `1 + ${moddedCritChance} × (${critMultiplier} − 1) = ${avg}`,
      stacking: "multiplicative",
      terms: [
        { name: "Modded crit chance", symbol: "CC", value: moddedCritChance, stacking: "additive", notes: "1.0 = 100%" },
        { name: "Modded crit multiplier", symbol: "M", value: critMultiplier, stacking: "additive" },
      ],
      source: SOURCE,
      kind: "documented",
    },
    yellow: mk("yellow-crit", "Yellow crit (tier 1)", 1),
    orange: mk("orange-crit", "Orange crit (tier 2)", 2),
    red: mk("red-crit", "Red crit (tier 3)", 3),
    mix: `${(lowChance * 100).toFixed(0)}% ${critTierName(lowTier)} (t=${lowTier}) / ${(highChance * 100).toFixed(0)}% ${critTierName(highTier)} (t=${highTier})`,
  };
}
