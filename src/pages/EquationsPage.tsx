import { useMemo, useState } from "react";
import { FORMULA_CATALOG, asCalcResult, type FormulaDoc } from "@/engine/formulas";
import { EquationPanel } from "@/components/EquationPanel";
import { Latex } from "@/components/Latex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { KindBadge, StackingBadge } from "@/components/StackingBadge";

const CATEGORIES: Array<FormulaDoc["category"] | "all"> = [
  "all",
  "stacking",
  "quantization",
  "weapon",
  "crit",
  "status",
  "armor",
  "shards",
  "abilities",
];

export function EquationsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [kind, setKind] = useState<"all" | FormulaDoc["kind"]>("all");
  const [selected, setSelected] = useState(FORMULA_CATALOG[0].id);

  const list = useMemo(() => {
    return FORMULA_CATALOG.filter((f) => {
      if (cat !== "all" && f.category !== cat) return false;
      if (kind !== "all" && f.kind !== kind) return false;
      const hay = `${f.name} ${f.formula} ${f.notes}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [q, cat, kind]);

  const doc = FORMULA_CATALOG.find((f) => f.id === selected) ?? list[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Equation explorer</CardTitle>
          <CardDescription>
            Every formula Tenno Calculus implements, with wiki citations. Rendered math uses the same LaTeX the engine stores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <Label>Search</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="violet, armor, DoT…" />
            </div>
            <div>
              <Label>Category</Label>
              <NativeSelect value={cat} onChange={(e) => setCat(e.target.value as typeof cat)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label>Kind</Label>
              <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="all">all</option>
                <option value="documented">documented</option>
                <option value="estimate">estimate</option>
              </NativeSelect>
            </div>
          </div>
          {list.length === 0 ? (
            <p className="py-8 text-center text-mute">No formulas match that filter.</p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(f.id)}
                    className="flex w-full flex-col gap-1 py-3 text-left hover:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{f.name}</span>
                      <StackingBadge stacking={f.stacking} />
                      <KindBadge kind={f.kind} />
                    </div>
                    {f.latex ? (
                      <Latex tex={f.latex} display={false} className="mt-1" />
                    ) : (
                      <span className="font-mono text-xs text-cyan">{f.formula}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <EquationPanel result={doc ? asCalcResult(doc) : undefined} empty="Pick a formula from the list." />
    </div>
  );
}
