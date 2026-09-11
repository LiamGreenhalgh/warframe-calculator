import type { TennoLoadout } from "@/import/schema";

/** Bundled Volt Prime + Braton Prime loadout so the calculators work immediately. */
export const SAMPLE_LOADOUT: TennoLoadout = {
  schema: "tenno-calculus-loadout",
  schemaVersion: 1,
  source: "sample",
  name: "Volt Shock Doctrine (sample)",
  notes:
    "Offline sample inspired by a typical electricity Volt. Two Tauforged Violet shards for primary electricity, three Tauforged Crimson for Strength. Import this if you have no Aleca Frame dump.",
  warframe: {
    id: "volt-prime",
    name: "Volt Prime",
    mods: ["blind-rage", "transient-fortitude", "intensify", "streamline", "primed-continuity", "stretch", "augur-reach", "primed-flow"],
    shards: [
      { color: "violet", tauforged: true, buff: "primaryElectricity" },
      { color: "violet", tauforged: true, buff: "primaryElectricity" },
      { color: "crimson", tauforged: true, buff: "abilityStrength" },
      { color: "crimson", tauforged: true, buff: "abilityStrength" },
      { color: "crimson", tauforged: true, buff: "abilityStrength" },
    ],
  },
  primary: {
    id: "braton-prime",
    name: "Braton Prime",
    mods: ["serration", "split-chamber", "point-strike", "vital-sense", "stormbringer", "hellfire", "speed-trigger", "primed-bane-grineer"],
  },
  secondary: {
    id: "kuva-nukor",
    name: "Kuva Nukor",
    mods: ["hornet-strike", "barrel-diffusion", "pistol-gambit", "target-cracker", "convulsion", "heated-charge"],
  },
  melee: {
    id: "galatine-prime",
    name: "Galatine Prime",
    mods: ["primed-pressure-point", "true-steel", "organ-shatter"],
  },
};
