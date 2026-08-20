## Security Review: `src/systems/station.js` mining cards (WAVE 71 PR2)

### Risk Level: Low

### Summary

Mining fill, accept, and dock delivery stay on allowlisted `SYSTEMS` / `COMMODITIES` / `ORE_TYPES` keys. Pay stamps `payQuoted` with a 0…20000 clamp. Reputation writes the live employer faction only. UI uses `h()` `textContent`. No 🔴 CRITICAL or 🟠 HIGH findings remain.

### Findings

#### 🟢 LOW: Restored hardness-4 mining can still pay

- **Severity**: low
- **Category**: save-tamper / economy
- **Location**: `src/systems/station.js:2198-2206`, `src/systems/station.js:1833-1851`
- **Description**: PR2 only *rolls* hardness ≤ 1. Accept and deliver allow any `ORE_TYPES`+`COMMODITIES` key. PR1 sanitize does not drop hardness 4. A crafted `wakeglass` mining row can accept and pay (still ≤ `PAY_QUOTED_MAX`).
- **Impact**: Extra credits vs a Mk I career. Same cheat class as editing `world.credits`.
- **Reproduction**: Restore `{ kind:'mining', commodity:'wakeglass', originSystem:'freehold', slot:0, need:4, …valid }`. Accept at Freehold. Deliver 4 wakeglass.
- **Remediation**: PR5 / later sanitize may drop hardness > 1 until a laser-gated serial. Do not block >1 in the deliver tick if a later PR posts harder ore.
- **Status**: open (documented; not PR2 merge law)

#### 🟢 LOW: Delivery spends live `need`, not the stamped 4

- **Severity**: informational
- **Category**: save-tamper / economy
- **Location**: `src/systems/station.js:1838-1841`
- **Description**: `payQuoted` is stamped from `need` at accept. The tick later removes `job.need` units. A post-accept edit of `need` to 1 spends 1 unit for the 4-unit quote.
- **Impact**: Local save edit only.
- **Remediation**: Optional later: freeze `need` at `FERRY_UNITS` on accept, or pay only when `need ===` stamped units.
- **Status**: open (accepted)

#### 🟢 LOW (resolved): Accept with unknown `originSystem`

- **Severity**: low
- **Category**: input validation
- **Location**: `src/systems/station.js:2198-2203`
- **Description**: A job with a missing origin fell through to `ctx.world.currentSystem`. If that id is not a `SYSTEMS` key, later ticks skip pay and the card sticks `accepted`.
- **Remediation applied:** If origin is still not `Object.hasOwn(SYSTEMS, …)` after fallback, notice and return before `state = 'accepted'`.
- **Status**: resolved

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` (station.js has none; new strings go through `h()` `textContent`)
- [x] No `jobs[id] =` map assign; array `push` only
- [x] No whole-string `SAFE_ID.test` on mining ids
- [x] Mining ids: `mine-<SYSTEMS key>-<n>` after `Object.hasOwn(SYSTEMS, sysId)`
- [x] No `asteroidId` field; no `job.faction` field
- [x] Title/detail interpolate `COMMODITIES[key].name` and `SYSTEMS[sysId].station.name`
- [x] `payQuoted` clamped 0…20000 on stamp and on pay
- [x] Employer rep: `SYSTEMS[origin].faction` + `Object.hasOwn(FACTIONS, faction)` before `reputation[faction]`
- [x] No `reputation[userString]`
- [x] Deliver requires docked + `currentSystem === origin`
- [x] Accept does not front cargo
- [x] No new frozen event (`commLine` via `completeJob`)
- [x] `state.js` / `save.js` / `hud.js` untouched
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. PR3 must splice+replace so `done` mining cannot stay payable or clutter the board.
2. Keep pay on stamped `payQuoted` (clamped) with `jobPayFor` fallback.
3. PR5 may drop hardness-4 mining rows at restore.

### Positive Observations

- Fill counts `offered|accepted` only and does not reshuffle existing cards.
- Board hides foreign *offered* mining and keeps *accepted* mining (pirate/recovery precedent).
- Digit accept still mutates the job object by identity.
