# HUD-02 remaining TARGET class silhouettes — verifier report

Domain: data (static leftover census). No Vite. No Chrome. No product `src/` edits by this verifier. Worker design doc not edited.

Graph: `graph_resolve` with `grok/verifier` failed (unknown agent). `codex/agent-codex` returned a Drive-publish primary (coverage 0.15, false match). `openclaw-janet/agent-qa` returned `proceed_unmodeled`. Draft shareable-document workflow is non-binding. This report is the local technical artifact.

## Status

CLEAN

## What I tested

- Read `docs/Hud02RemainingTargetSilhouettesDesign.md`, `out/w115/hud02tgt/current-hud02-target-silhouette-inventory.md`, `out/w115/hud02tgt/shared-contract.md`, plus notes / code-review / security-review / ui-audit.
- Grepped live `src/systems/hud.js` for `classKeyToken`, `tgtFacing`, `applyClassKeyAttr`, `dataset.classKey`.
- Grepped live `src/ui/hud.css` for `#hud[data-class-key]` vs `.rw-combat-target[data-class-key]`.
- Rechecked live cites: `hudFamily`, facing DOM, FORE/AFT lock path, rail hide, Mk II name pierce, Digit 0/8/9, KeyT/V/K/X, `SHIP_CLASSES`, hangar persist, Q-ship cover (`npc.js` / `visualClassFor`), WAVE113/114 boot pins, `innerHTML` none in `hud.js`.
- `git status` / timestamps for forbidden paths (`src/` this worker, sibling leftover docs, wishlist, `PROGRESS.md`, `out/w115/hud03vis/**`, `out/w115/shp/**`, `docs/OwnerDecisionsWave115.md`).
- Confirmed leftover freeze is **not CONSUME**. Named serial is **PR1 target facing class tokens**.
- Confirmed honor: HUD-01 empty hub, Digit 0 shipyard, no new persist key, Q-ship cover class, fail-closed unknown omit.
- Ports: verifier started none.

## Live census (code wins)

| Claim | Live | Cite |
|---|---|---|
| `classKeyToken` player only | `raw = ctx.player && ctx.player.classKey`; `hasOwn` `SHIP_CLASSES`; empty omit | `hud.js` 101–108 |
| `applyClassKeyAttr` on `#hud` | write-on-change `root.dataset.classKey` or delete | 110–115; init 1101; 5 Hz 1758 |
| `tgtFacing` exists | `makeFacing(tgtRail)` | 354–361, 873–875 |
| FORE/AFT on lock | live from lock quaternion | 1407–1426 |
| Target rail hide | live ship lock only | 1253–1268 |
| Unscoped player CSS | `#hud[data-family="mech"][data-class-key="…"] .rw-facing-*` and bio twin | `hud.css` 1286–1336, 1590–1669 |
| `.rw-combat-target[data-class-key]` | **zero** in `hud.css` and `hud.js` | leftover |
| `tgtRail.dataset` | **none** (only `#hud` writer) | `hud.js` 113–114 |
| `innerHTML` in `hud.js` | **none**; `el()` is `createElement` + `textContent` | 261–266 |
| `hudFamily` from player | hullKind / Beautiful / default bio; no lock | 81–89 |
| WAVE113 pin | living `#hud[data-family="bio"][data-class-key=` substring | `boot-test.mjs` 22960–23087 |
| WAVE114 pin | plated `#hud[data-family="mech"][data-class-key=` substring | 23090–23225 |

Player `#hud[data-class-key]` therefore restyles **both** rails. Target FORE/AFT is live. Lock class has **no** facing token. Leftover is **real**.

## Leftover freeze (not CONSUME)

- Brief Status / Wave rows: markdown leftover freeze. Later serial **PR1 target facing class tokens** (named only).
- Inventory §11: leftover real; do not freeze CONSUME; serial not none.
- Contract §0.1 / §3: CONSUME / serial none **forbidden**. First remaining serial is **PR1 target facing class tokens**.
- Notes.md matches.

Deputize matches the brief:

1. Later PR1 scopes player CSS to `.rw-combat-self`.
2. Allowlisted `data-class-key` on `.rw-combat-target` from **visible lock class**.
3. Fail closed omits the rail attribute (generic **family** facing on the target row).
4. Do not put lock class on `#hud`.
5. No `src/` this wave.

## Honor

| Rule | Pack | Live |
|---|---|---|
| HUD-01 empty hub | no pip / no new `.rw-reticle` DOM | `.rw-reticle` 80×80 `hud.css` 184–193; RANGE `hud.js` 729 |
| Digit 0 shipyard | must not steal | `DOCK_KEY_SERVICES` last item `station.js` 188; Digit 0 `6100–6102`; labels 5963 |
| Digit 8/9 stay | launch / epics+Standing; outfit papers | 1644–1646, 1691, 1705; dock labels Launch / Standing |
| No new persist key | no `world.tgtClass` / `world.hudClass` | `WORLD_FIELDS` hangar already at `save.js` 93–94; settings `rimward-settings-v1` |
| Q-ship cover | visual / cover class; never hidden `state.classKey`; Mk II name pierce does not unmask glyph | `npc.js` 276–277; `traffic-feel.js` `visualClassFor` 114–121; name pierce `hud.js` 2068–2071 |
| Fail-closed unknown | omit rail attr; generic family facing; never throw / `innerHTML` / freeze | contract §0.12 / §2; live player omit already 101–115 |
| KeyT/V/K/X stay | consume | `controls.js` 44, 268, 280–290 |
| WAVE113/114 player tokens | cite / consume / scope; do not steal as this leftover | unscoped CSS live; sibling docs unedited |

Contract `lockClassToken` cover gate matches `visualClassFor` (`qship === true` and not revealed → `coverClass ?? 'freighter'`, then allowlist). Revealed / ordinary uses `record.classKey` with `state.classKey` fallback. Mk II pierce is **not** in the glyph path.

## Forbidden writes (this worker)

Worker pack on disk is markdown only:

- `docs/Hud02RemainingTargetSilhouettesDesign.md` (mtime 19:24:58)
- `out/w115/hud02tgt/*.md` (19:24–19:26)

No `docs/OwnerDecisionsWave115.md`.

Sibling leftover docs were **not** rewritten this pass:

- `docs/Hud02RemainingSilhouettesDesign.md` mtime 17:33
- `docs/Hud02RemainingMechSilhouettesDesign.md` mtime 18:46

`src/systems/hud.js` / `src/ui/hud.css` mtime 18:46 — WAVE113/114 **player** `classKeyToken` + unscoped `#hud[data-class-key]` CSS. Diff has **no** `.rw-combat-target` writer. Not this worker.

`PROGRESS.md` / wishlist mtime 19:06 — Wave 113/114 class-token lines. Grep finds **no** `hud02tgt` / `Hud02RemainingTarget` / “target facing” leftover string.

`out/w115/hud03vis/**` and `out/w115/shp/**` exist as sibling packs. They forbid stealing `hud02tgt`. This pack forbids stealing them. Timestamps: hud03vis 19:22–19:23; shp 19:23–19:24; hud02tgt 19:24–19:26.

## Invented work check

| Temptation | Pack freeze | Live |
|---|---|---|
| CONSUME / serial none | Forbidden | no target token |
| Lock class on `#hud` | Forbidden | would restyle `selfFacing` |
| Hub pip / RANGE class word | Forbidden | hub empty |
| New Digit / `state.js` write | Forbidden | Digit 0 shipyard |
| New persist key | Forbidden | hangar player `classKey` only |
| Hidden Q-ship `state.classKey` | Forbidden | cover mesh class |
| Steal WAVE113/114 art | Forbidden | cite 22×10 metrics; scope player to self |

## Documentation slips (not leftover bugs)

- Inventory Digit 8/9 row also cites `station.js` 1644–1645 (outfitting comment). Dock Digit 8/9 still resolve from `DOCK_KEY_SERVICES` + labels 5963. Honor holds.
- WAVE111 / WAVE113 leftover packs **forbade** lock class on the player glyph. This pack correctly treats that residual as **now in scope** for a target-rail token. Not a census invert.

## Bugs found

None in the affected leftover census.
