export interface WarframeBase {
  id: string;
  name: string;
  health: number;
  shield: number;
  armor: number;
  energy: number;
  abilities: Array<{
    name: string;
    baseDamage: number;
    baseDuration: number;
    baseRange: number;
    baseCost: number;
    baseDrain?: number;
    notes: string;
  }>;
}

export const WARFRAMES: WarframeBase[] = [
  {
    id: "volt-prime",
    name: "Volt Prime",
    health: 370,
    shield: 555,
    armor: 135,
    energy: 200,
    abilities: [
      { name: "Shock", baseDamage: 200, baseDuration: 0, baseRange: 15, baseCost: 25, notes: "Scales with Strength. Range is targeting range." },
      { name: "Speed", baseDamage: 0, baseDuration: 9, baseRange: 25, baseCost: 25, notes: "Duration and Range. Attack-speed bonus scales with Strength." },
      { name: "Electric Shield", baseDamage: 0, baseDuration: 25, baseRange: 6, baseCost: 50, notes: "Duration-scaled. Adds Electricity to shots." },
      { name: "Discharge", baseDamage: 750, baseDuration: 6, baseRange: 20, baseCost: 100, notes: "Damage scales with Strength. Creates pseudo-Electricity procs that do not satisfy Violet Ability Damage." },
    ],
  },
  {
    id: "rhino",
    name: "Rhino",
    health: 370,
    shield: 555,
    armor: 240,
    energy: 175,
    abilities: [
      { name: "Rhino Charge", baseDamage: 650, baseDuration: 0, baseRange: 12, baseCost: 25, notes: "Strength-scaled impact combo." },
      { name: "Iron Skin", baseDamage: 0, baseDuration: 0, baseRange: 0, baseCost: 50, notes: "Absorption scales with Armor and Strength (unique formula — not fully expanded here)." },
      { name: "Roar", baseDamage: 0, baseDuration: 30, baseRange: 25, baseCost: 75, notes: "Faction-style damage bonus. Multiplicative with +Damage mods." },
      { name: "Rhino Stomp", baseDamage: 800, baseDuration: 8, baseRange: 25, baseCost: 100, notes: "Strength damage, Duration CC, Range radius." },
    ],
  },
  {
    id: "mesa",
    name: "Mesa",
    health: 370,
    shield: 280,
    armor: 105,
    energy: 175,
    abilities: [
      { name: "Ballistic Battery", baseDamage: 0, baseDuration: 0, baseRange: 0, baseCost: 25, notes: "Stores a portion of damage; unique add after base damage." },
      { name: "Shooting Gallery", baseDamage: 0, baseDuration: 30, baseRange: 16, baseCost: 50, notes: "Duration buff. Damage bonus is additive with +Damage (wiki: Shooting Gallery)." },
      { name: "Shatter Shield", baseDamage: 0, baseDuration: 25, baseRange: 11, baseCost: 75, notes: "DR from incoming bullets. Duration." },
      { name: "Peacemaker", baseDamage: 0, baseDuration: 0, baseRange: 0, baseCost: 25, baseDrain: 15, notes: "Exalted regulators. Shard Ability Damage does not apply to exalted weapons." },
    ],
  },
  {
    id: "saryn",
    name: "Saryn",
    health: 555,
    shield: 280,
    armor: 240,
    energy: 175,
    abilities: [
      { name: "Spores", baseDamage: 20, baseDuration: 24, baseRange: 16, baseCost: 25, notes: "Toxin/Corrosive spore damage scales with Strength." },
      { name: "Molt", baseDamage: 150, baseDuration: 3.5, baseRange: 0, baseCost: 50, notes: "Decoy health scales with Health and Shields." },
      { name: "Toxic Lash", baseDamage: 0, baseDuration: 45, baseRange: 0, baseCost: 50, notes: "Adds Toxin as a percentage of melee hit; Strength-scaled." },
      { name: "Miasma", baseDamage: 500, baseDuration: 0, baseRange: 20, baseCost: 75, notes: "Viral damage pulses. Strength and Range." },
    ],
  },
  {
    id: "gauss",
    name: "Gauss",
    health: 370,
    shield: 555,
    armor: 185,
    energy: 175,
    abilities: [
      { name: "Mach Rush", baseDamage: 800, baseDuration: 0, baseRange: 0, baseCost: 15, baseDrain: 12, notes: "Impact at end of rush. Battery mechanic not modeled." },
      { name: "Kinetic Plating", baseDamage: 0, baseDuration: 30, baseRange: 0, baseCost: 50, notes: "Reduces Kinetic/Elemental incoming; Duration." },
      { name: "Thermal Sunder", baseDamage: 400, baseDuration: 8, baseRange: 8, baseCost: 50, notes: "Cold or Heat pulse. Strength, Range, Duration." },
      { name: "Redline", baseDamage: 0, baseDuration: 30, baseRange: 0, baseCost: 100, notes: "Fire rate / attack speed buff. Duration." },
    ],
  },
  {
    id: "excalibur",
    name: "Excalibur",
    health: 370,
    shield: 370,
    armor: 240,
    energy: 175,
    abilities: [
      { name: "Slash Dash", baseDamage: 250, baseDuration: 0, baseRange: 12, baseCost: 25, notes: "Dash damage scales with Strength and melee mods (unique)." },
      { name: "Radial Blind", baseDamage: 0, baseDuration: 7, baseRange: 25, baseCost: 50, notes: "Duration CC, Range radius." },
      { name: "Radial Javelin", baseDamage: 1000, baseDuration: 0, baseRange: 15, baseCost: 75, notes: "Strength damage, Range." },
      { name: "Exalted Blade", baseDamage: 250, baseDuration: 0, baseRange: 0, baseCost: 25, baseDrain: 2.5, notes: "Exalted melee. Channel drain uses Efficiency and Duration. Shard Ability Damage does not apply." },
    ],
  },
];

export function getWarframe(id: string) {
  return WARFRAMES.find((w) => w.id === id);
}
