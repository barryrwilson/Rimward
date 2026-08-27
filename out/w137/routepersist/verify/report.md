# Wave 137 NAV-11 route persist leftover — verifier report

**Status:** CLEAN  
**Domain:** data (no Vite, Chrome, Playwright, CDP, boot tests)  
**Date:** 2026-08-26  
**Graph:** `graph_resolve` returned `codex/workflow-data-analysis-reporting` (weak match on “chart/report”). Owner this turn ordered census verify + `verify/report.md`. Required dashboard tools were not used. No ports claimed.

## Artifacts

All required pack files exist and are non-empty:

| Path | Bytes |
|---|---|
| `docs/Nav11RoutePersistDesign.md` | present, non-empty |
| `out/w137/routepersist/current-nav11-route-persist-inventory.md` | 10052 |
| `out/w137/routepersist/shared-contract.md` | 9993 |
| `out/w137/routepersist/security-review.md` | 4654 |
| `out/w137/routepersist/code-review.md` | 4567 |
| `out/w137/routepersist/ui-audit.md` | 4383 |
| `out/w137/routepersist/notes.md` | 3509 |

Worker did not write `out/w137/routepersist/verify/**` (this pass created it).

## Isolation

Worker unique untracked files:

- `docs/Nav11RoutePersistDesign.md`
- `out/w137/routepersist/*.md` (pack only; no copies of sibling packs)

No `src/`, `scripts/`, `public/`, `index.html`, or `package.json` in this pack.

Tree is dirty from concurrent workers (`package.json` agent:bridge, `PROGRESS.md` Wave 135/136, `docs/AgentApiDesign.md`, wishlist, `src/**`). Those diffs are not this pack.

This pack does not contain copies of:

- `out/w137/oreguide/**`
- `out/w137/evade/**`
- `docs/Nav10DockApproachDesign.md`
- `docs/AgentApiDesign.md`
- `docs/Msn05OreGuidanceDesign.md`
- `docs/AgentApiEvadeDesign.md`

Nav11 cites siblings as other workers. It does not rewrite them.

## Merge law / later write-set

`out/w137/routepersist/shared-contract.md` is merge law. Contract wins vs the brief.

Later write-set is named:

- This leftover: **CONSUME**. Serial **none**.
- If a later dest-drop census re-opens REAL: `src/systems/galaxychart.js` `setOpen(true)` UI re-sync only (`retargetPlot(true)` + `syncApButton`). No new WORLD_FIELD. Do not `clearRoute` on close.

## Freeze (not in leftover)

Pad 2B, third helm, teleport, and new Digit are forbidden. They are not the freeze.

## CONSUME vs REAL (live code)

`src/systems/galaxychart.js` `setOpen` (935–962): hide overlay, `resetView`, `clearHover`, blur. No `clearRoute` / `dropNav`. No destSelect idle write.

`clearRoute` in `galaxychart.js` only:

- import
- `activateSystem` current-system click (1192)
- Clear button (1199)

Close button (1197), KeyM (1338), Escape (1346), docked auto-close (1359), NAV-06 AP button success (1168) all call `setOpen(false)`. Dest stays.

`src/game/nav.js` owns `world.nav` (4–6). `writeNav` (48–55). `clearRoute` (271–275). `plotRoute` (279–300). Close does not call these.

`update()` always `retargetPlot(false)` + `syncApButton()` (1375–1376), chart closed or not.

Plot-first aria is only `!navHasRoute` (1129–1134). `navHasRoute` needs dest string and `path.length >= 1` (1112–1116). Plotted dest keeps Autopilot, not plot-first.

`save.js` WORLD_FIELDS already includes `'nav'` (107–108). Restore omit deletes bag (1205–1206). Keep still `sanitizeNav` (1248) with `autopilot: false`.

NAV-06 button close keeps dest (same `setOpen(false)`).

**Verdict:** leftover **CONSUME** is correct. CONSUME is not WRONG.

Inbox `"Veridian Reach · 1 jump"` matches `SYSTEMS.veridian.name` and Freehold 1-gate (`authored-systems.js` 44, 61–63) plus status `{name} · {n} jump(s)` (1063).

## Cite nits (not bugs)

- HUD DEST dest string is at `hud.js` 2412 / 2434; pack range 2394–2434 still covers the dest readout.
- Plot-first also shows for blocked dest with empty `path`. Named hole is plotted dest with path. Close does not create that.

## Processes

Started none. No Vite. No Chrome. No claimed ports. Did not run `npm run test:boot`.
