# Wave 126 remaining HUD-06 home-station marker notes

**Verdict:** leftover **REAL**. Name: **persistent home-station marker with distance**. Named serial: **PR1**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `execute_workflows` (`r-mt9gt94a-0f16677a`) bound `omp/workflow-catalog-maintenance` + approval-gating on terms `graph` / `write`, coverage **0.08**. Parent expected `proceed_unmodeled`. Catalog-maintenance / CRM / calendar are **false binds**. Did **not** `graph_approve` / `graph_propose`. Did **not** mutate CRM, calendar, or the graph. Local markdown only.
- Census live `src/systems/hud.js` POS, TGT edge arrow (~1415), scanner arc (~876), chartmarks, NAV-02 cue, dock prompt.
- Census `src/systems/station.js` `ctx.station` pose / `inZone` / dock range.
- Census `src/systems/nav-guidance.js` `formatNavDist`; did **not** claim `nav.js` / `galaxychart.js`.
- Census Wave 125 overlay flags (`hailOpen` / `chartOpen` / `berthOpen` / `berthHold`).
- Honor: HUD-01 empty hub, NAV-02, TGT arrows, Agent API PR5 badge, hail-demand, HUD-03/04 — cite, do not edit.
- Code wins over inbox “or a selected point of interest” as a same-PR cheap path (it is not).
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`.

## Why REAL (not CONSUME)

Named hole still live:

- TGT `rw-edge-arrow` exists for the **current lock** only (`hud.js` **816**, **1415-1433**).
- Station has **no** persistent on-glass / off-glass marker (grep `rw-home` / `HOME` = 0).
- POS is raw XYZ (`1974-1986`). Dock `J` dies outside 45 u.
- Chartmarks are mystery landmarks, not the pad.
- NAV-02 cue is the next gate, not the pad.
- Selected POI picker is absent and **omitted** (not CONSUME of the pad hole).

Owner-omitted / skippable (not this leftover):

- Selected POI picker.
- Agent API watch badge (PR5).
- Hail demand copy.
- NAV-02 / NAV-07 / TGT serials.
- Wave 125 berth hold.

Rejected as invented work: hub compass, TGT arrow reuse, GATE row reuse, persist key, new Digit, toast, `innerHTML`, `state.js` keys, `station.js` writes, `nav.js` / `galaxychart.js` claims.

## Deputize (frozen)

- Kind: **current-system station**.
- POI: **omit**.
- On-screen: square pip. Off-screen: home chevron inset **108**.
- Dist: chartmark `u` / `k` + POS `HOME` text.
- Hide: docked, jumping, hail, chart, berth. No pulse.
- Lock station: hide on-glass; keep POS HOME.
- Write-set later: **`src/systems/hud.js` + `src/ui/hud.css` only**.

## This pack

Markdown only:

- `docs/Hud06HomeMarkerDesign.md`
- `out/w126/homemarker/**` (no `verify/**`)

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave126.md`. Did not steal `out/w126/agentapi/**` or demand pack.

## Reviews

- Security: self-applied auditor + security-review.md. HIGH/CRITICAL fixed in contract (`innerHTML`, persist spoof, hidden AI project). Re-review: clean.
- Code/design-doc: self-applied code-review.md + reviewer persona. No remaining Blocker/Major.
- UI: self-applied ui-audit.md + designer-persona. Marker is player-facing; not skipped. Hub / glyph / text / overlay hide locked.

## Processes

Started none. No Vite. No Chrome. No CDP.

## Coupling for orchestrator

Do **not** implement in this worker. Sibling Agent API owns watch badge. Sibling hail-demand owns hail copy. NAV-02 / TGT stay. Serial **PR1** is named only. Graph resolution id `r-mt9gt94a-0f16677a` (false catalog bind; treated as unmodeled local pack).
