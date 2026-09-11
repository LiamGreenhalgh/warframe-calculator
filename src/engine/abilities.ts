import type { Bonus, CalcResult } from "./types";
import { applyBonuses } from "./stacking";

const STR_SOURCE = {
  title: "Ability Strength",
  url: "https://wiki.warframe.com/w/Ability_Strength",
};
const DUR_SOURCE = {
  title: "Ability Duration",
  url: "https://wiki.warframe.com/w/Ability_Duration",
};
const RNG_SOURCE = {
  title: "Ability Range",
  url: "https://wiki.warframe.com/w/Ability_Range",
};
const EFF_SOURCE = {
  title: "Ability Efficiency",
  url: "https://wiki.warframe.com/w/Ability_Efficiency",
};

export interface AbilityModInput {
  strengthBonuses: Bonus[];
  durationBonuses: Bonus[];
  rangeBonuses: Bonus[];
  efficiencyBonuses: Bonus[];
  baseCastCost: number;
  baseDrainPerSecond: number;
  baseAbilityDamage: number;
  baseDuration: number;
  baseRange: number;
  /** Unique shard Ability Damage, decimal. Multiplicative with Strength. */
  shardAbilityDamage?: number;
}

export interface AbilityReport {
  strength: CalcResult;
  duration: CalcResult;
  range: CalcResult;
  efficiency: CalcResult;
  castCost: CalcResult;
  channelDrain: CalcResult;
  scaledDamage: CalcResult;
}

function statResult(
  id: string,
  name: string,
  base: number,
  bonuses: Bonus[],
  source: { title: string; url: string },
): CalcResult {
  const stacked = applyBonuses(base, bonuses);
  return {
    ...stacked.resultAsCalc,
    id,
    name,
    source,
    formula: `${name} = Base × (1 + Σ additive % bonuses) + Σ flats`,
    substituted: stacked.substituted,
  };
}

/**
 * Final Ability Cost = Cost × max(2 − Efficiency, 0.25)
 * Efficiency is a decimal where 1.0 = 100%, 1.75 = 175%.
 * Arsenal hides values outside 25%–175% for non-channeled costs.
 */
export function finalCastCost(baseCost: number, efficiency: number): number {
  return baseCost * Math.max(2 - efficiency, 0.25);
}

/**
 * Channel drain uses uncapped efficiency:
 *   M = B × max(min((2 − E) / D, 1.75), 0.25)
 * Equivalent wiki forms:
 *   Final Energy Drain = Drain × max(2 − E/D, 0.25)
 *   M = B × (2 − E) × (1 / D) then clamp to 25%–175% of base.
 */
export function finalChannelDrain(
  baseDrain: number,
  efficiency: number,
  duration: number,
): number {
  const durationSafe = duration <= 0 ? Number.EPSILON : duration;
  const rawFactor = (2 - efficiency) / durationSafe;
  const clamped = Math.min(1.75, Math.max(0.25, rawFactor));
  return baseDrain * clamped;
}

export function calculateAbilities(input: AbilityModInput): AbilityReport {
  const strength = applyBonuses(1, input.strengthBonuses).result;
  const duration = applyBonuses(1, input.durationBonuses).result;
  const range = applyBonuses(1, input.rangeBonuses).result;
  const efficiency = applyBonuses(1, input.efficiencyBonuses).result;

  const cost = finalCastCost(input.baseCastCost, efficiency);
  const drain = finalChannelDrain(input.baseDrainPerSecond, efficiency, duration);
  const shard = input.shardAbilityDamage ?? 0;
  const scaled = input.baseAbilityDamage * strength * (1 + shard);

  return {
    strength: statResult("ability-strength", "Ability Strength", 1, input.strengthBonuses, STR_SOURCE),
    duration: statResult("ability-duration", "Ability Duration", 1, input.durationBonuses, DUR_SOURCE),
    range: statResult("ability-range", "Ability Range", 1, input.rangeBonuses, RNG_SOURCE),
    efficiency: {
      ...statResult("ability-efficiency", "Ability Efficiency", 1, input.efficiencyBonuses, EFF_SOURCE),
      assumption: "Arsenal displays Efficiency clamped to 25%–175% for cast cost. Channel drain uses the uncapped value.",
    },
    castCost: {
      id: "cast-cost",
      name: "Cast energy cost",
      value: cost,
      formula: "Cost = BaseCost × max(2 − Efficiency, 0.25)",
      latex: String.raw`C = C_0 \cdot \max(2-E, 0.25)`,
      substituted: `${input.baseCastCost} × max(2 − ${efficiency}, 0.25) = ${cost}`,
      stacking: "multiplicative",
      terms: [
        { name: "Base cost", symbol: "C0", value: input.baseCastCost, stacking: "flat" },
        { name: "Efficiency", symbol: "E", value: efficiency, stacking: "additive" },
      ],
      source: EFF_SOURCE,
      kind: "documented",
    },
    channelDrain: {
      id: "channel-drain",
      name: "Channeled energy drain / s",
      value: drain,
      formula: "Drain = BaseDrain × clamp((2 − E) / D, 0.25, 1.75)",
      latex: String.raw`M = B \cdot \mathrm{clamp}\left(\frac{2-E}{D}, 0.25, 1.75\right)`,
      substituted: `B=${input.baseDrainPerSecond}, E=${efficiency}, D=${duration} → ${drain}`,
      stacking: "multiplicative",
      terms: [
        { name: "Base drain/s", symbol: "B", value: input.baseDrainPerSecond, stacking: "flat" },
        { name: "Efficiency (uncapped)", symbol: "E", value: efficiency, stacking: "additive" },
        { name: "Duration multiplier", symbol: "D", value: duration, stacking: "additive" },
      ],
      source: EFF_SOURCE,
      kind: "documented",
    },
    scaledDamage: {
      id: "ability-damage",
      name: "Strength-scaled ability damage",
      value: scaled,
      formula: "Dmg = Base × Strength × (1 + shard Ability Damage)",
      latex: String.raw`D = D_0 \cdot S \cdot (1 + A_{\text{shard}})`,
      substituted: `${input.baseAbilityDamage} × ${strength} × (1 + ${shard}) = ${scaled}`,
      stacking: "multiplicative",
      terms: [
        { name: "Base ability damage", symbol: "D0", value: input.baseAbilityDamage, stacking: "flat" },
        { name: "Strength multiplier", symbol: "S", value: strength, stacking: "additive" },
        { name: "Shard Ability Damage", symbol: "A", value: shard, stacking: "additive", notes: "Unique multiplier; additive across shard colors." },
      ],
      source: STR_SOURCE,
      assumption: "Most damaging abilities scale linearly with Strength. Individual abilities with unique scaling (e.g. some exalted weapons) are not modeled here.",
      kind: "documented",
    },
  };
}

export const ABILITY_SOURCES = { STR_SOURCE, DUR_SOURCE, RNG_SOURCE, EFF_SOURCE };
