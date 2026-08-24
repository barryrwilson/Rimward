## Security Review: NAV-02 in-flight next-gate guidance (Wave 85)

### Risk Level: Low

### Summary

Guidance is a read-only HUD consumer of `ctx.world.nav`. Names use `textContent` after `Object.hasOwn(SYSTEMS, id)` and control-character strip. The 3D ring is not a pick body. The slice does not write `targets.current`, does not emit `navGuidance`, and does not persist a hop cursor. Stuffed `path[1]` / unknown `status` fail closed.

### Findings

No CRITICAL or HIGH findings.

#### 🟢 LOW: Catalog names are not HTML-escaped beyond control-strip

**Location:** `src/systems/nav-guidance.js:42–45`; `src/systems/hud.js:1788–1791`  
**Issue:** `navSystemName` strips C0/DEL then writes `textContent`. A catalog name that contains markup would show as text, not execute.  
**Impact:** None in a `textContent` HUD.  
**Fix:** None required. Do not switch these nodes to `innerHTML`.

### Passed Checks

- [x] XSS names: `textContent` only; `stripNavText`; `Object.hasOwn(SYSTEMS, id)`; reserved-id reject (`nav-guidance.js` 25–28, 42–45). No `innerHTML` in `hud.js` / `nav-guidance.js`.
- [x] Lock steal: no `targets.current =` in this slice. Plot/marker/cue/readout do not assign the lock (`hud.js` guidance block; `nav-guidance.js` 6–8).
- [x] Raycast pick: `emptyNavRaycast` on the parked group and torus (`nav-guidance.js` 23, 162). Not in `ctx.ships`. No `lockKind`.
- [x] Emit smash: no `navGuidance` emit. `navRoute` / `systemLoaded` are consumed, not spread onto `ctx.emit`.
- [x] Stuffed `path[1]`: reserved / unknown ids → `kind !== 'plotted'`, `pos: null` (`nav-guidance.js` 117–124). Unknown `status` → omit (`93–94`).
- [x] No bag write: HUD re-reads `world.nav`; does not assign it.
- [x] Distance lives outside the live region (`hud.js` 886–904). Outer panel is `aria-live="off"` / `aria-atomic="false"`. `role="status"` + `aria-live="polite"` are on `.rw-nav-readout-live` only (next/dest/remaining/status). GATE is a sibling.
- [x] Cue is `pointer-events: none` and `aria-hidden="true"` (`hud.js` 706–707; `hud.css` 895).

### Recommendations

1. Keep names on `textContent` if HUD-02 skins this panel.
2. Do not parent the ring under a KeyV pick assembly.

### Re-review

No HIGH/CRITICAL items. Slice stays fail-closed on stuffed ids and unknown status.
