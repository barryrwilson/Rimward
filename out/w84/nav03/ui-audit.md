## UI Audit: NAV-03 Autopilot / Cancel (Wave 84 design, post designer patch)

### Summary

The freeze now puts MATCH/refuse copy on a chart header live region (above `z-index` 30), ignores steer-break while the chart is open, keeps refuse-worthy Autopilot clickable, pins the Cancel chip to true top-center, and freezes interrupt English. Designer 🔴/🟠 items are closed in the contract.

### What's done well

- Chart-local `aria-live="polite"` status is the reporter while the chart is open. `#hud` toasts are secondary (`style.css` 28 vs `hud.css` 1431).
- Steer-break is off while `flags.galaxyChart`. WASD still cancels. Header clicks are not helm.
- Native `disabled` only when there is no dest. MATCH with a dest still gets a click and a reason node.
- Chip CSS is pinned: `top: 14px; left: 50%`. Not `.rw-banner` (top-right 96px). Not hub. Not `.rw-jump`. Not NAV-02 readout.
- Space on the focused button does not activate Autopilot; Enter/click do.
- Autopilot stays in the header even with no dest.
- §8.3 English covers every interrupt token. No token dump. No dest ids.

### Findings

No 🔴 Blocker or 🟠 Major remain in this freeze.

#### 🟡 Minor: Hit target and header cluster

**Location:** contract §8.1; live `.rw-galaxy-close` `hud.css` 1455–1488  
**Issue:** “Cancel autopilot” is wider than “Autopilot” and can shove × on `92vw` panels.  
**Fix:** Already frozen: header cluster `display: flex; gap: 8px`. PR6 must ship that wrapper.  
**Why open:** impl not landed.

#### 🟡 Minor: Chip must not inherit combat fade from a parent

**Location:** contract §8.2; `hud.css` 88, 586  
**Issue:** Wrapper class `.rw-fade` / `.rw-aux` / `.rw-chartmark` would hide Cancel.  
**Fix:** Frozen: chip root `.rw-autopilot` only. PR6 pin.

#### 💡 Suggestion: Contrast + reduced-motion CSS in PR6

List `.rw-autopilot` beside `.rw-jump` under `body.rw-contrast`. No pulse. Copy `.rw-galaxy-close:focus-visible`.

### Accessibility checklist (design)

- [x] Named controls (Autopilot / Cancel); `aria-label` tracks `textContent`
- [x] Chart-open refuse visible/audible (header `aria-live`, not HUD toast)
- [x] Keyboard: no Digit / KeyM steal; Enter activates; Space does not
- [x] `aria-disabled` is boolean; reason lives in `aria-describedby` node
- [x] Native `disabled` only for no dest
- [x] Contrast tokens named; high-contrast hook named
- [x] No hub / jump-bar / banner overlap
- [x] Names from `SYSTEMS[].name`
- [x] No `innerHTML`
- [x] Focus rings: copy close button
