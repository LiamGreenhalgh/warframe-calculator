import { describe, expect, it } from "vitest";
import { parseLoadoutJson } from "@/import/parse";
import { SAMPLE_LOADOUT } from "@/data/sampleLoadout";
import { calculateWeapon, emptyMods } from "./weapon";
import { getWeapon } from "@/data/weapons";
import { modsToWeaponInput } from "@/import/parse";
import { documentedElectricityBonus } from "./shards";

describe("sample loadout", () => {
  it("parses native JSON", () => {
    const r = parseLoadoutJson(JSON.stringify(SAMPLE_LOADOUT));
    expect(r.ok).toBe(true);
    expect(r.loadout?.warframe?.id).toBe("volt-prime");
    expect(r.loadout?.primary?.id).toBe("braton-prime");
    expect(documentedElectricityBonus(r.loadout!.warframe!.shards!)).toBeCloseTo(2.4);
  });

  it("maps a loose Overframe-like object", () => {
    const r = parseLoadoutJson(
      JSON.stringify({
        name: "Loose",
        warframe: { name: "Volt Prime", shards: [{ color: "violet", tauforged: true, buff: "primaryElectricity" }] },
        primary: { name: "Braton Prime", mods: ["Serration", "Split Chamber"] },
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.loadout?.primary?.mods).toContain("serration");
  });

  it("rejects broken JSON", () => {
    const r = parseLoadoutJson("{not json");
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/parse failed/i);
  });
});

describe("weapon calculator", () => {
  it("Serration on Braton Prime multiplies IPS", () => {
    const w = getWeapon("braton-prime")!;
    const mods = emptyMods();
    mods.baseDamage.push({
      id: "s",
      name: "Serration",
      stat: "damage",
      value: 1.65,
      operation: "STACKING_MULTIPLY",
      group: "baseDamage",
    });
    const report = calculateWeapon({ weapon: w, mods });
    const base = w.impact + w.puncture + w.slash;
    expect(report.moddedBase.value).toBeCloseTo(base * 2.65);
  });

  it("applies the sample primary mods without throwing", () => {
    const w = getWeapon("braton-prime")!;
    const { input } = modsToWeaponInput(SAMPLE_LOADOUT.primary!.mods!);
    const report = calculateWeapon({ weapon: w, mods: input });
    expect(report.burstDps.value).toBeGreaterThan(0);
    expect(report.sustainedDps.value).toBeGreaterThan(0);
    expect(report.avgShot.value).toBeGreaterThan(report.moddedBase.value);
  });
});
