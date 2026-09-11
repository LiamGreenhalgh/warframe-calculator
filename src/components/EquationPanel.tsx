import type { CalcResult } from "@/engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KindBadge, StackingBadge } from "@/components/StackingBadge";
import { Latex } from "@/components/Latex";
import { formatNumber } from "@/lib/utils";

export function EquationPanel({ result, empty }: { result?: CalcResult | null; empty?: string }) {
  if (!result) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Equation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mute">{empty ?? "Run a calculation to see the formula, substituted values, and whether each term is +X% or ×."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{result.name}</CardTitle>
          <StackingBadge stacking={result.stacking} />
          <KindBadge kind={result.kind} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-mute">Result</div>
          <div className="font-display text-3xl text-gold">
            {formatNumber(result.value, 4)}
            {result.unit ? <span className="ml-2 text-base text-mute">{result.unit}</span> : null}
            {result.displayRounded != null ? (
              <span className="ml-2 text-base text-mute">display {result.displayRounded}</span>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-mute">Formula</div>
          {result.latex ? (
            <Latex tex={result.latex} display />
          ) : (
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-cyan">{result.formula}</pre>
          )}
          {result.latex && result.formula ? (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-mute">{result.formula}</pre>
          ) : null}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-mute">Substituted</div>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-ink">{result.substituted}</pre>
        </div>
        {result.terms.length > 0 ? (
          <div>
            <div className="text-xs uppercase tracking-wider text-mute">Variable glossary</div>
            <ul className="mt-1 space-y-1">
              {result.terms.map((t) => (
                <li key={t.symbol + t.name} className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-gold">{t.symbol}</span>
                  <span>{t.name}</span>
                  <span className="font-mono text-mute">{formatNumber(t.value, 4)}</span>
                  <StackingBadge stacking={t.stacking} />
                  {t.notes ? <span className="text-xs text-mute">{t.notes}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {result.assumption ? (
          <p className="border-l-2 border-electric/50 pl-2 text-xs text-mute">{result.assumption}</p>
        ) : null}
        <a
          className="inline-block text-xs text-gold underline decoration-gold/40 underline-offset-4"
          href={result.source.url}
          target="_blank"
          rel="noreferrer"
        >
          Source: {result.source.title}
        </a>
      </CardContent>
    </Card>
  );
}
