import { useState } from "react";
import { SAMPLE_LOADOUT } from "@/data/sampleLoadout";
import { describeAlecaFallback, parseLoadoutJson, sampleLoadout } from "@/import/parse";
import { browserScanUnavailable, scanAlecaFromTauri, type DesktopScan } from "@/import/aleca";
import { LOADOUT_JSON_SCHEMA, type TennoLoadout } from "@/import/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ImportPage({
  loadout,
  onLoadout,
}: {
  loadout: TennoLoadout;
  onLoadout: (l: TennoLoadout) => void;
}) {
  const [text, setText] = useState(JSON.stringify(SAMPLE_LOADOUT, null, 2));
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("Paste JSON, upload a file, load the sample, or scan Aleca Frame folders on desktop.");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [scan, setScan] = useState<DesktopScan>(browserScanUnavailable());

  async function applyText(raw: string) {
    setStatus("loading");
    setWarnings([]);
    const result = parseLoadoutJson(raw);
    if (!result.ok || !result.loadout) {
      setStatus("error");
      setMessage(result.errors.join(" ") || "Could not read that JSON.");
      return;
    }
    onLoadout(result.loadout);
    setStatus("ok");
    setMessage(`Loaded ${result.loadout.name}. Weapons and shards now feed the other calculators.`);
    setWarnings(result.warnings);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setStatus("loading");
    try {
      const raw = await file.text();
      setText(raw);
      await applyText(raw);
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  async function scanDesktop() {
    setStatus("loading");
    const result = await scanAlecaFromTauri();
    setScan(result);
    if (!result.available) {
      setStatus("error");
      setMessage("Folder scan is a Tauri desktop feature. Use paste/upload in this browser preview.");
      return;
    }
    if (!result.found.length) {
      setStatus("ok");
      setMessage("Scan finished. No JSON files in the usual Aleca Frame folders. Load the sample or paste an export.");
      return;
    }
    setStatus("ok");
    setMessage(`Found ${result.found.length} JSON file(s). Open one below or paste its contents.`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Import loadout</CardTitle>
          <CardDescription>
            No Warframe account login. Tenno Calculus never asks for a password. Use a JSON export, Aleca-style local files,
            or the bundled sample.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => applyText(text)}>Parse JSON</Button>
            <Button type="button" variant="outline" onClick={() => { const s = sampleLoadout(); setText(JSON.stringify(s, null, 2)); applyText(JSON.stringify(s)); }}>
              Load sample
            </Button>
            <Button type="button" variant="secondary" onClick={scanDesktop}>
              Scan Aleca folders
            </Button>
            <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-gold/40 px-3 text-sm text-gold">
              Upload file
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          <Label htmlFor="loadout-json">JSON</Label>
          <Textarea id="loadout-json" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          {status === "idle" ? <p className="text-sm text-mute">{message}</p> : null}
          {status === "loading" ? <p className="text-sm text-electric">Reading loadout…</p> : null}
          {status === "ok" ? <p className="text-sm text-gold">{message}</p> : null}
          {status === "error" ? <p className="text-sm text-tenno">{message}</p> : null}
          {warnings.map((w) => (
            <p key={w} className="text-xs text-mute">{w}</p>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Active loadout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-display text-2xl text-gold">{loadout.name}</div>
            <p className="text-mute">{loadout.notes}</p>
            <p>Warframe: {loadout.warframe?.name ?? "—"} · shards {loadout.warframe?.shards?.length ?? 0}</p>
            <p>Primary: {loadout.primary?.name ?? "—"} ({(loadout.primary?.mods ?? []).length} mods)</p>
            <p>Secondary: {loadout.secondary?.name ?? "—"}</p>
            <p>Melee: {loadout.melee?.name ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aleca Frame / inventory</CardTitle>
            <CardDescription>Fallbacks when live auth is impossible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-mute">
            {describeAlecaFallback().map((line) => (
              <p key={line}>• {line}</p>
            ))}
            <div className="flex flex-wrap gap-1 pt-2">
              <Badge variant="documented">sample bundled</Badge>
              <Badge variant="estimate">no account secrets</Badge>
            </div>
            {scan.found.length ? (
              <ul className="font-mono text-xs text-ink">
                {scan.found.map((f) => (
                  <li key={f.path}>{f.path} ({f.bytes} B)</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs">Last scan found no files. Paths checked: {scan.pathsChecked.slice(0, 3).join(", ")}…</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>JSON schema</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto font-mono text-[10px] text-mute">{JSON.stringify(LOADOUT_JSON_SCHEMA, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
