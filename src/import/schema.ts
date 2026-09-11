import type { ShardBuffId, ShardColor, SocketedShard } from "@/engine/shards";

export const LOADOUT_SCHEMA_VERSION = 1;
export const LOADOUT_SCHEMA_ID = "tenno-calculus-loadout";

export interface LoadoutWeaponRef {
  id: string;
  name?: string;
  mods?: string[];
  /** Optional uniqueName from WFCD / companion JSON. */
  uniqueName?: string;
}

export interface TennoLoadout {
  schema: typeof LOADOUT_SCHEMA_ID;
  schemaVersion: number;
  source: "sample" | "paste" | "file" | "aleca" | "overframe" | "companion" | "wfcd";
  name: string;
  notes?: string;
  warframe?: {
    id: string;
    name?: string;
    mods?: string[];
    shards?: SocketedShard[];
  };
  primary?: LoadoutWeaponRef;
  secondary?: LoadoutWeaponRef;
  melee?: LoadoutWeaponRef;
}

export const LOADOUT_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://tenno-calculus.local/schema/loadout.json",
  title: "Tenno Calculus loadout",
  type: "object",
  required: ["schema", "schemaVersion", "name"],
  properties: {
    schema: { const: LOADOUT_SCHEMA_ID },
    schemaVersion: { type: "integer", minimum: 1 },
    source: { type: "string" },
    name: { type: "string" },
    notes: { type: "string" },
    warframe: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        mods: { type: "array", items: { type: "string" } },
        shards: {
          type: "array",
          maxItems: 5,
          items: {
            type: "object",
            required: ["color", "tauforged", "buff"],
            properties: {
              color: { enum: ["crimson", "amber", "azure", "topaz", "violet", "emerald"] },
              tauforged: { type: "boolean" },
              buff: { type: "string" },
            },
          },
        },
      },
    },
    primary: { $ref: "#/$defs/weapon" },
    secondary: { $ref: "#/$defs/weapon" },
    melee: { $ref: "#/$defs/weapon" },
  },
  $defs: {
    weapon: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        mods: { type: "array", items: { type: "string" } },
        uniqueName: { type: "string" },
      },
    },
  },
} as const;

export const ALECA_SCAN_PATHS = [
  "%LOCALAPPDATA%\\AlecaFrame",
  "%LOCALAPPDATA%\\AlecaFrame\\relicLogs",
  "%APPDATA%\\AlecaFrame",
  "~/Documents/AlecaFrame",
  "~/.local/share/AlecaFrame",
  "~/.config/AlecaFrame",
  "~/Library/Application Support/AlecaFrame",
];

export type { ShardBuffId, ShardColor, SocketedShard };
