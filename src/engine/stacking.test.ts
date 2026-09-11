import { describe, expect, it } from "vitest";
import {
  additivePercentMultiplier,
  applyBonuses,
  compareAdditiveVsMultiplicative,
  multiplicativePercentMultiplier,
} from "./stacking";
import type { Bonus } from "./types";

const dmg = (id: string, name: string, value: number, group = "baseDamage"): Bonus => ({
  id,
  name,
  stat: "damage",
  value,
  operation: "STACKING_MULTIPLY",
  group,
});

describe("bonus stacking", () => {
  it("adds Serration and Heavy Caliber (STACKING_MULTIPLY)", () => {
    const r = applyBonuses(100, [dmg("s", "Serration", 1.65), dmg("h", "Heavy Caliber", 1.65)]);
    expect(r.result).toBeCloseTo(430);
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].stacking).toBe("additive");
    expect(r.groups[0].multiplier).toBeCloseTo(4.3);
  });

  it("multiplies Serration with Bane of Grineer", () => {
    const r = applyBonuses(100, [
      dmg("s", "Serration", 1.65, "baseDamage"),
      {
        id: "bane",
        name: "Bane of Grineer",
        stat: "faction",
        value: 0.3,
        operation: "MULTIPLY",
        group: "faction",
      },
    ]);
    expect(r.result).toBeCloseTo(100 * 2.65 * 1.3);
  });

  it("applies Arcane Avenger as a flat ADD after percents", () => {
    const r = applyBonuses(0.2, [
      {
        id: "ts",
        name: "True Steel",
        stat: "critChance",
        value: 1.2,
        operation: "STACKING_MULTIPLY",
        group: "critChance",
      },
      {
        id: "av",
        name: "Arcane Avenger",
        stat: "critChance",
        value: 0.45,
        operation: "ADD",
      },
    ]);
    expect(r.result).toBeCloseTo(0.2 * 2.2 + 0.45);
  });

  it("never confuses additive +X% with multiplicative *X%", () => {
    const values = [1.65, 0.3];
    const add = additivePercentMultiplier(values);
    const mul = multiplicativePercentMultiplier(values);
    expect(add).toBeCloseTo(2.95);
    expect(mul).toBeCloseTo(2.65 * 1.3);
    const cmp = compareAdditiveVsMultiplicative(values);
    expect(cmp.multiplicativeBonus).toBeGreaterThan(cmp.additiveBonus);
  });

  it("SET overrides ignore other bonuses", () => {
    const r = applyBonuses(10, [
      dmg("s", "Serration", 1.65),
      { id: "set", name: "Primary Acuity", stat: "multishot", value: 1, operation: "SET" },
    ]);
    expect(r.result).toBe(1);
  });
});
