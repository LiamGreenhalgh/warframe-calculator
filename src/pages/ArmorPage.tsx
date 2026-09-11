import { useMemo, useState } from "react";
import {
  ENEMY_PROFILES,
  TYPE_MODIFIERS,
  enemyArmorDR,
  explainArmor,
  netArmorAfterStrips,
  tennoArmorDR,
  type EnemyProfile,
} from "@/engine/armor";
import { EquationPanel } from "@/components/EquationPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StackingBadge } from "@/components/StackingBadge";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { CalcResult } from "@/engine/types";

export function ArmorPage() {
  const [kind, setKind] = useState<"tenno" | "enemy">("enemy");
  const [armor, setArmor] = useState(900);
  const [health, setHealth] = useState(1200);
  const [profileId, setProfileId] = useState(ENEMY_PROFILES[0].id);
  const [corrosive, setCorrosive] = useState(0);
  const [heat, setHeat] = useState(0);
  const [focus, setFocus] = useState<CalcResult | null>(null);

  const profile = ENEMY_PROFILES.find((p) => p.id === profileId)!;
  const net = netArmorAfterStrips(armor, { corrosiveStacks: corrosive, heatStacks: heat });
  const result = useMemo(() => explainArmor(net, kind, health), [net, kind, health]);
  const rawDR = kind === "tenno" ? tennoArmorDR(armor) : enemyArmorDR(armor);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Enemy mitigation</CardTitle>
            <CardDescription>
              Tenno armor is AR/(AR+300). Enemy armor is 0.9 × √(AR/2700) up to 90% at 2700. Shields ignore armor. Toxin
              bypasses most shields.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Formula</Label>
              <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as "tenno" | "enemy")}>
                <option value="enemy">Enemy (sqrt cap)</option>
                <option value="tenno">Tenno / Warframe</option>
              </NativeSelect>
            </div>
            <div>
              <Label>Codex profile (type mods)</Label>
              <NativeSelect value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                {ENEMY_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="md:col-span-2">
              <Label>Armor {armor} → net {formatNumber(net, 1)}</Label>
              <input type="range" min={0} max={2700} value={armor} onChange={(e) => setArmor(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <Label>Nominal health {health}</Label>
              <input type="range" min={100} max={20000} value={health} onChange={(e) => setHealth(Number(e.target.value))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Corrosive {corrosive}</Label>
                <input type="range" min={0} max={10} value={corrosive} onChange={(e) => setCorrosive(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <Label>Heat {heat}</Label>
                <input type="range" min={0} max={10} value={heat} onChange={(e) => setHeat(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" className="text-left" onClick={() => setFocus(result)}>
            <Card className="hover:border-gold/50">
              <CardHeader><CardTitle className="text-base">Damage reduction</CardTitle></CardHeader>
              <CardContent>
                <div className="font-display text-3xl text-gold">{formatPercent(result.value, 2)}</div>
                <StackingBadge stacking="multiplicative" />
              </CardContent>
            </Card>
          </button>
          <Card>
            <CardHeader><CardTitle className="text-base">Damage taken</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl text-gold">{formatPercent(1 - result.value, 2)}</div>
              <p className="text-xs text-mute">Unstripped DR {formatPercent(rawDR, 2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">EHP</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl text-gold">{formatNumber(health / Math.max(1 - result.value, 1e-9))}</div>
            </CardContent>
          </Card>
        </div>

        <TypeTable profile={profile} />
      </div>
      <EquationPanel result={focus ?? result} />
    </div>
  );
}

function TypeTable({ profile }: { profile: EnemyProfile }) {
  const classes = [profile.health, profile.armorClass, profile.shieldClass].filter(Boolean);
  const types = ["impact", "puncture", "slash", "heat", "cold", "electricity", "toxin", "blast", "corrosive", "gas", "magnetic", "radiation", "viral"] as const;
  if (!classes.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-mute">This profile has no health/armor/shield classes listed.</CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Damage type modifiers</CardTitle>
        <CardDescription>{profile.notes}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="uppercase text-mute">
            <tr>
              <th className="py-1">Type</th>
              {classes.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t} className="border-t border-line">
                <td className="py-1">{t}</td>
                {classes.map((c) => {
                  const v = TYPE_MODIFIERS[c!]?.[t] ?? 0;
                  return (
                    <td key={c} className={v > 0 ? "text-gold" : v < 0 ? "text-tenno" : "text-mute"}>
                      {v === 0 ? "—" : v > 0 ? `+${v * 100}%` : `${v * 100}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex gap-2">
          <Badge variant="additive">health/armor/shield type mods</Badge>
          <Badge variant="multiplicative">armor DR is a separate ×</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
