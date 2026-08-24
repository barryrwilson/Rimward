# WAVE101 NPC turret verifier notes

Date: 2026-08-23  
Workspace: `C:\Projects\WebSim`  
Browser: skipped. `[NO BROWSER COVERAGE]` for live fire feel.

## Status

CLEAN

## Commands

```
node --import ./scripts/with-css-stub.mjs out/w101/turrets/probe.mjs
→ PROBE PASS (exit 0)

npm run test:boot
→ BOOT TEST FAIL — 74 errors (pre-existing waves). WAVE99 turrets all true. WAVE101 turrets all true. No `WAVE99 TURRETS FAIL`. No `WAVE101 TURRETS FAIL`.
```

Ports 5173 / 9410 / 5174: not LISTENING. No Vite / Chrome / Playwright started.

## WAVE99

Every `w99` value is `true`, including `explicitTarget`, `vsNpcDrops` (destroyed / non-live dummy), live vsPlayer emit, telegraph/demand cold, cap 4.

`vsNpcDrops` dummy now sets `state.destroyed = true` so the pin still means non-live drop after vsNPC spawn shipped.

## WAVE101

Every `w101` value is `true`: vsNPC spawn, player hull unchanged, `lastAttacker !== 'player'`, missing drop, vsPlayer still works, Unknowable shooter drop, cap 4 shared, Digit 0 shipyard, live ace-vs-trader emit, seat 0 / civilian / Unknowable never, telegraph cold.

## Toast

`src/game/npc-fire-toast.js` not edited. Turret vsNPC already fail-closes.

## Bugs found

None for this slice.

## Environmental issues

None. Node probe and boot WAVE99/WAVE101 ran. Browser skipped.
