import { describe, expect, it } from "vitest";
import katex from "katex";
import { FORMULA_CATALOG } from "./formulas";
import { explainVioletElectricity, violetMeleeCritDamage } from "./shards";
import { explainArmor } from "./armor";
import { quantizationResult } from "./quantization";
import { describeCrit } from "./crit";
import { unroundedTick } from "./status";
import { applyBonuses } from "./stacking";
import { calculateAbilities } from "./abilities";

function assertRenders(id: string, tex: string | undefined) {
  expect(tex, `${id} should have LaTeX`).toBeTruthy();
  expect(() =>
    katex.renderToString(tex!, { displayMode: true, throwOnError: true, strict: "ignore" }),
  ).not.toThrow();
}

const ABILITY_INPUT = {
  strengthBonuses: [],
  durationBonuses: [],
  rangeBonuses: [],
  efficiencyBonuses: [],
  baseCastCost: 25,
  baseDrainPerSecond: 2.5,
  baseAbilityDamage: 100,
  baseDuration: 10,
  baseRange: 15,
  shardAbilityDamage: 0.1,
};

describe("LaTeX catalog", () => {
  it("every catalog formula renders in KaTeX", () => {
    for (const doc of FORMULA_CATALOG) {
      assertRenders(doc.id, doc.latex);
    }
  });

  it("live calculator results render in KaTeX", () => {
    const shards = Array.from({ length: 2 }, () => ({
      color: "violet" as const,
      tauforged: true,
      buff: "primaryElectricity" as const,
    }));
    const abilities = calculateAbilities(ABILITY_INPUT);
    const samples = [
      explainVioletElectricity(shards).documented,
      violetMeleeCritDamage(shards, 525),
      explainArmor(300, "tenno"),
      explainArmor(2700, "enemy"),
      quantizationResult(30, 100),
      describeCrit(1.2, 2).average,
      describeCrit(1.2, 2).yellow,
      unroundedTick({ type: "slash" as const, seeds: [40], elementalBonus: 0.6 }).result,
      applyBonuses(100, [{ id: "a", name: "Serration", stat: "damage", value: 1.65, operation: "STACKING_MULTIPLY" }])
        .resultAsCalc,
      abilities.castCost,
      abilities.channelDrain,
      abilities.scaledDamage,
    ];

    for (const result of samples) {
      assertRenders(result.id, result.latex);
    }
  });
});
