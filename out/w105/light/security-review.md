## Security Review: Beautiful light NPC sculpt (Wave 105)

### Risk Level: Low

### Summary
Asset-only change in `scripts/ship_builders/beautiful/light.py` plus baked `public/assets/ships/beautiful/light/lod*.glb`. No runtime path join, no remote GLB, no eval. Quick scan.

### Findings

No 🔴 CRITICAL or 🟠 HIGH issues.

#### 🟢 LOW: Bake used allowlisted CLI tokens
**Location:** `scripts/build-ship-assets.py` `parse_targets` (read-only)
**Issue:** This worker invoked `-- beautiful --class=light`. Tokens come from `FACTIONS` / `CLASSES`.
**Impact:** None for this write-set.
**Fix:** N/A

### Passed Checks
- [x] No secrets in `scripts/ship_builders/beautiful/light.py`
- [x] No `eval(` / `new Function` / `http://` / `https://` in `light.py`
- [x] No remote GLB URL. Output is `public/assets/ships/beautiful/light/lod*.glb`
- [x] Meshopt marker present on lod0/1/2 (`out/w105/light/meshopt.txt`)
- [x] Runtime `ship-assets.js` not edited (canonical join stays owner of path security)
- [x] `src/systems/ship.js` living path not edited
- [x] No persist, no HUD, no `state.js`, no `innerHTML`
- [x] No new organ type (shared organs remain serial)

### Recommendations
1. Keep Wave 95 copies under `out/w105/light/wave95-keep/` until the next catalog wave.
2. Do not add a user-authored model URL in a later serial.
