## Code Review: TGT-05 reticle-lock (Wave 74 PR2–PR4)

### Summary
KeyT cycle is unchanged. KeyV is a new one-frame edge. Pick shares the visible-reticle ray, uses disc-hit + nearer t, and never writes station/gate/pod refs. First pass raised two Majors (stale reticle, V prompt stealing group-3 Mine). Both are fixed. Recheck is clean of Blocker/Major.

### What's done well
- `cycleTarget` body is untouched (ships in 600; rocks only if `weaponGroup === 3`; nearest wrap).
- `reticleLockPressed` is its own pulse; TRACKED adds only `KeyV`.
- `pickReticleLock` extends `reticle-aim.js` (shared `fillCamRay`); no second camera path; no `Raycaster`; no cone / `CONVERGE_DOT`.
- Asteroid lock is the list row (`id === index`) even in group 1.
- Miss does not steal `targets.current`. Combat.js left alone: seeker still requires `object` + `state`.
- `state.js` untouched. HUD does not write `hullKind`.

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major (resolved)
1. **Pick ran before this frame's `reticleScreen`.** First pass: `tryReticleLock` sat with `cycleTarget` above the mouse clamp. V would lock last frame's pip. **Fix:** publish `reticleScreen`, then pick (`controls.js` update). **Status:** resolved.
2. **V prompt stole group-3 Mine.** First pass: rocks-in-range set `V / Lock` before the mine cue. **Fix:** V prompt runs after Dock/Jump/Hail/T/Mine (`hud.js`). **Status:** resolved.

#### 🟡 Minor
1. **Docked / jumping V still toasts.** `reticleLockBlocked` + `missReticleLock` emit the same static `commLine`. Contract asks for miss feedback on refuse. Noisy at the dock, but specified. **Location:** `controls.js:99-112`. **Status:** accepted.
2. **`reticleAimPoint` now returns the hit ref or `false`.** Callers in `combat.js` ignore the return. Boolean use still works. **Location:** `reticle-aim.js:88`. **Status:** accepted.

#### 💡 Suggestion
1. Disc radius uses camera-right world offset, not a full silhouette. Direct-hit PR2; fail-closed cone is deferred. Acceptable.
2. `raySphereTOpen` duplicates `raySphereT` minus the 0.4 m gun floor. Keep separate so gun aim does not change.

### Recheck
- Probe `out/w74/tgt05/probe.mjs`: OK (cycle-T, KeyV, FP center, destroyed skip, rock group 1, miss no-steal, range 600).
- No remaining Blocker/Major.

### Test coverage
Node probe pins inventory + pick + controls edge. Live flight (`npm run dev`) still needed for glass feel. Do not run `test:boot` in this wave.
