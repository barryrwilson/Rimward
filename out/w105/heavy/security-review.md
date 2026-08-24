## Security Review: scripts/ship_builders/beautiful/heavy.py

### Risk Level: Low

### Summary

Bake-only geometry. No user input, no network, no secrets, no runtime path join. No HIGH or CRITICAL findings.

### Findings

None.

### Passed Checks

- [x] No secrets in code
- [x] No `eval` / `exec` / `subprocess` / `os.system`
- [x] No `innerHTML`
- [x] No remote GLB URL
- [x] Class key is a literal bake argument (`--class=heavy`), not save/network input
- [x] `sys.path.insert` is the existing local bake idiom (parents[2] → `scripts/`)
- [x] Glow stays driver-emitted mesh; this file only appends to `glow`
- [x] No persist, no HUD, no `state.js`

### Recommendations

1. Keep faction/class allowlists in `build-ship-assets.py` (unchanged this wave).

## Security Audit: beautiful heavy builder

### Summary

Clean. Offline Blender sculpt. No exploitable data flow.

### Positive Observations

- Uses only `ship_kit` primitives and existing `anatomy` / `organs` / `surface` helpers.
- No new organ type.
- Delivery path stays `public/assets/ships/beautiful/heavy/` after canonical class bake.
