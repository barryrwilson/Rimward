# WAVE101 NPC turret verifier notes

Date: 2026-08-23
Workspace: `C:\Projects\WebSim`
Browser: skipped. `[NO BROWSER COVERAGE]` for live fire feel. Port 5173 was already LISTENING (pid 170452). Did not start Vite 5174, Chrome CDP, or Playwright. Did not kill 5173.

## Status

CLEAN (Node probe + WAVE99/WAVE101 boot pins + extra `playerHit` guard). Not full live coverage.

## Commands

```
node --import ./scripts/with-css-stub.mjs out/w101/turrets/probe.mjs
→ PROBE PASS (exit 0)

node --import ./scripts/with-css-stub.mjs out/w101/turrets/verify/player-hit-guard.mjs
→ PLAYER-HIT GUARD PASS (exit 0)
  playerHits=0 npcHits=4 lastAttackerIsPlayer=false
  evidence: out/w101/turrets/verify/player-hit-guard.json

npm run test:boot
→ BOOT TEST FAIL — 81 errors (pre-existing waves; not this slice).
  No `WAVE99 TURRETS FAIL`. No `WAVE101 TURRETS FAIL`.
  Pins: out/w101/turrets/verify/boot-pins.txt
  Full log: out/w101/turrets/verify/boot-full.txt
```

## WAVE99

Every `w99` value is `true`, including `explicitTarget`, `vsNpcDrops` (destroyed / non-live dummy), live vsPlayer emit, telegraph/demand cold, cap 4.

Dummy in `scripts/boot-test.mjs` sets `state.destroyed = true` so the pin still means non-live drop after vsNPC spawn shipped.

## WAVE101

Every `w101` value is `true`: vsNPC spawn, player hull unchanged, `lastAttacker !== 'player'`, missing drop, vsPlayer still works, Unknowable shooter drop, cap 4 shared, Digit 0 shipyard, live ace-vs-trader emit, seat 0 / civilian / Unknowable never, telegraph cold.

## Code path (read, not edited)

- `tryNpcTurret`: `ai.target === 'player'` emits `{ weapon: 'turret', target: 'player' }`. Live object target emits that ship. Missing / non-object does not emit. Self-target returns. Telegraph/demand stay at the caller (`phase !== 'attack'`).
- Combat turret branch: vsPlayer sets `bolt.vsPlayer = true`. Live ship sets `bolt.vsPlayer = false`. Missing target drops (`continue`). Unknowable shooter continues before spawn.
- Hit split: `(p.fromPlayer || !p.vsPlayer) ? testNpcHits : testPlayerHit`. vsNPC never calls `testPlayerHit`.
- `testNpcHits` writes `lastAttacker = p.shooter` when not fromPlayer. Extra guard: 0 `playerHit` events, 4 `npcHit` events.
- Toast: `src/game/npc-fire-toast.js` not in the WAVE101 combat/npc diff. `weapon === 'turret'` and `target !== 'player'` still returns `null`.
- Digit 0: `DOCK_KEY_SERVICES` last entry is `shipyard`; `Digit0` selects that. Flight `TRACKED` has Digit1–5 only. No new HUD glance class in this slice (`hud.js` / `controls.js` diffs are other waves).
- `mayHuntPlayer` body has no `turret` string. Gate is `canSeat` + `mayHuntPlayer`. `NPC_TURRET_LIVE_CAP = 4` is the only live NPC turret cap.

## Bugs found

None for this slice.

## Environmental issues

None for Node. Browser skipped on purpose (5173 already owned).
