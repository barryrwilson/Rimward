## UI Audit: HUD-02 PR1 living facing class tokens

### Summary
Class identity is a static clip inside the existing 22×10 FORE/AFT sil. The 80 px hub gains no child. Mech plate is unchanged. `reducedMotion` gains no facing loop. Light keeps the live organism.

### What's done well
- FORE/AFT words still come from `makeFacing` text nodes.
- Hub tree is still pupil + 3 cilia + RANGE.
- Bio variants use `--vein` mix already on the generic organism.
- Six living shapes stay one lineage: mass / length / tautness, not Earth animal toys.
- Target rail uses the same player token (family-wide identity).
- Built hull: attribute omitted, plate CSS untouched.

### Findings

No Blocker or Major findings.

#### 🟡 Minor: Ace nose is a hard triangle
**Location:** `src/ui/hud.css` `[data-class-key="ace"] .rw-facing-nose`
**Issue:** The dart hint is a three-point clip. At 8×6 px it can read sharper than the ellipse family.
**Fix:** Playtest may retune clip-path (contract allows). Not an Earth squid photocopy.
**Justification:** Hint table says “narrower taut dart”. Still inside 22×10.

#### 💡 Suggestion: Light vs unknown look the same
**Location:** generic `#hud[data-family='bio'] .rw-facing-*`
**Issue:** Allowlisted light and omitted unknown both paint the generic organism.
**Fix:** None. Fail closed and light identity are the same clip on purpose.

### Passed
- Hub empty 80 px. No class pip on `.rw-reticle`. No new reticle DOM.
- 22×10 box. No AGEZ / 78 px rail gap growth.
- FORE/AFT stay.
- `reducedMotion`: no new `@keyframes` on class facing; no `animation` on class selectors. Existing facing-flash remains on the words and is already killed under `body.rw-reduced-motion`.
- Duel parity: same glance set, same cadence, clip is accent in the sil box.
- Zoo: no teeth, tentacles, or animal silhouettes.
- Digit 0 shipyard untouched (not this UI).

### Pin-only follow-up (iteration 2)
No chrome change. WAVE113 pin reads match WAVE62 dataset accessors. Live HUD already verified.
