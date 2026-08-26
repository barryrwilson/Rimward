# Wave 125 CTL-03 PR1 berth hold + RESUME

**Verdict:** PR1 landed. Helm on the records desk does not disengage a flying Autopilot leg. Session `ctx.flags.berthHold` is not KeyP pause. Explicit RESUME continues the same flying leg.

## Method

- Graph resolve: `proceed_unmodeled` (`r-mt9b9j6z-f3d56047`). No binding workflow. Did not write the graph.
- Merge law: `out/w124/berthfreeze/shared-contract.md` wins.
- This re-dispatch write-set: `src/game/autopilot.js` only (plus pack markdown + design status).
- Did **not** run `npm run test:boot`. Did **not** start Vite or Chrome.

## Helm fix (re-dispatch)

Verifier: `flyTick` called `inputBreak` before the `berthHeld` `zeroCmd` return. Mouse steer on the desk (`hypot >= AP_STEER_BREAK`) ran `disengage('input')`.

Root fix in `inputBreak`:

1. `helmSteerLatched` = chart open **or** `berthHeld`. Sets `steerArmed = false` (same as chart).
2. While `berthHeld`, return `''`. Do not treat hold as helm. Do not `disengage('input')`.
3. `flyTick` still `zeroCmd` + return and keeps `nav.autopilot`.
4. After RESUME, leftover reticle hypot cannot cancel until hypot < `AP_STEER_BREAK`.

## Behaviour

1. Open L: `berthHold` true. Player integrate / AP steer / gate emit / jump timer / player DPS skip. Distant NPC traffic still ticks.
2. Close with no interrupt: hold clears. Live flight.
3. Close with interrupt (jumping, progress > 0, or `nav.autopilot === true`): panel stays. SAVE/LOAD stay. Hint names RESUME. Named RESUME below slots.
4. Mouse / leftover reticle on the desk: `nav.autopilot` stays true. RESUME continues that same flying leg.
5. RESUME: clear snapshot, `setBerthOpen(false)`, same AP leg / same charge continues. No teleport. No second `jumpRequested` writer.
6. LOAD (not KeyP): restore, clear hold + snapshot, close panel same click. Mid-jump LOAD still refused. Hold does not refuse LOAD.

## Copy (textContent literals)

- Open, no interrupt: `L or ESC to close — your ship holds. This is not Pause (P).`
- Interrupt remainder: `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).`
- AP: `Autopilot is waiting. RESUME continues that leg.`
- gate: `Gate charge is waiting. RESUME continues that jump.`
- both: `Autopilot and gate charge are waiting. RESUME continues.`

## Coupling

- Overlay-policy is the boolean helper home. Hail defer unchanged. Never writes `flags.paused`.
- `gate.js` remains the sole `src/` `jumpRequested` emit.
- NAV-03 `sanitizeNav` untouched (restore AP false).
- CTL-04 `controls.js` not touched. AI-05 `npc.js` not touched.

## Processes

Started none. No Vite 5176. No CDP 9430. Boot-test skipped (orchestrator).
