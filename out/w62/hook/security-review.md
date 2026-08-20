# Security Review: HUD-02 PR1 family hook (`src/systems/hud.js`)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Mode:** Quick scan (client HUD attribute hook; no auth, no payments, no new persist keys).  
**Scope:** `src/systems/hud.js` family hook, `scripts/boot-test.mjs` WAVE62, `out/w62/hook/probe.mjs`.  
**Pass:** 2 (re-apply after `last.kind` cache rename so `hud.js` has no `hullKind =` token).

### Risk Level: Low

### Summary

The hook reads hull/faction/session and writes `#hud.dataset.family` to `'mech'` or `'bio'` only. No `innerHTML`. HUD never writes `ctx.player.hullKind` or `ctx.input.throttle`. Session override is allowlisted and try/catch-wrapped. No CRITICAL or HIGH.

## Security Audit: HUD-02 PR1 family hook

### Summary

Overall risk: **low**. Attribute token + session debug read only.

### Finding 1: World-string XSS via `innerHTML`

- **Severity**: high (implementation risk) → **resolved**
- **Category**: Injection (DOM XSS)
- **Location**: `src/systems/hud.js` (no `innerHTML` matches)
- **Description**: Family path sets `root.dataset.family` from `hudFamily`, which returns only `'mech'` or `'bio'`. Existing HUD strings stay on `textContent`.
- **Impact**: None in this PR. An `innerHTML` skin would still be XSS.
- **Reproduction**: Grep `innerHTML` in `hud.js` — no hits.
- **Remediation**: Keep `textContent`. Do not interpolate family into HTML or CSS strings.
- **Status**: resolved (this PR does not add `innerHTML`)

### Finding 2: HUD write of `hullKind` would persist

- **Severity**: high (if written) → **resolved**
- **Category**: Client persistence / unexpected state
- **Location**: `src/systems/hud.js` 64–73, 696–701, 1153–1165
- **Description**: `restore()` `Object.assign`s extra player keys. A HUD assignment to `ctx.player.hullKind` would stick in `rimward-save-v1`.
- **Impact**: Hand-forced `mech` on the living starter would survive load.
- **Reproduction**: Grep `hullKind\s*=(?!=)` in `hud.js` — no assignment. Only `===` reads.
- **Remediation**: HUD reads `p.hullKind`. Tests may mutate the harness player and must restore.
- **Status**: resolved

### Finding 3: Session / raw override accepted as HTML

- **Severity**: low → **resolved in code**
- **Category**: Input validation
- **Location**: `src/systems/hud.js` 76–81
- **Description**: `sessionHudFamilyOverride()` returns `null` unless the value is exactly `mech` or `bio`. Dataset write uses the returned token or `hudFamily`’s token, never the raw storage string after a failed allowlist.
- **Impact**: Junk session values cannot become attribute HTML.
- **Reproduction**: `sessionStorage.setItem('rw-hud-family', '<img>')` then `hudFamily` still returns `'bio'` for a default player.
- **Remediation**: Keep the allowlist. Do not put `getItem` output into CSS.
- **Status**: resolved

### Finding 4: `sessionStorage['rw-hud-family']` looks like a product key

- **Severity**: informational
- **Category**: Configuration
- **Location**: `src/systems/hud.js` 76–81
- **Description**: Session storage is origin-scoped and dies with the tab. HUD only **reads**. It never `setItem`s the key and never copies it onto `ctx.player`.
- **Impact**: Becomes Finding 2 only if a later PR writes the override onto the player record.
- **Reproduction**: Grep `sessionStorage.setItem` in `hud.js` — none.
- **Remediation**: Leave the key undocumented in the O panel. Do not add a settings checkbox.
- **Status**: open (documentation discipline; not a src defect)

### Finding 5: Blocked / private storage must not throw

- **Severity**: medium (if uncaught) → **resolved**
- **Category**: Availability / fail-closed
- **Location**: `src/systems/hud.js` 76–81
- **Description**: Some browsers throw on `sessionStorage` access. The helper wraps `getItem` in try/catch and returns `null`, so `hudFamily` falls through to `'bio'`.
- **Impact**: Missing storage would crash the 5 Hz HUD path if uncaught.
- **Reproduction**: Stub `getItem` to throw; `hudFamily({ player: { faction: 'independent' } })` returns `'bio'`.
- **Status**: resolved

### Finding 6: Prototype keys on faction lookups

- **Severity**: informational
- **Category**: Prototype pollution / unsafe key lookup
- **Location**: `src/systems/hud.js` 72; `src/systems/organic.js` 67–69
- **Description**: `isBeautiful(p.faction)` is `faction === 'beautiful'`. This PR does not add `FACTIONS[p.faction]` or other dynamic lookups on the family path.
- **Impact**: A polluted `faction` string cannot select an unexpected object key here.
- **Status**: resolved (not worsened)

### Passed Checks

- [x] No secrets in the changed files
- [x] No `innerHTML` in `hud.js`
- [x] No `ctx.player.hullKind` write
- [x] No `ctx.input.throttle` write
- [x] Session override allowlisted `mech`|`bio`
- [x] Session override try/catch
- [x] Override not persisted, not copied to player
- [x] `dataset.family` is only `'mech'` or `'bio'`
- [x] No new settings / `WORLD_FIELDS` keys
- [x] Prototype-key faction lookups not added
- [x] N/A: API auth, SQL, crypto, wallets, CORS, server sessions

### Recommendations

1. Keep SHP persist allowlist of `hullKind` to `living`|`built` (not this PR).
2. Later skins must not interpolate `dataset.family` into `innerHTML` or stylesheet text.

### Positive Observations

- Debug override is session-only and fail-closed.
- Family write is an attribute token, not injected markup.
- Tests restore `hullKind` on the shared harness player.
