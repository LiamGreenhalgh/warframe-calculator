import type { CalcResult, EquationTerm, ShardColor } from "./types";

export type { ShardColor };

const VIOLET_SOURCE = {
  title: "Violet Archon Shard — Primary Electricity Damage",
  url: "https://wiki.warframe.com/w/Violet_Archon_Shard",
};

const SHARD_SOURCE = {
  title: "Archon Shard",
  url: "https://wiki.warframe.com/w/Archon_Shard",
};

export const ELECTRICITY_ELIGIBLE: ShardColor[] = ["crimson", "azure", "violet"];

export type ShardBuffId =
  | "meleeCritDamage"
  | "primaryStatusChance"
  | "secondaryCritChance"
  | "abilityStrength"
  | "abilityDuration"
  | "energyOnSpawn"
  | "healthOrbEffectiveness"
  | "energyOrbEffectiveness"
  | "castingSpeed"
  | "parkourVelocity"
  | "maxHealth"
  | "shieldCapacity"
  | "energyMax"
  | "armor"
  | "healthRegen"
  | "toxinStatusDamage"
  | "toxinStatusHeal"
  | "abilityDamageCorrosive"
  | "corrosiveMaxStacks"
  | "blastKillHealth"
  | "blastKillShield"
  | "heatKillSecondaryCrit"
  | "abilityDamageRadiation"
  | "abilityDamageElectricity"
  | "primaryElectricity"
  | "violetMeleeCritDamage"
  | "equilibriumOrbs";

export interface SocketedShard {
  color: ShardColor;
  tauforged: boolean;
  buff: ShardBuffId;
}

export interface ShardBuffDef {
  id: ShardBuffId;
  label: string;
  color: ShardColor;
  stacking: "additive" | "flat" | "multiplicative";
  unit: "%" | "flat";
  normal: number;
  tauforged: number;
  notes: string;
  /** Electricity uses a custom formula; this is the base card value only. */
  formulaNote?: string;
}

export const SHARD_BUFFS: ShardBuffDef[] = [
  { id: "meleeCritDamage", label: "Melee Critical Damage", color: "crimson", stacking: "additive", unit: "%", normal: 0.25, tauforged: 0.375, notes: "Additive with Organ Shatter. Affects matching exalted melee." },
  { id: "primaryStatusChance", label: "Primary Status Chance", color: "crimson", stacking: "additive", unit: "%", normal: 0.25, tauforged: 0.375, notes: "Additive with Rifle Aptitude." },
  { id: "secondaryCritChance", label: "Secondary Critical Chance", color: "crimson", stacking: "additive", unit: "%", normal: 0.25, tauforged: 0.375, notes: "Additive with Pistol Gambit." },
  { id: "abilityStrength", label: "Ability Strength", color: "crimson", stacking: "additive", unit: "%", normal: 0.1, tauforged: 0.15, notes: "Additive with Intensify / Blind Rage." },
  { id: "abilityDuration", label: "Ability Duration", color: "crimson", stacking: "additive", unit: "%", normal: 0.1, tauforged: 0.15, notes: "Additive with Continuity." },
  { id: "energyOnSpawn", label: "Maximum Energy filled on spawn", color: "amber", stacking: "additive", unit: "%", normal: 0.3, tauforged: 0.45, notes: "Additive with Preparation." },
  { id: "healthOrbEffectiveness", label: "Health Orb effectiveness", color: "amber", stacking: "additive", unit: "%", normal: 1.0, tauforged: 1.5, notes: "Does not affect Equilibrium / Violet conversion." },
  { id: "energyOrbEffectiveness", label: "Energy Orb effectiveness", color: "amber", stacking: "additive", unit: "%", normal: 0.5, tauforged: 0.75, notes: "Does not affect Equilibrium / Violet conversion." },
  { id: "castingSpeed", label: "Casting Speed", color: "amber", stacking: "additive", unit: "%", normal: 0.25, tauforged: 0.375, notes: "Additive with Natural Talent." },
  { id: "parkourVelocity", label: "Parkour Velocity", color: "amber", stacking: "additive", unit: "%", normal: 0.15, tauforged: 0.225, notes: "Additive with Mobilize." },
  { id: "maxHealth", label: "Max Health", color: "azure", stacking: "flat", unit: "flat", normal: 150, tauforged: 225, notes: "Flat after all percent health bonuses." },
  { id: "shieldCapacity", label: "Shield Capacity", color: "azure", stacking: "flat", unit: "flat", normal: 150, tauforged: 225, notes: "Flat after percent shield bonuses. Ineligible on Inaros / Kullervo / Nidus." },
  { id: "energyMax", label: "Energy Max", color: "azure", stacking: "flat", unit: "flat", normal: 50, tauforged: 75, notes: "Flat after percent energy bonuses. Ineligible on Hildryn / Lavos." },
  { id: "armor", label: "Armor", color: "azure", stacking: "flat", unit: "flat", normal: 150, tauforged: 225, notes: "Flat after percent armor bonuses." },
  { id: "healthRegen", label: "Health regen per second", color: "azure", stacking: "flat", unit: "flat", normal: 5, tauforged: 7.5, notes: "Flat after other regen bonuses." },
  { id: "toxinStatusDamage", label: "Toxin Status Damage", color: "emerald", stacking: "additive", unit: "%", normal: 0.3, tauforged: 0.45, notes: "Additive with Elementalist mods." },
  { id: "toxinStatusHeal", label: "Heal per Toxin status damage instance", color: "emerald", stacking: "flat", unit: "flat", normal: 2, tauforged: 3, notes: "Triggered each time toxin status damages an enemy." },
  { id: "abilityDamageCorrosive", label: "Ability Damage vs Corrosive", color: "emerald", stacking: "additive", unit: "%", normal: 0.1, tauforged: 0.15, notes: "Unique Ability Damage multiplier; additive across shard colors, multiplicative with Strength. Requires Corrosive already on the target." },
  { id: "corrosiveMaxStacks", label: "Bonus Corrosive max stacks", color: "emerald", stacking: "flat", unit: "flat", normal: 2, tauforged: 3, notes: "Only for Corrosive applied by you." },
  { id: "blastKillHealth", label: "Max Health per Blast kill (capped)", color: "topaz", stacking: "flat", unit: "flat", normal: 1, tauforged: 2, notes: "Caps at 300 (450 tauforged) per shard; resets on revive." },
  { id: "blastKillShield", label: "Shield on Blast kill", color: "topaz", stacking: "flat", unit: "flat", normal: 5, tauforged: 7.5, notes: "No overshields. Does not apply during shield gate." },
  { id: "heatKillSecondaryCrit", label: "Secondary CC per Heat-status kill", color: "topaz", stacking: "additive", unit: "%", normal: 0.01, tauforged: 0.015, notes: "Per-shard cap 50%/75%. Caps and per-kill amounts stack across shards." },
  { id: "abilityDamageRadiation", label: "Ability Damage vs Radiation", color: "topaz", stacking: "additive", unit: "%", normal: 0.1, tauforged: 0.15, notes: "Unique Ability Damage multiplier. Requires Radiation already on the target." },
  { id: "abilityDamageElectricity", label: "Ability Damage vs Electricity", color: "violet", stacking: "additive", unit: "%", normal: 0.1, tauforged: 0.15, notes: "Unique Ability Damage multiplier. Requires Electricity already on the target. Volt Discharge pseudo-procs do not count." },
  { id: "primaryElectricity", label: "Primary Electricity Damage", color: "violet", stacking: "additive", unit: "%", normal: 0.3, tauforged: 0.45, notes: "See dedicated electricity formula. Additive with Stormbringer. Combines like an innate element after mods.", formulaNote: "Each electricity shard: base + extra × (Crimson+Azure+Violet count, including itself)." },
  { id: "violetMeleeCritDamage", label: "Melee Critical Damage (Energy gate)", color: "violet", stacking: "additive", unit: "%", normal: 0.25, tauforged: 0.375, notes: "Doubles when max energy is 501 or more. Additive with Organ Shatter." },
  { id: "equilibriumOrbs", label: "Health↔Energy orb conversion", color: "violet", stacking: "additive", unit: "%", normal: 0.2, tauforged: 0.3, notes: "Additive with Equilibrium. Does not interact with Amber orb effectiveness." },
];

export function shardValue(def: ShardBuffDef, tauforged: boolean): number {
  return tauforged ? def.tauforged : def.normal;
}

export function eligibleElectricityCount(shards: SocketedShard[]): number {
  return shards.filter((s) => ELECTRICITY_ELIGIBLE.includes(s.color)).length;
}

/**
 * Documented per-shard electricity contribution.
 * The extra term counts ALL equipped Crimson, Azure, and Violet shards,
 * including the shard granting the bonus.
 *
 * Tauforged: 0.45 + 0.15 × N
 * Normal:    0.30 + 0.10 × N
 */
export function documentedElectricityContribution(
  tauforged: boolean,
  eligibleCount: number,
): number {
  const base = tauforged ? 0.45 : 0.3;
  const extra = tauforged ? 0.15 : 0.1;
  return base + extra * eligibleCount;
}

export function documentedElectricityBonus(shards: SocketedShard[]): number {
  const n = eligibleElectricityCount(shards);
  return shards
    .filter((s) => s.color === "violet" && s.buff === "primaryElectricity")
    .reduce((sum, s) => sum + documentedElectricityContribution(s.tauforged, n), 0);
}

/**
 * Community hypothesis provided by the user:
 *   multiplier = 1 + (0.45 + 0.15(x − 1)) × x
 * i.e. each Tauforged electricity shard gives 45% plus 15% for every *other*
 * purple, then those percents are added across x electricity shards.
 *
 * This disagrees with the wiki: the extra 15% counts the shard itself, and
 * eligible colors are Crimson + Azure + Violet, not "other purples" only.
 */
export function hypothesizedElectricityBonus(electricityShardCount: number): number {
  const x = electricityShardCount;
  return (0.45 + 0.15 * (x - 1)) * x;
}

export function hypothesizedElectricityMultiplier(electricityShardCount: number): number {
  return 1 + hypothesizedElectricityBonus(electricityShardCount);
}

export interface VioletElectricityReport {
  documented: CalcResult;
  hypothesis: CalcResult;
  differs: boolean;
  wikiExamples: Array<{ label: string; bonus: number }>;
  eligibleCount: number;
  electricityCount: number;
}

export function explainVioletElectricity(shards: SocketedShard[]): VioletElectricityReport {
  const n = eligibleElectricityCount(shards);
  const elec = shards.filter((s) => s.color === "violet" && s.buff === "primaryElectricity");
  const documentedBonus = documentedElectricityBonus(shards);
  const hypoBonus = hypothesizedElectricityBonus(elec.length);

  const terms: EquationTerm[] = elec.map((s, i) => ({
    name: `${s.tauforged ? "Tauforged" : "Normal"} violet electricity #${i + 1}`,
    symbol: `s${i + 1}`,
    value: documentedElectricityContribution(s.tauforged, n),
    stacking: "additive",
    notes: s.tauforged
      ? `0.45 + 0.15×${n}`
      : `0.30 + 0.10×${n}`,
  }));

  const documented: CalcResult = {
    id: "violet-elec-documented",
    name: "Primary Electricity bonus (wiki)",
    value: documentedBonus,
    unit: "percent-as-decimal",
    formula:
      "Bonus = Σ_i (base_i + extra_i × N)   where N = # Crimson+Azure+Violet shards (includes itself)",
    latex: String.raw`E=\sum_i \left(b_i + e_i N\right),\quad N=\#\{\text{Crimson, Azure, Violet}\}`,
    substituted: elec.length
      ? `N=${n}; E = ${elec
          .map((s) => documentedElectricityContribution(s.tauforged, n))
          .join(" + ")} = ${documentedBonus}`
      : "No violet electricity shards socketed → 0",
    stacking: "additive",
    terms: [
      { name: "Eligible C/A/V shards", symbol: "N", value: n, stacking: "flat" },
      ...terms,
    ],
    source: VIOLET_SOURCE,
    kind: "documented",
  };

  const hypothesis: CalcResult = {
    id: "violet-elec-hypothesis",
    name: "Community hypothesis (not official)",
    value: hypoBonus,
    unit: "percent-as-decimal",
    formula: "1 + (0.45 + 0.15(x − 1)) × x   → bonus = (0.45 + 0.15(x − 1)) × x",
    latex: String.raw`1 + \big(0.45 + 0.15(x-1)\big)x`,
    substituted: `x=${elec.length} electricity shards; bonus = (0.45 + 0.15×${Math.max(elec.length - 1, 0)}) × ${elec.length} = ${hypoBonus}`,
    stacking: "additive",
    terms: [
      { name: "Electricity shard count (x)", symbol: "x", value: elec.length, stacking: "flat" },
    ],
    source: {
      title: "User-provided community hypothesis",
      url: "https://wiki.warframe.com/w/Violet_Archon_Shard",
      notes: "Assumes every electricity shard is Tauforged and that +15% only counts other purples. Wiki examples contradict this.",
    },
    assumption:
      "Treats extra +15% as 'each other purple' (x−1) and ignores Crimson/Azure eligibility. Not used as the official result.",
    kind: "hypothesis",
  };

  return {
    documented,
    hypothesis,
    differs: Math.abs(documentedBonus - hypoBonus) > 1e-9,
    wikiExamples: [
      { label: "1 Tauforged electricity", bonus: 0.6 },
      { label: "2 Tauforged electricity", bonus: 1.5 },
      { label: "2 Tauforged electricity + 3 Crimson", bonus: 2.4 },
      { label: "5 Tauforged electricity", bonus: 6.0 },
    ],
    eligibleCount: n,
    electricityCount: elec.length,
  };
}

export function sumAbilityDamageBonus(shards: SocketedShard[]): number {
  const ids: ShardBuffId[] = [
    "abilityDamageElectricity",
    "abilityDamageRadiation",
    "abilityDamageCorrosive",
  ];
  return shards
    .filter((s) => ids.includes(s.buff))
    .reduce((sum, s) => {
      const def = SHARD_BUFFS.find((d) => d.id === s.buff);
      return def ? sum + shardValue(def, s.tauforged) : sum;
    }, 0);
}

export function sumBuff(shards: SocketedShard[], buff: ShardBuffId): number {
  const def = SHARD_BUFFS.find((d) => d.id === buff);
  if (!def) return 0;
  return shards
    .filter((s) => s.buff === buff)
    .reduce((sum, s) => sum + shardValue(def, s.tauforged), 0);
}

export function violetMeleeCritDamage(
  shards: SocketedShard[],
  maxEnergy: number,
): CalcResult {
  const def = SHARD_BUFFS.find((d) => d.id === "violetMeleeCritDamage")!;
  const raw = shards
    .filter((s) => s.buff === "violetMeleeCritDamage")
    .reduce((sum, s) => sum + shardValue(def, s.tauforged), 0);
  const doubles = maxEnergy > 500;
  const value = doubles ? raw * 2 : raw;
  return {
    id: "violet-melee-cd",
    name: "Violet melee crit damage",
    value,
    formula: "Bonus = Σ shard CD × (2 if MaxEnergy ≥ 501 else 1)",
    latex: String.raw`B=\sum s_i \times \begin{cases}2 & E_{\max}>500\\1 & \text{otherwise}\end{cases}`,
    substituted: `raw=${raw}; maxEnergy=${maxEnergy}; doubled=${doubles} → ${value}`,
    stacking: "additive",
    terms: [
      { name: "Raw shard CD", symbol: "s", value: raw, stacking: "additive" },
      { name: "Max energy", symbol: "E", value: maxEnergy, stacking: "flat" },
    ],
    source: VIOLET_SOURCE,
    kind: "documented",
  };
}

export { SHARD_SOURCE, VIOLET_SOURCE };
