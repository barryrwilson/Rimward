# Issue #124 — the fence's marker is earned by piracy

[Issue #124](https://github.com/barryrwilson/Rimward/issues/124).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-d3b0b4`
from master `c4167634`. Build, unchanged boot, the new focused suite, the
release-focused regressions, the issue #99 / #122 / #67 suites and the live
browser check on 2026-09-11 pass with no console errors. No independent QA,
merge, release or deployment is claimed.

## Outcome

The issue asked for a pirate path to the fence's marker: before this, Quiet
Hollis (fence · Freehold Landing) banked a favor only for a bounty claim
(`station.js` `rewardJobContacts`) and Old Callow's vouch, so a working pirate
answered "Call in a favor" with "You hold no marker with me." forever. The
issue named four candidate earn rules (a ransom taken, a cargo demand paid, a
fenced sale above some value, a fear threshold) and asked that the pirate
path exist. Delivered:

- `station.js` gains `tickFenceMarker`, an every-frame `ctx.lastEvents` scan
  beside `tickPatrolJob`. A `npcSurrendered` receipt with `causer: 'player'`
  and outcome `ransom`, `jettison` or `crewPods` — a hull the player broke
  that paid, in credits or in cargo, from the surrender card or from the
  `npc.js` capitulate loop alike — banks one favor with the fence of the
  system it happened in, exactly as one bounty claim does. The receipt
  vocabulary is the issue #99 one and fails closed: a world-caused break, an
  unattributed receipt, a mere break-off (`flee`), a cut-engines yield that
  paid nothing, and a stripped wreck (no receipt) bank nothing. The bounty
  path and Callow's vouch are unchanged.
- The marker is local. The only fence works the Freehold dock, so a ransom
  taken in Veridian or Redmarch banks nothing anywhere; the dockmaster is
  never touched.
- A `commLine` receipt names the contact when the marker banks — `Word
  travels. Quiet Hollis hears you took a ransom — one marker banked.` (or
  `emptied a hold`) — so the marker is not invisible in space.
- Not taken: a fenced-sale rule (`ECON.fenceRate` is data only; no fenced
  sale exists in code to hook) and a fear-threshold rule (fear ≥
  `ECON.fear.tributeOpensAt` already opens the locker directly through
  `restrictedAllowed`, so a favor there would be redundant). No new event
  type, persistent field, key, SKU, gauge or kit change: `contact.favors`
  already persists.

## Acceptance

| Criterion | Evidence |
|---|---|
| A ransom taken banks the fence's marker | `test:fence-marker` group 1; live: Digit2 on a player-demanded card paid 365 UU, fence `favors 0 → 1` |
| A cargo demand paid banks it | group 2 (`jettison`, `crewPods`) |
| Fail closed on attribution and non-paying outcomes | group 3 |
| The marker is local and touches no other contact | group 4 |
| The banked marker spends at the People desk | group 5; live: `Call in a favor` answered "makes one call. The restricted locker will be... open to you, this visit.", `station.fenceUnlocked: true`, card read `favors 0` after |
| The bounty path is unchanged | `rewardJobContacts` untouched; `test:boot` unchanged |

## Verification record (2026-09-11)

- `npm run build` — pass.
- `npm run test:boot` — pass, unchanged.
- `npm run test:fence-marker` — 15/15 pins.
- `npm run test:surrender-attribution`, `test:player-terms`,
  `test:capitulation-feedback` — pass.
- `node scripts/release-focused.mjs` — 19/19 (including the new suite).
- Live browser (`?agent=1`, Digit1 origin, fear written to 20 as a fixture):
  a Veridian freighter spawned 150 u ahead with `resolve: 2` read `willing`;
  `act({ name: 'hail' })` opened the terms card; a Digit2 keydown resolved
  `demandRansom` (credits 350 → 715). The comm line printed `WORD TRAVELS.
  QUIET HOLLIS HEARS YOU TOOK A RANSOM — ONE MARKER BANKED.`; the People desk
  card read `fence · trust 0 · favors 1`; `Call in a favor` opened the
  restricted locker for the visit and the card returned to `favors 0`. No
  console errors.

## Risks and parked follow-ups

- The rule counts `npcSurrendered` receipts, not credits moved: a hull whose
  ransom is zero still banks a marker if the card paid `ransom`. The card
  never offers a zero ransom today.
- A fenced-sale earn rule needs a fenced sale first; not filed, since the
  issue asked only that a pirate path exist.
