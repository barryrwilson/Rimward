## Code Review: Beautiful Ones foundation (wave 106)

### Summary
Old manta / flipper / membrane architecture is gone from the shared modules. Four body-plan primitives probe clean at detail 0..3. Class files still import removed names; that break is in-scope and expected.

### What's done well
- Public API names match the four plans (shark / squid / octopus / whale).
- `grown_loft` still uses true ellipse rings. No `kit.hull_loft` for grown bodies.
- Hollows and vents use ellipsoids + `grown_lip`, not `kit.box` wells or porthole tori.
- Companion is a fusiform body, not a mini-manta.
- Travel-pose helper forces arm tips toward +Z.
- Probe covers every new public construct, leftover `_FLIP_`/`_FIN_` names, NaN, degenerate, sub-voxel, illegal roles.

### Findings

#### 🟡 Minor: Axis-aligned nacre pads
**Location:** `anatomy.py` `nacre_pads`
**Issue:** `kit.sphere` scale is ship-axis aligned, so a diagonal path grows `rz` rather than a true along-path radius.
**Fix:** Class authors should sample paths mostly along Z (folds, ridges) or pass larger isotropic radii. A path-aligned ellipsoid would need a custom loft; not required for this wave.

#### 🟡 Minor: Blade thickness is the thin axis
**Location:** `anatomy.py` `shark_dorsal` / `shark_caudal` / `whale_fluke`
**Issue:** The fin is thin in one axis (~0.14–0.16) and long in the other two. Above the 0.06 voxel, but class authors must keep `thick` >= 0.07.
**Fix:** Documented as `_THICK_MIN`. Do not drop `thick` below that.

#### 💡 Suggestion: `fin_ray` alias
**Location:** `surface.py` `fin_ray = span_ray`
**Issue:** Name still says "fin". The body is a generic root-tip ray.
**Fix:** Class workers should call `span_ray`. Keep the alias until old notes die.

No leftover `_FLIP_` / `_FIN_SPAN` constants in `anatomy.py`. No `fin_membrane` / `fleshy_sweep` / `swept_span` / `fold_crease` in the shared modules.

### Open (expected)
- `light.py` / `ace.py` / `cutter.py` / `heavy.py` / `frigate.py` / `freighter.py` still import removed names. Later class workers rewrite them. Do not restore the old API.
