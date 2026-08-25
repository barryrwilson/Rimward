## Code Review: Wave 117 CTL-01 PR1 dock/jump bind

### Summary
The remap matches merge law: KeyJ pulses `pendingDock`, KeyD stays strafe, `dockPressed` stays the world edge. Skip mirrors pause. Boot pins wait on a recipe. No blockers.

### What's done well
- `TRACKED` includes `KeyJ`. Missing that would drop the key before the switch.
- `case 'KeyD'` no longer sets `pendingDock`. `strafeX` still uses held KeyD.
- Skip uses the same typing/title/models tests as `main.js` 170–174.
- Try/catch fail-closed matches “never throw”.
- Prompt copy is `pKey`/`pVerb` only. Combat rails and class tokens were not rewritten by this leftover.
- `ctx.js` comments only. No new input field.
- Boot pins now match KeyJ (WAVE21 706/732, WAVE6 1732).

## Append: boot-test.mjs pin apply

### Summary
Recipe text matched. Field `w21hubChecks.dEmitsRouteJump` kept its name on purpose. No Blocker or Major.

### What's done well
- Jump legs use KeyJ. Dock helpers still write the world edge.
- Tick labels and comments name J.
- KeyZ, WAVE85, WAVE88, WAVE117 NAV-05 KeyM pins not inverted.

### Findings
None.

## Append: title skip attach (WAVE21 harness)

### Summary
`titleOverlayAttached` matches live “title open”. Boot `getElementById` create-on-miss is detached (`parent: null`). WAVE21 KeyJ can pulse `pendingDock`. No Blocker or Major.

### What's done well
- Does not drop title/models/typing skip.
- Does not change boot stub `getElementById`.
- Does not invert NAV-05.

### Findings
None.

### Findings

No Blocker or Major.

#### 🟡 Minor: Skip helper duplicates reticle-lock overlay tests
**Location:** `src/systems/controls.js:58-71` vs `203-210`
**Issue:** Title and models checks exist twice. They are not identical (`reticleLockBlocked` also parks docked/jump/pause).
**Fix:** Leave split. Dock skip must not inherit reticle parks.

#### 💡 Suggestion: File-level comment still says “edge pulses”
**Location:** `src/systems/controls.js:33-37`
**Issue:** The edge-pulse comment is still correct (`dockPressed` is the edge). Bind is in the header line 30.
**Fix:** None required.

### Scope notes
- `scripts/boot-test.mjs` not edited. WAVE21 still `dispatchKey('KeyD')` until recipe apply.
- `gate.js` / `station.js` / `autopilot.js` not edited. `wantJump` OR stays live.
- Dirty `hud.js` also holds HUD-02 class-token work. This PR1 only changed dock/jump prompt strings at 2128–2137.
