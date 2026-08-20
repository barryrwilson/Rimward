# Code Review: out/w61 HUD evidence inventory

**Persona:** reviewer + orchestrator `code-review.md`.  
**Scope:** citation accuracy of `out/w61/current-hud-inventory.md` vs `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/ship.js` (camera/MATCH), `src/systems/settings.js`, `src/core/ctx.js`, `docs/HudUtilityChangeProposal.md`.

## Code Review: current-hud-inventory.md

### Summary
The inventory names only shipped instruments and quotes locked non-goals from the proposal. One HIGH citation gap (dormant target-rail MATCH node) is fixed in the inventory. Remaining notes are minor.

### What's done well
- Lead math cites the shipped relative / selected-weapon path (`hud.js` 849–863), not Appendix B’s historical cannon-only bug.
- Living vs mechanical split quotes CSS; unused `@keyframes rw-breathe` is called out instead of invented as a running animation.
- Scanner gate is correctly limited to the contacts arc; MATCH/lead/RANGE/edge are not scanner-gated.
- Non-goals match proposal §2 / §5.6 / §8 (empty glass, no reticle ring, MATCH does not write throttle, no GSE / four-face / missiles / tendrils).
- HUD-03 `body.rw-colorblind` / `rw-contrast` / `rw-reduced-motion` plus `--rw-text-scale` match `settings.js` `apply()`.

### Findings

#### 🟠 Major: Target rail also contains a hidden MATCH lamp node
**Location:** `src/systems/hud.js:546` `makeSpeed(tgtRail)`; `:1352` `tgtSpeed.set(targetSpeedNow)`
**Issue:** First draft said target SPD has “no MATCH lamp.” The helper always creates `.rw-match-lamp`. It stays hidden because `set` is called with one argument.
**Fix:** Inventory §3.2 now names the dormant node so HUD-02 does not skin it as a second MATCH.
**Status:** resolved

#### 🟡 Minor: `ship.js` header vs MATCH writer
**Location:** `src/systems/ship.js:51` “never writes … flags.matchSpeed” (recoil paragraph) vs `:462–470` MATCH toggle.
**Issue:** Inventory already notes the recoil comment vs the MATCH writer. HUD-02 should follow `ctx.js` ownership (`flags.matchSpeed` writer: ship.js), not the recoil sentence in isolation.
**Fix:** none required in inventory; documented.
**Status:** accepted (comment conflict is in game code; design-only wave)

#### 🟡 Minor: Proposal Appendix B is stale on Hail / lead
**Location:** `docs/HudUtilityChangeProposal.md` Appendix B still lists `hail.js bottom:4%` and `tof = dist / WEAPONS.cannon.speed`.
**Issue:** Inventory correctly cites live `hail.js:111` (`bottom:22%`) and live lead math. HUD-02 must prefer the inventory + source, not Appendix B.
**Status:** accepted (inventory already warns)

#### 💡 Suggestion: Jump / bracket / prompt listed as supporting
**Location:** inventory §8
**Issue:** Task required the named glance set. Supporting furniture is extra but cited from real nodes. Not invented.
**Status:** keep (prevents HUD-02 from “discovering” them as new combat chrome)

### Citation spot-check (8+)

| Claim | Source | Result |
|---|---|---|
| Self rail `top: 57%` / −78px | `hud.css` 770–784 | pass |
| Target rail +78px | `hud.css` 786–788 | pass |
| 80 px hub | `hud.css` 181–189; `hud.js` 775 | pass |
| Pupil + 3 cilia | `hud.js` 419–420; `hud.css` 333–357 | pass |
| Dashed `::before` / RANGE | `hud.css` 192–217; `hud.js` 894–904 | pass |
| MATCH lamp text | `hud.js` 158, 1174; `hud.css` 219–226 | pass |
| FORE/AFT + no-lock dim | `hud.js` 907–927 | pass |
| Lead relative TOF | `hud.js` 853–863 | pass |
| Contacts `scanner >= 1` | `hud.js` 932–933 | pass |
| Tick / chevron / diamond | `hud.css` 710–734 | pass |
| Toasts `right: 168px` | `hud.css` 589–593 | pass |
| Career fade 0.14 / aux 0.38 | `hud.css` 88, 815 | pass |
| Hail `bottom:22%` 360px | `hail.js` 111 | pass |
| Onboarding `top:48px` | `onboarding.js` 84 | pass |
| `body.rw-*` | `settings.js` 66–69 | pass |
| MATCH `fwdSpeed` no throttle write | `ship.js` 443, 552–557 | pass |
| Camera offsets | `ship.js` 65–67, 123–126 | pass |
| `rw-breathe` unused | `hud.css` 326–329 only | pass |

### Verdict
Citations match the working tree. No remaining 🔴/🟠 inventory defects after the MATCH-node correction.
