# PHY-04 Wave 109 notes

First impl. Contract `out/w108/phy04/shared-contract.md` wins. PR3 far 80 u skipped.

## Landed

| PR | Path | Result |
|---|---|---|
| PR1 two-sample | `src/systems/npc.js` `applyAvoidBias` + `addMidChordHit` | Mid probe at `look * 0.5` for non-station kinds. Live 40 u, station keep-out, gate ring, inside-XZ stay. |
| PR2 frame hold | `src/systems/npc.js` `writeFrameHold` via `steerLive` | Route/loiter dest inside D5 → `writeStationHold` / `minerHoldFromStation` this frame. No `record.route` write. |
| PR3 far 80 u | skipped | Owner playtest later. |
| PR4 pins | `out/w109/phy04/probe.mjs`; additive `out/phy-verify/kernel-pins.mjs` | Exit 0. |

## Fail closed

- Missing mid helper call: 40 u bias remains.
- Missing bag / `!_phyOn`: dest unchanged.
- Missing hold writer: dest + live keep-out.
- Never `speed = 0`. Never freeze hulls.

## Honor

- HUD-01 empty hub. No pip. No new DOM.
- Digit 0/8/9 untouched.
- `state.js` / `physics.js` / `ship.js` / `traffic-feel.js` / `boot-test.mjs` not edited (except `npc.js` imports `writeStationHold`).
- PHY-01 `bounceLive` still called. PHY-03 sun radii 2.4 / 1.12 stay.
- No navmesh. No `planApPath`. No extra bag alloc.

## Verify

```
node out/w109/phy04/probe.mjs
node --import ./scripts/with-css-stub.mjs out/phy-verify/kernel-pins.mjs
```

Both PASS this worker. Vite 5180 and CDP 9421 were not started.

## Reviews

No open CRITICAL / HIGH / Blocker / Major. MEDIUM/LOW: chord-through dest uses keep-out not hold rewrite so gate legs do not skip; `typeof addMidChordHit` is same-file.
