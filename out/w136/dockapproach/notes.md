# Wave 136 NAV-10 PR1 notes

**Verdict:** PR1 HUD approach-speed cue **landed** in `hud.js` + `hud.css`. Leftover stays **REAL**. Governor is **not** this PR.

## Method

- Graph resolve `r-mtar7fqe-60d11ae3` decision `proceed_unmodeled`. Did not bind a browser workflow.
- Merge law: `out/w130/dockapproach/shared-contract.md` wins over the design doc.
- Live code wins over Wave 130 census line numbers.
- Did **not** start Vite, Chrome, Playwright, or CDP. Did **not** claim ports.
- Did **not** run `npm run test:boot`. Did **not** edit `scripts/boot-test.mjs`.
- Did **not** write `station.js`, `state.js`, `controls.js`, `hail.js`, `collision.js`, or Agent files.

## What landed

- In-zone prompt key stays `J`. Verb is authored `Dock · SLOW — approach under 20 u/s` when speed is finite and `> 20`. Else verb stays `Dock`.
- Distinct **self** SPD node `.rw-slow-lamp` with `textContent` `SLOW`. MATCH stays `MATCH`. `tgtSpeed.set(targetSpeedNow)` stays speed-only.
- Lamp band: local `3 * U.DOCK_RANGE` (135). No `state.js` write.
- Hide: docked, `ctx.gate.jumping`, `ctx.flags.berthHold`, jump-owns-verb (`gate.inZone && !station.inZone`), non-finite dist/speed, missing pose.
- Write-on-change. Init-once DOM. No `innerHTML`. No new animation. Hub still 80 px.

## Coupling (do not steal)

- PHY-01 bounce stays. 2× snap stays. NAV-03 AP stays. Hail02 miss stays.
- HUD-06 HOME inset 108 stays. HUD-01 hub empty stays.
- CTL-01 KeyJ tap stays. No `flags.paused`. No Agent `act dock`.

## Boot pins

Proposed greps + ctx probes: `out/w136/dockapproach/boot-pins.md`.
