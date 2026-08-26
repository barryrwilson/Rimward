# Wave 125 AI-05 PR1 starter-grace notes (iter 2 — death remaining)

**Verdict:** PR1 death clock is session remaining `deathCalmLeft`. Hop tamper still fail-closed. `JUMP.graceSeconds` stays 60.

## Method

- Graph resolve: `execute_workflows` `codex/workflow-activar-training-session-designer` (`r-mt9ce8s7-39987cdb`, coverage 0.06, terms `not` / `session`). Required catalog tools are CRM / projects / training artifacts. Owner task is npc death remaining, not a training session. No `graph_propose`. Owner write-set followed.
- Merge law: `out/w124/startergrace/shared-contract.md` wins, except owner re-dispatch: death is remaining countdown; hop remaining `> 180` → until **0**.
- Wrote `src/systems/npc.js` for code. Status / death-clock lines on `docs/Ai05StarterGraceDesign.md`.
- Probe: `node --import ./scripts/with-css-stub.mjs out/w125/startergrace/probe.mjs` — all PASS.
- Extra-helper: `node --import ./scripts/with-css-stub.mjs out/w125/startergrace/verify/extra-helper.mjs` — all PASS.
- Did **not** run `npm run test:boot`. Did **not** start Vite or Chrome. Did **not** edit `state.js`, `save.js`, `origins.js`, `hud.js`, `scripts/boot-test.mjs`.
- Security + code review: self-applied auditor/reviewer personas. No `[security-auditor]` / `[reviewer]` spawn tool. No HIGH/CRITICAL. No second code pass.

## Cause

`deathCalmUntil = now + 90` used `world.time`. Wave5 / wave27 death-restore rewinds `world.time`. Module stamp did not rewind. `now < deathCalmUntil` stayed true. Helper sat before `playerInterestedIn`, so WAVE30/31/32 acquire legs stayed dead.

## Lands

- `STARTER_GRACE_SECONDS` / `STARTER_SYSTEM` authored maps. `Object.hasOwn` only.
- `starterGraceBlocksAcquire(ctx, live, now)`: hopBlock || starterExtraBlock || deathBlock. Catch → false.
- `alwaysHuntsPlayer === true` bypasses extra starter only.
- Call sites: pirate hunt acquire, demand, `updateDuel`. Scratch unchanged.
- `graceUntilOrZero`: non-finite → 0; `until > now + 180` → 0; else stamped absolute (hop only).
- Death write: `deathCalmLeft = clamp(0..180, 90)`. Death read: remaining `> 0`.
- `tickDeathCalm(dt)` at start of `initNpc().update`. Finite positive `dt` only.
- `playerDestroyed` on `events` + `lastEvents`: `breakOff` if target player, re-roll unless Dresk. Does **not** stamp `ai.calmUntil` with remaining.

## Verify

- Greenhand, freehold, time 10, not Dresk: helper true.
- Marked extra 0; hop 60 still; hop expires at stamp.
- Huge hop `1e15` at now 200 / 380 / 10000: false.
- Infinity / NaN hop: false.
- Dresk extra off; hop + death remaining on.
- Death: rewind `world.time` still blocks; 90 s of dt expires even at time 0; pirates cold; Dresk keeps interest.
- Scratch still sets `playerInterested` without helper.
- `JUMP.graceSeconds` 60. No new `WORLD_FIELDS`.

## Reviews

- Security: no CRITICAL/HIGH. MEDIUM: patrol hop still raw `?? 0` (not a PR1 call site).
- Code: no Blocker/Major. Minors: demand blocked after scratch; ace duel has no scratch during extra; lastEvents re-clamps remaining one frame. Accepted.
- Design audit: not applicable (no chrome).

## Processes

Started none that stay. Probe and extra-helper exited. No Vite. No Chrome. No CDP.
