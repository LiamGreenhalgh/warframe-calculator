import type { CalcResult, DamageType, HealthClass } from "./types";

const ARMOR_SOURCE = {
  title: "Armor",
  url: "https://wiki.warframe.com/w/Armor",
};

const CALC_SOURCE = {
  title: "Damage/Calculation — Armored Enemies",
  url: "https://wiki.warframe.com/w/Damage/Calculation",
};

const DR_SOURCE = {
  title: "Damage Reduction",
  url: "https://wiki.warframe.com/w/Damage_Reduction",
};

/** Tenno / Warframe armor: DR = AR / (AR + 300). Unchanged by the enemy armor rework. */
export function tennoArmorDR(armor: number): number {
  if (armor <= 0) return 0;
  return armor / (armor + 300);
}

export function tennoDamageTakenMultiplier(armor: number): number {
  return 1 - tennoArmorDR(armor);
}

/**
 * Enemy armor (standard NPC, Net Armor ≤ 2700):
 *   DR = 0.9 × √(NetArmor / 2700)
 *
 * wiki.warframe.com HTML flattens the radical; the Fandom page and the
 * 2700→90% cap both match the square-root form. If Net Armor exceeds 2700
 * in an exceptional case, wiki falls back to AR/(AR+300).
 */
export function enemyArmorDR(armor: number): number {
  if (armor <= 0) return 0;
  if (armor > 2700) return armor / (armor + 300);
  return 0.9 * Math.sqrt(armor / 2700);
}

export function enemyDamageTakenMultiplier(armor: number): number {
  return 1 - enemyArmorDR(armor);
}

export function ehpFromArmor(nominalHealth: number, armor: number, kind: "tenno" | "enemy"): number {
  const taken = kind === "tenno" ? tennoDamageTakenMultiplier(armor) : enemyDamageTakenMultiplier(armor);
  if (taken <= 0) return Number.POSITIVE_INFINITY;
  return nominalHealth / taken;
}

export function explainArmor(
  armor: number,
  kind: "tenno" | "enemy",
  nominalHealth = 1000,
): CalcResult {
  const dr = kind === "tenno" ? tennoArmorDR(armor) : enemyArmorDR(armor);
  const ehp = ehpFromArmor(nominalHealth, armor, kind);
  const formula =
    kind === "tenno"
      ? "DR = AR / (AR + 300);  EHP = H / (1 − DR)"
      : armor > 2700
        ? "Exceptional AR>2700: DR = AR/(AR+300)"
        : "DR = 0.9 × √(AR / 2700);  EHP = H / (1 − DR)";
  return {
    id: `armor-dr-${kind}`,
    name: kind === "tenno" ? "Tenno armor damage reduction" : "Enemy armor damage reduction",
    value: dr,
    unit: "fraction",
    formula,
    latex:
      kind === "tenno"
        ? String.raw`DR=\frac{AR}{AR+300}`
        : String.raw`DR=0.9\sqrt{AR/2700}`,
    substituted: `AR=${armor} → DR=${dr} (${(dr * 100).toFixed(2)}%); EHP(${nominalHealth})=${ehp}`,
    stacking: "multiplicative",
    terms: [
      { name: "Net armor", symbol: "AR", value: armor, stacking: "flat" },
      { name: "Nominal health", symbol: "H", value: nominalHealth, stacking: "flat" },
    ],
    source: kind === "tenno" ? ARMOR_SOURCE : { ...ARMOR_SOURCE, notes: "Square-root form: wiki.warframe.com/w/Armor and warframe.fandom.com/wiki/Armor. Enemy scaling clamps initial armor to 200–2700." },
    kind: "documented",
  };
}

/**
 * Corrosive status armor strip. Base cap is 10 stacks (80% armor removed at 10).
 * Emerald shards can raise the cap for YOUR corrosive.
 * Full 10 stacks = 80% armor remaining multiplier → 20% remaining? 
 *
 * Documented: each Corrosive stack reduces armor. The current wiki value is
 * −26% armor on first proc then diminishing, totaling 80% at 10 stacks.
 * We use the published 80% at 10 stacks linear-in-effect approximation only
 * when stack count is 10; otherwise the per-stack table below.
 */
export const CORROSIVE_ARMOR_REMAINING: Record<number, number> = {
  0: 1,
  1: 0.74,
  2: 0.56,
  3: 0.42,
  4: 0.32,
  5: 0.26,
  6: 0.22,
  7: 0.2,
  8: 0.2,
  9: 0.2,
  10: 0.2,
};

/**
 * Heat status also strips armor (up to 50% at full stacks). Community/wiki:
 * Heat armor reduction ramps to 50%. Treated as multiplicative with Corrosive
 * remaining armor (both are remaining-armor multipliers).
 */
export function heatArmorRemaining(heatStacks: number): number {
  const stacks = Math.min(Math.max(heatStacks, 0), 10);
  return 1 - 0.5 * (stacks / 10);
}

export function netArmorAfterStrips(
  baseArmor: number,
  opts: { corrosiveStacks?: number; heatStacks?: number; otherRemaining?: number },
): number {
  const corr = CORROSIVE_ARMOR_REMAINING[Math.min(10, Math.max(0, opts.corrosiveStacks ?? 0))] ?? 0.2;
  const heat = heatArmorRemaining(opts.heatStacks ?? 0);
  const other = opts.otherRemaining ?? 1;
  return Math.max(0, baseArmor * corr * heat * other);
}

/** Damage type modifiers vs health / armor / shield classes. Values from the Damage wiki. */
export const TYPE_MODIFIERS: Record<HealthClass, Partial<Record<DamageType, number>>> = {
  clonedFlesh: { slash: 0.25, heat: 0.25, viral: 0.75, gas: -0.5, impact: -0.25 },
  ferriteArmor: { puncture: 0.5, toxin: 0.25, corrosive: 0.75, slash: -0.15, blast: -0.25 },
  alloyArmor: { puncture: 0.15, cold: 0.25, radiation: 0.75, slash: -0.5, electricity: -0.5, magnetic: -0.5 },
  flesh: { slash: 0.25, toxin: 0.5, viral: 0.75, gas: -0.25 },
  shield: { impact: 0.5, puncture: -0.2, cold: -0.5, magnetic: 0.75 },
  protoShield: { impact: 0.15, puncture: -0.5, toxin: 0.25, magnetic: 0.75, heat: -0.5, radiation: -0.1 },
  infested: { slash: 0.25, heat: 0.25, gas: 0.75, radiation: -0.5, viral: -0.5 },
  fossilized: { slash: 0.15, cold: -0.25, blast: 0.5, corrosive: 0.75, radiation: -0.75, viral: -0.5 },
  infestedSinew: { puncture: 0.25, cold: 0.25, radiation: 0.5, blast: -0.5, slash: -0.5 },
  machinery: { electricity: 0.5, impact: 0.25, blast: 0.75, toxin: -0.25, viral: -0.25 },
  robotic: { puncture: 0.25, electricity: 0.5, radiation: 0.25, slash: -0.25 },
  overguard: {},
};

export interface EnemyProfile {
  id: string;
  name: string;
  faction: string;
  health: HealthClass;
  armorClass?: HealthClass;
  shieldClass?: HealthClass;
  baseArmor: number;
  notes: string;
}

export const ENEMY_PROFILES: EnemyProfile[] = [
  { id: "grineer-lancers", name: "Grineer Lancer (Ferrite)", faction: "Grineer", health: "clonedFlesh", armorClass: "ferriteArmor", baseArmor: 500, notes: "Typical Ferrite-armored Grineer." },
  { id: "grineer-bombards", name: "Grineer Bombard (Alloy)", faction: "Grineer", health: "clonedFlesh", armorClass: "alloyArmor", baseArmor: 900, notes: "Alloy armor; Radiation / Cold / Puncture favored." },
  { id: "corpus-crewman", name: "Corpus Crewman", faction: "Corpus", health: "flesh", shieldClass: "shield", baseArmor: 0, notes: "Shields first. Toxin bypasses shields on most targets." },
  { id: "corpus-tech", name: "Corpus Tech (Proto Shield)", faction: "Corpus", health: "flesh", shieldClass: "protoShield", baseArmor: 0, notes: "Proto Shields resist Heat." },
  { id: "infested-charger", name: "Infested Charger", faction: "Infested", health: "infested", baseArmor: 0, notes: "Unarmored Infested health. Slash / Heat / Gas." },
  { id: "unarmored", name: "Unarmored (no type mods)", faction: "Neutral", health: "flesh", baseArmor: 0, notes: "Type modifiers ignored for isolation tests." },
];

export function typeModifier(healthClass: HealthClass | undefined, type: DamageType): number {
  if (!healthClass) return 0;
  return TYPE_MODIFIERS[healthClass]?.[type] ?? 0;
}

export function mitigatedHit(opts: {
  damageType: DamageType;
  amount: number;
  profile: EnemyProfile;
  netArmor: number;
  hitting: "health" | "shields";
}): { inflicted: number; steps: string[]; result: CalcResult } {
  const { damageType, amount, profile, netArmor, hitting } = opts;
  const steps: string[] = [];
  let inflicted = amount;

  if (hitting === "shields") {
    const sm = typeModifier(profile.shieldClass, damageType);
    inflicted *= 1 + sm;
    steps.push(`Shield type mod ${damageType} vs ${profile.shieldClass ?? "none"}: ${sm >= 0 ? "+" : ""}${(sm * 100).toFixed(0)}%`);
    if (damageType === "toxin") {
      steps.push("Toxin bypasses most shields and would instead hit health. This path models a shield hit only if the target is immune to bypass.");
    }
  } else {
    const hm = profile.id === "unarmored" ? 0 : typeModifier(profile.health, damageType);
    inflicted *= 1 + hm;
    steps.push(`Health type mod ${damageType} vs ${profile.health}: ${hm >= 0 ? "+" : ""}${(hm * 100).toFixed(0)}%`);
    if (profile.armorClass && netArmor > 0) {
      const am = profile.id === "unarmored" ? 0 : typeModifier(profile.armorClass, damageType);
      inflicted *= 1 + am;
      steps.push(`Armor type mod ${damageType} vs ${profile.armorClass}: ${am >= 0 ? "+" : ""}${(am * 100).toFixed(0)}%`);
      if (damageType === "slash" || damageType === "true" || damageType === "cinematic") {
        steps.push("Slash Bleed (cinematic) ignores armor; this is direct-hit Slash, which does not.");
      }
      const dr = enemyArmorDR(netArmor);
      inflicted *= 1 - dr;
      steps.push(`Enemy armor DR at AR=${netArmor}: ${(dr * 100).toFixed(2)}% → ×${(1 - dr).toFixed(4)}`);
    }
  }

  const result: CalcResult = {
    id: "mitigated-hit",
    name: "Mitigated hit",
    value: inflicted,
    formula:
      hitting === "shields"
        ? "Inflicted = SD × (1 + shield type mod)"
        : "Inflicted = SD × (1 + health mod) × (1 + armor type mod) × (1 − enemy DR)",
    substituted: steps.join(" → ") + ` → ${inflicted}`,
    stacking: "multiplicative",
    terms: [
      { name: "Starting damage", symbol: "SD", value: amount, stacking: "additive" },
      { name: "Net armor", symbol: "AR", value: netArmor, stacking: "flat" },
    ],
    source: CALC_SOURCE,
    assumption:
      "Armor type modifiers are applied as a separate (1+AM) term times the sqrt enemy DR. The wiki's simplified armored formula ignores type modifiers; combining them this way is labeled because the pages treat type mods and armor DR as independent.",
    kind: "estimate",
  };

  return { inflicted, steps, result };
}

export { ARMOR_SOURCE, CALC_SOURCE, DR_SOURCE };
