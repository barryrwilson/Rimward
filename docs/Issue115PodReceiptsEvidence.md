# Issue #115 — Scoop receipts a pirate can observe

[Issue #115](https://github.com/barryrwilson/Rimward/issues/115).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/issue-work-4f8ccb`
from master `196b954c`. Build, unchanged boot, the focused suite, the schema
pins and the agent/salvage regressions pass locally, and the live browser check
on 2026-09-11 passes with no console errors. No independent QA, merge, release
or deployment is claimed.

## Outcome

- `podCollected` is a **keep-class** ring row. A scoop that lands while the
  16-row ring is saturated with `npcHit` / `bodyHit` / `shieldDown` /
  `mineHit` rows is no longer evicted on arrival. The row carries `podId`,
  the merged `units`, and the pod's primary `commodity` (`survivor` for a
  survivor pod; absent for an empty pod).
- A pod that does not fit the hold now produces a **keep-class**
  `podBlocked { podId, units, free }` receipt. pods.js emits it once per pod
  per free-space value, never per frame: a pod sitting in scoop range for two
  seconds earns one receipt, and only a change in `free` earns a fresh one for
  a pod that still does not fit.
- Every pod carries a session-unique `pod-<n>` id, and `targets.nearby` pod
  rows publish that `id` and the pod's `units`, so a runner can compare a pod
  against its own free space before flying to it and can match a receipt to
  the row it was steering at.

Scooping itself is unchanged: same range, same `used + incoming <= capacity`
rule, nothing while docked. The HUD "Cargo secured." line and chime are
unchanged; the refusal has no HUD line (see below). Pods never persist, so no
save field changes. No new command, key, gauge or schema version; the public
API stays at `VERSION` 2 and the ring cap stays 16.

## Change and boundaries

| File | Change |
|---|---|
| `src/game/pods.js` | Session pod ids; exported `podUnits` / `podCommodityKey`; `podCollected` carries `units` and `commodity`; the capacity refusal emits `podBlocked` once per pod per free-space value (`pod.blockedFree`). |
| `src/game/agent-schema.js` | `podBlocked` joins the authored event set; `podCollected` and `podBlocked` join `KEEP_RING`; `EVENT_FIELDS` for both; `podId` derivation covers all three pod events; `units` / `free` must be finite and non-negative and `commodity` a known key or `survivor`; manifest note. |
| `src/game/agent-observe.js` | Nearby and locked pod rows publish the pod `id` and `units`. |
| `src/core/ctx.js` | Event vocabulary comment for `podCollected` fields and `podBlocked`. |
| `scripts/issue-115-pod-receipts-test.mjs`, `scripts/agent-schema-test.mjs`, `package.json` | Focused suite (`npm run test:pod-receipts`) and schema pins. |
| `docs/AgentApiDesign.md`, `docs/REMAINING-WORK.md` | Contract and backlog status. |

Out of scope and unchanged: pod bearing/id for pods in issue #116's wider
nearby-row request, `playerHit` attribution (#117), the `podSpawned` row
(still ordinary chatter), and any HUD line for the refusal. A player-facing
"hold full" toast would be a HUD change with its own live verification and is
parked as a possible follow-up, not claimed here.

## Automated evidence

| Check | Result |
|---|---|
| `npm run build` | PASS (1,846.21 kB minified / 553.24 kB gzip, within the approved caps). |
| `npm run test:boot` | PASS, unchanged. |
| `npm run test:pod-receipts` | PASS, 33 checks: pod ids and nearby `id`/`units`; a real scoop's raw and ring receipts; the ring row surviving a ring saturated with 16 `mineHit` plus `npcHit`/`shieldDown` rows; exactly one `podBlocked` over 120 frames in scoop range with the pod still in the world and the hold untouched; a second blocked pod earning its own receipt; one fresh receipt per still-blocked pod when `free` changes; both scooping once they fit; survivor and empty pods; nothing while docked. |
| `npm run test:agent-schema` | PASS, 149 checks including 17 new issue #115 pins (sanitize, idempotence, JSON safety, bad-field rejection, keep retention under combat saturation, FIFO ageing, uncollapsed bounded floods, `podSpawned` still evictable). |
| `npm run test:agent-hardening` | PASS. |
| `npm run test:salvage-onboarding` | PASS (recovery.js still matches the raw `pod` on `podCollected`). |
| `npm run test:agent-gameplay` | PASS (wave 141/142 parity, including the recovery scoop). |

## Live browser check (2026-09-11)

Dev server via Vite on an unused port, Claude desktop Browser pane,
`?agent=1`, new game, origin 1, agent opt-in from the query. Pods were spawned
through the real `spawnPod` (a labelled `privilegedFixture`, since a pod cannot
be waited for in a live session); the hold was filled by writing `ctx.cargo`
and said so. Every receipt, cargo change and nearby row asserted was produced
by the real pods system and read from the public `window.rimward` handle.

| Pin | Result |
|---|---|
| L1 nearby pod row | `{ kind:'pod', id:'pod-1', name:'Raw ore', range:60, units:6, bearing }` for a 6-unit pod 60 u ahead. PASS. |
| L2 scoop under saturation | With the ring holding 16 `mineHit` rows, two pods spawned on the hull scooped and the ring read 14 `mineHit` + `podCollected { podId:'pod-3', units:5, commodity:'rawOre' }` + `podCollected { podId:'pod-2', units:5, commodity:'refinedMetals' }`. Cargo 10/20 and "CARGO SECURED." on the HUD. PASS. |
| L3 bounded refusal | Hold at 18/20, a 5-unit pod on the hull: exactly one `podBlocked { podId:'pod-4', units:5, free:2 }` after ~25 sim frames in range, the pod still in the world, cargo untouched, nearby row `units:5`. Still one receipt on the next read. PASS. |
| L4 fit after room | Hold jettisoned: `podCollected { podId:'pod-4', units:5, commodity:'rawOre' }`, pod gone, cargo 5/20, ring still 16 rows, snapshot JSON-safe. PASS. |
| Console | 0 errors, 0 uncaught exceptions. PASS. |

Limitation: in the desktop app the simulation stops advancing while the
Browser pane is hidden, so the "fresh receipt when `free` changes" step ran
zero sim frames between the fixture write and the jettison and was not
observed live. That path is proven by the focused suite (two fresh receipts at
`free:6`, one per still-blocked pod) and is recorded here as automated, not
live, evidence.
