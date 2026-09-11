import { useMemo, useState } from "react";
import { applyBonuses, compareAdditiveVsMultiplicative, type Bonus } from "@/engine";
import { EquationPanel } from "@/components/EquationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { StackingBadge } from "@/components/StackingBadge";
import { formatNumber, formatSignedPercent } from "@/lib/utils";
import type { CalcResult, OperationType } from "@/engine/types";

interface Row {
  name: string;
  valuePct: number;
  operation: OperationType;
  group: string;
}

const PRESETS: Row[][] = [
  [
    { name: "Serration", valuePct: 165, operation: "STACKING_MULTIPLY", group: "damage" },
    { name: "Heavy Caliber", valuePct: 165, operation: "STACKING_MULTIPLY", group: "damage" },
  ],
  [
    { name: "Serration", valuePct: 165, operation: "STACKING_MULTIPLY", group: "damage" },
    { name: "Bane of Grineer", valuePct: 30, operation: "MULTIPLY", group: "faction" },
  ],
  [
    { name: "Intensify", valuePct: 30, operation: "STACKING_MULTIPLY", group: "strength" },
    { name: "Blind Rage", valuePct: 99, operation: "STACKING_MULTIPLY", group: "strength" },
    { name: "Tau Crimson Strength", valuePct: 15, operation: "STACKING_MULTIPLY", group: "strength" },
  ],
];

export function StackingPage() {
  const [base, setBase] = useState(100);
  const [rows, setRows] = useState<Row[]>(PRESETS[1]);
  const [focus, setFocus] = useState<CalcResult | null>(null);

  const bonuses: Bonus[] = rows.map((r, i) => ({
    id: `${r.name}-${i}`,
    name: r.name,
    stat: r.group,
    value: r.operation === "ADD" ? r.valuePct : r.valuePct / 100,
    operation: r.operation,
    group: r.group,
  }));

  const stacked = useMemo(() => applyBonuses(base, bonuses), [base, bonuses]);
  const cmp = compareAdditiveVsMultiplicative(rows.filter((r) => r.operation !== "ADD").map((r) => r.valuePct / 100));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Bonus stacking engine</CardTitle>
            <CardDescription>
              Same-group +X% cards add, then groups multiply. A +30% Bane is not another Serration. If two +165% damage mods
              multiplied they would be 7.02×; they add to 4.3×.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Base stat</Label>
              <Input type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <Button key={i} type="button" size="sm" variant="outline" onClick={() => setRows(p)}>
                  {p.map((r) => r.name).join(" + ")}
                </Button>
              ))}
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-line p-2 md:grid-cols-4">
                <Input value={r.name} onChange={(e) => setRows(edit(rows, i, { name: e.target.value }))} />
                <Input type="number" value={r.valuePct} onChange={(e) => setRows(edit(rows, i, { valuePct: Number(e.target.value) }))} />
                <NativeSelect
                  value={r.operation}
                  onChange={(e) => setRows(edit(rows, i, { operation: e.target.value as OperationType }))}
                >
                  <option value="STACKING_MULTIPLY">+X% additive group</option>
                  <option value="MULTIPLY">× own group</option>
                  <option value="ADD">flat ADD</option>
                  <option value="SET">SET</option>
                </NativeSelect>
                <Input value={r.group} onChange={(e) => setRows(edit(rows, i, { group: e.target.value }))} />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRows([...rows, { name: "New bonus", valuePct: 30, operation: "STACKING_MULTIPLY", group: "damage" }])}
            >
              Add bonus
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" className="text-left" onClick={() => setFocus(stacked.resultAsCalc)}>
            <Card className="hover:border-gold/50">
              <CardHeader><CardTitle className="text-base">Stacked result</CardTitle></CardHeader>
              <CardContent>
                <div className="font-display text-3xl text-gold">{formatNumber(stacked.result, 3)}</div>
                <StackingBadge stacking={stacked.resultAsCalc.stacking} />
              </CardContent>
            </Card>
          </button>
          <Card>
            <CardHeader><CardTitle className="text-base">If everything added</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl text-mute">{formatNumber(base * cmp.additiveMultiplier, 3)}</div>
              <p className="text-xs text-mute">{formatSignedPercent(cmp.additiveBonus)} vs base</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">If everything multiplied</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl text-cyan">{formatNumber(base * cmp.multiplicativeMultiplier, 3)}</div>
              <p className="text-xs text-mute">{formatSignedPercent(cmp.multiplicativeBonus)} vs base</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Groups</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {stacked.groups.map((g) => (
              <div key={g.group} className="flex flex-wrap items-center gap-2 border-b border-line py-2">
                <span className="font-mono text-gold">{g.group}</span>
                <StackingBadge stacking={g.stacking} />
                <span>Σ {formatNumber(g.sum, 3)} → ×{formatNumber(g.multiplier, 3)}</span>
                <span className="text-mute">{g.bonuses.map((b) => b.name).join(", ")}</span>
              </div>
            ))}
            {!stacked.groups.length ? <p className="text-mute">No percent groups. Empty input yields the base stat.</p> : null}
          </CardContent>
        </Card>
      </div>
      <EquationPanel result={focus ?? stacked.resultAsCalc} />
    </div>
  );
}

function edit(rows: Row[], i: number, patch: Partial<Row>): Row[] {
  return rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
}
