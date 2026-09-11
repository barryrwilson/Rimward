# Issue #118 — `setCombatIntent` refusals name their cause

[Issue #118](https://github.com/barryrwilson/Rimward/issues/118).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-77b2bb`
from master `031e0dda`. Build, unchanged boot, the new focused suite, the
schema pins and the agent/combat regressions pass locally, and the live browser
check on 2026-09-11 reproduces the playtest refusal and shows the fix with no
console errors. No independent QA, merge, release or deployment is claimed.

## Outcome

- The folded `target-lost` check in `agentCombatSet` is split into one token
  per precondition, in this order:
  - `lock-kind` — the current lock is a rock, pod, station, gate or landmark.
  - `stale-lock` — there is no current lock, or its id is not `targetId`.
  - `target-lost` — the locked hull left the live roster (`ctx.ships`).
  - `no-sample` — the hull is locked but `combatSample()` has no fresh HUD aim
    digest: none written yet, written for another lock or weapon group, from
    another system, older than 0.25 s of simulation time, or beyond 600 u.
- Every refusal from `setControl` / `setCombatIntent` argument validation
  (`bad-args`, `bad-seq`, `bad-ttl`, `stale`, `bad-axis`, `bad-throttle`) and
  the four target refusals carries an additive `detail` string on the receipt,
  for example `defense must be 'evade'|'break-off'|'off'`,
  `unknown argument warp` (`unknown argument burner` before issue #120 made `burner` a real argument), or
  `HUD aim digest is for rec-5, not rec-9; one rendered HUD frame is needed after selectTarget`.
  `token` stays the stable enum. `detail` is absent when empty, so accepted
  receipts and lifecycle-gate refusals keep the previous shape.
  `observe().lastIntent` mirrors `detail` under the same rule.
- The manifest documents the frame rule: `selectTarget` gains a `note`, and
  `setCombatIntent` gains `targetRefusals` (one line per split token), the
  three new tokens in `refusalReasons`, and a `detail` line. hud.js writes the
  aim digest once per rendered frame, so a new lock or weapon group needs one
  rendered frame; a hidden or suspended tab renders none (issue #121, unchanged).

Combat behaviour, terminal reasons in `agent-combat.js` (mid-lease
`target-lost` / `target-changed`), the lease model, `selectTarget` acceptance,
persistence and the API `VERSION` (2) are unchanged. No new command, key,
gauge, persisted field or event type.

## Why the playtest saw `target-lost` on a fresh lock

`selectTarget` moves `ctx.targets.current` on acceptance, but the HUD aim
digest `combatSample()` reads is written by hud.js during the next rendered
frame. A `setCombatIntent` issued in the same script turn — or while the
desktop Browser pane is hidden and no frame renders — finds a digest for the
previous lock and was refused with the folded token. The live check below
reproduces exactly that: the digest still named `rec-5` after the lock moved
to `rec-9`, and one rendered frame later the same request was accepted.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/controls.js` | `refuse(token, detail)` records `refusalDetail`; `agentRefusalDetail()` exports it; `sampleGap()` names the failing `combatSample` clause; `agentControlSet` / `agentCombatSet` supply detail for argument refusals; the target check is split into `lock-kind` / `stale-lock` / `target-lost` / `no-sample`. |
| `src/systems/agent-api.js` | `fail()` accepts `detail`; the `setControl` / `setCombatIntent` branch passes `agentRefusalDetail()`; `remember()` mirrors a non-empty `detail` into `lastIntent`. |
| `src/game/agent-schema.js` | `actResult` accepts optional `detail` (omitted when empty); `copyLastIntent` mirrors it; `selectTarget` spec gains the frame-rule note; `setCombatIntent` spec gains the three tokens, `targetRefusals` and `detail`. |
| `scripts/issue-118-refusal-tokens-test.mjs` | New focused suite, `npm run test:refusal-tokens` (14 groups). |
| `scripts/issue-61-combat-intent-test.mjs`, `scripts/issue-114-combat-full-stop-test.mjs` | Two pins updated from the folded token to `no-sample` / `stale-lock`. The eight mid-lease terminal-reason pins are unchanged. |
| `docs/AgentCombatIntentDesign.md`, `docs/AgentApiDesign.md`, `docs/REMAINING-WORK.md` | Contract and inventory. |

Not changed on purpose: the mid-lease terminal reason when the sample goes
stale during a live combat lease stays `target-lost` (issue scope is the
acceptance refusal); `selectTarget` receipts do not say when the sample is
ready — the manifest documents the one-rendered-frame rule instead, and
`observe().t` advancing is the caller's signal.

## Acceptance criteria

| Criterion | Evidence |
|---|---|
| Split the token: `no-sample`, `lock-kind`, `stale-lock`; keep `target-lost` for a hull that left `ctx.ships` | `test:refusal-tokens` groups 2–9; live check below |
| Add a `detail` string to `bad-args` receipts | `test:refusal-tokens` groups 10–12 (`defense`, `intent`, `targetId`, unknown key, missing key, `ttl`, `seq`, `stale`, `setControl` axes/throttle/ttl); live check |
| Document how many frames a new lock needs before `combatSample` is fresh | `selectTarget.note`, `setCombatIntent.targetRefusals['no-sample']`, `docs/AgentCombatIntentDesign.md`; pinned by group 14 |

## Verification

Automated, all on this branch (2026-09-11):

| Gate | Result |
|---|---|
| `npm run build` | PASS |
| `npm run test:boot` | PASS, unchanged (`BOOT TEST PASS — no update errors`) |
| `npm run test:refusal-tokens` | PASS, 14 groups |
| `npm run test:agent-schema` | PASS |
| `npm run test:agent-hardening` | PASS |
| `npm run test:agent-bridge` | PASS |
| `npm run test:combat-intent` | PASS, 33 groups (one pin updated) |
| `npm run test:combat-full-stop` | PASS, 7 groups (one pin updated) |
| `npm run test:reactive-defense` | PASS |
| `npm run test:throttle-observability` | PASS, 12 pins |
| `npm run test:agent-gameplay` | PASS |

Live browser (Vite dev server on port 5199, `?agent=1`, new game, first
origin, desktop Browser pane, 2026-09-11). The hull was placed by harness
privilege beside the Freehold lane so traffic instantiated; nothing else was
synthetic. All calls went through `window.rimward.act`:

| Step | Receipt |
|---|---|
| `setCombatIntent { defense: 'none' }` | `bad-args`, detail `defense must be 'evade'\|'break-off'\|'off'` |
| `setCombatIntent { burner: true }` | `bad-args`, detail `unknown argument burner` at the time; since issue #120 the detail reads `burner is accepted only with intent 'break-off'\|'retreat'` on an attack intent and `burner: true` is accepted on `retreat` / `break-off` — the suite's pin follows #120 as of issue #138 |
| `setCombatIntent { ttl: 99 }` | `bad-ttl`, detail `ttl must be a number in 1..60 seconds` |
| `setControl { steerX: 3 }` | `bad-axis`, detail `steerX must be a number in -1..1` |
| `setCombatIntent` with no lock | `stale-lock`, detail `no current lock; selectTarget rec-1 first`; `lastIntent.detail` matches |
| lock on `rec-5` with a frame rendered | accepted, `owner: 'combat'` |
| `selectTarget rec-9`, then `setCombatIntent rec-9` in the same turn | `no-sample`, detail `HUD aim digest is for rec-5, not rec-9; one rendered HUD frame is needed after selectTarget`; no lease taken |
| one rendered frame later, same request | accepted, `owner: 'combat'` |
| `setCombatIntent rec-9999` while locked on `rec-9` | `stale-lock`, detail `current lock is rec-9, not rec-9999; selectTarget it first` |
| weapon group changed under the lock | `no-sample`, detail `HUD aim digest is for weapon group 1, not 2; one rendered HUD frame is needed after setWeaponGroup` |
| console | no errors |

## Risks and follow-ups

- `detail` is free text for humans and may change wording; runners must key
  on `token`. The manifest says so.
- `detail` strings contain only ids, argument names and numbers already
  published by `observe()`; no names, positions or hidden AI state.
- A runner that switched on `'target-lost'` to mean "select again" now sees
  `stale-lock` / `no-sample` for those cases. That is the requested change; the
  manifest `refusalReasons` list carries the new tokens.
- Issue #121 (frozen `t` while the pane is hidden) is unchanged; `no-sample`
  detail names the stale age so a runner can tell a suspended sim from a lost
  hull, which is the practical relief this issue asked for.
