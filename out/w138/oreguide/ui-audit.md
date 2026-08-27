## UI Audit: Wave 138 PR1 group-3 mine cue

### Summary
The existing group-3 empty-lock prompt now names the nearest matching ore in text, then range. Color is not the only cue. No new Digit, hub pip, animation, or MATCH reuse. Dock / Jump / Hail / Target still win. A rock lock still skips the cue.

### What's done well
- Copy is `Mine · Raw ore 200u` / `Mine · Living rock 90u` (boot stills).
- Fail-closed name `'ore'` if the commodity row has no name.
- Fallback `Mine · belt Nu` when no accepted mining job or no matching rock remains (including depleted `ore`).
- Two accepted jobs: cue names the nearest match, not a slot-0 pin.
- `textContent` on `rw-prompt-verb`. No innerHTML.
- Lock card still `ASTEROID` + ore after lock. `mineBlocked` toast unchanged. MATCH lamp still MATCH.
- `reducedMotion`: no new animation.

### Findings

No Blocker or Major findings.

#### 💡 Suggestion: cue still uses prompt key `3`
**Location:** `src/systems/hud.js` ~2652
**Issue:** Live group-3 cue already used key `3`. PR1 does not remap T.
**Fix:** None. Honor KeyT as TGT-07 cycle; the prompt remains the mine-group hint.
**Status:** accepted — matches today.

### Verdict
Designer audit clean for this cue change. HUD-01 hub empty. No field marker.
