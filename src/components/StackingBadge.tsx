import type { StackingClass } from "@/engine/types";
import { Badge } from "@/components/ui/badge";

const LABEL: Record<StackingClass, { text: string; variant: "additive" | "multiplicative" | "flat" | "set" | "mixed" }> = {
  additive: { text: "+X% additive", variant: "additive" },
  multiplicative: { text: "× multiplicative", variant: "multiplicative" },
  flat: { text: "flat ADD", variant: "flat" },
  set: { text: "SET override", variant: "set" },
  mixed: { text: "mixed +% / ×", variant: "mixed" },
};

export function StackingBadge({ stacking }: { stacking: StackingClass }) {
  const spec = LABEL[stacking];
  return <Badge variant={spec.variant}>{spec.text}</Badge>;
}

export function KindBadge({ kind }: { kind?: "documented" | "estimate" }) {
  if (kind === "estimate") return <Badge variant="estimate">Estimate / assumption</Badge>;
  return <Badge variant="documented">Wiki-documented</Badge>;
}
