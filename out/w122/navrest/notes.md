# Wave 122 remaining NAV leftover after NAV-07 notes

**Verdict:** leftover **CONSUME**. Name: **no remaining NAV leftover.** Named serial: **none**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt90v3z0-91bc2e06`). Did **not** `graph_approve` / `graph_propose`. Draft workflows non-binding.
- Read live `galaxychart.js` plot / labels / dest / Autopilot button / hover / `showApLive` / `setOpen`.
- Read `autopilot.js` MATCH / cancel dest / restore silent / hub vs ring / `AP_LINES`.
- Read `gate.js` sole emit + `lookupLiveNavHopKind`.
- Read `hud.js` readout / cue / HUD Cancel.
- Read `ctx.js` nav flags; `save.js` `WORLD_FIELDS.nav`; `nav.js` `sanitizeNav`.
- Cite boot WAVE85 + WAVE117 (WAVE96 / WAVE120 / WAVE121 **named logs absent**; code still live).
- Honor: Nav01–07 briefs, wishlist Initiative NAV — cite, do not edit.
- Code wins over wishlist “Remaining zone handoff leftover … impl later.”
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports.

## Why CONSUME

NAV-01..07 already live:

- Plot persist + chart click (Wave 85).
- Guidance readout / cue / ring (Wave 85).
- Autopilot MATCH refuse; cancel keeps dest; restore never resumes (Wave 85).
- Hover strip; hover does not plot (Wave 96).
- Handoff: nearer hub does not cancel a physical ring; split `AP_LINES`; `gate.js` sole emit; `#rw-galaxy-ap-live` on fly cancel; direct engage does not close (Wave 117).
- Autopilot **button** success `setOpen(false)` + blur / HUD Cancel (Wave 120).
- Labels share `activateSystem`; `#rw-galaxy-dest`; KeyM `isTypingFocus` skip (Wave 121).

Rejected as invented work (not a named serial): teleport, persist-resume flying AP, hub PPI, dest-select hover leftover, WAVE96/WAVE121 boot-log invention, Digit steal, new persist key.

Idea inbox NAV rows are `[x] DONE`. No second unnamed NAV hole.

## This pack

Markdown only:

- `docs/Nav08RemainingNavDesign.md`
- `out/w122/navrest/**`

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave122.md`. Did not steal `out/w122/tgtrest/**`, `out/w122/represt/**`, `out/w121/**`, `out/w120/**`, `out/w117/**`.

## Reviews

- Security: self-applied auditor + security-review.md. No CRITICAL/HIGH. Re-review after lock: clean.
- Code/design-doc: self-applied code-review.md + reviewer persona. No Blocker/Major. Minors accepted (stale wishlist; missing named WAVE96/120/121 boot logs).
- UI: self-applied ui-audit.md. No Blocker/Major. Specified later UI is live Galaxy Chart / AP; CONSUME adds none.

## Processes

Started none. No Vite. No Chrome. No CDP.

## Coupling for orchestrator

Do **not** implement. Sibling TGT/REP own other leftover packs. Overlay mutex / hail / toast / KeyJ are cite-only. Serial PR1 does not exist.
