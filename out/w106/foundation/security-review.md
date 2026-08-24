## Security Review: Beautiful Ones foundation (wave 106)

### Risk Level: Low

### Summary
Blender authoring scripts only. No secrets, no eval, no network, no path join to remote GLBs. Nursery seed no longer uses PYTHONHASHSEED-sensitive `hash()`.

### Findings

None at CRITICAL or HIGH.

#### 🟢 LOW: Local sys.path insert
**Location:** `scripts/ship_builders/beautiful/anatomy.py` and `organs.py` (`sys.path.insert` to `scripts/`)
**Issue:** Adds a fixed parent of the package so `ship_kit` imports. Same pattern as the rest of the ship builders.
**Impact:** None on production web paths. Offline bake only.
**Fix:** Leave as the kit convention.

### Passed Checks
- [x] No secrets in code
- [x] No eval / exec
- [x] No urllib / requests / http
- [x] No innerHTML
- [x] No path join to remote GLBs
- [x] Deterministic `kit.rng` (not `random`, not `hash()`)
- [x] Probe writes only to local stdout / `out/w106/foundation/probe.log`

### Recommendations
1. Keep class workers on the same local-kit import pattern.
