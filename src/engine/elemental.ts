import type { DamageMap, DamageType } from "./types";
import { EMPTY_DAMAGE } from "./types";

export type PrimaryElement = "heat" | "cold" | "electricity" | "toxin";

const COMBINE: Record<string, DamageType> = {
  "heat+cold": "blast",
  "cold+heat": "blast",
  "heat+electricity": "radiation",
  "electricity+heat": "radiation",
  "heat+toxin": "gas",
  "toxin+heat": "gas",
  "cold+electricity": "magnetic",
  "electricity+cold": "magnetic",
  "cold+toxin": "viral",
  "toxin+cold": "viral",
  "electricity+toxin": "corrosive",
  "toxin+electricity": "corrosive",
};

/** Mod slot order: left to right, top row then bottom row. */
export interface ElementSource {
  element: PrimaryElement | DamageType;
  /** Decimal percent of modded base damage, e.g. 0.9 for Hellfire. For innate absolute, convert before combine. */
  bonus: number;
  origin: "mod" | "innate" | "valence" | "shard";
  name: string;
}

export interface CombinedElementResult {
  types: Partial<Record<DamageType, number>>;
  steps: string[];
}

/**
 * Combine primary elements.
 * Mods combine first in slot order. Duplicate elements add into the first
 * unmatched occurrence. Innate / valence / violet-shard electricity are then
 * applied in HCET order (Heat → Cold → Electricity → Toxin), matching
 * Adversary weapons + Violet Archon Shard notes.
 */
export function combineElements(sources: ElementSource[]): CombinedElementResult {
  const mods = sources.filter((s) => s.origin === "mod");
  const delayed = sources.filter((s) => s.origin !== "mod");
  const steps: string[] = [];
  const buckets: Array<{ element: DamageType; bonus: number; locked: boolean; name: string }> = [];

  const add = (element: DamageType, bonus: number, name: string, hcet: boolean) => {
    const isPrimary =
      element === "heat" ||
      element === "cold" ||
      element === "electricity" ||
      element === "toxin";
    if (!isPrimary) {
      buckets.push({ element, bonus, locked: true, name });
      steps.push(`Kept innate ${element} from ${name} (already combined; does not fuse with mods)`);
      return;
    }
    const existing = buckets.find((b) => !b.locked && b.element === element);
    if (existing) {
      existing.bonus += bonus;
      existing.name += ` + ${name}`;
      steps.push(`Added ${name} (+${(bonus * 100).toFixed(0)}% ${element}) into existing ${element}`);
      return;
    }
    const partner = buckets.find(
      (b) =>
        !b.locked &&
        (b.element === "heat" ||
          b.element === "cold" ||
          b.element === "electricity" ||
          b.element === "toxin") &&
        b.element !== element,
    );
    if (partner) {
      const key = `${partner.element}+${element}`;
      const combined = COMBINE[key];
      if (combined) {
        steps.push(
          `${partner.element} (${partner.name}) + ${element} (${name}) → ${combined}${hcet ? " [HCET]" : ""}`,
        );
        partner.element = combined;
        partner.bonus += bonus;
        partner.locked = true;
        partner.name = `${partner.name} + ${name}`;
        return;
      }
    }
    buckets.push({ element, bonus, locked: false, name });
    steps.push(`Opened ${element} from ${name} (+${(bonus * 100).toFixed(0)}%)`);
  };

  for (const m of mods) add(m.element, m.bonus, m.name, false);

  const hcetOrder = ["heat", "cold", "electricity", "toxin", "blast", "radiation", "gas", "magnetic", "viral", "corrosive"] as const;
  const delayedSorted = [...delayed].sort(
    (a, b) => hcetOrder.indexOf(a.element as (typeof hcetOrder)[number]) - hcetOrder.indexOf(b.element as (typeof hcetOrder)[number]),
  );
  for (const d of delayedSorted) add(d.element, d.bonus, d.name, true);

  const types: CombinedElementResult["types"] = {};
  for (const b of buckets) {
    types[b.element] = (types[b.element] ?? 0) + b.bonus;
  }
  return { types, steps };
}

export function physicalAfterMods(
  base: Pick<DamageMap, "impact" | "puncture" | "slash">,
  bonuses: { impact?: number; puncture?: number; slash?: number },
): Pick<DamageMap, "impact" | "puncture" | "slash"> {
  return {
    impact: base.impact * (1 + (bonuses.impact ?? 0)),
    puncture: base.puncture * (1 + (bonuses.puncture ?? 0)),
    slash: base.slash * (1 + (bonuses.slash ?? 0)),
  };
}

export function withBaseDamage(
  ips: Pick<DamageMap, "impact" | "puncture" | "slash">,
  damageBonus: number,
): Pick<DamageMap, "impact" | "puncture" | "slash"> {
  const m = 1 + damageBonus;
  return {
    impact: ips.impact * m,
    puncture: ips.puncture * m,
    slash: ips.slash * m,
  };
}

export function toDamageMap(
  ips: Partial<DamageMap>,
  elements: Partial<Record<DamageType, number>>,
  moddedBase: number,
): DamageMap {
  const map = { ...EMPTY_DAMAGE };
  map.impact = ips.impact ?? 0;
  map.puncture = ips.puncture ?? 0;
  map.slash = ips.slash ?? 0;
  for (const [k, pct] of Object.entries(elements)) {
    const key = k as DamageType;
    if (key in map && typeof pct === "number") {
      (map[key as keyof DamageMap] as number) += pct * moddedBase;
    }
  }
  return map;
}
