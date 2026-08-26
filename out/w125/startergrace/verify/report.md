## Status
CLEAN

## What I tested

Domain: data. Node first. No Vite. No Chrome CDP 9431. This worker did not edit `src/`.

Merge law: `out/w124/startergrace/shared-contract.md` wins on leftover identity. Live death clock is session remaining `deathCalmLeft` (Wave 125 remaining-countdown fix): stamp 90 on `playerDestroyed`, subtract finite `dt`, `deathBlock` is `deathCalmLeft > 0`. Hop tamper remaining `> 180` → 0. Extra starter still `world.time < extra`.

Graph: `graph_resolve` (`r-mt9crwk0-ec022dec`, namespace `codex`) returned `execute_workflows` for `codex/workflow-software-delivery`. Approval gates: none. Required catalog browser tool not used; owner scoped domain data + node. Deliverable is `verify/report.md`. No `graph_propose`.

1. Read `src/systems/npc.js` maps (166–182), helpers (1708–1810), `playerInterestedIn` (1831–1838), scratch (1851–1884), hunt acquire (1925–1967), demand (2013–2018), `updateDuel` (2052–2056), `initNpc().update` (2475–2482).
2. Ran `node --import ./scripts/with-css-stub.mjs out/w125/startergrace/probe.mjs` from repo root. Full log: `out/w125/startergrace/verify/probe-stdout.txt`. Worker probe: 67 PASS, exit 0.
3. Ran `node --import ./scripts/with-css-stub.mjs out/w125/startergrace/verify/extra-helper.mjs`. Log: `extra-helper-stdout.txt`. Extra helper: 15 PASS, exit 0.
4. Grep `src/systems/npc.js` for remaining-countdown + call order. See `grep-npc.txt`. No `deathCalmUntil`.
5. Read `JUMP.graceSeconds` in `src/game/state.js` 588. Value is **60**.
6. Read `WORLD_FIELDS` in `src/game/save.js` 80–105. `jumpGraceUntil` is present. No `deathCalmUntil`. No `deathCalmLeft`. No `starterGrace`. Grep of `save.js` for those keys: 0 hits.
7. Did not start Vite 5177 or CDP 9431. Did not retune interest.

Order vs `playerInterestedIn`:

- Scratch (1859–1872) sets `playerInterested = true` and does **not** call `starterGraceBlocksAcquire`.
- Hunt acquire (1961–1966) evaluates `hopGraceUntilNow` and `!starterGraceBlocksAcquire` **before** `playerInterestedIn`. Short-circuit skips the roll while grace blocks.
- Demand and `updateDuel` use hop clamp + helper. They do not call `playerInterestedIn`.

Death remaining-countdown (fix under re-verify):

```js
let deathCalmLeft = 0; // DEATH_CALM_SECONDS = 90

function tickDeathCalm(dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  if (!Number.isFinite(deathCalmLeft) || deathCalmLeft > GRACE_CLAMP_SECONDS) {
    deathCalmLeft = 0;
    return;
  }
  deathCalmLeft = Math.max(0, deathCalmLeft - dt);
}

function deathCalmBlocks() {
  return Number.isFinite(deathCalmLeft) && deathCalmLeft > 0 && deathCalmLeft <= GRACE_CLAMP_SECONDS;
}
```

`initNpc().update` calls `tickDeathCalm(dt)` then `applyPlayerDestroyedCalm`. The death frame stamps 90 after the tick, so that frame does not consume remaining. `deathBlock` does not compare `world.time`.

Hop clamp:

```js
function graceUntilOrZero(until, now) {
  if (!Number.isFinite(until) || !Number.isFinite(now)) return 0;
  if (until > now + GRACE_CLAMP_SECONDS) return 0;
  return until;
}
```

Remaining `> 180` s or non-finite → 0. No sliding `now + 180` on each frame.

Helper / origin checks (probe + extra):

| Case | Result |
|---|---|
| Greenhand, freehold, `time` 10, not Dresk | block (true) |
| Greenhand `time` 179 | block |
| Greenhand `time` 180 extra off | false |
| Greenhand other system | extra off |
| Beautiful, freehold, `time` 10 | block |
| Marked extra 0 | false |
| Marked hop `jumpGraceUntil` 70 at now 10 | hop still blocks |
| Legitimate hop stamp 70 at now 70 | expires (false) |
| ledgerDebt extra 0 | false |
| drifter extra 0 (redmarch) | false |
| unknown / missing origin | extra 0 |
| Dresk extra bypass (greenhand + beautiful) | false |
| Dresk hop still honors | true |
| Dresk death still honors (remaining > 0) | true |
| NaN hop | no god-mode (false) |
| Infinity hop | no god-mode (false) |
| hugeHop `1e15` at now 200 / 380 / **10000** | fail closed (false); does **not** block |
| NaN `world.time` | extra off |
| catch null ctx | false |
| Death stamp `deathCalmLeft` 90; pirates re-roll; Dresk keeps interest and still calms | probe PASS |
| Rewind `world.time` to 10 / 1 / 0 while remaining > 0 | still blocks |
| 90 s of finite `dt` at `world.time` 0 | death expires (false) |
| Scratch 1851–1884 | does **not** call helper; still sets `playerInterested = true` |

Call sites: pirate acquire 1962, demand 2018, `updateDuel` 2056. Scratch does not call the helper.

`JUMP.graceSeconds === 60`. No new `WORLD_FIELDS`. No `innerHTML` in `npc.js`. Interest weights unchanged (`base: 0.005`, `max: 0.20`). Named guns remain.

## Bugs found

None.

Huge hop `now=10000` does not block. A `world.time` rewind does not stretch death. 90 s of `dt` expires death at `world.time` 0. Greenhand t=10 blocks. Dresk extra bypass holds. Scratch does not call the helper. `JUMP.graceSeconds` is 60. No new `WORLD_FIELDS`.

Accepted non-bugs (not counted):

- Demand still uses the helper after scratch acquire. Contract lists demand as a helper site.
- Ace `updateDuel` has no scratch override. Scratch lives in `updateHunt` only.
- Patrol hop still uses raw `?? 0` (`npc.js` 1897 / 1937). Not a PR1 call site.
- Merge-law formula still shows `deathCalmUntil` and `Math.min(hopUntil, now + 180)`. Live hop fail-closes remaining > 180 s to 0. Live death is remaining `deathCalmLeft`. That matches the remaining-countdown brief and is stricter than a sliding cap.
- `clampDeathCalmLeft` caps a stamp `> 180` to 180; `tickDeathCalm` / `deathCalmBlocks` fail-close remaining `> 180` to no block. Stamp path uses 90, so the two clamps do not meet in PR1.

## Environmental issues

- Graph stack `codex/workflow-software-delivery` matches a local verify. Browser catalog tool was not used (domain data). Owner named `verify/report.md`.
- This worker started no Vite / Chrome / background node. `netstat` LISTENING on **5177** and **9431**: none. Probe and extra-helper exited.
- Extra helper does not assert NaN hop or hop-60 expiry; the worker probe does. Both logs were read.

## Evidence

### Probe (worker)

Command: `node --import ./scripts/with-css-stub.mjs out/w125/startergrace/probe.mjs`

Exit: 0. 67 cases PASS, including maps, three call sites, `scratch.noHelper`, `death.remainingVar` / `death.tickDt` / `death.blockRemaining` / `death.noAbsoluteStamp`, rewind + 90 dt expiry, `jump.grace60`, `persist.noNewWorldField`, helper Greenhand / Marked / Dresk / catch, `helper.hugeHop.now10000.mustNotGodMode`, `helper.infHop.failClosed`, `helper.nanHopNoGod`, `helper.hop60ExpiresAtStamp`, `hop.noSlidingNowPlus180`. Log: `out/w125/startergrace/verify/probe-stdout.txt`.

### Extra helper (verifier)

Command: `node --import ./scripts/with-css-stub.mjs out/w125/startergrace/verify/extra-helper.mjs`

Exit: 0. Beautiful / ledgerDebt / drifter / Greenhand 179–180 / NaN time / Dresk beautiful / hugeHop 200 / 380 / **10000** / Infinity hop / death rewind + `dt` 90 PASS. `hugeHop.now10000.mustNotGodMode` value **false**. Log: `out/w125/startergrace/verify/extra-helper-stdout.txt`.

### Maps (`npc.js` 166–182)

- Greenhand / Beautiful extra **180**, start `freehold`.
- Marked / ledgerDebt extra **0**, start `freehold`.
- Drifter extra **0**, start `redmarch`.
- `GRACE_CLAMP_SECONDS` 180. `DEATH_CALM_SECONDS` 90. Module `deathCalmLeft = 0`. No `deathCalmUntil`.

### Call sites

- Acquire 1961–1966: `hopGraceUntilNow` and `!starterGraceBlocksAcquire` before `playerInterestedIn`.
- Demand 2017–2018: same hop + helper.
- `updateDuel` 2055–2056: hop or helper → loiter.
- Scratch 1859–1872: `ai.playerInterested = true`; no helper.
- Update 2481–2482: `tickDeathCalm(dt)` then `applyPlayerDestroyedCalm` (`deathCalmLeft = 90`).

### Persist / hop length

- `state.js` 588: `graceSeconds: 60`.
- `save.js` `WORLD_FIELDS`: existing `jumpGraceUntil` / `origin` / `time`. No new starter/death key.

### Ports

Vite **5177** / CDP **9431**: not LISTENING. No Playwright started. No process from this worker left running.
