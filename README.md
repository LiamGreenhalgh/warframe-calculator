# Tenno Calculus

A standalone **Warframe calculator** for bonus stacking, weapon DPS, Archon Shards, abilities, and enemy mitigation. Every result is paired with the equation, substituted values, a variable glossary, and whether each term is **+X% additive** or **× multiplicative**.

**Live site:** [https://liamgreenhalgh.github.io/warframe-calculator/](https://liamgreenhalgh.github.io/warframe-calculator/)

The UI runs in a browser (Vite), on GitHub Pages, and as a native Windows / macOS / Linux app (Tauri 2).

## What it calculates

- **Bonus stacking** — `STACKING_MULTIPLY` (+X% in the same group add) vs `MULTIPLY` (separate groups multiply) vs flat `ADD` vs `SET`
- **Weapon damage / DPS** — base damage, IPS, elemental combining (including HCET / shard electricity), faction, crit tiers (yellow / orange / red), multishot, fire rate, reload, burst and sustained DPS
- **Status DPS** — Slash / Heat / Toxin / Electricity / Gas using the wiki tick formula `(Σ seeds + 1) × C × M`
- **Archon Shards** — all six colors, Tauforged, including **Violet primary electricity**
- **Abilities** — Strength, Duration, Range, Efficiency, cast cost floor, channeled drain
- **Enemy mitigation** — Tenno armor `AR/(AR+300)`, enemy armor `0.9√(AR/2700)`, type modifiers, Corrosive / Heat strips
- **Equation explorer** — every implemented formula with wiki URLs
- **Loadout import** — paste / file / sample / Aleca-style folder scan (desktop)

## Additive vs multiplicative

Warframe writes almost everything as a percent. That does **not** mean the percents multiply.

| Internal op | UI badge | Meaning | Example |
| --- | --- | --- | --- |
| `STACKING_MULTIPLY` | **+X% additive** | `Base × (1 + b1 + b2)` | Serration + Heavy Caliber → 4.3× |
| `MULTIPLY` | **× multiplicative** | `Base × (1+b1) × (1+b2)` | Serration × Bane of Grineer → 3.445× |
| `ADD` | **flat ADD** | applied after percents | Arcane Avenger +45 CC |
| `SET` | **SET override** | ignores other bonuses | Primary Acuity locks multishot |

If Serration (+165%) and Bane (+30%) added, you would only get +195%. They multiply, so the bonus is +244.5%.

## Violet / purple electricity (the example)

**Documented** (wiki.warframe.com/w/Violet_Archon_Shard):

```
E = Σ (base_i + extra_i × N)
N = number of Crimson + Azure + Violet shards, including the shard granting the bonus
Tauforged: base 45%, extra 15%
Normal:    base 30%, extra 10%
```

Wiki examples:

- 1 Tauforged electricity → **60%**
- 2 Tauforged electricity → **150%** = `2 × (45% + 15% × 2)`
- 2 electricity + 3 Crimson → **240%**
- 5 Tauforged electricity → **600%**

The bonus is **additive** with Stormbringer. The extra term counts the originating shard and also Crimson / Azure, not “other purples only.”

**Community hypothesis** (shown only as a labeled comparison, never as the official result):

```
1 + (0.45 + 0.15(x − 1)) × x
```

That version uses `(x − 1)` “other purples,” so 1 shard would be 45% and 5 shards 525%. The wiki contradicts both numbers.

## Loadout import

Live Warframe login is **not** used (no account secrets).

1. **Sample loadout** — Volt Prime, Braton Prime, two Tauforged Violet electricity shards, three Tauforged Crimson Strength. Bundled so the app is usable immediately.
2. **Paste / upload JSON** — native `tenno-calculus-loadout` schema, plus a best-effort mapper for Overframe-like objects and companion inventory snippets.
3. **Aleca Frame folders** — the Tauri build scans `%LOCALAPPDATA%\AlecaFrame`, `~/.local/share/AlecaFrame`, and similar paths for `.json` files. Aleca Frame’s Stats export is trade/platinum history, not a full arsenal dump; prefer a loadout-shaped JSON or the schema below.
4. **WFCD / warframestat.us** — public item names can be matched against the bundled dataset. If a name is missing, the UI warns and you can still edit by hand.

Schema id: `tenno-calculus-loadout` (see `src/import/schema.ts` and the Loadout page).

## GitHub Pages

Pushes to `main` build the web app and publish it to GitHub Pages:

[https://liamgreenhalgh.github.io/warframe-calculator/](https://liamgreenhalgh.github.io/warframe-calculator/)

The repo is public so anyone can open that URL. Desktop/Tauri builds are unchanged; Pages only hosts the Vite web bundle.

## Run (web preview)

```bash
npm install
npm run dev
```

Vite binds **0.0.0.0:4729** (not 3000 / 5173 / 8080).

```
http://127.0.0.1:4729
```

```bash
npm test        # calculation library
npm run build   # production web bundle
```

## Run (desktop)

Requires the [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/) for your OS (Rust, and on Linux `webkit2gtk` + `librsvg`).

```bash
npm install
npm run tauri dev      # development window
npm run tauri build    # native installers for the current platform
```

`src-tauri/` is the Tauri 2 project. `tauri build` produces platform packages under `src-tauri/target/release/bundle/`.

## Project layout

- `src/engine/` — pure TypeScript math (no React). Unit tests live next to the modules.
- `src/data/` — bundled weapons, mods, warframes, sample loadout
- `src/import/` — JSON schema, parsers, Aleca path scan
- `src/pages/` — calculators and equation explorer
- `src-tauri/` — desktop wrapper

## Sources

- https://wiki.warframe.com/w/Damage/Calculation
- https://wiki.warframe.com/w/Calculating_Bonuses
- https://wiki.warframe.com/w/Violet_Archon_Shard
- https://wiki.warframe.com/w/Archon_Shard
- https://wiki.warframe.com/w/Armor
- https://wiki.warframe.com/w/Ability_Efficiency
- https://warframe.fandom.com/wiki/Damage/Calculation
- https://warframe.fandom.com/wiki/Armor (square-root enemy DR rendering)
- https://github.com/Sainan/warframe-api-helper
- https://docs.alecaframe.com/

Formulas the wiki does not pin down (exact unmodded DoT tick count, combining armor *type* mods with the sqrt DR curve) are labeled **estimate** in the UI. Nothing is invented silently.

Weapon stats in `src/data/weapons.ts` are bundled arsenal snapshots so the app works offline. They are not a live Public Export dump.

## License

Fan-made calculator. WARFRAME is a trademark of Digital Extremes. This project is not affiliated with DE.
