import { useState } from "react";
import { sampleLoadout } from "@/import/parse";
import type { TennoLoadout } from "@/import/schema";
import type { SocketedShard } from "@/engine/shards";
import { Shell, type AppPage } from "@/components/Shell";
import { WeaponPage } from "@/pages/WeaponPage";
import { ShardsPage } from "@/pages/ShardsPage";
import { AbilityPage } from "@/pages/AbilityPage";
import { ArmorPage } from "@/pages/ArmorPage";
import { StackingPage } from "@/pages/StackingPage";
import { ImportPage } from "@/pages/ImportPage";
import { EquationsPage } from "@/pages/EquationsPage";

export default function App() {
  const [page, setPage] = useState<AppPage>("shards");
  const [loadout, setLoadout] = useState<TennoLoadout>(() => sampleLoadout());

  function onShards(shards: SocketedShard[]) {
    setLoadout((prev) => ({
      ...prev,
      warframe: {
        id: prev.warframe?.id ?? "volt-prime",
        name: prev.warframe?.name,
        mods: prev.warframe?.mods,
        shards,
      },
    }));
  }

  return (
    <Shell page={page} onPage={setPage} loadout={loadout}>
      {page === "weapons" ? <WeaponPage loadout={loadout} /> : null}
      {page === "shards" ? <ShardsPage loadout={loadout} onShards={onShards} /> : null}
      {page === "abilities" ? <AbilityPage loadout={loadout} /> : null}
      {page === "armor" ? <ArmorPage /> : null}
      {page === "stacking" ? <StackingPage /> : null}
      {page === "import" ? <ImportPage loadout={loadout} onLoadout={setLoadout} /> : null}
      {page === "equations" ? <EquationsPage /> : null}
    </Shell>
  );
}
