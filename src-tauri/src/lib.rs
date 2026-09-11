use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadoutScanResult {
    pub paths_checked: Vec<String>,
    pub found: Vec<FoundLoadoutFile>,
    pub notes: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundLoadoutFile {
    pub path: String,
    pub bytes: u64,
}

fn candidate_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Ok(home) = std::env::var("HOME") {
        let home = PathBuf::from(home);
        dirs.push(home.join(".local/share/AlecaFrame"));
        dirs.push(home.join(".config/AlecaFrame"));
        dirs.push(home.join("Documents/AlecaFrame"));
        dirs.push(home.join("Documents/Warframe"));
        dirs.push(home.join("Library/Application Support/AlecaFrame"));
        dirs.push(home.join("Library/Application Support/Warframe"));
    }
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        let local = PathBuf::from(local);
        dirs.push(local.join("AlecaFrame"));
        dirs.push(local.join("Warframe"));
        dirs.push(local.join("AlecaFrame/relicLogs"));
    }
    if let Ok(appdata) = std::env::var("APPDATA") {
        dirs.push(PathBuf::from(appdata).join("AlecaFrame"));
    }
    dirs.push(PathBuf::from("C:\\Users\\Public\\Documents\\Warframe"));
    dirs
}

fn collect_json_files(root: &PathBuf, found: &mut Vec<FoundLoadoutFile>) {
    let Ok(entries) = std::fs::read_dir(root) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                if name.starts_with('.') {
                    continue;
                }
            }
            collect_json_files(&path, found);
        } else if path
            .extension()
            .and_then(|s| s.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("json"))
        {
            if let Ok(meta) = path.metadata() {
                found.push(FoundLoadoutFile {
                    path: path.to_string_lossy().to_string(),
                    bytes: meta.len(),
                });
            }
        }
    }
}

#[tauri::command]
fn scan_aleca_loadouts() -> LoadoutScanResult {
    let dirs = candidate_dirs();
    let mut paths_checked = Vec::new();
    let mut found = Vec::new();
    for dir in &dirs {
        paths_checked.push(dir.to_string_lossy().to_string());
        if dir.is_dir() {
            collect_json_files(dir, &mut found);
        }
    }
    let notes = vec![
        "Live Warframe account auth is not used. Import JSON, paste a loadout, or scan local Aleca Frame-style folders.".to_string(),
        "On Windows the usual Aleca Frame folder is %LOCALAPPDATA%\\AlecaFrame.".to_string(),
        "If nothing is found, use the bundled sample loadout or paste Tenno Calculus JSON.".to_string(),
    ];
    LoadoutScanResult {
        paths_checked,
        found,
        notes,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_aleca_loadouts])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
