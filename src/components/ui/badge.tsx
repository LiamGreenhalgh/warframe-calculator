import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-gold/40 text-gold",
        additive: "border-gold bg-gold/15 text-gold",
        multiplicative: "border-cyan bg-cyan/15 text-cyan",
        flat: "border-mute bg-white/5 text-mute",
        set: "border-tenno bg-tenno/15 text-tenno",
        mixed: "border-electric bg-electric/15 text-electric",
        hypothesis: "border-dashed border-electric text-electric",
        estimate: "border-muted-foreground/40 text-mute",
        documented: "border-gold/30 text-gold",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
