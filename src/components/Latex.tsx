import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export function Latex({
  tex,
  display = true,
  className,
}: {
  tex: string;
  display?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        output: "html",
        trust: false,
      });
    } catch {
      return `<span class="text-mute font-mono text-xs">${escapeHtml(tex)}</span>`;
    }
  }, [tex, display]);

  return (
    <div
      className={cn("katex-host overflow-x-auto overflow-y-hidden", display && "py-1", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
