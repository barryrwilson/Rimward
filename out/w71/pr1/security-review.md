## Security Review: `src/game/save.js` sanitizeJobs (WAVE 71 PR1)

### Risk Level: Low

### Summary

Restore heals `world.jobs` at the same boundary as `sanitizeFieldOre`. Omit-key, non-array, and empty lists become `[]`. Fresh objects, hyphen-token ids, reserved-id drops, `payQuoted` clamp, and a live `SYSTEMS` cap close the persist hole. No 🔴 CRITICAL or 🟠 HIGH findings remain.

### Findings

#### 🟠 HIGH (resolved): Omitted `jobs` key kept the live session board

- **Severity**: high (session mix / save-tamper)
- **Category**: persist boundary
- **Location**: `src/game/save.js:698-706`, `src/game/save.js:375-379`
- **Description**: `restore` copies a `WORLD_FIELDS` key only when it is not `undefined`. A snapshot without `jobs` left `ctx.world.jobs` from the current session. `sanitizeJobs` then healed that live list instead of clearing it. Contract §1.2: missing → `[]`.
- **Impact**: Load of a legacy or stripped blob could keep accepted contracts, stuffed `payQuoted`, or board rows from the prior session.
- **Reproduction**: Live `jobs` = unique ace. Restore `{ v:1, world:{ currentSystem:'freehold' } }` with no `jobs` key. Before fix, ace stayed. After fix, `jobs === []`.
- **Remediation applied:** `if (snap.world.jobs === undefined) delete ctx.world.jobs` (same omit-key pattern as hangar / fieldOre). `sanitizeJobs` still maps missing / non-array to `[]`. Probe pins `omit.jobsEmpty`.
- **Status**: resolved

#### 🟡 MEDIUM: `reward` is not clamped (payQuoted is)

- **Severity**: medium
- **Category**: save-tamper / economy
- **Location**: `src/game/save.js:267-279`
- **Description**: Contract §1.4 clamps `payQuoted` / `originPrice` to `0…20000`. `reward` must only be finite. A crafted bounty/patrol row can keep `reward: 1e15`.
- **Impact**: Next `completeJob` pay can mint credits. Same cheat class as editing `world.credits`.
- **Reproduction**: Restore `{ id:'bounty-ace', kind:'bounty', reward:1e15, …valid fields }`. Row stays.
- **Remediation**: Optional later: clamp `reward` with the same lid. Not required for PR1 merge law.
- **Status**: open (documented; contract-faithful)

#### 🟢 LOW: Restore walks the full raw array before the cap

- **Severity**: low
- **Category**: availability (single-player)
- **Location**: `src/game/save.js:385-391`
- **Description**: A huge junk array is fully sanitized, then overflow is dropped. Unique four at the tail stay keepable.
- **Impact**: Slow restore only. Local save.
- **Remediation**: Do not pre-truncate (would drop unique four at the end).
- **Status**: open (accepted)

#### 🟢 LOW: XSS via restored title/detail is not a save.js issue

- **Severity**: informational
- **Category**: injection
- **Location**: `src/game/save.js:264-266`; UI remains `textContent` / `h()`
- **Description**: Titles are stripped of control chars. This PR adds no `innerHTML` and no new frozen event.
- **Status**: closed for this PR

### Passed Checks

- [x] No secrets in code
- [x] No new `localStorage` key (`rimward-save-v1` only)
- [x] `WORLD_FIELDS` still `'jobs'`; no `world.missions`
- [x] Omit-key / non-array / null jobs → `[]` (not null); `ensureJobs` not called from save.js
- [x] Fresh `[]` and fresh `{}`; no `Object.assign` of a raw save job
- [x] Walk uses index `for` / `Object.keys`; no `for…in` on jobs
- [x] Job ids: hyphen tokens; no whole-string `SAFE_ID.test`
- [x] `RESERVED_IDS` on full id and each token
- [x] Unique four kept when fields sanitize
- [x] `payQuoted: 999999` clamps to `20000`
- [x] Prototype pollution: `Object.prototype.polluted` stays undefined
- [x] Unknown keys (`faction`, `asteroidId`) dropped
- [x] No `innerHTML`
- [x] No new frozen event
- [x] `state.js` untouched
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Keep PR2 mining pay on `payQuoted` (already clamped) plus live `jobPayFor` fallback.
2. Do not map-assign `jobs[id] =` in later PRs.
3. Boot pins in PR5 can reuse omit-key plus proto mining cases.

### Positive Observations

- Omit-key heal now matches hangar and fieldOre.
- Fail closed on poison jobs matches `sanitizeFieldOre`.
- Cap uses `4 + 2 * Object.keys(SYSTEMS).length + 16`.
- Overflow never deletes unique four, accepted jobs, or the two honest slots per `originSystem`.
