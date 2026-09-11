# Issue #121 — observe() says when the simulation is suspended

[Issue #121](https://github.com/barryrwilson/Rimward/issues/121).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-1e76da`
from master `11ee8081`. Build, unchanged boot, the new focused suite, the
release-focused regressions (17/17, including the new suite) and the live
browser check on 2026-09-11 pass with no console errors. No independent QA,
merge, release or deployment is claimed.

## Outcome

The issue asked for a `frameAgeMs` or `suspended` signal on `observe()`, and
for the terminal reason of a lease lost to a hidden pane to say so. Both are
delivered; the wall bound itself is unchanged, so a grant made before a pane
went hidden still does not fire after it comes back.

- `main.js` stamps the wall clock of every render-loop frame on
  `ctx.frameWallMs` and the gap that frame closed on `ctx.frameGapMs`. The
  loop runs while paused, so a KeyP pause is not a stall.
- `observe().frameAgeMs` is the integer wall milliseconds since the latest
  frame (0 before the first frame). `observe().flags.suspended` is true once
  no frame has run for `SUSPEND_AFTER_MS` (1000 ms, exported from
  `controls.js`). During a stall `t` freezes and `flags.paused` stays false,
  exactly as the playtest saw; the new fields are the missing tell.
- A combat-lease wall deadline crossed while no frame ran (read between
  frames, or on the first frame that closes the gap) ends the lease with
  `control.reason: 'suspended'`, state `expired`, owner `none`,
  `expiresIn: 0`, `combat.fireBlocked: 'suspended'` and the normal full-stop
  release. A deadline crossed with frames running, and a simulation-time
  expiry, still read `expired`. A fresh intent afterwards is accepted.
- The raw manual lease has no wall clock and is untouched: a stall leaves it
  active with its simulation time intact.
- `COMMAND_SPECS.setCombatIntent.terminalReasons` gains `suspended`; the
  `ttl` argument text names the case. Not a version bump: the fields are
  additive.

Not done, on purpose: the issue's second option (not counting wall time toward
a lease while no frame runs) would let a grant made before a long hidden
period resume firing when the pane returns. The documented safety property
("focus does not renew the grant") is kept; the terminal reason now says why.

## Files

| File | Change |
|---|---|
| `src/core/ctx.js` | `frameWallMs`, `frameGapMs` session fields (main.js is the writer). |
| `src/main.js` | Stamps both fields at the top of every render-loop frame. |
| `src/systems/controls.js` | `SUSPEND_AFTER_MS`, `agentFrameClock(ctx)`, and `expireCombat` naming a wall crossing during a stall `suspended`; `dropLease` maps that reason to state `expired`. |
| `src/game/agent-observe.js` | Publishes `frameAgeMs` and `flags.suspended`. |
| `src/game/agent-schema.js` | `suspended` terminal reason; `ttl` text. |
| `scripts/issue-121-suspended-clock-test.mjs` | New focused suite (`npm run test:suspended-clock`), also in `release-focused.mjs`. |
| `docs/AgentCombatIntentDesign.md`, `docs/REMAINING-WORK.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md` | Contract and status. |

## Automated checks (2026-09-11)

| Check | Result |
|---|---|
| `npm run test:suspended-clock` | PASS, 10 groups over the real controls update and the public v2 dispatcher with `performance.now()` offset by hand: schema enum; 0 / false before the first frame; a live loop reads a small age; a 45 s stall reads `suspended: true` with `t` frozen and `paused: false`, cleared by the next frame; a 1 s intent lost to a 5 s stall reads reason `suspended`, state `expired`, full-stop release, terminal kept on the first frame back; the first frame closing a gap names the crossing; a crossing with frames running reads `expired`; a sim-time expiry during a stall reads `expired`; a fresh intent after the terminal is accepted; the raw lease keeps its sim time through a stall. |
| `npm run build` | PASS. |
| `npm run test:boot` | PASS, unchanged (`BOOT TEST PASS — no update errors`, agent gameplay waves clean). |
| `npm run test:release-focused` | PASS 17/17, including the new `suspendedClock` entry. |

## Live browser check (2026-09-11)

Vite dev server on port 5199, Claude desktop Browser pane, `?agent=1`,
continued save near Freehold Landing, agent play enabled. A stall was
reproduced without hiding the pane by busy-waiting the main thread inside one
`javascript_tool` call and reading `observe()` at the end of the same call (no
frame runs meanwhile).

| Pin | Result |
|---|---|
| L1 live loop | `frameAgeMs: 13`, `flags.suspended: false`, `flags.paused: false`. PASS. |
| L2 stall | After a 1.5 s busy-wait: `frameAgeMs: 1516`, `flags.suspended: true`, `flags.paused: false`, `t` identical to the pre-stall reading. PASS. |
| L3 recovery | After a screenshot and a 2 s wait: `frameAgeMs: 9`, `frameGapMs: 14`, `suspended: false`, `t` advanced. PASS. |
| L4 lease terminal | A harness-only fixture spawned the trader record `Cartwheel Ann` 250 u ahead and selected it; one rendered frame later `setCombatIntent { ttl: 1, intent: 'break-off' }` was accepted, then a 1.3 s busy-wait: `control { owner: 'none', state: 'expired', reason: 'suspended', expiresIn: 0, combat.fireBlocked: 'suspended' }`, `flags.fullStop: true`, `t` frozen. PASS. |
| L5 terminal kept after resume | One second of frames later: `suspended: false`, `control.reason` still `suspended`. PASS. |
| L6 console | No console errors. PASS. |

## Risks

- `frameStalled` also reads true for every `expireCombat` call during the
  whole first frame that closes a gap (and until the next frame stamps a
  small `frameGapMs`). A wall crossing inside that 16 ms window would read
  `suspended`; that is the intended reading for a runner.
- A synchronous main-thread hitch longer than one second (asset load, GC)
  reads as a stall. That is accurate for the runner: no frame ran.
- Fixture-only harnesses that never stamp `ctx.frameWallMs` read
  `frameAgeMs: 0`, `suspended: false` and keep the old `expired` reason.
