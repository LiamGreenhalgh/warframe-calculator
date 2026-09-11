import { SAMPLE_LOADOUT } from "@/data/sampleLoadout";
import { findModByName, getMod } from "@/data/mods";
import { getWeapon, WEAPONS } from "@/data/weapons";
import { getWarframe, WARFRAMES } from "@/data/warframes";
import type { SocketedShard } from "@/engine/shards";
import { emptyMods, type WeaponModInput } from "@/engine/weapon";
import type { Bonus } from "@/engine/types";
import {
  ALECA_SCAN_PATHS,
  LOADOUT_SCHEMA_ID,
  type TennoLoadout,
} from "./schema";

export interface ImportResult {
  ok: boolean;
  loadout?: TennoLoadout;
  errors: string[];
  warnings: string[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function matchWeaponId(raw: string): string | undefined {
  const n = normalizeName(raw);
  return WEAPONS.find((w) => w.id === n || normalizeName(w.name) === n)?.id;
}

function matchWarframeId(raw: string): string | undefined {
  const n = normalizeName(raw);
  return WARFRAMES.find((w) => w.id === n || normalizeName(w.name) === n)?.id;
}

function coerceMods(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const found = getMod(item) ?? findModByName(item);
      if (found) ids.push(found.id);
      else ids.push(item);
      continue;
    }
    const rec = asRecord(item);
    if (!rec) continue;
    const name = String(rec.name ?? rec.uniqueName ?? rec.id ?? "");
    const found = getMod(normalizeName(name)) ?? findModByName(name);
    if (found) ids.push(found.id);
  }
  return ids;
}

function coerceShards(raw: unknown): SocketedShard[] {
  if (!Array.isArray(raw)) return [];
  const out: SocketedShard[] = [];
  for (const item of raw) {
    const rec = asRecord(item);
    if (!rec) continue;
    const color = String(rec.color ?? rec.Colour ?? "").toLowerCase();
    const buff = String(rec.buff ?? rec.effect ?? rec.upgrade ?? "");
    if (!color || !buff) continue;
    out.push({
      color: color as SocketedShard["color"],
      tauforged: Boolean(rec.tauforged ?? rec.Tauforged ?? rec.isTauforged),
      buff: buff as SocketedShard["buff"],
    });
  }
  return out.slice(0, 5);
}

function weaponFromUnknown(raw: unknown, slot: "primary" | "secondary" | "melee") {
  if (typeof raw === "string") {
    const id = matchWeaponId(raw);
    return id ? { id, name: getWeapon(id)?.name, mods: [] } : undefined;
  }
  const rec = asRecord(raw);
  if (!rec) return undefined;
  const name = String(rec.name ?? rec.Name ?? rec.uniqueName ?? rec.id ?? "");
  const id = matchWeaponId(name) ?? matchWeaponId(String(rec.id ?? "")) ?? WEAPONS.find((w) => w.slot === slot && normalizeName(w.name) === normalizeName(name))?.id;
  if (!id) return name ? { id: normalizeName(name), name, mods: coerceMods(rec.mods ?? rec.Mods) } : undefined;
  return { id, name: getWeapon(id)?.name ?? name, mods: coerceMods(rec.mods ?? rec.Mods) };
}

export function parseLoadoutJson(text: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, errors: [`JSON parse failed: ${(err as Error).message}`], warnings };
  }

  const rec = asRecord(parsed);
  if (!rec) return { ok: false, errors: ["Root value must be an object."], warnings };

  if (rec.schema === LOADOUT_SCHEMA_ID) {
    const loadout = parsed as TennoLoadout;
    if (!loadout.name) errors.push("Loadout name is required.");
    if (errors.length) return { ok: false, errors, warnings };
    return { ok: true, loadout, errors, warnings };
  }

  if (rec.LoadOutInventory || rec.ItemType || rec.Suits) {
    warnings.push("Detected a Warframe companion / inventory-shaped dump. Mapping what we can; uniqueNames not in the bundled dataset are skipped.");
  }

  const wfRaw = asRecord(rec.warframe) ?? asRecord(rec.Warframe) ?? asRecord(rec.suit);
  const wfName = wfRaw ? String(wfRaw.name ?? wfRaw.Name ?? wfRaw.id ?? "") : String(rec.warframeName ?? rec.frame ?? "");
  const wfId = wfName ? matchWarframeId(wfName) : undefined;
  if (wfName && !wfId) warnings.push(`Warframe "${wfName}" is not in the bundled dataset.`);

  const loadout: TennoLoadout = {
    schema: LOADOUT_SCHEMA_ID,
    schemaVersion: 1,
    source: rec.aleca ? "aleca" : rec.overframe ? "overframe" : "paste",
    name: String(rec.name ?? rec.Name ?? rec.buildName ?? "Imported loadout"),
    notes: typeof rec.notes === "string" ? rec.notes : "Imported from a non-native JSON shape. Check mapped weapons/mods.",
    warframe: wfId
      ? {
          id: wfId,
          name: getWarframe(wfId)?.name,
          mods: coerceMods(wfRaw?.mods ?? rec.warframeMods),
          shards: coerceShards(wfRaw?.shards ?? rec.shards ?? rec.archonShards),
        }
      : undefined,
    primary: weaponFromUnknown(rec.primary ?? rec.Primary ?? rec.Rifle ?? rec.LongGun, "primary"),
    secondary: weaponFromUnknown(rec.secondary ?? rec.Secondary ?? rec.Pistol, "secondary"),
    melee: weaponFromUnknown(rec.melee ?? rec.Melee ?? rec.MeleeWeapon, "melee"),
  };

  if (!loadout.primary && !loadout.secondary && !loadout.melee && !loadout.warframe) {
    warnings.push("No bundled weapons or warframe matched. You can still inspect the JSON, or use the sample loadout.");
  }

  return { ok: true, loadout, errors, warnings };
}

export function modsToWeaponInput(modIds: string[]): { input: WeaponModInput; unknown: string[] } {
  const input = emptyMods();
  const unknown: string[] = [];
  for (const id of modIds) {
    const mod = getMod(id) ?? findModByName(id);
    if (!mod) {
      unknown.push(id);
      continue;
    }
    for (const b of mod.bonuses) {
      const bucket = bucketFor(b);
      if (bucket) input[bucket].push(b);
    }
    if (mod.elements) input.elements.push(...mod.elements);
  }
  return { input, unknown };
}

function bucketFor(b: Bonus): keyof Omit<WeaponModInput, "elements"> | null {
  const map: Record<string, keyof Omit<WeaponModInput, "elements">> = {
    damage: "baseDamage",
    baseDamage: "baseDamage",
    multishot: "multishot",
    critChance: "critChance",
    critMultiplier: "critMultiplier",
    statusChance: "statusChance",
    fireRate: "fireRate",
    reload: "reload",
    magazine: "magazine",
    faction: "faction",
    statusDamage: "statusDamage",
    statusDuration: "statusDuration",
    impact: "impact",
    puncture: "puncture",
    slash: "slash",
  };
  if (b.operation === "ADD" && b.stat === "critChance") return "flatCritChance";
  return map[b.stat] ?? map[b.group ?? ""] ?? null;
}

export function warframeBonusesFromMods(modIds: string[]): {
  strength: Bonus[];
  duration: Bonus[];
  range: Bonus[];
  efficiency: Bonus[];
  unknown: string[];
} {
  const strength: Bonus[] = [];
  const duration: Bonus[] = [];
  const range: Bonus[] = [];
  const efficiency: Bonus[] = [];
  const unknown: string[] = [];
  for (const id of modIds) {
    const mod = getMod(id) ?? findModByName(id);
    if (!mod) {
      unknown.push(id);
      continue;
    }
    for (const b of mod.bonuses) {
      if (b.stat === "strength") strength.push(b);
      else if (b.stat === "duration") duration.push(b);
      else if (b.stat === "range") range.push(b);
      else if (b.stat === "efficiency") efficiency.push(b);
    }
  }
  return { strength, duration, range, efficiency, unknown };
}

export function sampleLoadout(): TennoLoadout {
  return structuredClone(SAMPLE_LOADOUT);
}

export function describeAlecaFallback(): string[] {
  return [
    "Live Warframe login is not used (no account secrets).",
    "Paste Tenno Calculus JSON, Overframe-like JSON, or a companion inventory snippet.",
    "On the desktop app, Tenno Calculus scans Aleca Frame folders when present:",
    ...ALECA_SCAN_PATHS,
    "Aleca Frame itself stores settings under %LOCALAPPDATA%\\AlecaFrame and can export Stats JSON to the Desktop — those stats dumps are not full loadouts; prefer a loadout export or this schema.",
    "WFCD / warframestat.us item names can be matched against the bundled dataset when the network is available.",
    "A complete sample loadout is always one click away.",
  ];
}
