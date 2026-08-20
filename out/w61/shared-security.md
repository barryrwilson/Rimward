# Security Review: `out/w61/shared-contract.md` (HUD-02 shared contract)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Mode:** Quick scan (design-only markdown; no runtime, no auth, no payments).  
**Scope:** `out/w61/shared-contract.md` only. No `src/` edits in this wave.  
**Pass:** 3 (re-apply after lead / restore citation fixes).

### Risk Level: Low

### Summary

The brief is a client HUD skin contract. It does not add network, auth, or settings keys. World-string XSS and **player-record persist** are the real boundaries. Restore keeps extra `ctx.player` keys. HUD must not write `hullKind`. No CRITICAL or HIGH remain.

## Security Audit: HUD-02 shared contract

### Summary

Overall risk: **low**. Design-only. Finding 2 no longer assumes drop-until-SHP.

### Finding 1: World-string XSS if a later skin uses `innerHTML`

- **Severity**: high (implementation risk) → **resolved in contract**
- **Category**: Injection (DOM XSS)
- **Location**: `src/systems/hud.js` toast / name / meta / banner path (today `textContent` only; no `innerHTML` in `hud.js`); contract §7
- **Description**: Names, `commLine` text, cover names, landmark lines, ore names, and `shipName` are world/save strings. An `innerHTML` skin would execute markup from those fields.
- **Impact**: Script in a toast or target name in a crafted save / hail line.
- **Reproduction**: Future PR sets `tgtNameEl.innerHTML = railName` with `railName` from `record.name`.
- **Remediation**: Contract §7: `textContent` / `Text` nodes only. Family CSS is authored.
- **Status**: resolved (contract law). Implementers must not regress `hud.js`.

### Finding 2: `hullKind` on the player record persists without an allowlist

- **Severity**: medium → **resolved in contract law** (SHP must still implement the allowlist)
- **Category**: Client persistence / unexpected state
- **Location**: contract §3.4, §7; `src/game/save.js` `snapshot` ~170, `restore` `Object.assign(ctx.player, snap.player)` ~359, `sanitizeRestored` ~232–241
- **Description**: Player is **not** a `WORLD_FIELDS` whitelist. `snapshot()` writes `ctx.player` wholesale. `restore()` `Object.assign`s it back. `sanitizeRestored` heals NaN vitals only. It does **not** drop unknown keys. A HUD write of `ctx.player.hullKind` **keeps** across load. A hand-edited `hullKind: 'built'` on the living starter sticks and forces `mech`. This is the same class of hole as a hand-edited `scanner: 99` before the 0/1/2 heal.
- **Impact**: Unsanitized family switch from a save blob. Fiction and duel chrome follow the save, not the hull.
- **Reproduction**: Set `ctx.player.hullKind = 'built'` (or edit `rimward-save-v1` `player.hullKind`), restore, call `hudFamily`.
- **Remediation (contract, pass 3):** HUD never writes `hullKind`. No HUD `WORLD_FIELDS` key. No `settings.js` family key. Session debug only (`mech`|`bio`). SHP persist wave copies `hullKind` on purpose and allowlists `living`|`built`; anything else deletes the key.
- **Do not assume:** drop-until-SHP. Extra player keys persist today.
- **Status**: resolved in the brief. Open on SHP save code (not this wave).

### Finding 3: Query / session override accepted as HTML

- **Severity**: low
- **Category**: Input validation
- **Location**: contract §3.1 `sessionHudFamilyOverride()`, §7
- **Description**: If implementers assign the raw query string to `dataset.family` or into CSS, a value other than `mech`|`bio` is junk. Not XSS if it stays an attribute token. Becomes XSS only if interpolated into `innerHTML` or a stylesheet string.
- **Impact**: None if the helper allowlists two tokens.
- **Reproduction**: `?hudFamily=<img>` then `innerHTML` of that value (forbidden by §7).
- **Remediation**: Helper returns `null` unless the value is exactly `mech` or `bio`. Do not put the raw query into CSS.
- **Status**: open (implementation-wave reminder; no src in this wave)

### Finding 4: `sessionStorage['rw-hud-family']` looks like a product key

- **Severity**: informational
- **Category**: Configuration
- **Location**: contract §7
- **Description**: Session storage is origin-scoped and vanishes with the tab. Risk is an implementer later copying it into `settings.js` or onto `ctx.player`.
- **Impact**: Becomes Finding 2 if copied onto the player record (that path **persists**).
- **Reproduction**: N/A this wave.
- **Remediation**: Name stays debug-only. Do not document it in the O panel. Do not write it to `ctx.player`.
- **Status**: open (documentation discipline)

### Passed Checks

- [x] No secrets, API keys, or tokens in the brief
- [x] No new admin / privileged client path
- [x] No `innerHTML` of world strings directed
- [x] No new settings / `WORLD_FIELDS` keys directed
- [x] HUD forbidden from writing `hullKind` (because restore **keeps** extra player keys)
- [x] Settings surface unchanged (`rimward-settings-v1` field whitelist stays)
- [x] Debug override session-only and token-allowlisted
- [x] Q-ship cover names stay text
- [x] No src / docs / public writes in this wave
- [x] N/A: API auth, SQL, crypto, wallets, CORS, server sessions

### Recommendations

1. Implementation PR1: `sessionHudFamilyOverride()` allowlists `mech`|`bio` only. Do not store the result on `ctx.player`.
2. SHP save wave: allowlist `hullKind` to `living`|`built` the same way `scanner` is sanitized to 0/1/2. Do not rely on `sanitizeRestored` to drop junk.
3. Code review of HUD-02 PRs greps `innerHTML` in `hud.js` and greps `hullKind` writes in `hud.js`.

### Positive Observations

- Contract cites `el()` / `textContent` and the real `snapshot` / `Object.assign` player path.
- Hull-derived family plus a ban on HUD writes closes the persist hole without a new key.
- `#hud[data-family]` keeps tokens in an attribute, not in injected HTML.

---

## Re-apply (pass 3)

No CRITICAL / HIGH left in the brief. Finding 2 rewritten: restore **keeps** extra player keys; HUD must not write `hullKind`; SHP must allowlist. Finding 3–4 stay as implementer notes.
