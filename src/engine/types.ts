export type StackingClass =
  | "additive"
  | "multiplicative"
  | "flat"
  | "set"
  | "mixed";

/** Internal Warframe bonus operation types from Calculating Bonuses. */
export type OperationType = "ADD" | "STACKING_MULTIPLY" | "MULTIPLY" | "SET";

export type DamageType =
  | "impact"
  | "puncture"
  | "slash"
  | "heat"
  | "cold"
  | "electricity"
  | "toxin"
  | "blast"
  | "corrosive"
  | "gas"
  | "magnetic"
  | "radiation"
  | "viral"
  | "void"
  | "tau"
  | "true"
  | "cinematic";

export type HealthClass =
  | "clonedFlesh"
  | "ferriteArmor"
  | "alloyArmor"
  | "flesh"
  | "shield"
  | "protoShield"
  | "infested"
  | "fossilized"
  | "infestedSinew"
  | "machinery"
  | "robotic"
  | "overguard";

export type ShardColor =
  | "crimson"
  | "amber"
  | "azure"
  | "topaz"
  | "violet"
  | "emerald";

export type CritTierName = "white" | "yellow" | "orange" | "red";

export interface WikiSource {
  title: string;
  url: string;
  notes?: string;
}

export interface EquationTerm {
  name: string;
  symbol: string;
  value: number;
  stacking: StackingClass;
  notes?: string;
}

export interface CalcResult {
  id: string;
  name: string;
  value: number;
  unit?: string;
  formula: string;
  latex?: string;
  substituted: string;
  stacking: StackingClass;
  terms: EquationTerm[];
  source: WikiSource;
  assumption?: string;
  displayRounded?: number;
  kind?: "documented" | "hypothesis" | "estimate";
}

export interface Bonus {
  id: string;
  name: string;
  stat: string;
  /** Decimal percent (0.65 = +65%) or a flat amount for ADD. */
  value: number;
  operation: OperationType;
  /**
   * Bonuses that share a group add together (STACKING_MULTIPLY).
   * Different groups then multiply. Omit to default to `stat`.
   */
  group?: string;
}

export interface DamageMap {
  impact: number;
  puncture: number;
  slash: number;
  heat: number;
  cold: number;
  electricity: number;
  toxin: number;
  blast: number;
  corrosive: number;
  gas: number;
  magnetic: number;
  radiation: number;
  viral: number;
  void: number;
  tau: number;
  true: number;
}

export const EMPTY_DAMAGE: DamageMap = {
  impact: 0,
  puncture: 0,
  slash: 0,
  heat: 0,
  cold: 0,
  electricity: 0,
  toxin: 0,
  blast: 0,
  corrosive: 0,
  gas: 0,
  magnetic: 0,
  radiation: 0,
  viral: 0,
  void: 0,
  tau: 0,
  true: 0,
};

export const PHYSICAL_TYPES = ["impact", "puncture", "slash"] as const;
export const PRIMARY_ELEMENTS = ["heat", "cold", "electricity", "toxin"] as const;
export const COMBINED_ELEMENTS = [
  "blast",
  "corrosive",
  "gas",
  "magnetic",
  "radiation",
  "viral",
] as const;

export type TriggerType =
  | "auto"
  | "semi"
  | "burst"
  | "charge"
  | "held"
  | "duplex"
  | "auto-spool";

export type WeaponSlot = "primary" | "secondary" | "melee";
