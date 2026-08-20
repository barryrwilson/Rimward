## Security Review: `src/systems/station.js` mining replace + expire (WAVE 71 PR3)

### Risk Level: Low

### Summary

Mining complete and expire splice the live row, then push a new offered card. Pay still uses clamped `payQuoted` and an allowlisted employer faction. UI stays on `h()` / `textContent` / `commLine`. No 🔴 CRITICAL or 🟠 HIGH findings.

### Findings

#### 🟢 LOW: Restored hardness-4 mining can still pay (open from PR2)

- **Severity**: low
- **Category**: save-tamper / economy
- **Location**: `src/systems/station.js:1847-1866`
- **Description**: Deliver still allows any `ORE_TYPES`+`COMMODITIES` key. PR3 does not drop hardness 4. A crafted `wakeglass` row can still pay (≤ `PAY_QUOTED_MAX`).
- **Impact**: Extra credits vs a Mk I career. Same cheat class as editing `world.credits`.
- **Reproduction**: Restore a valid mining row with `commodity:'wakeglass'`. Accept at origin. Deliver 4 units before the deadline.
- **Remediation**: PR5 / later sanitize may drop hardness > 1 until a laser-gated serial.
- **Status**: open (documented; not PR3 merge law)

#### 🟢 LOW: Delivery spends live `need`, not the stamped 4 (open from PR2)

- **Severity**: informational
- **Category**: save-tamper / economy
- **Location**: `src/systems/station.js:1849-1854`
- **Description**: `payQuoted` is stamped from `need` at accept. The tick later removes `job.need` units. A post-accept edit of `need` to 1 spends 1 unit for the 4-unit quote. Expire still fails closed (no pay).
- **Impact**: Local save edit only.
- **Remediation**: Optional later: freeze `need` at `FERRY_UNITS` on accept.
- **Status**: open (accepted)

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` (`station.js` has none; commLine and board use `textContent` / `h()`)
- [x] No `jobs[id] =` map assign; splice + `push` of a new object only
- [x] Replacement does not reuse the spliced object identity
- [x] Mining ids stay `mine-<SYSTEMS key>-<n>` after `Object.hasOwn(SYSTEMS, sysId)`; monotonic `n` avoids id reuse
- [x] `commLine` interpolates `COMMODITIES[key].name` (allowlist) or the fallback `'ore'`
- [x] Title/detail on the replacement come from `makeMiningJob` allowlisted names
- [x] `payQuoted` clamped 0…20000 on pay
- [x] Employer rep: `SYSTEMS[origin].faction` + `Object.hasOwn(FACTIONS, faction)` before `reputation[faction]`
- [x] Expire writes no credits, no reputation, no dockmaster trust/favor
- [x] `state = 'failed'` before pay so a crash mid-replace cannot pay twice; leftover `failed` rows splice with no pay
- [x] Do not leave `failed`/`done` mining on the board after a successful tick
- [x] Deliver still requires docked + `currentSystem === origin`
- [x] Expire runs on the 0.5 s tick while undocked
- [x] No new frozen event (`commLine` only)
- [x] `state.js` / `save.js` / `hud.js` / `world.js` untouched
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Keep `failed` as a pay-lock only. Do not render `failed` mining cards (PR3 splices them).
2. Keep pay on stamped `payQuoted` (clamped) with `jobPayFor` fallback.
3. PR5 may drop hardness-4 mining rows at restore.

### Positive Observations

- Reverse index walk makes splice safe on the 0.5 s cadence.
- Digit accept still mutates the job object by identity.
- Unique four still finish through `completeJob` → `done`.
