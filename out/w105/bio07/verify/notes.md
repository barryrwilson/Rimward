# BIO-07 Wave 105 verifier notes

**Domain:** data (markdown freeze). No Vite. No Chrome.
**Graph:** `graph_resolve` id `r-mt6qjzxr-cc1cfdd4` returned `execute_workflows` on unrelated `codex/workflow-activar-privacy-data-advisor` (coverage 0.05, terms `data`/`pr`). Owner brief said `proceed_unmodeled`. Verifier continued under that scoped exception. Did not run CRM / privacy deliverable.
**Date:** 2026-08-24.

## Write-set

Worker-listed pack:

- `docs/Bio07BodiesDesign.md` (untracked)
- `out/w105/bio07/shared-contract.md`
- `out/w105/bio07/current-bio07-inventory.md`
- `out/w105/bio07/security-review.md`
- `out/w105/bio07/code-review.md`
- `out/w105/bio07/ui-audit.md`
- `out/w105/bio07/designer-audit.md` (not on the dispatch list; still markdown under `out/w105/bio07/`)

This pack does **not** contain:

- `src/`
- `scripts/` (`light.py` / `heavy.py` / `anatomy.py` / `organs.py` not in this worker)
- `public/`
- `docs/PLAYER-EXPERIENCE-WISHLIST.md`
- `PROGRESS.md`
- `docs/OwnerDecisions*.md` (no `docs/OwnerDecisionsWave105.md`)
- sibling `docs/Bio03*`, `docs/Bio06CadenceDesign.md`, Bio01–05 / BioLiving / Rep / Msn / Hud / Shp / Nav / Tgt / Npc / Pod / Exp

Repo worktree is dirty from **other** Wave 105 workers (`src/` none required here; `scripts/ship_builders/beautiful/{light,heavy,organs}.py`; wishlist; `PROGRESS.md`; `docs/Bio03ClassLookDesign.md`; untracked `docs/Bio06CadenceDesign.md`). Those diffs are not this BIO-07 markdown write-set. Sibling PR1/PR2 **may** land class files against this freeze. Shared `organs.py` (29-line dirty) is a sibling serial-module risk, not a pack file.

Grep `hzScale` in `out/w105/bio07/` = 0. No per-class Hz table.

## Contract vs brief vs owner brief

Contract is merge law (`out/w105/bio07/shared-contract.md`). `docs/Bio07BodiesDesign.md` points at it. If they disagree, contract wins. No conflict found.

Deputize (owner brief + contract §0.1):

| Law | Pack |
|---|---|
| Anti-rigidity: kill box wells / panel lines / fitted mantles / window-nozzle-turret | contract §0.1 table; brief §5 |
| Class glance: light family not CPU clone; heavy shieldback muscle; remaining four bible §4.6 | contract glance table; brief §6 |
| Fail closed = Wave 95 GLB per class | contract §0.9, §4, §9 |
| No new class keys / Digit / persist / UU / `state.js` write | contract §0.5, §0.8, §0.12, §5 |
| Shared organs serial | contract §0.6, §3, PR7 |
| NPC stay GLB; player `makeLivingHull` bar | contract §0.2–§0.3, §1–§2 |
| Light/heavy sibling this wave; remaining four later | contract §6 PR1–PR6 |

Serial named: PR1 light / PR2 heavy **this wave siblings**; PR3–PR6 remaining; PR7 shared organs; PR8 bake pins. No impl of PR3–PR8 in this worker.

BIO-06: one-line leftover. Inventory cites live 0.5→2.3 as **census**, not a new class Hz table. Contract forbids designing Hz numbers here.

## Inventory vs live code (code wins)

Load-bearing cites **hold**:

| Claim | Live |
|---|---|
| `kit.box` crease floor | `scripts/ship_builders/beautiful/anatomy.py` 834–835 `fold_crease` |
| `kit.box` sanctuary well | `organs.py` 454–455 |
| `kit.box` glow panel | `organs.py` 492–493; `_GLOW_PANEL_T` 64–65 |
| Class `.py` do not call `kit.box` | grep: anatomy/organs (+ comments). No class-file `kit.box(` |
| `grown_loft` | `surface.py` 338–354 |
| `_FLIP_TIP_ROUND` 0.60 | `anatomy.py` 88 |
| Vent torus lip | `organs.py` 229–230, 282–286 |
| `dorsal_mantles` still in shared module | `organs.py` 718–776 |
| `makeLivingHull` sphere 64×40 | `src/systems/ship.js` 274–334 |
| `livingSilhouette` cutter/heavy only | `ship.js` 258–263 |
| `buildLivingVisual` | `ship.js` 382–413 |
| `GROWTH_SCALE_MAX` 0.15 | `ship.js` 98, 1043 |
| `meshKindFor` / remount | `ship.js` 535–539, 546–560 |
| Boot `createShipState('light')` | `ship.js` 624 |
| Default faction `independent` | `src/game/state.js` 173 |
| `SHIP_CLASSES` six keys | `state.js` 37–44 |
| `isBeautiful` faction only | `src/systems/organic.js` 67–69 |
| Models Browser `ship:player` | `src/game/model-catalog.js` 93–113 `makeLivingHull()` |
| NPC classes + path join | `src/systems/ship-assets.js` 7–13, 23–36, 114–119, 387–390 |
| GPU swim uniforms | `ship-assets.js` 43–87, 398–429, 457–470 |
| `eval` / `new Function` in `ship-assets.js` | grep 0 |
| Glow is Group+mesh | `ship-assets.js` 404–416 |
| NPC mesh | `src/systems/npc.js` 176–178 `buildShipAsset`; tick 2287 |
| `LIVING_STOCK` six | `src/game/shipyard.js` 28–30; comment 12–14; `YARD_LIST_UU` 16–23 |
| Generic Beautiful stub | `scripts/build-ship-assets.py` 354–361, 420–424; `PILOTS['beautiful']` 435 |
| `PILOT_CLASSES` | `beautiful/__init__.py` 73; charter 7–20 |
| Measure ladder | `scripts/measure-ships.mjs` 12 |
| HUD reads `hullKind` | `src/systems/hud.js` 81–89; copy 1079; extra read 1720. No write |
| Hub RANGE | `hud.js` 709–712 |
| Digit 0 shipyard last | `src/systems/station.js` 185 |
| `innerHTML` Models Browser | `src/systems/modelsbrowser.js` 114, 317, 369, 460, 468, 602 |
| No hull-look `WORLD_FIELDS` | `src/game/save.js` 76–101; key `rimward-save-v1` 66 |
| Player swim 0.5→2.3, no `reducedMotion` gate | `ship.js` 144–147, 948–965 |
| Ace three `fold_crease` | `ace.py` 42–48 |
| Cutter cradle / no teeth | `cutter.py` 24–46 |
| Frigate four hollows | `frigate.py` 44–49 |
| Freighter garden biomes | `freighter.py` 46–58 |
| Bible §4.6 | `docs/FactionShipDesignBible.md` 157–170 |
| Plates README | 1–15, 100 |
| Wishlist BIO-07 | `docs/PLAYER-EXPERIENCE-WISHLIST.md` 1354–1393 |
| Wave 95 GLB + blend pins | `public/assets/ships/beautiful/{light,ace,cutter,heavy,frigate}/lod0-2` + freighter lod0–3; `assets-source/ships/beautiful/*.blend` |

### Cite drift (not a pack lie; sibling class files moved)

Inventory §5.2–5.3 froze **pre-sibling** light/heavy geometry. Live worktree (allowed PR1/PR2 against this freeze):

| Inventory freeze | Live 2026-08-24 |
|---|---|
| `light.py` `fold_crease` 383–391 → `anatomy.py` 834 | **gone**. `_fold_flesh` 326–331. Comment “No kit.box crease courses.” |
| light measured 19260 tris 12112/7572/3696 (2026-08-14) line 78 | header “Measured lod0 (2026-08-24): verts 18620” |
| light vents radius 0.16 at 433–442 | vents 366–376 radius **0.13** |
| light crown 374–377 | crown 321–324 (still count=8, `arc=0.30`) |
| `heavy.py` `org.dorsal_mantles` 245–261 | **gone**. three `sf.grown_loft` muscle lofts 241–279 |
| heavy two `fold_crease` 315–323 | **gone**. comment “no box crease, no well” 324 |
| heavy envelope line 48 | envelope **43** (l=17.0, b=8.84, h=5.78 still) |
| heavy crown `arc=0.10` 366–371 | header `arc=0.08` 33–35 |

`anatomy.py` 834 and `organs.py` 454/492 **still** stamp `kit.box`. Ace/cutter/frigate/freighter still call `fold_crease` / hollows. Shared pain holds.

code-review 🟡 “PR1/PR2 still call `fold_crease`” is stale vs live class files; true vs the freeze snapshot. designer-audit already notes light.py 327 / heavy.py 324 comments.

Inventory header already: re-open cited files before a body serial. Later impl must re-grep.

## Frozen honors

- HUD-01 empty hub; no species pip on `.rw-reticle`
- Digit 0 shipyard; 8 launch; 9 epics; no new Digit
- HUD never writes `hullKind`
- Player CPU `makeLivingHull` not replaced; NPC GPU stay; no clone onto traffic
- Six live class keys; no SKU add; no UU; `state.js` read-only
- Fail closed Wave 95 GLB, not generic stub, not Wave 8
- Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` one writer
- Remaining four wait
- BIO-06 Hz not designed here
- No Vite / Chrome this worker (brief names them as later visual verify only)

## Reviews

- `code-review.md`: no 🔴/🟠 on the pack. Stale 🟡 on light/heavy still calling `fold_crease`.
- `security-review.md`: Low. No CRITICAL/HIGH. Path join / `eval` / innerHTML / persist freezes match live.
- `ui-audit.md`: no 🔴/🟠 on the spec. Accepts live fusion until a class bakes.
- `designer-audit.md`: **Not CLEAN** on **sibling** light/heavy shaded stills (`out/w105/light/light-render.png`, `out/w105/heavy/heavy-render.png`). That is bake glance, not a markdown-law miss. Pack still says fail-closed keep Wave 95 if the hero misses the bar.

## Not tested

- Browser / Vite / boot-test (forbidden / not this wave)
- Sibling GLB quality as a product bake (out of markdown freeze). designer-audit covers stills.
- Parallel writer race on dirty `organs.py` (other worker)
