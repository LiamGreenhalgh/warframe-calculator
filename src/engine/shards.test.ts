import { describe, expect, it } from "vitest";
import {
  documentedElectricityBonus,
  documentedElectricityContribution,
  explainVioletElectricity,
  hypothesizedElectricityBonus,
  hypothesizedElectricityMultiplier,
  type SocketedShard,
} from "./shards";

function tauElec(n: number, extraCrimson = 0): SocketedShard[] {
  const shards: SocketedShard[] = [];
  for (let i = 0; i < n; i++) shards.push({ color: "violet", tauforged: true, buff: "primaryElectricity" });
  for (let i = 0; i < extraCrimson; i++) shards.push({ color: "crimson", tauforged: true, buff: "abilityStrength" });
  return shards;
}

describe("violet / purple archon shard electricity", () => {
  it("counts the originating shard in N (1 tauforged = 60%)", () => {
    expect(documentedElectricityContribution(true, 1)).toBeCloseTo(0.6);
    expect(documentedElectricityBonus(tauElec(1))).toBeCloseTo(0.6);
  });

  it("matches wiki: 2 tauforged electricity = 150%", () => {
    expect(documentedElectricityBonus(tauElec(2))).toBeCloseTo(1.5);
    expect(2 * (0.45 + 0.15 * 2)).toBeCloseTo(1.5);
  });

  it("matches wiki: 2 electricity + 3 crimson = 240%", () => {
    expect(documentedElectricityBonus(tauElec(2, 3))).toBeCloseTo(2.4);
    expect(2 * (0.45 + 0.15 * 5)).toBeCloseTo(2.4);
  });

  it("matches wiki: 5 tauforged electricity = 600%", () => {
    expect(documentedElectricityBonus(tauElec(5))).toBeCloseTo(6.0);
  });

  it("uses 30%/10% for non-tauforged shards", () => {
    const shards: SocketedShard[] = [
      { color: "violet", tauforged: false, buff: "primaryElectricity" },
    ];
    expect(documentedElectricityBonus(shards)).toBeCloseTo(0.3 + 0.1 * 1);
  });

  it("ignores Amber / Topaz / Emerald for the extra N term", () => {
    const shards: SocketedShard[] = [
      { color: "violet", tauforged: true, buff: "primaryElectricity" },
      { color: "amber", tauforged: true, buff: "castingSpeed" },
      { color: "topaz", tauforged: true, buff: "abilityDamageRadiation" },
      { color: "emerald", tauforged: true, buff: "toxinStatusDamage" },
    ];
    expect(documentedElectricityBonus(shards)).toBeCloseTo(0.6);
  });

  it("does not treat the user hypothesis as official", () => {
    const hypo = hypothesizedElectricityBonus(5);
    const wiki = documentedElectricityBonus(tauElec(5));
    expect(hypo).toBeCloseTo(5.25);
    expect(wiki).toBeCloseTo(6);
    expect(hypothesizedElectricityMultiplier(5)).toBeCloseTo(1 + 5.25);

    const report = explainVioletElectricity(tauElec(5));
    expect(report.differs).toBe(true);
    expect(report.documented.kind).toBe("documented");
    expect(report.hypothesis.kind).toBe("hypothesis");
    expect(report.hypothesis.name.toLowerCase()).toContain("hypothesis");
  });

  it("hypothesis uses (x-1) other purples, so 1 shard is 45% not 60%", () => {
    expect(hypothesizedElectricityBonus(1)).toBeCloseTo(0.45);
    expect(documentedElectricityBonus(tauElec(1))).toBeCloseTo(0.6);
  });
});
