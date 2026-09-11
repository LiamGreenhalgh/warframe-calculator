import type { CalcResult } from "./types";
import { displayDamage } from "./quantization";

const SOURCE = {
  title: "Damage/Calculation — Damage Over Time",
  url: "https://wiki.warframe.com/w/Damage/Calculation",
};

export type DotType = "slash" | "heat" | "toxin" | "electricity" | "gas";

export const DOT_COEFFICIENT: Record<DotType, number> = {
  slash: 0.35,
  heat: 0.5,
  toxin: 0.5,
  electricity: 0.5,
  gas: 0.5,
};

/**
 * Unrounded tick = (Σ seeds + 1) × C × M
 * The +1 is a temporary accumulator starting value, included once per tick group
 * (Heat/Electricity/Gas merge; Slash and Toxin tick independently so each stack
 * has its own +1).
 *
 * Seeds are modded base damage (elemental/physical bonuses ignored) × faction
 * for toxin/slash examples. Elemental bonus of the matching type lives in M.
 * Faction applies a second time in M for DoT.
 */
export function unroundedTick(opts: {
  seeds: number[];
  type: DotType;
  elementalBonus?: number;
  factionBonus?: number;
  statusDamageBonus?: number;
  independentStacks?: boolean;
}): { raw: number; displayed: number; result: CalcResult } {
  const C = DOT_COEFFICIENT[opts.type];
  const elem = 1 + (opts.elementalBonus ?? 0);
  const faction = 1 + (opts.factionBonus ?? 0);
  const status = 1 + (opts.statusDamageBonus ?? 0);
  const M = elem * faction * status;

  let raw: number;
  if (opts.independentStacks || opts.type === "slash" || opts.type === "toxin") {
    raw = opts.seeds.reduce((acc, s) => acc + (s + 1) * C * M, 0);
  } else {
    const sum = opts.seeds.reduce((a, b) => a + b, 0);
    raw = (sum + 1) * C * M;
  }

  const result: CalcResult = {
    id: `dot-${opts.type}`,
    name: `${opts.type} status tick`,
    value: raw,
    formula: "Unrounded tick = (Σ seeds + 1) × C × M   (independent stacks each get their own +1)",
    latex: String.raw`T=\left(\sum S_i + 1\right)\cdot C\cdot M`,
    substituted: `C=${C}; M=${M}; seeds=[${opts.seeds.join(", ")}] → ${raw} (display ${displayDamage(raw)})`,
    stacking: "multiplicative",
    terms: [
      { name: "Status coefficient", symbol: "C", value: C, stacking: "set" },
      { name: "Elemental bonus factor", symbol: "M_el", value: elem, stacking: "additive" },
      { name: "Faction factor (DoT)", symbol: "M_fac", value: faction, stacking: "multiplicative", notes: "Faction applies an extra time on DoT." },
      { name: "Status damage factor", symbol: "M_st", value: status, stacking: "additive" },
    ],
    source: SOURCE,
    displayRounded: displayDamage(raw),
    kind: "documented",
  };

  return { raw, displayed: displayDamage(raw), result };
}

/** DoT is not 1/32 quantized. Seed uses modded base × multishot × faction (wiki). */
export function dotSeed(opts: {
  moddedBaseDamage: number;
  moddedMultishot: number;
  factionBonus: number;
}): number {
  return opts.moddedBaseDamage * opts.moddedMultishot * (1 + opts.factionBonus);
}

/**
 * Average DoT from the arsenal-style wiki formulas. Total ticks unmodded are
 * shared; we use 7 ticks (6s duration, 1s interval including t=0) unless
 * status duration bonuses stretch that linearly — labeled because the
 * transcluded page writes "Total Ticks × (1 + Status Duration)" without
 * publishing the exact unmodded tick count.
 */
export const UNMODDED_DOT_TICKS = 7;

export function averageDot(opts: {
  type: DotType;
  seed: number;
  factionBonus: number;
  statusDamageBonus: number;
  matchingElementalBonus: number;
  statusDurationBonus: number;
  statusChance: number;
  avgCritMultiplier: number;
}): CalcResult {
  const C = DOT_COEFFICIENT[opts.type];
  const ticks = UNMODDED_DOT_TICKS * (1 + opts.statusDurationBonus);
  const perProc =
    C *
    (1 + opts.matchingElementalBonus) *
    opts.seed *
    (1 + opts.factionBonus) *
    (1 + opts.statusDamageBonus) *
    ticks;
  const avg = opts.statusChance * perProc * opts.avgCritMultiplier;
  return {
    id: `avg-dot-${opts.type}`,
    name: `Average ${opts.type} DoT (per shot, expected)`,
    value: avg,
    formula:
      "Avg DoT = SC × C × (1+elem) × Seed × (1+faction) × (1+statusDmg) × Ticks × (1+duration) × AvgCrit",
    substituted: `${opts.statusChance} × ${C} × ${1 + opts.matchingElementalBonus} × ${opts.seed} × ${1 + opts.factionBonus} × ${1 + opts.statusDamageBonus} × ${ticks} × ${opts.avgCritMultiplier} = ${avg}`,
    stacking: "multiplicative",
    terms: [
      { name: "Status chance", symbol: "SC", value: opts.statusChance, stacking: "additive" },
      { name: "Coefficient", symbol: "C", value: C, stacking: "set" },
    ],
    source: SOURCE,
    assumption: `Unmodded tick count taken as ${UNMODDED_DOT_TICKS} (6s / 1s). Wiki says DoT types share unmodded tick count but does not print the integer here.`,
    kind: "estimate",
  };
}
