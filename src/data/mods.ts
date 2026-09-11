import type { Bonus } from "@/engine/types";
import type { ElementSource } from "@/engine/elemental";

export type ModSlot = "primary" | "secondary" | "melee" | "warframe" | "any";

export interface CatalogMod {
  id: string;
  name: string;
  slot: ModSlot;
  bonuses: Bonus[];
  elements?: ElementSource[];
  maxRank: number;
  notes?: string;
}

function pct(id: string, name: string, stat: string, value: number, group?: string): Bonus {
  return {
    id,
    name,
    stat,
    value,
    operation: "STACKING_MULTIPLY",
    group,
  };
}

export const MODS: CatalogMod[] = [
  { id: "serration", name: "Serration", slot: "primary", maxRank: 10, bonuses: [pct("serration", "Serration", "damage", 1.65, "baseDamage")] },
  { id: "heavy-caliber", name: "Heavy Caliber", slot: "primary", maxRank: 10, bonuses: [pct("heavy-caliber", "Heavy Caliber", "damage", 1.65, "baseDamage")] },
  { id: "hornet-strike", name: "Hornet Strike", slot: "secondary", maxRank: 10, bonuses: [pct("hornet-strike", "Hornet Strike", "damage", 2.2, "baseDamage")] },
  { id: "pressure-point", name: "Pressure Point", slot: "melee", maxRank: 5, bonuses: [pct("pressure-point", "Pressure Point", "damage", 1.2, "baseDamage")] },
  { id: "primed-pressure-point", name: "Primed Pressure Point", slot: "melee", maxRank: 10, bonuses: [pct("ppp", "Primed Pressure Point", "damage", 1.65, "baseDamage")] },
  { id: "split-chamber", name: "Split Chamber", slot: "primary", maxRank: 5, bonuses: [pct("split-chamber", "Split Chamber", "multishot", 0.9, "multishot")] },
  { id: "barrel-diffusion", name: "Barrel Diffusion", slot: "secondary", maxRank: 5, bonuses: [pct("barrel-diffusion", "Barrel Diffusion", "multishot", 1.2, "multishot")] },
  { id: "point-strike", name: "Point Strike", slot: "primary", maxRank: 5, bonuses: [pct("point-strike", "Point Strike", "critChance", 1.5, "critChance")] },
  { id: "vital-sense", name: "Vital Sense", slot: "primary", maxRank: 5, bonuses: [pct("vital-sense", "Vital Sense", "critMultiplier", 1.2, "critMultiplier")] },
  { id: "pistol-gambit", name: "Pistol Gambit", slot: "secondary", maxRank: 5, bonuses: [pct("pistol-gambit", "Pistol Gambit", "critChance", 1.2, "critChance")] },
  { id: "target-cracker", name: "Target Cracker", slot: "secondary", maxRank: 5, bonuses: [pct("target-cracker", "Target Cracker", "critMultiplier", 0.6, "critMultiplier")] },
  { id: "true-steel", name: "True Steel", slot: "melee", maxRank: 5, bonuses: [pct("true-steel", "True Steel", "critChance", 1.2, "critChance")] },
  { id: "organ-shatter", name: "Organ Shatter", slot: "melee", maxRank: 5, bonuses: [pct("organ-shatter", "Organ Shatter", "critMultiplier", 0.9, "critMultiplier")] },
  { id: "stormbringer", name: "Stormbringer", slot: "primary", maxRank: 5, bonuses: [], elements: [{ element: "electricity", bonus: 0.9, origin: "mod", name: "Stormbringer" }] },
  { id: "hellfire", name: "Hellfire", slot: "primary", maxRank: 5, bonuses: [], elements: [{ element: "heat", bonus: 0.9, origin: "mod", name: "Hellfire" }] },
  { id: "cryo-rounds", name: "Cryo Rounds", slot: "primary", maxRank: 5, bonuses: [], elements: [{ element: "cold", bonus: 0.9, origin: "mod", name: "Cryo Rounds" }] },
  { id: "infected-clip", name: "Infected Clip", slot: "primary", maxRank: 5, bonuses: [], elements: [{ element: "toxin", bonus: 0.9, origin: "mod", name: "Infected Clip" }] },
  { id: "convulsion", name: "Convulsion", slot: "secondary", maxRank: 5, bonuses: [], elements: [{ element: "electricity", bonus: 0.9, origin: "mod", name: "Convulsion" }] },
  { id: "heated-charge", name: "Heated Charge", slot: "secondary", maxRank: 5, bonuses: [], elements: [{ element: "heat", bonus: 0.9, origin: "mod", name: "Heated Charge" }] },
  { id: "pathogen-rounds", name: "Pathogen Rounds", slot: "secondary", maxRank: 5, bonuses: [], elements: [{ element: "toxin", bonus: 0.9, origin: "mod", name: "Pathogen Rounds" }] },
  { id: "maim", name: "Maim", slot: "secondary", maxRank: 5, bonuses: [pct("maim", "Maim", "slash", 1.2, "slash")] },
  { id: "fanged-fusillade", name: "Fanged Fusillade", slot: "primary", maxRank: 5, bonuses: [pct("fanged", "Fanged Fusillade", "slash", 1.2, "slash")] },
  { id: "piercing-caliber", name: "Piercing Caliber", slot: "primary", maxRank: 5, bonuses: [pct("piercing-caliber", "Piercing Caliber", "puncture", 1.2, "puncture")] },
  { id: "primed-bane-grineer", name: "Primed Bane of Grineer", slot: "primary", maxRank: 10, bonuses: [{ id: "pbaneg", name: "Primed Bane of Grineer", stat: "faction", value: 0.55, operation: "MULTIPLY", group: "faction" }] },
  { id: "bane-corpus", name: "Bane of Corpus", slot: "primary", maxRank: 5, bonuses: [{ id: "banec", name: "Bane of Corpus", stat: "faction", value: 0.3, operation: "MULTIPLY", group: "faction" }] },
  { id: "bane-infested", name: "Bane of Infested", slot: "primary", maxRank: 5, bonuses: [{ id: "banei", name: "Bane of Infested", stat: "faction", value: 0.3, operation: "MULTIPLY", group: "faction" }] },
  { id: "speed-trigger", name: "Speed Trigger", slot: "primary", maxRank: 5, bonuses: [pct("speed-trigger", "Speed Trigger", "fireRate", 0.6, "fireRate")] },
  { id: "anemic-agility", name: "Anemic Agility", slot: "secondary", maxRank: 5, bonuses: [pct("anemic-fr", "Anemic Agility", "fireRate", 0.9, "fireRate"), pct("anemic-dmg", "Anemic Agility", "damage", -0.15, "baseDamage")] },
  { id: "fast-hands", name: "Fast Hands", slot: "primary", maxRank: 5, bonuses: [pct("fast-hands", "Fast Hands", "reload", 0.3, "reload")] },
  { id: "rifle-aptitude", name: "Rifle Aptitude", slot: "primary", maxRank: 5, bonuses: [pct("rifle-aptitude", "Rifle Aptitude", "statusChance", 0.15, "statusChance")] },
  { id: "rifle-elementalist", name: "Rifle Elementalist", slot: "primary", maxRank: 5, bonuses: [pct("rifle-elementalist", "Rifle Elementalist", "statusDamage", 0.9, "statusDamage")] },
  { id: "continuous-misery", name: "Continuous Misery", slot: "primary", maxRank: 3, bonuses: [pct("continuous-misery", "Continuous Misery", "statusDuration", 1.0, "statusDuration")] },
  { id: "intensify", name: "Intensify", slot: "warframe", maxRank: 5, bonuses: [pct("intensify", "Intensify", "strength", 0.3, "strength")] },
  { id: "blind-rage", name: "Blind Rage", slot: "warframe", maxRank: 10, bonuses: [pct("blind-rage-str", "Blind Rage", "strength", 0.99, "strength"), pct("blind-rage-eff", "Blind Rage", "efficiency", -0.55, "efficiency")] },
  { id: "transient-fortitude", name: "Transient Fortitude", slot: "warframe", maxRank: 10, bonuses: [pct("tf-str", "Transient Fortitude", "strength", 0.55, "strength"), pct("tf-dur", "Transient Fortitude", "duration", -0.275, "duration")] },
  { id: "streamline", name: "Streamline", slot: "warframe", maxRank: 5, bonuses: [pct("streamline", "Streamline", "efficiency", 0.3, "efficiency")] },
  { id: "fleeting-expertise", name: "Fleeting Expertise", slot: "warframe", maxRank: 5, bonuses: [pct("fe-eff", "Fleeting Expertise", "efficiency", 0.6, "efficiency"), pct("fe-dur", "Fleeting Expertise", "duration", -0.6, "duration")] },
  { id: "continuity", name: "Continuity", slot: "warframe", maxRank: 5, bonuses: [pct("continuity", "Continuity", "duration", 0.3, "duration")] },
  { id: "primed-continuity", name: "Primed Continuity", slot: "warframe", maxRank: 10, bonuses: [pct("pcontinuity", "Primed Continuity", "duration", 0.55, "duration")] },
  { id: "narrow-minded", name: "Narrow Minded", slot: "warframe", maxRank: 10, bonuses: [pct("nm-dur", "Narrow Minded", "duration", 0.99, "duration"), pct("nm-rng", "Narrow Minded", "range", -0.66, "range")] },
  { id: "stretch", name: "Stretch", slot: "warframe", maxRank: 5, bonuses: [pct("stretch", "Stretch", "range", 0.45, "range")] },
  { id: "overextended", name: "Overextended", slot: "warframe", maxRank: 5, bonuses: [pct("oe-rng", "Overextended", "range", 0.9, "range"), pct("oe-str", "Overextended", "strength", -0.6, "strength")] },
  { id: "augur-reach", name: "Augur Reach", slot: "warframe", maxRank: 5, bonuses: [pct("augur-reach", "Augur Reach", "range", 0.3, "range")] },
  { id: "vitality", name: "Vitality", slot: "warframe", maxRank: 10, bonuses: [pct("vitality", "Vitality", "health", 1.0, "health")] },
  { id: "redirection", name: "Redirection", slot: "warframe", maxRank: 10, bonuses: [pct("redirection", "Redirection", "shield", 1.0, "shield")] },
  { id: "steel-fiber", name: "Steel Fiber", slot: "warframe", maxRank: 10, bonuses: [pct("steel-fiber", "Steel Fiber", "armor", 1.0, "armor")] },
  { id: "flow", name: "Flow", slot: "warframe", maxRank: 5, bonuses: [pct("flow", "Flow", "energy", 1.0, "energy")] },
  { id: "primed-flow", name: "Primed Flow", slot: "warframe", maxRank: 10, bonuses: [pct("pflow", "Primed Flow", "energy", 1.85, "energy")] },
];

export function getMod(id: string): CatalogMod | undefined {
  return MODS.find((m) => m.id === id);
}

export function findModByName(name: string): CatalogMod | undefined {
  const n = name.trim().toLowerCase();
  return MODS.find((m) => m.name.toLowerCase() === n || m.id === n);
}
