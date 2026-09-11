import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-line bg-void px-3 text-sm text-ink placeholder:text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-32 w-full rounded-md border border-line bg-void px-3 py-2 font-mono text-xs text-ink placeholder:text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs uppercase tracking-wider text-mute", className)} {...props} />;
}

export function NativeSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-line bg-void px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className,
      )}
      {...props}
    />
  );
}
