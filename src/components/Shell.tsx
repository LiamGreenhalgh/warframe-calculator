import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TennoLoadout } from "@/import/schema";

export type AppPage =
  | "weapons"
  | "shards"
  | "abilities"
  | "armor"
  | "stacking"
  | "import"
  | "equations";

const NAV: Array<{ id: AppPage; label: string }> = [
  { id: "weapons", label: "Weapons / DPS" },
  { id: "shards", label: "Archon Shards" },
  { id: "abilities", label: "Abilities" },
  { id: "armor", label: "Mitigation" },
  { id: "stacking", label: "Stacking" },
  { id: "import", label: "Loadout" },
  { id: "equations", label: "Equations" },
];

export function Shell({
  page,
  onPage,
  loadout,
  children,
}: {
  page: AppPage;
  onPage: (p: AppPage) => void;
  loadout: TennoLoadout;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-3xl text-gold">Tenno Calculus</div>
            <p className="max-w-xl text-xs text-mute">
              Arsenal math that keeps +X% additive bonuses apart from × multiplicative ones. Loadout:{" "}
              <span className="text-ink">{loadout.name}</span>
            </p>
          </div>
          <div className="text-right text-[10px] uppercase tracking-[0.2em] text-gold-dim">
            Foundry terminal · offline dataset
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 pb-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPage(item.id)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs uppercase tracking-wider",
                page === item.id ? "bg-gold text-primary-foreground" : "text-mute hover:bg-white/5 hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
