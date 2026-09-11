import { useMemo, useState } from "react";
import { WARFRAMES, getWarframe } from "@/data/warframes";
import { MODS } from "@/data/mods";
import { calculateAbilities } from "@/engine/abilities";
import { sumAbilityDamageBonus, sumBuff, type SocketedShard } from "@/engine/shards";
import { warframeBonusesFromMods } from "@/import/parse";
import type { TennoLoadout } from "@/import/schema";
import { EquationPanel } from "@/components/EquationPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, NativeSelect } from "@/components/ui/input";
import { StackingBadge } from "@/components/StackingBadge";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { Bonus, CalcResult } from "@/engine/types";

export function AbilityPage({ loadout }: { loadout: TennoLoadout }) {
  const [frameId, setFrameId] = useState(loadout.warframe?.id ?? "volt-prime");
  const [modIds, setModIds] = useState<string[]>(loadout.warframe?.mods ?? ["blind-rage", "streamline", "primed-continuity", "stretch"]);
  const [abilityIndex, setAbilityIndex] = useState(0);
  const [focus, setFocus] = useState<CalcResult | null>(null);

  const frame = getWarframe(frameId);
  const ability = frame?.abilities[abilityIndex];
  const mapped = warframeBonusesFromMods(modIds);
  const shards: SocketedShard[] = loadout.warframe?.shards ?? [];
  const strengthShards: Bonus[] = sumBuff(shards, "abilityStrength")
    ? [{ id: "crimson-str", name: "Crimson Ability Strength", stat: "strength", value: sumBuff(shards, "abilityStrength"), operation: "STACKING_MULTIPLY", group: "strength" }]
    : [];
  const durationShards: Bonus[] = sumBuff(shards, "abilityDuration")
    ? [{ id: "crimson-dur", name: "Crimson Ability Duration", stat: "duration", value: sumBuff(shards, "abilityDuration"), operation: "STACKING_MULTIPLY", group: "duration" }]
    : [];

  const report = useMemo(() => {
    if (!ability) return null;
    return calculateAbilities({
      strengthBonuses: [...mapped.strength, ...strengthShards],
      durationBonuses: [...mapped.duration, ...durationShards],
      rangeBonuses: mapped.range,
      efficiencyBonuses: mapped.efficiency,
      baseCastCost: ability.baseCost,
      baseDrainPerSecond: ability.baseDrain ?? 10,
      baseAbilityDamage: ability.baseDamage,
      baseDuration: ability.baseDuration,
      baseRange: ability.baseRange,
      shardAbilityDamage: sumAbilityDamageBonus(shards),
    });
  }, [ability, mapped, strengthShards, durationShards, shards]);

  function toggle(id: string) {
    setModIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const wfMods = MODS.filter((m) => m.slot === "warframe");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ability Strength / Duration / Range / Efficiency</CardTitle>
            <CardDescription>
              Percent ability stats add with Intensify, Blind Rage, and Crimson shards. Cast cost floors at 25% of base.
              Channel drain uses uncapped efficiency divided by duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Warframe</Label>
              <NativeSelect value={frameId} onChange={(e) => { setFrameId(e.target.value); setAbilityIndex(0); }}>
                {WARFRAMES.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label>Ability</Label>
              <NativeSelect value={abilityIndex} onChange={(e) => setAbilityIndex(Number(e.target.value))}>
                {frame?.abilities.map((a, i) => (
                  <option key={a.name} value={i}>{a.name}</option>
                ))}
              </NativeSelect>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mods</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {wfMods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`rounded-sm border px-2 py-1 text-xs ${modIds.includes(m.id) ? "border-gold bg-gold/15 text-gold" : "border-line text-mute"}`}
              >
                {m.name}
              </button>
            ))}
          </CardContent>
        </Card>

        {report && ability ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([report.strength, report.duration, report.range, report.efficiency] as CalcResult[]).map((r) => (
                <button key={r.id} type="button" className="text-left" onClick={() => setFocus(r)}>
                  <Card className="h-full hover:border-gold/50">
                    <CardHeader>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-display text-3xl text-gold">{formatPercent(r.value - 1, 1)}</div>
                      <div className="text-xs text-mute">multiplier {formatNumber(r.value, 3)}×</div>
                      <StackingBadge stacking="additive" />
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[report.castCost, report.channelDrain, report.scaledDamage].map((r) => (
                <button key={r.id} type="button" className="text-left" onClick={() => setFocus(r)}>
                  <Card className="h-full hover:border-gold/50">
                    <CardHeader>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-display text-3xl text-gold">{formatNumber(r.value, 2)}</div>
                      <StackingBadge stacking={r.stacking} />
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
            <p className="text-sm text-mute">{ability.notes}</p>
            {ability.baseDuration ? (
              <p className="text-sm">
                Scaled duration <span className="text-gold">{formatNumber(ability.baseDuration * report.duration.value, 2)}s</span>
              </p>
            ) : null}
            {ability.baseRange ? (
              <p className="text-sm">
                Scaled range <span className="text-gold">{formatNumber(ability.baseRange * report.range.value, 2)}m</span>
              </p>
            ) : null}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-mute">Select a Warframe to compute Strength, Duration, Range, and Efficiency.</CardContent>
          </Card>
        )}
      </div>
      <EquationPanel result={focus ?? report?.castCost} />
    </div>
  );
}
