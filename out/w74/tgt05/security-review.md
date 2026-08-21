## Security Review: TGT-05 reticle-lock (Wave 74 PR2–PR4)

### Risk Level: Low

### Summary
Client HUD/input change. No new persist, no `innerHTML`, no lock blob on events. First pass found no CRITICAL/HIGH. Recheck after the reticle-publish order and HUD prompt fix is still clean.

### Findings

None open at CRITICAL, HIGH, or MEDIUM.

#### 🟢 LOW: `ctx.emit` still spreads the payload object
**Location:** `src/core/ctx.js:230-231`
**Issue:** `emit(type, data)` does `{ type, t, ...data }`. A future caller that spreads a ship/rock into `data` would put names/meshes on the queue.
**Impact:** Not exploitable here: `tryReticleLock` only emits `{ hit: true }` / `{ hit: false }` literals and a static `commLine` `{ text }`.
**Fix:** Keep payloads as literals (current). Do not pass lock refs.
**Status:** accepted — pre-existing emit helper; this slice does not widen it.

### Passed Checks
- [x] No secrets in code
- [x] Miss copy is a module string literal (`Nothing under the reticle.`)
- [x] HUD prompt uses `textContent` (`hud.js` 1712–1714); no `innerHTML` in `hud.js`
- [x] `reticleLock` payload is `{ hit: boolean }` only — probe `v-hit-event` / `miss-event-hit-false`
- [x] Does not emit lock refs, names, ids, or meshes
- [x] Does not reuse `hailOpened` / `saveBlocked`
- [x] No `for…in` blob merge; lock write is an existing list/ship ref
- [x] No new `localStorage` key; `WORLD_FIELDS` has no `targets`
- [x] Prototype keys are not copied onto `targets.current`
- [x] Station `{ position, name }` is never written (pick iterates ships + asteroid list only)
- [x] Cue gain 0.05 / duration 0.06 s; not in `FAMILY_CUES`

### Recheck (after HUD mine-cue order + pick-after-reticleScreen)
- XSS / emit payload / persist: unchanged, still pass.
- No new sinks.

### Recommendations
1. Keep `reticleLock` payloads as boolean literals only.
2. Do not later interpolate `record.name` into the miss `commLine`.
