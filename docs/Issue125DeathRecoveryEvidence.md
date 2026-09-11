# Issue #125 — death returns to the berth; patrol law is local

[Issue #125](https://github.com/barryrwilson/Rimward/issues/125).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/last-issue-2c8c40`
from master `6bb15385`. Build, unchanged boot, the new focused suite, the
neighbouring focused suites, the release-focused runner and the live browser
check on 2026-09-11 pass with no console errors. No independent QA, merge,
release or deployment is claimed.

## Outcome

The playtest died three times in 13 sim-minutes near Freehold Landing. Each
death restored the rolling autosave — a mid-flight snapshot taken with the
killer already inbound — 2–7 km from the station with the throttle setpoint
still live, and the pods scooped since that save vanished with no receipt.
The hull that did the killing twice, Lancer Po, was a Veridian Combine heavy
that Freehold's own cast had generated: `createRecords` gave every patrol
past index 0 the neighbouring system's faction, so the Marked origin's
Veridian −15 standing made a patrol inside Freehold hunt on standing alone,
while the war board described the same hull as patrolling Veridian Spire.
Delivered:

- **Berth recovery** (`save.js`). The docked and launch checkpoints — and any
  autosave taken while docked — mirror their blob into a second key,
  `rimward-save-v1-berth`, and stamp the lineage: the checkpoint carries
  `berth: true`, every later autosave carries `berthSavedAt` (the berth's
  `savedAt`). A death within `BERTH_RECOVERY_WINDOW` (120 s) of a mid-flight
  autosave — the fight had already begun when that save was taken — returns
  to the berth mirror when its `savedAt` matches the stamp and it is not
  ahead of the autosave. Every other case restores the autosave exactly as
  before: a death more than 120 s after the last mid-flight save, a mirror
  from another lineage, a mirror ahead of the autosave, or a legacy blob with
  no stamps (fail closed). `readRecoveryPlan` is pure, so the overlay copy
  and `recover()` agree. `clearAutosave` (New Game) drops the mirror with
  the autosave; manual berth slots survive as before. Boot load never reads
  the mirror. No UU is charged on any path (RW-005 stands).
- **Honest copy.** The overlay reads `…as they were at your last berth.` /
  `Returning to your last berth…` only when the berth is where she goes; a
  mid-flight autosave recovery reads `…as they were at your last autosave.` /
  `Returning to your last autosave…`; the fresh-start lines are unchanged.
- **The receipt.** After `She limped home.` a second comm line states the
  cost — `Rewound 41 s to your last berth. Lost from the hold: 14 Raw ore,
  5 Refined metals.` (or `Nothing lost from the hold.`; a fresh start reads
  `No berth record. …`). The authored `recovered` event gains
  `source: 'berth'` beside `autosave` / `fresh`, `rewindSeconds` (sim clock
  rolled back), `lostCargo` (`'<units> <commodityKey>'` rows the death-time
  hold had that the restored hold lacks) and `lostUnits`. The ring sanitizer
  whitelists the source tokens, bounds the list (16 rows, `^\d+ key$`) and
  drops negative or non-numeric counts; the row stays keep-class.
- **At rest.** `controls.js` consumes `recovered` and zeroes the throttle
  setpoint and its held latch, so a recovered hull does not fly straight out
  of the berth on the setpoint the player held at the moment of loss.
  `input.fullStop` is left alone as at a berth.
- **Patrol law is local** (`world.js`, `npc.js`). Every generated patrol now
  flies its home system's flag; war quarry comes from the target faction's
  own bank, which `pickWarQuarry` already prefers. For banks that already
  exist, `mayHuntPlayer` no longer lets a patrol enforce standing law in a
  system another faction holds: a Veridian heavy in Freehold ignores the
  Marked player's Veridian board, hunts them the moment they meet inside
  Veridian space, and a player scratch still provokes it anywhere. An
  unknown or unfactioned system keeps the pre-#125 rule, so bare fixture
  contexts and the wave-99/101 turret pins are unchanged.

Not taken (parked, see below): a station-security reaction to a hostile
hunter near the dock, any change to how aces demand or kill, and a
migration mechanism that would send a patrol across a gate on a hunt job.

## Files

| File | Change |
|---|---|
| `src/game/save.js` | `BERTH_KEY`, `BERTH_RECOVERY_WINDOW`, lineage stamps, `readRecoveryPlan`, `lostCargoRows`, receipt lines, overlay copy, `requestAutosave(ctx, { berth })`, `clearAutosave` drops the mirror, header contract |
| `src/systems/controls.js` | `recovered` zeroes `input.throttle` / `throttleHeld` |
| `src/game/agent-schema.js` | `recovered` fields `source|rewindSeconds|lostCargo|lostUnits`, bounded sanitizer |
| `src/core/ctx.js` | event vocabulary comment for `recovered` |
| `src/game/world.js` | patrol records take `def.faction` |
| `src/systems/npc.js` | `foreignLaw`; `mayHuntPlayer` standing rule is local |
| `scripts/issue-125-death-recovery-test.mjs` | the focused suite (`npm run test:death-recovery`) |
| `scripts/release-focused.mjs`, `package.json` | runner and script entries |
| `docs/AgentApiDesign.md`, `docs/REMAINING-WORK.md` | contract note and backlog entry |

## Verification

- `npm run build` — passes.
- `npm run test:boot` — `BOOT TEST PASS — no update errors` (unchanged
  test; the wave-5 death-copy source pins, the wave-64 `clearAutosave`
  berth-slot pin, the wave-80 war-quarry replacement pin and the wave-99/101
  turret pins all pass).
- `npm run test:death-recovery` — 44 pins, seven groups: patrol law is
  local (home flag, Marked not a target in Freehold, Freehold −10 still is,
  a legacy Veridian record does not hunt in Freehold but does in Veridian, a
  Freehold patrol does not enforce Freehold law in Veridian, a scratch still
  provokes, no Freehold war posting binds a Freehold-bank hull); the berth
  mirror (docked and launch checkpoints write it with the stamp, the idle
  autosave rolls the autosave key only); a death inside the window returns to
  the berth (position, hold, `recovered { source:'berth', rewindSeconds,
  lostCargo, lostUnits }`, both comm receipts, overlay copy, session ring,
  zeroed throttle, credits untouched); a death beyond the window restores
  the autosave with the honest copy and `Nothing lost`; fail-closed (foreign
  lineage, mirror ahead of the autosave, legacy blob, fresh start reports
  the whole hold); `clearAutosave`; the ring sanitizer.
- Neighbouring suites pass unchanged: `test:agent-schema`,
  `test:agent-hardening`, `test:pause-recovery` (legacy blob → `autosave`),
  `test:lane-hold`, `test:shared-lane`, `test:attacker-identity`,
  `test:nearby-rows`, `test:fence-marker`, `test:player-terms`.
- `npm run test:release-focused` — `FOCUSED RELEASE REGRESSIONS PASS (20/20)` (the new suite is entry `deathRecovery`).
- Live browser (`?agent=1`, Vite dev server, Marked origin): a real dock
  wrote `rimward-save-v1` and `rimward-save-v1-berth` with the same
  `savedAt`; after the boot restore of that berth blob a mid-flight autosave
  taken 2 km out carried `berthSavedAt` equal to the mirror's `savedAt`;
  with 14 raw ore and 5 refined metals aboard, throttle 0.8 and the clock
  41 s past the autosave, `playerDestroyed` opened `SHIP LOST — No UU
  charge. Credits, cargo, and hull return as they were at your last berth.
  Returning to your last berth… (Enter to skip)`; a real Enter put the hull
  on the pad at 120/30/654 with an empty hold and 350 UU, printed `She
  limped home.` and `Rewound 41 s to your last berth. Lost from the hold:
  14 Raw ore, 5 Refined metals.` as HUD toasts, `observe().events` carried
  `recovered { source:'berth', rewindSeconds: 41, lostCargo: ['14 rawOre',
  '5 refinedMetals'], lostUnits: 19 }`, the throttle read 0 after the next
  frame and the companion read ANXIOUS. Both Freehold patrol records fly
  the Freehold flag; the live Lancer Po hull held no target on the Marked
  player; a record re-flagged Veridian answered `mayHuntPlayer` false in
  Freehold and true with `currentSystem = 'veridian'`. No console errors.

## Risks and notes

- Storage: a berth checkpoint writes the same blob twice (autosave and
  mirror). Quota failure on the mirror leaves the stamps disagreeing, which
  recovery reads as "no berth" and falls back to the autosave.
- A berth recovery can rewind further than the old autosave recovery did
  (the whole flight since launch) — that is the issue's ask, the copy says
  so, and the receipt states the cost. The window keeps a long fight (saves
  refused for more than 120 s) on the old autosave path.
- Legacy banks keep their foreign-faction patrol records (no bank heal was
  added: the wave-80 boot fixture and the war board's origin-bank fallback
  both rely on such records). The hunt rule protects the player regardless;
  the war board's `patrols <far dock>` line stays inaccurate for those
  legacy hulls only.
- `source: 'berth'` is a new token for agents reading `recovered`; the
  documented contract (`docs/AgentApiDesign.md`) and the sanitizer accept
  all three.

## Parked

- Station security reacting to a hostile hunter near the dock (issue #105's
  order is a lane-clearance hail, not an engagement); with the foreign
  patrol gone from Freehold, the hunters that remain are pirates that rolled
  interest and the authored ace, which is the intended danger.
- Aces demanding instead of killing, and starter cruise speed versus an ace
  (the issue's third point) — untouched.
- A hunt job or bounty that explicitly sends a patrol across a gate.
