# Security Review: FX remaining muzzle / bolt / beam pack (Wave 114)

### Risk Level: Low

### Summary

Markdown-only CONSUME pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), user shaders from save, proto merge into sprites, new persist keys, Digit/UU theft, and freeze-on-busy-pool. Live combat has no `innerHTML`. Muzzle textures are engine-authored canvases at init. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 114 markdown pack plus live fire-side surfaces it cites. Review mode: quick scan of later-impl XSS / shaders / proto / persist.

## Security Audit: `docs/Fx01RemainingMuzzleDesign.md` + `out/w114/fxmuzzle/**`

### Summary

Overall risk: **low / clean**. Leftover is CONSUME so there is no later fire-side PR1 to attack. Freezes still bind if an owner re-opens after playtest.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟢 LOW: CONSUME still names live `spawnMuzzle` call sites

- **Severity**: informational
- **Category**: attack surface documentation
- **Location:** `out/w114/fxmuzzle/current-fx-muzzle-inventory.md` §3.5; `combat.js` 1008–1029, 1233
- **Description:** Inventory cites live fire helpers. That is census, not new code. A later crank PR could still ignore CONSUME.
- **Impact:** None this wave. A future invert of WAVE54 pins is a product-risk, gated by contract §0.14 / §0.17.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Keep serial plan with **no PR1**. Optional census grep only.
- **Status:** accepted — CONSUME named in contract §0 / §3

### Positive Observations

- `innerHTML` forbidden later (contract §0.4). Grep `combat.js`: no `innerHTML`.
- Canvas textures (`makeGlowDot` 344–358, `makeBeamRibbon` 360–381) are engine-authored at init. Contract §0.4 forbids user GLSL / material from save.
- Persist: no new `WORLD_FIELDS` key (contract §0.6). Muzzle sprites are scene-only.
- Proto: contract §0.7 forbids `for-in` merge from save into sprites; copy numeric pose fields only.
- Fail closed: busy muzzle pool skips the pop; never freeze sim (contract §0.19 / §2).
- No Digit / UU / SKU / `state.js` write (contract §0.3 / §0.5).
- No secrets, tokens, or credentials in this pack.
- Scrape `spawnHitFx` and WAVE111 parent are consume; this pack does not add a second trust path for `e.damage`.

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No user shaders from save
- [x] No new persist key
- [x] No proto merge recipe
- [x] No Digit theft
- [x] Fail-closed never freeze
- [x] No `src/` / `scripts/` writes in this pack

### Recommendations

1. Keep CONSUME. Do not land a fire-side PR that reads weapon id into HTML or shaders.
2. If owner re-opens after playtest, keep engine-authored `makeGlowDot` reuse — no save-sourced GLSL.
