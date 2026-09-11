import type { CalcResult, DamageMap } from "./types";
import { EMPTY_DAMAGE } from "./types";

const SOURCE = {
  title: "Damage/Calculation — Quantization",
  url: "https://wiki.warframe.com/w/Damage/Calculation",
};

/**
 * Scale = Modded Base Damage / 32
 */
export function quantizationScale(moddedBaseDamage: number): number {
  return moddedBaseDamage / 32;
}

/**
 * Quantized(x) = sign(x) × floor(|x| × 32 + 0.5) / 32
 * Quantized damage type value = Quantized(x) × Modded Base Damage
 * which is round-to-nearest integer of (value / scale) times scale.
 */
export function quantizeDamageType(
  damageTypeValue: number,
  moddedBaseDamage: number,
): number {
  if (moddedBaseDamage === 0) return 0;
  const x = damageTypeValue / moddedBaseDamage;
  const quantizedX =
    Math.sign(x) * Math.floor(Math.abs(x) * 32 + 0.5) / 32;
  return quantizedX * moddedBaseDamage;
}

export function quantizeWithScale(value: number, scale: number): number {
  if (scale === 0) return 0;
  const rounded = Math.sign(value) * Math.floor(Math.abs(value) / scale + 0.5);
  return rounded * scale;
}

export function quantizeDamageMap(
  map: DamageMap,
  moddedBaseDamage: number,
): DamageMap {
  const out = { ...EMPTY_DAMAGE };
  (Object.keys(map) as (keyof DamageMap)[]).forEach((key) => {
    out[key] = quantizeDamageType(map[key], moddedBaseDamage);
  });
  return out;
}

export function sumDamage(map: DamageMap): number {
  return (Object.values(map) as number[]).reduce((a, b) => a + b, 0);
}

/** Display pop-up rounding: floor(raw + 0.5). Display only — health change is not integer-rounded. */
export function displayDamage(raw: number): number {
  if (raw < 0) return Math.ceil(raw - 0.5);
  return Math.floor(raw + 0.5);
}

export function quantizationResult(
  damageTypeValue: number,
  moddedBaseDamage: number,
): CalcResult {
  const scale = quantizationScale(moddedBaseDamage);
  const q = quantizeDamageType(damageTypeValue, moddedBaseDamage);
  return {
    id: "quantization",
    name: "Quantized damage type",
    value: q,
    formula:
      "Scale = B/32;  Q(x) = sign(x)·floor(|x|·32 + 0.5)/32;  Qdmg = Q(value/B)·B",
    latex: String.raw`S=\frac{B}{32},\quad Q(x)=\operatorname{sign}(x)\cdot\frac{\lfloor |x|\cdot 32+0.5\rfloor}{32}`,
    substituted: `Scale=${scale}; Q(${damageTypeValue}) = ${q}`,
    stacking: "set",
    terms: [
      { name: "Modded base damage", symbol: "B", value: moddedBaseDamage, stacking: "additive" },
      { name: "Damage type value", symbol: "V", value: damageTypeValue, stacking: "additive" },
      { name: "Scale", symbol: "S", value: scale, stacking: "set" },
    ],
    source: SOURCE,
    displayRounded: displayDamage(q),
    kind: "documented",
  };
}
