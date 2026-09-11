# Issue #119 — NPC miner `mineHit` receipts stay off the public ring

[Issue #119](https://github.com/barryrwilson/Rimward/issues/119).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-547450`
from master `66b56f88`. Build, unchanged boot, the new focused suite, the
schema pins and the agent regressions pass locally, and the live browser check
on 2026-09-11 passes with no console errors. No independent QA, merge, release
or deployment is claimed.

## Outcome

- The public `mineHit` ring row is the **player's beam only**. An NPC miner
  working a rock anywhere in the system no longer produces a public row, so a
  session in which the player never mined shows no `mineHit` at all, and NPC
  cuts no longer fold into the same `asteroidId` bucket as the player's own
  cut or add keep-class pressure that evicts real chatter such as
  `podCollected`.
- Both internal emitters tag their payload: `actor: 'npc'` from the npc.js
  miner and `actor: 'player'` from the combat.js beam. `sanitizeEvent` admits
  a `mineHit` only when `actor === 'player'`; npc, missing or unknown actors
  all fail closed, so a future untagged emitter cannot leak.
- The published row is `{ asteroidId, actor: 'player', count? }`. `actor` is
  kept on the row so the observe() re-sanitize copy is idempotent.

The internal channel is unchanged for its consumer: `asteroids.js` still
extracts from either actor, with the same `point`, `laserTier` and
`extractPerSec`, so NPC ore extraction, rock heat and miner cargo fill behave
exactly as before. Fold and keep rules for player rows are unchanged.
`mineBlocked` only ever had the player emitter and is unchanged. No new
command, key, gauge, persisted field, event type or schema version; the public
API stays at `VERSION` 2 and the ring cap stays 16.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/npc.js` | Miner `mineHit` payload carries `actor: 'npc'`. |
| `src/systems/combat.js` | Player beam `mineHit` payload carries `actor: 'player'`. |
| `src/game/agent-schema.js` | `sanitizeEvent` drops any `mineHit` whose `actor` is not `'player'`; `EVENT_FIELDS.mineHit` publishes `actor`. |
| `src/core/ctx.js` | Event vocabulary comment for `mineHit`. |
| `scripts/issue-119-miner-receipts-test.mjs`, `scripts/agent-schema-test.mjs`, `package.json` | Focused suite (`npm run test:miner-receipts`) and schema pins. |
| `docs/AgentApiDesign.md`, `docs/REMAINING-WORK.md` | Contract and backlog status. |

Out of scope and unchanged: the wider nearby-row request (#116), `playerHit`
attribution (#117), the `setCombatIntent` refusal tokens (#118), and any HUD
change. The issue's alternative of publishing NPC rows with an `actor` tag
was not taken: the issue itself calls those rows a false signal and ring
pressure, and dropping them needs no consumer change.

## Automated evidence

| Check | Result |
|---|---|
| `npm run build` | PASS (1,846.28 kB minified / 553.27 kB gzip). |
| `npm run test:boot` | PASS, unchanged (`BOOT TEST PASS — no update errors`). |
| `npm run test:miner-receipts` | PASS, 13 checks over the real agent-api harvest and observe() builder: emitter source pins (exactly two emitters, each tagged); 12 npc frames leave the ring empty with `world.miningLaser === 0`; player rows fold per rock and publish `{ asteroidId, actor, count }` with no `point`/`laserTier`/`extractPerSec`; an npc cut on the same rock does not touch the player row; 52 distinct npc cuts evict nothing from a ring saturated with `npcHit` plus one `podCollected`; the internal channel still carries both actors. |
| `npm run test:agent-schema` | PASS, including 6 new issue #119 pins (player row fields, idempotent re-sanitize, npc/missing/unknown actor dropped, `noteSessionEvent` drop-and-fold). |
| `npm run test:pod-receipts` | PASS, unchanged. |
| `npm run test:agent-hardening` | PASS, unchanged. |
| `npm run test:agent-gameplay` | PASS, unchanged (mining mission family still completes through the real automine loop). |

## Live browser check (2026-09-11)

Vite dev server on port 5199, Claude desktop Browser pane, `?agent=1`, new
game, origin 1. A harness-only wrapper around `ctx.emit` counted raw internal
`mineHit` payloads by actor (observation only; labelled
`privilegedFixture`). The starter hull has no mining laser, so the player
half was exercised by emitting three player-tagged payloads in the combat.js
shape plus one npc-tagged payload on the same rock; the harvest, fold and
observe() copy are the real code paths.

| Pin | Result |
|---|---|
| L1 npc cuts never land | Over ~38 sim-seconds of unattended traffic the raw channel carried **11 npc-tagged** `mineHit` payloads on rocks 27 and 10, zero player and zero untagged; `ctx.agent.events` held no `mineHit` and `observe().events` was `[originChosen]`. PASS. |
| L2 player row published | After the fixture emits, `observe().events` read `[originChosen, mineHit { asteroidId: 27, actor: 'player', count: 3 }]`; the extra npc payload on rock 27 (raw npc count 12) did not change the row. PASS. |
| L3 console | No console errors or warnings. PASS. |

## Risks

- Any future third `mineHit` emitter must tag `actor: 'player'` to be public;
  the source pin in the focused suite fails if the emitter count changes, so
  the omission is caught rather than leaked.
- `actor` is a new published field on the `mineHit` row. It is additive and
  always `'player'`; no consumer in the repository reads it.
