# Wave 128 NAV-09 chart readability notes

**Verdict:** leftover **REAL**. Name: **101-system chart as exploration and decision tool** (zoom/pan, dest `<select>` kept + faction/standing filter, zoom-aware labels, hop itinerary). Named serial: **PR1**. Not CONSUME. Not “no NAV-09 leftover.” Named serial is **not** none.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt9mf4w6-b5454eb5`). Did **not** `graph_approve` / `graph_propose`. Draft workflows non-binding. Agent `omp/agent-omp` (canonical id after `grok-worker-nav09` failed match). Namespace `omp`. Calendar/CRM: none binding.
- Census live `src/systems/galaxychart.js` (panel, svg, destField, hoverReadout, legend, `activateSystem`, plot, AP button).
- Census `src/ui/hud.css` `.rw-galaxy-*`.
- Census `SYSTEMS` merge + Wave 94 `veil` + generated 94. Node count: **101 / 101 charted**.
- Census `nav.js` / `save.js` `world.nav` (one plot store).
- Census `chart-hover.js` / `standingRead` / `RANK_LADDER`.
- Census overlay-policy `canOpenPlayCard` / `isTypingFocus` / never `flags.paused`.
- Cite NAV-01..08 (read only). NAV-08 remaining-NAV is **CONSUME** and is **not** this leftover.
- Cite dest `<select id="rw-galaxy-dest">` NAV-07 — **keep**.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`. Did **not** write `src/`. Did **not** edit the wishlist.

## Why REAL (not CONSUME)

Named hole still live:

- Static fitted `viewBox` of the whole rim. No wheel. No drag. No zoom buttons.
- Dest list is **101** unfiltered options (typeahead exists; faction/standing filters do **not**).
- Labels are **12** static names; 94 generated systems unlabeled at every zoom.
- Plot status is `{name} · N jumps`, not a hop itinerary with faction / standing / gate type / known risk.

NAV-07 dest `<select>` + label click **does** exist. That is **not** zoom, filter, zoom-labels, or itinerary. Do **not** CONSUME on dest typeahead alone.

NAV-08 CONSUME does **not** eat this inbox. That census asked remaining NAV after NAV-07. This census is wishlist **106–111**.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Zoom/pan | session; wheel+drag+buttons; reset on close |
| Dest `<select>` | **keep**; filter options |
| Search | native typeahead; no required second box |
| Filters | faction + standing; discs + options |
| Zoom labels | extra names at scale ≥ 2 in view |
| Itinerary | read `world.nav.path`; hide if no plot |
| Gate type | derive gate vs hub; no new SYSTEMS field |
| Risk | standing + `cast.pirates`; never clues |
| Persist | none new |
| Serial | **PR1** (optional PR2 itinerary split) |

## Catalog

Live `Object.keys(SYSTEMS).length` = **101**. Authored **7** including `veil`. Generated **94**. Do not hardcode 100.

## Write-set later (not this wave)

`src/systems/galaxychart.js` + chart CSS already owned (`.rw-galaxy-*` in `hud.css`). Not `hud.js` flight HUD. Not `jump.js`. Not `state.js`.

## Siblings (do not steal)

NAV-05 `showApLive`. NAV-06 AP button `setOpen(false)`. NAV-07 dest select / KeyM typing skip. HUD-06 HOME pip. HUD-07 deconfliction. Hail02. Agent API teleport. Overlay pause.
