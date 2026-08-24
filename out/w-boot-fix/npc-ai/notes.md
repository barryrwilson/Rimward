# WAVE74 `live.ai` UPDATE ERR

## Cause

`scripts/boot-test.mjs` WAVE74 pushes `fakeShip74` onto `ctx.ships`. The dummy has `object`, `state`, and `record`. It has no `ai`. `collectCycle74` then calls `tick` (KeyT cycle). `initNpc` update assumed every list entry has `ai.velocity`.

`src/systems/npc.js` does not push onto `ctx.ships`. `traffic.js` only pushes `spawnLiveShip` results. This is not a WAVE64 remount leftover or a hail wreck.

## Fix

- Guard destroyed handling: `if (live.ai && !live.ai.deathHandled)`.
- After that block, `if (!live.ai) continue`.
- Use `ai.velocity` after the local `const ai = live.ai`.

Boot-test.mjs was not edited (npc.js-only per task).

## Verify

`npm run test:boot` exit 0.

Log: `out/w-boot-fix/npc-ai/boot.txt`

- Zero `UPDATE ERR`
- `BOOT TEST PASS`
- WAVE74 pins all true
