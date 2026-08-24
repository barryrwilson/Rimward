## Security Review: BIO-03 Beautiful look + bake (Wave 95)

### Risk Level: Low

### Summary
Bake-only change. Class Python and shared organs do not join runtime asset paths. No remote GLB. No eval. Glow still comes from the live driver `RIMWARD_ENGINE_GLOW` mesh.

### Findings

No 🔴 CRITICAL or 🟠 HIGH issues.

#### 🟢 LOW: Bake CLI still allowlists faction/class tokens
**Location:** `scripts/build-ship-assets.py` `parse_targets` (read-only this wave)
**Issue:** This serial did not edit the driver. Beautiful bake used allowlisted tokens `beautiful` and class keys from `CLASSES`.
**Impact:** None for this write-set.
**Fix:** N/A

### Passed Checks
- [x] No secrets in `scripts/ship_builders/beautiful/`
- [x] No `eval(` / `http://` / `https://` in class or organ Python
- [x] No remote GLB URL in bake output path (`public/assets/ships/beautiful/<class>/lod*.glb`)
- [x] `npm run ships:validate` PASS — Meshopt GLBs, self-contained, no external `uri`
- [x] Skins encoded only under `public/assets/ships/materials/beautiful/{trader,pirate}`
- [x] Runtime `ship-assets.js` not edited (canonical join stays owner of path security)
- [x] `userData.glow` still a mesh from `RIMWARD_ENGINE_GLOW` (driver, not class files)
- [x] No persist, no HUD, no `state.js`, no `innerHTML`

### Recommendations
1. Keep fail-closed Wave 8 copies under `out/w95/bio03/wave8-keep/` until the next catalog wave.
2. Do not add a user-authored model URL in a later serial.
