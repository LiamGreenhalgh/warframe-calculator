import { describe, expect, it } from "vitest";
import { quantizeDamageType, quantizationScale, displayDamage } from "./quantization";
import { averageCritMultiplier, critMultiplierForTier, critTierName } from "./crit";
import { enemyArmorDR, tennoArmorDR, ehpFromArmor } from "./armor";
import { finalCastCost, finalChannelDrain } from "./abilities";
import { unroundedTick } from "./status";
import { combineElements } from "./elemental";

describe("quantization", () => {
  it("matches the 30/30/40 wiki example", () => {
    const B = 100;
    expect(quantizationScale(B)).toBeCloseTo(3.125);
    expect(quantizeDamageType(30, B)).toBeCloseTo(31.25);
    expect(quantizeDamageType(40, B)).toBeCloseTo(40.625);
    expect(displayDamage(123.4375)).toBe(123);
  });
});

describe("crit tiers", () => {
  it("yellow / orange / red multipliers", () => {
    expect(critTierName(1)).toBe("yellow");
    expect(critTierName(2)).toBe("orange");
    expect(critTierName(3)).toBe("red");
    expect(critMultiplierForTier(1, 2)).toBeCloseTo(2);
    expect(critMultiplierForTier(2, 2)).toBeCloseTo(3);
    expect(critMultiplierForTier(3, 2)).toBeCloseTo(4);
    expect(averageCritMultiplier(2.5, 2)).toBeCloseTo(1 + 2.5);
  });
});

describe("armor", () => {
  it("Tenno 300 armor is 50% DR", () => {
    expect(tennoArmorDR(300)).toBeCloseTo(0.5);
    expect(ehpFromArmor(1000, 300, "tenno")).toBeCloseTo(2000);
  });

  it("enemy 2700 armor is 90% DR", () => {
    expect(enemyArmorDR(2700)).toBeCloseTo(0.9);
  });

  it("enemy 0 armor deals full damage", () => {
    expect(enemyArmorDR(0)).toBe(0);
  });
});

describe("ability efficiency", () => {
  it("caps cast cost at 25% of base", () => {
    expect(finalCastCost(100, 1.9)).toBeCloseTo(25);
    expect(finalCastCost(100, 1.3)).toBeCloseTo(70);
    expect(finalCastCost(25, 1.3)).toBeCloseTo(17.5);
  });

  it("matches the wiki channel example (10, 130% eff, 140% dur → 5/s)", () => {
    expect(finalChannelDrain(10, 1.3, 1.4)).toBeCloseTo(5);
  });
});

describe("status DoT", () => {
  it("Heat Supra example: (40+1)×0.5×1.6 = 32.8 displays 33", () => {
    const t = unroundedTick({ seeds: [40], type: "heat", elementalBonus: 0.6 });
    expect(t.raw).toBeCloseTo(32.8);
    expect(t.displayed).toBe(33);
  });

  it("Slash uses 0.35 and independent +1", () => {
    const t = unroundedTick({ seeds: [40], type: "slash", factionBonus: 0.55 });
    expect(t.raw).toBeCloseTo((40 + 1) * 0.35 * 1.55);
  });
});

describe("element combining", () => {
  it("Hellfire + Cryo Rounds on Amprex-like electricity stays Blast + Electricity", () => {
    const r = combineElements([
      { element: "heat", bonus: 0.9, origin: "mod", name: "Hellfire" },
      { element: "cold", bonus: 0.9, origin: "mod", name: "Cryo Rounds" },
      { element: "electricity", bonus: 1, origin: "innate", name: "Amprex" },
    ]);
    expect(r.types.blast).toBeCloseTo(1.8);
    expect(r.types.electricity).toBeCloseTo(1);
  });
});
