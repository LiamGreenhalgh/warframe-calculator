import { useMemo, useState } from "react";
import { WEAPONS, getWeapon } from "@/data/weapons";
import { MODS } from "@/data/mods";
import { ENEMY_PROFILES, netArmorAfterStrips } from "@/engine/armor";
import { calculateWeapon, mitigatedWeaponHit, type WeaponModInput } from "@/engine/weapon";
import { modsToWeaponInput } from "@/import/parse";
import type { TennoLoadout } from "@/import/schema";
import { EquationPanel } from "@/components/EquationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KindBadge, StackingBadge } from "@/components/StackingBadge";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { CalcResult } from "@/engine/types";
import { documentedElectricityBonus } from "@/engine/shards";
import type { ElementSource } from "@/engine/elemental";

export function WeaponPage({ loadout }: { loadout: TennoLoadout }) {
  const defaultId = loadout.primary?.id ?? WEAPONS[0].id;
  const [weaponId, setWeaponId] = useState(defaultId);
  const [query, setQuery] = useState("");
  const [modIds, setModIds] = useState<string[]>(loadout.primary?.mods ?? ["serration", "split-chamber"]);
  const [profileId, setProfileId] = useState(ENEMY_PROFILES[0].id);
  const [armor, setArmor] = useState(500);
  const [corrosive, setCorrosive] = useState(0);
  const [heat, setHeat] = useState(0);
  const [hitting, setHitting] = useState<"health" | "shields">("health");
  const [focus, setFocus] = useState<CalcResult | null>(null);
  const [showError, setShowError] = useState("");

  const weapon = getWeapon(weaponId);
  const slotMods = MODS.filter((m) => m.slot === weapon?.slot || m.slot === "any");
  const filteredWeapons = WEAPONS.filter((w) => w.name.toLowerCase().includes(query.toLowerCase()));

  const mapped = useMemo(() => modsToWeaponInput(modIds), [modIds]);

  const shardElec = documentedElectricityBonus(loadout.warframe?.shards ?? []);
  const mods: WeaponModInput = useMemo(() => {
    const copy: WeaponModInput = {
      ...mapped.input,
      elements: [...mapped.input.elements],
    };
    if (shardElec > 0 && weapon?.slot === "primary") {
      const src: ElementSource = {
        element: "electricity",
        bonus: shardElec,
        origin: "shard",
        name: "Violet Archon Shard electricity",
      };
      copy.elements = [...copy.elements, src];
    }
    return copy;
  }, [mapped, shardElec, weapon?.slot]);

  const report = weapon ? calculateWeapon({ weapon, mods }) : null;
  const profile = ENEMY_PROFILES.find((p) => p.id === profileId)!;
  const netArmor = netArmorAfterStrips(armor, { corrosiveStacks: corrosive, heatStacks: heat });
  const mitigated =
    report && weapon ? mitigatedWeaponHit(report, profile, netArmor, hitting) : 0;

  function toggleMod(id: string) {
    setModIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function applyLoadoutWeapon() {
    const ref = loadout.primary;
    if (!ref) {
      setShowError("This loadout has no primary weapon mapped.");
      return;
    }
    setShowError("");
    setWeaponId(ref.id);
    setModIds(ref.mods ?? []);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Weapon damage &amp; DPS</CardTitle>
            <CardDescription>
              Base damage mods are additive with each other. Faction, crit, and armor DR multiply. Violet electricity from the
              imported loadout is injected as an innate-style element on primaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Search arsenal</Label>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Braton, Soma, Amprex…" />
              </div>
              <div>
                <Label>Weapon</Label>
                <NativeSelect value={weaponId} onChange={(e) => setWeaponId(e.target.value)}>
                  {(filteredWeapons.length ? filteredWeapons : WEAPONS).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {w.slot}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={applyLoadoutWeapon}>
                Use loadout primary
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setModIds([])}>
                Strip mods
              </Button>
            </div>
            {showError ? <p className="text-sm text-tenno">{showError}</p> : null}
            {!weapon ? (
              <p className="text-sm text-mute">No weapon selected. Pick one from the arsenal list.</p>
            ) : null}
            {mapped.unknown.length ? (
              <p className="text-xs text-tenno">Unmapped mods (not in bundled catalog): {mapped.unknown.join(", ")}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mods</CardTitle>
            <CardDescription>
              Gold badges are +X% additive (STACKING_MULTIPLY). Cyan badges are × multiplicative groups such as faction.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {slotMods.map((m) => {
              const on = modIds.includes(m.id);
              const stacking = m.bonuses.some((b) => b.operation === "MULTIPLY") ? "multiplicative" : "additive";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMod(m.id)}
                  className={`rounded-sm border px-2 py-1 text-left text-xs ${on ? "border-gold bg-gold/15 text-gold" : "border-line text-mute"}`}
                >
                  <div className="font-medium">{m.name}</div>
                  <StackingBadge stacking={stacking} />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {report && weapon ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[report.moddedBase, report.avgShot, report.burstDps, report.sustainedDps].map((r) => (
                <button key={r.id} type="button" onClick={() => setFocus(r)} className="text-left">
                  <Card className="h-full hover:border-gold/50">
                    <CardHeader>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-display text-3xl text-gold">{formatNumber(r.value)}</div>
                      <StackingBadge stacking={r.stacking} />
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Crit tiers</CardTitle>
                <CardDescription>{report.crit.mix}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {[report.crit.average, report.crit.yellow, report.crit.orange, report.crit.red].map((c) => (
                  <Button key={c.id} type="button" size="sm" variant="secondary" onClick={() => setFocus(c)}>
                    {c.name}: {formatNumber(c.value, 3)}×
                  </Button>
                ))}
                <span className="text-sm text-mute">
                  CC {formatPercent(report.modded.critChance)} · CD {formatNumber(report.modded.critMultiplier, 2)}× · SC{" "}
                  {formatPercent(report.modded.statusChance)}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Damage types &amp; combine order</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="mb-3 list-disc pl-4 text-xs text-mute">
                  {report.combineSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-4">
                  {Object.entries(report.quantized)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between border border-line px-2 py-1">
                        <span>{k}</span>
                        <span className="text-gold">{formatNumber(v, 2)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status DPS (expected)</CardTitle>
                <CardDescription>
                  Slash / Heat / Toxin / Electricity / Gas. Tick math uses the wiki (Σ seeds + 1) × C × M. Average DoT tick
                  count is labeled as an estimate.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.values(report.dots).map((d) => (
                  <Button key={d.id} type="button" size="sm" variant="outline" onClick={() => setFocus(d)}>
                    {d.name.split(" ")[1]} {formatNumber(d.value)}
                    <KindBadge kind={d.kind} />
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enemy mitigation</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Target</Label>
                  <NativeSelect value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                    {ENEMY_PROFILES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <Label>Hit</Label>
                  <NativeSelect value={hitting} onChange={(e) => setHitting(e.target.value as "health" | "shields")}>
                    <option value="health">Health (armor applies)</option>
                    <option value="shields">Shields (armor ignored)</option>
                  </NativeSelect>
                </div>
                <div>
                  <Label>Armor before strips ({armor})</Label>
                  <input
                    type="range"
                    min={0}
                    max={2700}
                    value={armor}
                    onChange={(e) => setArmor(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Corrosive stacks {corrosive}</Label>
                    <input type="range" min={0} max={10} value={corrosive} onChange={(e) => setCorrosive(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <Label>Heat stacks {heat}</Label>
                    <input type="range" min={0} max={10} value={heat} onChange={(e) => setHeat(Number(e.target.value))} className="w-full" />
                  </div>
                </div>
                <div className="md:col-span-2 text-sm">
                  Net armor {formatNumber(netArmor, 1)} · mitigated avg shot{" "}
                  <span className="text-gold">{formatNumber(mitigated)}</span>
                  <Badge variant="estimate" className="ml-2">
                    type mods × enemy DR
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-mute">Select a weapon to compute arsenal damage, crit tiers, and DPS.</CardContent>
          </Card>
        )}
      </div>
      <EquationPanel result={focus ?? report?.avgShot} />
    </div>
  );
}
