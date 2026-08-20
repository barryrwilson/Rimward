## Code Review: AST PR1 data/seed + fieldOre

### Summary
Orbit elements replace the five placement draws. WAVE51 first-8 tuples, `id === i`, and shared Vector3 identity hold. Keep-out uses no extra rng. Same-system restore overlays without dispose. Update still tumbles in place (no PR2 motion).

### What's done well
- Exactly five `rng()` draws before `radius` (ore/colour/axis stream aligned).
- `list[i].id === i`; `list[i].position` is the rock Vector3; list replaced only on `systemLoaded` teardown.
- Closed-form pose at `ctx.world.time` at build only.
- Work sector maps the phase0 draw; first N indices are the dense sector.
- Count hard-clamped to 160.
- `fieldOre` sparse write on extract; overlay `min(seeded, persisted)`; revive/deplete on overlay.
- Restore that omits `fieldOre` deletes the live bag (same as hangar). Overlay token `lastOreRef` treats a deleted bag as a change and refills from seed.

### Findings

No Blocker or Major findings after revive-on-overlay, planet-torus keep-out, and omit-key delete.

#### 🟡 Minor: Planet slot table is copied, not imported
**Location:** `src/systems/asteroids.js` `PLANET_SLOTS`
**Issue:** `solarsystem.js` `SLOTS` is not exported. This PR cannot edit that file.
**Fix:** Later serial owner exports `SLOTS` (or a read-only `{radius, orbitRadius}[]`) and asteroids imports it.
**Justification:** Live numbers match `solarsystem.js` 170–206 and `PLANET_SLOT_COUNT`. Out of scope to export.

#### 💡 Suggestion: Keep-out helpers are allocated per rock
**Location:** `src/systems/asteroids.js` build second pass
**Issue:** `bumpR` / `bodyHit` closures are created inside the per-rock loop. Build-only, N ≤ 160.
**Fix:** Lift to module or `build()` scope if a later PR profiles build cost.

### WAVE51 / identity pins (probe)
- Freehold seed 11 first-8 `(oreKey, radius, ore)` match the pre-change tuples.
- `list.length === field.count` (130), clamp ≤ 160.
- Work sector ≥ 60% within ±0.7 rad of `az0`.
- Mean `hypot(x,z)` near belt R, not the old 160 u clump.
- Keep-out vs sun heat, station cylinder, gates/hub, planet-slot torii.

### PR2 not started
`update` still recomposes tumble matrices only. No per-frame `writeOrbitPose`.
