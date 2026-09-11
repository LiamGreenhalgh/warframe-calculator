import { useMemo, useState } from "react";
import {
  SHARD_BUFFS,
  explainVioletElectricity,
  sumAbilityDamageBonus,
  sumBuff,
  violetMeleeCritDamage,
  type ShardBuffId,
  type ShardColor,
  type SocketedShard,
} from "@/engine/shards";
import type { TennoLoadout } from "@/import/schema";
import { EquationPanel } from "@/components/EquationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { KindBadge, StackingBadge } from "@/components/StackingBadge";
import { formatPercent } from "@/lib/utils";
import type { CalcResult } from "@/engine/types";

const COLORS: ShardColor[] = ["crimson", "amber", "azure", "topaz", "violet", "emerald"];

function emptySocket(color: ShardColor): SocketedShard {
  const buff = SHARD_BUFFS.find((b) => b.color === color)!.id;
  return { color, tauforged: false, buff };
}

export function ShardsPage({
  loadout,
  onShards,
}: {
  loadout: TennoLoadout;
  onShards: (shards: SocketedShard[]) => void;
}) {
  const [shards, setShards] = useState<SocketedShard[]>(
    loadout.warframe?.shards?.length
      ? loadout.warframe.shards
      : [
          { color: "violet", tauforged: true, buff: "primaryElectricity" },
          { color: "violet", tauforged: true, buff: "primaryElectricity" },
          { color: "crimson", tauforged: true, buff: "abilityStrength" },
          { color: "crimson", tauforged: true, buff: "abilityStrength" },
          { color: "crimson", tauforged: true, buff: "abilityStrength" },
        ],
  );
  const [energy, setEnergy] = useState(525);
  const [focus, setFocus] = useState<CalcResult | null>(null);

  const report = useMemo(() => explainVioletElectricity(shards), [shards]);
  const melee = violetMeleeCritDamage(shards, energy);
  const str = sumBuff(shards, "abilityStrength");
  const ad = sumAbilityDamageBonus(shards);

  function update(i: number, patch: Partial<SocketedShard>) {
    setShards((prev) => {
      const next = prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
      onShards(next);
      return next;
    });
  }

  function setColor(i: number, color: ShardColor) {
    const buff = SHARD_BUFFS.find((b) => b.color === color)!.id;
    update(i, { color, buff });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Archon Shard calculator</CardTitle>
            <CardDescription>
              Five Helminth sockets. Tauforged is 1.5× the card. Violet electricity uses the wiki formula: each shard
              contributes base + extra × N, and N counts every Crimson, Azure, and Violet shard including itself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shards.map((s, i) => {
              const buffs = SHARD_BUFFS.filter((b) => b.color === s.color);
              return (
                <div key={i} className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-4">
                  <div>
                    <Label>Socket {i + 1}</Label>
                    <NativeSelect value={s.color} onChange={(e) => setColor(i, e.target.value as ShardColor)}>
                      {COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex h-9 items-center gap-2 text-sm">
                      <input type="checkbox" checked={s.tauforged} onChange={(e) => update(i, { tauforged: e.target.checked })} />
                      Tauforged
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Buff</Label>
                    <NativeSelect value={s.buff} onChange={(e) => update(i, { buff: e.target.value as ShardBuffId })}>
                      {buffs.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => { const next = COLORS.map(emptySocket); setShards(next); onShards(next); }}>
                Empty sockets
              </Button>
              <Button
                type="button"
                size="sm"
                variant="electric"
                onClick={() => {
                  const next = Array.from({ length: 5 }, () => ({ color: "violet" as const, tauforged: true, buff: "primaryElectricity" as const }));
                  setShards(next);
                  onShards(next);
                }}
              >
                5× Tauforged violet electricity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Violet primary electricity</CardTitle>
            <CardDescription>
              Documented: each electricity shard contributes base + extra × N, and N counts every Crimson, Azure, and Violet
              shard including itself. Eligible N = {report.eligibleCount}. Additive with Stormbringer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-4xl text-gold">{formatPercent(report.documented.value, 1)}</span>
              <StackingBadge stacking="additive" />
              <KindBadge kind="documented" />
              <Button type="button" size="sm" variant="secondary" onClick={() => setFocus(report.documented)}>
                Show wiki equation
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-mute">
                  <tr>
                    <th className="py-1">Wiki example</th>
                    <th>Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {report.wikiExamples.map((ex) => (
                    <tr key={ex.label} className="border-t border-line">
                      <td className="py-1">{ex.label}</td>
                      <td className="font-mono text-gold">{formatPercent(ex.bonus, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-mute">
              Amber, Topaz, and Emerald do not increment N. Electricity combines after mods, like an innate element (HCET with
              valence).
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ability Strength shards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl text-gold">{formatPercent(str, 1)}</div>
              <StackingBadge stacking="additive" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shard Ability Damage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl text-gold">{formatPercent(ad, 1)}</div>
              <p className="text-xs text-mute">Unique × vs matching status. Additive across colors.</p>
            </CardContent>
          </Card>
          <button type="button" className="text-left" onClick={() => setFocus(melee)}>
            <Card className="h-full hover:border-gold/50">
              <CardHeader>
                <CardTitle className="text-base">Violet melee CD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl text-gold">{formatPercent(melee.value, 1)}</div>
                <Label>Max energy (doubles above 500)</Label>
                <Input type="number" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
      <EquationPanel result={focus ?? report.documented} />
    </div>
  );
}
