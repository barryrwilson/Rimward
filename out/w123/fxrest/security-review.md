# Security Review: remaining FX leftover after named FX slices pack (Wave 123)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), user shaders from save, proto merge of save poses into sprites, Digit theft, a hub pip, and a new persist key. Live combat already uses engine-authored textures and numeric pose copy. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 123 markdown pack plus live FX surfaces it cites. Review mode: quick scan of later-impl XSS / proto / persist / shader / Digit.

## Security Audit: `docs/Fx02RemainingFxDesign.md` + `out/w123/fxrest/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later remaining-FX PR1 to attack. Freezes still bind if an owner re-opens after a true missing-FX census. Muzzle leftover CONSUME is not reopened as REAL.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live spawn helpers and family colors

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w123/fxrest/current-fx-remaining-inventory.md` §3–7; `combat.js` **1008–1029**, **1050–1106**, **1858–1860**
- **Description:** Inventory cites live muzzle / ripple / scrape helpers and `FAMILY_COLORS`. That is census, not new code. A later invert could ignore CONSUME and `innerHTML` family ids or persist sprites from save.
- **Impact:** None this wave. Live combat `innerHTML`: **none**. Sprites are scene-only. `aftermath` already persists wreck **data**, not materials.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `combat.js`: no `innerHTML`.
- No user shader / GLSL from save (contract §0.4). Textures `makeGlowDot` / `makeRippleRing` / `makeScorchDot` / `makeBeamRibbon` are engine-authored (`combat.js` **344**, **361**, **403**).
- Persist: no new `WORLD_FIELDS` key (contract §0.6). FX sprites stay scene. `aftermath` already exists for wrecks (`save.js` **77–79**).
- Proto: live `spawnRipple` / `stampHullMark` copy numeric px/py/pz/qx/qy/qz/qw/sx/sy/sz (`combat.js` **1078–1082**, **1145–1147**). Fail closed on non-finite (`hull-marks.js` **11–13**, **19–29**).
- Scrape FX wrapped in `try/catch` — skip FX, never freeze (`combat.js` **1858–1860**).
- WAVE111 parent fail closed to world-space (`combat.js` **1092–1102**).
- Busy muzzle pool skips the pop; bolt still flies if spawned (`combat.js` **1008–1028**).
- No Digit / invented UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- Family `'impact'` fail-closes off `WEAPONS` (scrape path).

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no `world.fx`
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] No user shader from save
- [x] Fail-closed spawn cited
- [x] Prototype-safe pose copy cited
- [x] Muzzle CONSUME not reopened as REAL

### Recommendations

1. Keep CONSUME / serial **none**. Do not implement.
2. If owner re-opens after a true missing-FX census, keep `textContent`, engine-authored textures, no save shaders, and fail-closed skip.
3. Keep muzzle leftover CONSUME.

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open

No critical or high in the freeze. Untextured `spawnFlash` is skippable hit-side, not a remaining leftover to implement. WAVE54 death-burst `Math.random()` in `world.js` wreck ids is existing aftermath identity, not this leftover.

**Re-review after markdown lock:** still no CRITICAL/HIGH. CONSUME stands. Muzzle leftover stays CONSUME.
