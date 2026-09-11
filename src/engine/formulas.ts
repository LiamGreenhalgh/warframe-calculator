import type { CalcResult, StackingClass } from "./types";

export interface FormulaDoc {
  id: string;
  category:
    | "stacking"
    | "quantization"
    | "weapon"
    | "crit"
    | "status"
    | "armor"
    | "shards"
    | "abilities";
  name: string;
  formula: string;
  latex?: string;
  stacking: StackingClass;
  source: { title: string; url: string };
  notes: string;
  kind: "documented" | "estimate";
  example?: string;
}

export const FORMULA_CATALOG: FormulaDoc[] = [
  {
    id: "percent-to-multiplier",
    category: "stacking",
    name: "Percent bonus → multiplier",
    formula: "Net Multiplier = 1 + Net Percent Bonus (as a decimal)",
    latex: String.raw`M = 1 + b`,
    stacking: "additive",
    source: { title: "Calculating Bonuses", url: "https://wiki.warframe.com/w/Calculating_Bonuses" },
    notes: "+165% Serration is b=1.65, not a ×1.65 extra on top of another +Damage mod. Two +165% damage mods are 1+1.65+1.65=4.3×, not 2.65×2.65.",
    kind: "documented",
    example: "Serration + Heavy Caliber: 1 + 1.65 + 1.65 = 4.3× base damage",
  },
  {
    id: "additive-percent",
    category: "stacking",
    name: "Additive percent stacking (STACKING_MULTIPLY)",
    formula: "Result = Base × (1 + b1 + b2 + …)",
    latex: String.raw`R = B\left(1+\sum b_i\right)`,
    stacking: "additive",
    source: { title: "Calculating Bonuses", url: "https://wiki.warframe.com/w/Calculating_Bonuses" },
    notes: "Most +X% mods: damage, fire rate, crit chance, Ability Strength, armor %.",
    kind: "documented",
  },
  {
    id: "multiplicative-percent",
    category: "stacking",
    name: "Multiplicative stacking (MULTIPLY / separate groups)",
    formula: "Result = Base × (1+b1) × (1+b2) × …",
    latex: String.raw`R = B\prod(1+b_i)`,
    stacking: "multiplicative",
    source: { title: "Calculating Bonuses", url: "https://wiki.warframe.com/w/Calculating_Bonuses" },
    notes: "Faction (Bane), Viral on health, headshots, Eclipse, Roar, armor DR. Serration and Bane of Grineer: (1+1.65)×(1+0.3)=3.445×.",
    kind: "documented",
    example: "If Serration and Bane added, you would only get +195%. They multiply, so +244.5%.",
  },
  {
    id: "flat-add",
    category: "stacking",
    name: "Flat / percentage-point ADD",
    formula: "Result = (percent-stacked stat) + f1 + f2",
    latex: String.raw`R = R_{\%} + \sum f`,
    stacking: "flat",
    source: { title: "Calculating Bonuses", url: "https://wiki.warframe.com/w/Calculating_Bonuses" },
    notes: "Arcane Avenger +45% CC is +0.45 after percent crit chance, not +45% of base. Azure Health/Armor/Energy shards are flat after percents.",
    kind: "documented",
  },
  {
    id: "order-of-ops",
    category: "stacking",
    name: "Order of operations",
    formula: "Result = [Base × Π(1 + Σ additive group)] + Σ flats",
    latex: String.raw`R=\left[B\prod\left(1+\sum_{g} b\right)\right]+\sum f`,
    stacking: "mixed",
    source: { title: "Calculating Bonuses", url: "https://wiki.warframe.com/w/Calculating_Bonuses" },
    notes: "Same-stat additive groups first, then multiplicative groups, then flats. SET overrides ignore the rest.",
    kind: "documented",
  },
  {
    id: "quantization",
    category: "quantization",
    name: "Damage type quantization",
    formula: "Scale=B/32; Q(x)=sign(x)·floor(|x|·32+0.5)/32; Qdmg=Q(V/B)·B",
    latex: String.raw`S=\frac{B}{32},\quad Q(x)=\operatorname{sign}(x)\cdot\frac{\lfloor |x|\cdot 32+0.5\rfloor}{32}`,
    stacking: "set",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Physical and elemental bonuses quantize. +Damage and faction multiply the already-quantized total (they scale numerator and Scale together). DoT ticks are NOT quantized this way. Pop-ups display floor(raw+0.5).",
    kind: "documented",
    example: "30 Impact / 30 Puncture / 40 Slash at B=100 → 31.25 / 31.25 / 40.625",
  },
  {
    id: "modded-stat",
    category: "weapon",
    name: "Modded stat",
    formula: "Modded = Base × (1 + Σ stat %)",
    latex: String.raw`M = B\left(1+\sum b_i\right)`,
    stacking: "additive",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Used for crit chance, fire rate, magazine, status chance. Reload and charge time invert: Time / (1 + speed %).",
    kind: "documented",
  },
  {
    id: "reload-time",
    category: "weapon",
    name: "Modded reload / charge time",
    formula: "ModdedTime = BaseTime / (1 + speed %)",
    latex: String.raw`T = \frac{T_0}{1+\sum b_i}`,
    stacking: "additive",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Reload bonuses reduce time. They do not add to fire rate.",
    kind: "documented",
  },
  {
    id: "arsenal-total",
    category: "weapon",
    name: "Arsenal total damage",
    formula: "Base × [1 + Elem + IPS_dist·IPS] × (1+Damage) × [MS_base×(1+MS)]",
    latex: String.raw`D=B\bigl(1+E+I_{\mathrm{dist}}I\bigr)(1+D_{\mathrm{mod}})\bigl[M_0(1+M)\bigr]`,
    stacking: "mixed",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Average non-crit per shot, no faction. Melee omits multishot and stance multipliers.",
    kind: "documented",
  },
  {
    id: "avg-shot",
    category: "crit",
    name: "Average shot",
    formula: "AvgShot = Total × (1 + CC × (M − 1))",
    latex: String.raw`\overline{S}=T\bigl(1+\mathrm{CC}(M-1)\bigr)`,
    stacking: "multiplicative",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Normal shot uses floor(CC); crit shot uses ceil(CC). Yellow t=1, orange t=2, red t≥3. Multiplier at tier t is 1+t(M−1).",
    kind: "documented",
  },
  {
    id: "burst-dps",
    category: "weapon",
    name: "Average burst DPS",
    formula: "BurstDPS = AvgShot × EffectiveFR",
    latex: String.raw`\mathrm{Burst}=\overline{S}\cdot\mathrm{FR}`,
    stacking: "multiplicative",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Auto/semi/held: FR = modded fire rate. Charge and burst have extra delay terms.",
    kind: "documented",
  },
  {
    id: "sustained-dps",
    category: "weapon",
    name: "Average sustained DPS",
    formula: "Sustained = Burst × shots / (shots + FR×reload)",
    latex: String.raw`\mathrm{Sust}=\mathrm{Burst}\cdot\frac{n}{n+\mathrm{FR}\cdot R}`,
    stacking: "multiplicative",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Vectis subtracts 1 from the denominator (no reload delay). Epitaph ignores reload. Continuous ramp is assumed max.",
    kind: "documented",
  },
  {
    id: "dot-tick",
    category: "status",
    name: "Status DoT tick",
    formula: "Tick = (Σ seeds + 1) × C × M",
    latex: String.raw`T=(\sum S_i+1)\cdot C\cdot M`,
    stacking: "multiplicative",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "C=0.5 Heat/Electricity/Toxin/Gas, 0.35 Slash. +1 is an accumulator start, not a +1 damage bonus per stack. Slash/Toxin independent (each stack has its own +1). Heat merges. Faction applies an extra time. Not 1/32 quantized. Slash Bleed is cinematic (ignores armor). Toxin bypasses most shields.",
    kind: "documented",
    example: "Heat seed 40 with +60% Heat: (40+1)×0.5×1.6 = 32.8 → displays 33",
  },
  {
    id: "tenno-armor",
    category: "armor",
    name: "Tenno armor DR",
    formula: "DR = AR / (AR + 300)",
    latex: String.raw`DR=\frac{AR}{AR+300}`,
    stacking: "multiplicative",
    source: { title: "Armor", url: "https://wiki.warframe.com/w/Armor" },
    notes: "Player armor was not changed by the enemy armor rework. 300 armor = 50% DR.",
    kind: "documented",
  },
  {
    id: "enemy-armor",
    category: "armor",
    name: "Enemy armor DR",
    formula: "DR = 0.9 × √(AR / 2700)   (AR ≤ 2700)",
    latex: String.raw`DR=0.9\sqrt{AR/2700}`,
    stacking: "multiplicative",
    source: { title: "Armor", url: "https://wiki.warframe.com/w/Armor" },
    notes: "Level scaling clamps initial enemy armor to 200–2700 (90% DR at cap). Exceptional AR>2700 uses AR/(AR+300). The official wiki HTML often drops the radical; Fandom renders √. Steel Path no longer multiplies armor.",
    kind: "documented",
  },
  {
    id: "unarmored",
    category: "armor",
    name: "Unarmored / True damage",
    formula: "Inflicted = SD × (1 + health-type modifier)",
    latex: String.raw`D=\mathrm{SD}\,(1+H)`,
    stacking: "multiplicative",
    source: { title: "Damage/Calculation", url: "https://wiki.warframe.com/w/Damage/Calculation" },
    notes: "Shields ignore armor. Toxin generally bypasses shields (exceptions: Treasurer, Hounds, etc.).",
    kind: "documented",
  },
  {
    id: "violet-electricity",
    category: "shards",
    name: "Violet primary electricity (documented)",
    formula: "E = Σ (base_i + extra_i × N),  N = # Crimson+Azure+Violet (includes itself)",
    latex: String.raw`E=\sum(b_i+e_i N)`,
    stacking: "additive",
    source: { title: "Violet Archon Shard", url: "https://wiki.warframe.com/w/Violet_Archon_Shard" },
    notes: "Tauforged base 45% extra 15%; normal 30%/10%. Additive with Stormbringer. Combines as an innate element after mods (HCET with valence). Wiki examples: 1 tau=60%, 2 tau=150%, 2 tau+3 crimson=240%, 5 tau=600%.",
    kind: "documented",
    example: "2 × (0.45 + 0.15×2) = 1.50",
  },
  {
    id: "ability-damage-shards",
    category: "shards",
    name: "Shard Ability Damage",
    formula: "Final = AbilityDamage × Strength × (1 + Σ shard AD)",
    latex: String.raw`D=D_0\cdot S\cdot\bigl(1+\sum A_i\bigr)`,
    stacking: "multiplicative",
    source: { title: "Archon Shard", url: "https://wiki.warframe.com/w/Archon_Shard" },
    notes: "Unique multiplier from Violet/Topaz/Emerald. Additive across colors. Requires the matching status already on the target. Does not apply to exalted weapons.",
    kind: "documented",
  },
  {
    id: "cast-cost",
    category: "abilities",
    name: "Ability cast cost",
    formula: "Cost = Base × max(2 − Efficiency, 0.25)",
    latex: String.raw`C=C_0\cdot\max(2-E,0.25)`,
    stacking: "multiplicative",
    source: { title: "Ability Efficiency", url: "https://wiki.warframe.com/w/Ability_Efficiency" },
    notes: "Hard floor 25% of base cost. Arsenal hides Efficiency outside 25%–175% for this formula.",
    kind: "documented",
  },
  {
    id: "channel-drain",
    category: "abilities",
    name: "Channeled drain",
    formula: "Drain = Base × clamp((2 − E) / D, 0.25, 1.75)",
    latex: String.raw`M=B\cdot\mathrm{clamp}\!\left(\frac{2-E}{D},0.25,1.75\right)`,
    stacking: "multiplicative",
    source: { title: "Ability Efficiency", url: "https://wiki.warframe.com/w/Ability_Efficiency" },
    notes: "Uses uncapped Efficiency. Duration under 100% can be offset by Efficiency above 175% (Fleeting + Streamline).",
    kind: "documented",
    example: "B=10, E=1.3, D=1.4 → 5 energy/s",
  },
  {
    id: "ability-scale",
    category: "abilities",
    name: "Strength-scaled ability",
    formula: "Modded = Base × Strength   (Strength = 1 + Σ % bonuses)",
    latex: String.raw`D=D_0\cdot S,\quad S=1+\sum b_i`,
    stacking: "additive",
    source: { title: "Ability Strength", url: "https://wiki.warframe.com/w/Ability_Strength" },
    notes: "Duration and Range use the same additive percent pattern. Individual abilities may have unique curves — those are not invented here.",
    kind: "documented",
  },
];

export function formulasByCategory(): Record<FormulaDoc["category"], FormulaDoc[]> {
  const out = {} as Record<FormulaDoc["category"], FormulaDoc[]>;
  for (const f of FORMULA_CATALOG) {
    (out[f.category] ??= []).push(f);
  }
  return out;
}

export function documentedFormulas(): FormulaDoc[] {
  return FORMULA_CATALOG.filter((f) => f.kind === "documented");
}

export function asCalcResult(doc: FormulaDoc): CalcResult {
  return {
    id: doc.id,
    name: doc.name,
    value: 0,
    formula: doc.formula,
    latex: doc.latex,
    substituted: doc.example ?? doc.notes,
    stacking: doc.stacking,
    terms: [],
    source: doc.source,
    assumption: doc.kind === "documented" ? undefined : doc.notes,
    kind: doc.kind,
  };
}
