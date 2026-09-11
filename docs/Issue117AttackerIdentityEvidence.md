# Issue #117 — `playerHit` and `playerDestroyed` name the attacker

[Issue #117](https://github.com/barryrwilson/Rimward/issues/117).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-57e919`
from master `270af60d`. Build, unchanged boot, the new focused suite, the
schema, hardening and agent regressions pass locally, and the live browser
check on 2026-09-11 passes with no console errors. No independent QA, merge,
release or deployment is claimed.

## Outcome

- A public `playerHit` row produced by an NPC projectile (cannon, turret or
  missile) carries `attackerId` and `attackerName`. Both are primitives
  derived at the emit site in `combat.js` through the existing
  `escapePublicIdentity` helper, so the masking law is the one the HUD
  bracket and the issue #68 escape receipts already use: a masked Q-ship
  publishes its cover name until the Mk II eye (`world.scanner >= 2`)
  pierces it, and an unnamed record reads `CONTACT`.
- Impact (`family: 'impact'`) and solar `playerHit` rows carry no attacker
  fields; they never had a shooter.
- `playerDestroyed` carries the same two fields for the **last NPC hull that
  hit that life**, even when the killing blow is an impact or the sun. The
  record clears on the receipt, so a recovered life starts with no attacker,
  and on `systemLoaded`.
- `sanitizeEvent` fails closed: an `attackerId` must be a string (1..64) or a
  finite number, an `attackerName` must be a non-empty string (≤ 40) and never
  travels without its id. The bound is idempotent on the observe() copy.

`playerHit` still folds per `family`, so the newest row names the latest
shooter and `count` keeps accumulating across shooters; the manifest note on
`setCombatIntent` says so. Keep class, the ring cap, the internal consumers
(`agent-defense.js`, `hud.js`, `ship.js`, `bio.js`, `song.js`), combat
behaviour, persistence and the public API `VERSION` (2) are unchanged. No new
command, key, gauge, persisted field or event type.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/combat.js` | `attackerIdentity(ship)` derives the primitives; `testPlayerHit` spreads them into `playerHit` and records the shooter as the life's last attacker; `emitPlayerApplyHits` publishes that attacker on `playerDestroyed` and clears it; `systemLoaded` clears it. |
| `src/game/agent-schema.js` | `EVENT_FIELDS` for `playerHit` and `playerDestroyed` admit `attackerId`/`attackerName`; `boundAttacker` fails closed; the `setCombatIntent` manifest note documents the fields and the fold rule. |
| `src/core/ctx.js` | Event vocabulary comment for both types. |
| `scripts/issue-117-attacker-identity-test.mjs`, `package.json` | Focused suite (`npm run test:attacker-identity`). |
| `docs/AgentApiDesign.md`, `docs/REMAINING-WORK.md` | Contract and backlog status. |

Out of scope and unchanged: the nearby-row request (#116), the reactive
defense consumer (#62, which still reads the internal `playerHit` row), any
HUD change, and a per-attacker fold key for `playerHit`.

## Automated evidence

| Check | Result |
|---|---|
| `npm run build` | PASS (1,851.77 kB minified / 555.30 kB gzip). |
| `npm run test:boot` | PASS, unchanged (`BOOT TEST PASS — no update errors`). |
| `npm run test:attacker-identity` | PASS, 27 checks over the real combat projectile path, the real harvest and observe(): source pins on both emitters; a real NPC cannon bolt lands a `playerHit` naming the shooter with no ship ref, kept on the observe() copy; a masked Q-ship publishes `Meridian Hauler` at scanner 0 and `Iron Verity` at scanner 2; an impact row has no attacker; after Lancer Po hits, an impact kill publishes `playerDestroyed { attackerId, attackerName: 'Lancer Po' }`; the next life's impact death carries none; malformed ids/names drop and re-sanitize is idempotent. |
| `npm run test:agent-schema` | PASS, unchanged. |
| `npm run test:agent-hardening` | PASS, unchanged. |
| `npm run test:combat-full-stop`, `test:pod-receipts`, `test:miner-receipts`, `test:refusal-tokens` | PASS, unchanged. |

## Live browser check (2026-09-11)

Vite dev server on port 5199, Claude desktop Browser pane, `?agent=1`, new
game, origin 1, agent play enabled. A harness-only fixture primed the
red-ledger cutter asset, spawned a pirate record `Lancer Po` 45 u ahead of
the hull with `spawnLiveShip`, and emitted `npcFire` cannon requests every
150 ms; the projectile, hit, harvest and observe() paths are the real code.

| Pin | Result |
|---|---|
| L1 `playerHit` names the shooter | `observe().events` held `playerHit { damage: 8, family: 'energy', fromAft: false, attackerId: 'i117-live', attackerName: 'Lancer Po', count: 26 }`. PASS. |
| L2 `playerDestroyed` names the killer | The hull died at t≈187; the ring held `playerDestroyed { attackerId: 'i117-live', attackerName: 'Lancer Po' }` and the row survived the autosave rewind (`observe().t` read 180.5 after recovery). PASS. |
| L3 console | No console errors. PASS. |

## Risks

- `_lastPlayerAttacker` holds a live ship reference between the hit and the
  death receipt; it is a single module slot, cleared on death and on
  `systemLoaded`, so a despawned hull is retained at most until the next hit
  or load.
- The attacker fields are additive on two existing rows. No consumer in the
  repository reads them; the reactive defense reads the internal row and is
  unchanged.
