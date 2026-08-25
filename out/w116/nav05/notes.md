# Wave 116 NAV-05 leftover — remaining autopilot gate handoff

## Verdict

**Leftover is real.** Serial name: **PR1 autopilot gate handoff**. Serial is **not** none. **Not CONSUME.**

Optional **PR2 reason lines** (playtest retune). **PR3 live route pin** is required to close leftover unless PR1 already lands the `systemLoaded` sequence assert.

## Census (code wins)

- `AP_LINES.missingHop` (`autopilot.js` 27) and `missingGate` (30) share “next gate is missing.”
- Fly lookup (`resolveNavGatePos` 228–231), NaN pose (238–243), `planApPath` `!ok` (263–266), hub not-listed (329–331), hub wrap (338–341), and missing `path[1]` (382–387) all `disengage('missingGate')`.
- `wantJump` 317: `inZone && !docked && nearTo === hop`.
- `gate.js` 643–649: sole `jumpRequested`; `apJump` requires `autopilot && wantJump && near.to === nextHop`; `nextHop = path[1]`.
- `flyTick` `systemLoaded` via `lastEvents` 372–380.
- `resolveNavGatePos` live only (`nav-guidance.js` 89–97).
- WAVE85 pins: teleport-into-zone `jumpRequested`; fake arrive. WAVE88: steer/`wantJump` without leaving the system. **No WAVE87 string** in `scripts/boot-test.mjs`.
- MATCH refuse LIVE. PHY-02 `applyAvoidBias` LIVE. Restore `autopilot: false` LIVE.

Collapsed toast + nearest-hub cancel + steer-only pins are **not** a finished handoff.

## Deputize

- `gate.js` remains the only emitter. No teleport. No skip zone. No skip charge.
- Do not cancel when nearest hub does not list hop **and** a physical hop ring exists.
- Cycle/wrap only for hub-only routed hops.
- Split English (contract §0.1). Do not park.
- Later verify live plotted multi-hop through `systemLoaded` / `currentSystem`.
- MATCH consume. PHY-02 consume. Not a planner.
- `state.js` READ-ONLY. No new persist key. `path[1]` stays. Restore false.
- Digit 0–9 / KeyM / KeyV / HUD-01 hub stay.
- Later write-set: `src/game/autopilot.js` ± `src/systems/gate.js` ± `scripts/boot-test.mjs` ± `src/systems/galaxychart.js` (**only** `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen`, incl. chart Cancel). **Not** `hud.js` / `hud.css` / `controls.js`.
- Chip dest/next/rem stays. No reason paragraph on the chip.
- Do **not** close the chart on engage (P2 inbox waits).
- HUD toast-under-overlay is **not** NAV-03 leftover law. Sighted fly-cancel paint is `#rw-galaxy-ap-live`.
- Keep prefix split for `missingLookup`/`lookupFail`. Keep sentence-case `AP_LINES`. Do not flip chart Autopilot dim to `disabled`. Hub jargon may stay.

## Later PR1 may write

`src/game/autopilot.js` (handoff + `AP_LINES`). Optional `src/systems/gate.js` cycle/predicate hygiene (still sole emit). Optional `scripts/boot-test.mjs` pin. `src/systems/galaxychart.js` **only** for existing `#rw-galaxy-ap-live` fly-cancel `showApLive` while the chart is open (incl. chart Cancel). This worker wrote **no** `src/`.

## Honor

- `docs/Nav01RouteDesign.md` / `Nav02GuidanceDesign.md` / `Nav03AutopilotDesign.md` / `Nav04HoverDesign.md` — cite, do not rewrite.
- `out/w84/nav03/**` frozen.
- Wishlist / `PROGRESS.md` / `docs/OwnerDecisions*.md` — do not edit. No `docs/OwnerDecisionsWave116.md`.
- Do not steal `out/w116/hud02tgt/**` or `out/w116/ctl01/**`.
- Do not reopen HUD-03, kit mutate, aim-glass, UU, SKU.

## Graph workflow (break-glass)

`graph_resolve` returned **execute_workflows** for `codex/workflow-activar-training-session-designer` (coverage 0.08; terms `designer`/`document`/`open`). That workflow is Activar PR training, not this leftover pack. Owner assigned this NAV-05 markdown freeze patch. No CRM/training artifacts. No graph_propose. No graph_approve. Prior wave note named `codex/workflow-activar-client-brief` (same class of false match).

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed.

## Coupling for orchestrator

- CTL-01 must not make AP jump require `dockPressed`. Contract §0.11.
- HUD-02 sibling owns `hud.js` / `hud.css`. NAV-05 chip copy stays dest/next/rem.
- Designer Major (`out/w116/designer/nav05-ui-audit.md`): fly-path cancel under chart overlay. Frozen in contract §0.15 + brief: `galaxychart.js` `showApLive` while chart open. Did **not** overwrite the designer file or `out/w116/nav05/verify/**`.
- WAVE85 `jumpOnlyGate` / `predicate` greps must still pass after PR1.
- WAVE88 `wantJumpStay` (false when not in hop spoke) must still pass; do not set distance-only `wantJump`.
