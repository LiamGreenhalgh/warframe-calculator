import type { Bonus, CalcResult, DamageMap, TriggerType, WeaponSlot } from "./types";
import { applyBonuses } from "./stacking";
import {
  combineElements,
  physicalAfterMods,
  toDamageMap,
  type ElementSource,
} from "./elemental";
import { quantizeDamageMap, sumDamage } from "./quantization";
import { averageCritMultiplier, describeCrit } from "./crit";
import { averageDot, dotSeed, unroundedTick, type DotType } from "./status";
import { enemyArmorDR, typeModifier, type EnemyProfile } from "./armor";

export interface WeaponBase {
  id: string;
  name: string;
  slot: WeaponSlot;
  trigger: TriggerType;
  impact: number;
  puncture: number;
  slash: number;
  innate?: ElementSource[];
  critChance: number;
  critMultiplier: number;
  statusChance: number;
  fireRate: number;
  magazine: number;
  reload: number;
  multishot: number;
  ammoCost?: number;
  chargeTime?: number;
  burstCount?: number;
  burstDelay?: number;
  maxAmmo?: number;
}

export interface WeaponModInput {
  baseDamage: Bonus[];
  multishot: Bonus[];
  critChance: Bonus[];
  critMultiplier: Bonus[];
  statusChance: Bonus[];
  fireRate: Bonus[];
  reload: Bonus[];
  magazine: Bonus[];
  faction: Bonus[];
  statusDamage: Bonus[];
  statusDuration: Bonus[];
  impact: Bonus[];
  puncture: Bonus[];
  slash: Bonus[];
  elements: ElementSource[];
  flatCritChance: Bonus[];
}

export interface WeaponCalcInput {
  weapon: WeaponBase;
  mods: WeaponModInput;
  quantize?: boolean;
}

export interface WeaponReport {
  moddedBase: CalcResult;
  arsenalTotal: CalcResult;
  quantizedTotal: CalcResult;
  types: DamageMap;
  quantized: DamageMap;
  combineSteps: string[];
  crit: ReturnType<typeof describeCrit>;
  avgShot: CalcResult;
  burstDps: CalcResult;
  sustainedDps: CalcResult;
  dots: Record<DotType, CalcResult>;
  statusTickExamples: CalcResult[];
  effectiveFireRate: CalcResult;
  modded: {
    critChance: number;
    critMultiplier: number;
    statusChance: number;
    fireRate: number;
    reload: number;
    magazine: number;
    multishot: number;
    faction: number;
    damageBonus: number;
  };
}

function sumPct(bonuses: Bonus[]): number {
  return applyBonuses(1, bonuses).result - 1;
}

export function effectiveFireRate(
  weapon: WeaponBase,
  moddedFireRate: number,
): CalcResult {
  let value = moddedFireRate;
  let formula = "Effective FR = Modded Fire Rate";
  let substituted = `${moddedFireRate}`;
  if (weapon.trigger === "charge") {
    const speed = moddedFireRate / Math.max(weapon.fireRate, 0.001);
    const moddedCharge = (weapon.chargeTime ?? 0) / speed;
    value = 1 / (moddedCharge + 1 / moddedFireRate);
    formula = "FR_charge = 1 / (ModdedChargeTime + 1/ModdedFR)";
    substituted = `1 / (${moddedCharge} + 1/${moddedFireRate}) = ${value}`;
  } else if (weapon.trigger === "burst") {
    const count = weapon.burstCount ?? 3;
    const delay = weapon.burstDelay ?? 0.08;
    value = count / (1 / moddedFireRate + (count - 1) * delay);
    formula = "FR_burst = BurstCount / (1/FR + (BurstCount−1)×BurstDelay)";
    substituted = `${count} / (1/${moddedFireRate} + ${(count - 1) * delay}) = ${value}`;
  }
  return {
    id: "effective-fr",
    name: "Effective fire rate",
    value,
    formula,
    substituted,
    stacking: "additive",
    terms: [{ name: "Modded fire rate", symbol: "FR", value: moddedFireRate, stacking: "additive" }],
    source: {
      title: "Damage/Calculation — Gun Damage Per Second",
      url: "https://wiki.warframe.com/w/Damage/Calculation",
    },
    kind: "documented",
  };
}

export function calculateWeapon(input: WeaponCalcInput): WeaponReport {
  const w = input.weapon;
  const m = input.mods;
  const doQ = input.quantize !== false;

  const damageBonus = sumPct(m.baseDamage);
  const msBonus = sumPct(m.multishot);
  const ccBonus = sumPct(m.critChance);
  const cdBonus = sumPct(m.critMultiplier);
  const scBonus = sumPct(m.statusChance);
  const frBonus = sumPct(m.fireRate);
  const relBonus = sumPct(m.reload);
  const magStacked = applyBonuses(w.magazine, m.magazine);
  const facBonus = sumPct(m.faction);
  const sdBonus = sumPct(m.statusDamage);
  const sdurBonus = sumPct(m.statusDuration);
  const impactB = sumPct(m.impact);
  const punctureB = sumPct(m.puncture);
  const slashB = sumPct(m.slash);
  const flatCC = m.flatCritChance.reduce((a, b) => a + b.value, 0);

  // Innate on weapons is stored as absolute damage in our dataset, not percent.
  const innateAbs = w.innate?.reduce((a, e) => a + e.bonus, 0) ?? 0;
  const baseIpsTotal = w.impact + w.puncture + w.slash + innateAbs;
  const moddedBase = baseIpsTotal * (1 + damageBonus);

  const ips = physicalAfterMods(
    {
      impact: w.impact * (1 + damageBonus),
      puncture: w.puncture * (1 + damageBonus),
      slash: w.slash * (1 + damageBonus),
    },
    { impact: impactB, puncture: punctureB, slash: slashB },
  );

  const innateSources: ElementSource[] = (w.innate ?? []).map((e) => ({
    ...e,
    bonus: baseIpsTotal > 0 ? e.bonus / baseIpsTotal : 0,
    origin: e.origin,
  }));

  const combined = combineElements([...m.elements, ...innateSources]);
  const rawMap = toDamageMap(ips, combined.types, moddedBase);
  const quantized = doQ ? quantizeDamageMap(rawMap, moddedBase) : { ...rawMap };
  const totalRaw = sumDamage(rawMap);
  const totalQ = sumDamage(quantized);
  const ms = w.multishot * (1 + msBonus);
  const arsenal = totalRaw * ms;

  const cc = w.critChance * (1 + ccBonus) + flatCC;
  const cd = w.critMultiplier * (1 + cdBonus);
  const sc = Math.min(w.statusChance * (1 + scBonus), 10);
  const fr = w.fireRate * (1 + frBonus);
  const reload = w.reload / (1 + relBonus);
  const mag = magStacked.result;

  const avgCrit = averageCritMultiplier(cc, cd);
  const avgShotDmg = totalQ * ms * (1 + facBonus) * avgCrit;
  const efr = effectiveFireRate(w, fr);
  const burst = avgShotDmg * efr.value;
  const shots = mag / (w.ammoCost ?? 1);
  const proportion = shots / (shots + efr.value * reload);
  const sustained = burst * proportion;

  const seed = dotSeed({
    moddedBaseDamage: moddedBase,
    moddedMultishot: ms,
    factionBonus: facBonus,
  });

  const elemBonus = (t: DotType): number => {
    if (t === "slash") return 0;
    const key = t as keyof DamageMap;
    const raw = rawMap[key] ?? 0;
    return moddedBase > 0 ? raw / moddedBase : 0;
  };

  const dots = {
    slash: averageDot({ type: "slash", seed, factionBonus: facBonus, statusDamageBonus: sdBonus, matchingElementalBonus: 0, statusDurationBonus: sdurBonus, statusChance: sc, avgCritMultiplier: avgCrit }),
    heat: averageDot({ type: "heat", seed, factionBonus: facBonus, statusDamageBonus: sdBonus, matchingElementalBonus: elemBonus("heat"), statusDurationBonus: sdurBonus, statusChance: sc, avgCritMultiplier: avgCrit }),
    toxin: averageDot({ type: "toxin", seed, factionBonus: facBonus, statusDamageBonus: sdBonus, matchingElementalBonus: elemBonus("toxin"), statusDurationBonus: sdurBonus, statusChance: sc, avgCritMultiplier: avgCrit }),
    electricity: averageDot({ type: "electricity", seed, factionBonus: facBonus, statusDamageBonus: sdBonus, matchingElementalBonus: elemBonus("electricity"), statusDurationBonus: sdurBonus, statusChance: sc, avgCritMultiplier: avgCrit }),
    gas: averageDot({ type: "gas", seed, factionBonus: facBonus, statusDamageBonus: sdBonus, matchingElementalBonus: elemBonus("gas"), statusDurationBonus: sdurBonus, statusChance: sc, avgCritMultiplier: avgCrit }),
  } satisfies Record<DotType, CalcResult>;

  const statusTickExamples = (["slash", "heat", "toxin", "electricity", "gas"] as DotType[]).map(
    (t) =>
      unroundedTick({
        seeds: [seed],
        type: t,
        elementalBonus: t === "slash" ? 0 : elemBonus(t),
        factionBonus: facBonus,
        statusDamageBonus: sdBonus,
      }).result,
  );

  return {
    moddedBase: {
      id: "modded-base",
      name: "Modded base damage",
      value: moddedBase,
      formula: "ModdedBase = Base × (1 + Σ +Damage%)",
      substituted: `${baseIpsTotal} × (1 + ${damageBonus}) = ${moddedBase}`,
      stacking: "additive",
      terms: [{ name: "+Damage sum", symbol: "D", value: damageBonus, stacking: "additive" }],
      source: { title: "Calculating Bonuses", url: "https://wiki.warframe.com/w/Calculating_Bonuses" },
      kind: "documented",
    },
    arsenalTotal: {
      id: "arsenal-total",
      name: "Arsenal total (avg non-crit, no faction)",
      value: arsenal,
      formula:
        "Arsenal = Base × [1 + Elem + IPS_dist·IPS_bonus] × (1+Damage) × [BaseMS × (1+MS)]",
      substituted: `${totalRaw} × ${ms} = ${arsenal}`,
      stacking: "mixed",
      terms: [],
      source: { title: "Damage/Calculation — Total Damage", url: "https://wiki.warframe.com/w/Damage/Calculation" },
      kind: "documented",
    },
    quantizedTotal: {
      id: "quantized-total",
      name: "Quantized total (pre-multishot, pre-faction)",
      value: totalQ,
      formula: "Each type quantized to nearest 1/32 of modded base, then summed",
      substituted: `${totalQ}`,
      stacking: "set",
      terms: [],
      source: { title: "Damage/Calculation — Quantization", url: "https://wiki.warframe.com/w/Damage/Calculation" },
      kind: "documented",
    },
    types: rawMap,
    quantized,
    combineSteps: combined.steps,
    crit: describeCrit(cc, cd),
    avgShot: {
      id: "avg-shot",
      name: "Average shot (crit + faction + multishot)",
      value: avgShotDmg,
      formula: "AvgShot = QuantizedTotal × MS × (1+Faction) × (1 + CC×(M−1))",
      substituted: `${totalQ} × ${ms} × ${1 + facBonus} × ${avgCrit} = ${avgShotDmg}`,
      stacking: "multiplicative",
      terms: [
        { name: "Quantized total", symbol: "Q", value: totalQ, stacking: "set" },
        { name: "Multishot", symbol: "MS", value: ms, stacking: "additive" },
        { name: "Faction", symbol: "F", value: facBonus, stacking: "multiplicative" },
        { name: "Average crit", symbol: "C", value: avgCrit, stacking: "multiplicative" },
      ],
      source: { title: "Damage/Calculation — Average Shot", url: "https://wiki.warframe.com/w/Damage/Calculation" },
      kind: "documented",
    },
    burstDps: {
      id: "burst-dps",
      name: "Average burst DPS (direct hits)",
      value: burst,
      formula: "BurstDPS = AvgShot × EffectiveFR",
      substituted: `${avgShotDmg} × ${efr.value} = ${burst}`,
      stacking: "multiplicative",
      terms: [],
      source: { title: "Damage/Calculation — Average Burst DPS", url: "https://wiki.warframe.com/w/Damage/Calculation" },
      kind: "documented",
    },
    sustainedDps: {
      id: "sustained-dps",
      name: "Average sustained DPS",
      value: sustained,
      formula: "Sustained = BurstDPS × shots / (shots + FR×reload)",
      substituted: `${burst} × ${shots} / (${shots} + ${efr.value}×${reload}) = ${sustained}`,
      stacking: "multiplicative",
      terms: [],
      source: { title: "Damage/Calculation — Average Sustained DPS", url: "https://wiki.warframe.com/w/Damage/Calculation" },
      kind: "documented",
    },
    dots,
    statusTickExamples,
    effectiveFireRate: efr,
    modded: {
      critChance: cc,
      critMultiplier: cd,
      statusChance: sc,
      fireRate: fr,
      reload,
      magazine: mag,
      multishot: ms,
      faction: facBonus,
      damageBonus,
    },
  };
}

export function emptyMods(): WeaponModInput {
  return {
    baseDamage: [],
    multishot: [],
    critChance: [],
    critMultiplier: [],
    statusChance: [],
    fireRate: [],
    reload: [],
    magazine: [],
    faction: [],
    statusDamage: [],
    statusDuration: [],
    impact: [],
    puncture: [],
    slash: [],
    elements: [],
    flatCritChance: [],
  };
}

export function mitigatedWeaponHit(
  report: WeaponReport,
  profile: EnemyProfile,
  netArmor: number,
  hitting: "health" | "shields",
): number {
  let total = 0;
  const map = report.quantized;
  (Object.keys(map) as (keyof DamageMap)[]).forEach((type) => {
    const amount = map[type];
    if (!amount) return;
    let inflicted = amount;
    if (hitting === "shields") {
      inflicted *= 1 + typeModifier(profile.shieldClass, type);
    } else {
      inflicted *= 1 + (profile.id === "unarmored" ? 0 : typeModifier(profile.health, type));
      if (profile.armorClass && netArmor > 0) {
        inflicted *= 1 + (profile.id === "unarmored" ? 0 : typeModifier(profile.armorClass, type));
        inflicted *= 1 - enemyArmorDR(netArmor);
      }
    }
    total += inflicted;
  });
  return total * report.modded.multishot * (1 + report.modded.faction) * report.crit.average.value;
}
