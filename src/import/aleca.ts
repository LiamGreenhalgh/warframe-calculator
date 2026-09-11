import { ALECA_SCAN_PATHS } from "./schema";

export interface DesktopScan {
  available: boolean;
  pathsChecked: string[];
  found: Array<{ path: string; bytes: number }>;
  notes: string[];
}

export function browserScanUnavailable(): DesktopScan {
  return {
    available: false,
    pathsChecked: ALECA_SCAN_PATHS,
    found: [],
    notes: [
      "Folder scanning requires the Tauri desktop build.",
      "In the browser preview, use Paste JSON, Upload file, or Load sample.",
    ],
  };
}

export async function scanAlecaFromTauri(): Promise<DesktopScan> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<{
      pathsChecked: string[];
      found: Array<{ path: string; bytes: number }>;
      notes: string[];
    }>("scan_aleca_loadouts");
    return { available: true, ...result };
  } catch {
    return browserScanUnavailable();
  }
}
