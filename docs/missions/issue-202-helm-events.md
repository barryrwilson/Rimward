# Mission record — issue #202, helm shutdown receipts in the event ring

- **Issue**: [#202](https://github.com/barryrwilson/Rimward/issues/202) — NPC-on-NPC
  combat rows flood the event ring and evict `autopilotDisengaged`.
- **Branch**: `codex/issue-202-helm-events` (worktree `C:/Projects/WebSim-issue-202`).
- **Base**: master `282721f6`.
- **Provenance**: Rex, via Claude Code.
- **Stage**: testing. Independent Quinn QA of the exact commit is pending. No
  merge, no deploy.

## Problem

Trader playtest notes (`docs/playtests/2026-09-15-trader-playtest.md`): a hull
parked at the Freehold gate saw `observe().events` hold only `npcHit`,
`shieldDown`, `npcSheltered`, `npcEscaped` and `npcSurrendered` rows from
fights between NPCs the player had never touched or locked. Every one of those
types is keep-class or foldable, so the fresh
`autopilotDisengaged { reason: 'impact' }` was the only evictable row in the
16-row ring and was discarded on arrival. The agent could learn its own helm
was gone only by polling `autopilot.phase`.

## Acceptance

1. A player parked near an NPC-vs-NPC fight still sees its own
   `autopilotDisengaged` row in the next observation.
2. The 16-row cap and the existing keep-class rules for combat receipts are
   unchanged.

## Change

The issue's second listed option, the smaller one: `src/game/agent-schema.js`
adds `autopilotDisengaged` and `automineDisengaged` to `KEEP_RING`, with a
comment recording why. No new event type, field, key, cap or schema version.
`npcHit` / `shieldDown` scoping was deliberately not attempted — it would
change what the ring reports about the world, which this issue does not ask
for.

Retention stays bounded and narrow:

- The rows are not duplicate-collapsed, so each keeps its own `reason` and `t`.
- Repeats are bounded by `EVENT_CAP` alone; newest survive, oldest age out.
- The matching `autopilotEngaged` / `automineEngaged` rows stay ordinary
  chatter, as do `reticleLock`, `podSpawned` and a plain `hailClosed`.
- Combat, demand, lifecycle and mission receipts keep the exact retention they
  already had; no keep row outranks another.

## Test evidence

Focused regression: the issue #202 section of `scripts/agent-schema-test.mjs`,
run by `npm run test:agent-schema`. It covers the playtest chatter mix
saturating the ring (distinct hulls plus repeated same-target `npcHit` folding
into one counted row), both shutdown rows arriving into that prefilled 16-row
keep ring, the exact `reason` and `t` carried through, survival across later
chatter, six authored break reasons each, non-collapse under a 40-row flood,
the cap holding on an all-keep ring, FIFO ageing after 16 distinct newer keep
rows, narrowness pins for the engage rows and ordinary chatter, unchanged
retention for eight combat/mission/lifecycle receipts, and sanitize
primitives-only / idempotence / JSON safety.

| Run | Log | Result |
| --- | --- | --- |
| `npm run test:agent-schema`, before the fix | `.verification/issue-202/pre-fix.log` | FAIL — 20 pinned failures, all issue #202 pins; every pre-existing pin passed |
| `npm run test:agent-schema`, after the fix | `.verification/issue-202/post-fix.log` | PASS — 203 checks, 0 failures |
| `npm run build` | `.verification/issue-202/build.log` | PASS |
| `npm run test:boot` | `.verification/issue-202/boot.log` | PASS — exit 0, `BOOT TEST PASS`, no update errors |
| Live browser acceptance | `out/issue-202-evidence/live/results.json`, `run.log`, `live.png` | PASS (Quinn) |

Recorded pre-fix failures: `autopilotDisengaged` and `automineDisengaged`, each
for "survives chatter flood on arrival", "keeps its exact reason", "keeps its
timestamp", "survives later chatter", and the six reasons `impact`, `blocked`,
`stale`, `cancel`, `jumping`, `lost-station`.

## Live browser acceptance

Run by Quinn. Verdict PASS. Evidence:
`out/issue-202-evidence/live/results.json`, `run.log` and `live.png`.

What the run exercised:

- The production `disengage` in `src/game/autopilot.js` on an `impact` break,
  and the production `disengageAutomine` in `src/game/automine.js` on a hit
  break. The receipts came from the real emitters, not from hand-built rows.
- Combat ring saturation through a `ctx.emit` fixture carrying the playtest
  NPC-on-NPC mix, harvested naturally by the running browser session.
- Both receipts read back from the public `observe()` surface, with their
  reasons intact.
- The 16-row cap held, the receipts survived later chatter, and enough newer
  retained rows aged them out FIFO.
- Zero console errors and zero exceptions. The screenshot was reviewed
  visually.

Fixture honesty: the NPC-on-NPC chatter is injected through `ctx.emit`, not
produced by two live hulls fighting. The harvest, ring, cap, eviction and
`observe()` copy are the real code paths, as are both disengage emitters.

## Bounded expiry is FIFO, not time

The production ring has no age or TTL field. A retained row leaves only when
enough newer retained rows push it out in FIFO order, bounded by
`EVENT_CAP` = 16. A parked session that emits nothing keeps its helm receipt
indefinitely; wall or sim time alone never expires a row. The tests and the
live run pin FIFO ageing, not timed expiry.


## Rollback

Revert the commit on `codex/issue-202-helm-events`. The change is two entries
in one `Set` plus a comment; nothing persists, no save field or key moves, and
reverting restores the previous eviction behaviour exactly.
