## Security Review: Onb01 PR1 first-minute flight lesson

### Risk Level: Low

### Summary

PR1 paints authored hint literals with `textContent` only. `seen` restore is fail-closed (non-array → empty; unknown / prototype ids skip). No `innerHTML`, no new persist field, no pause write. No HIGH/CRITICAL remain open in the write-set.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None open.

#### 🟡 MEDIUM: Hostile `seen` stuffed with all authored lesson ids skips teaching

**Location:** `src/systems/onboarding.js` `show` / `seenHasAuthored`; `save.js` WORLD_FIELDS `'onboarding'` (cite only)  
**Issue:** A crafted save that already lists `look`/`throttle`/`target`/`hail`/`dock`/`chart` never re-teaches.  
**Justification:** Same envelope as the live eight-hint `seen` array. Client `settings.hints` is the honest mute. Do not add a sanitizer that clears `seen` (that would re-dump veterans). Do not add `WORLD_FIELDS` `flightLesson`.

#### 🟡 MEDIUM: WAVE6 save-fields pin still keys on retired `move`

**Location:** `scripts/boot-test.mjs` **1930–1931** (WAVE6 section g, outside this write-set)  
**Issue:** Onboarding block now banks `look`. Section g still asserts `seen.includes('move')`. A full harness run can fail closed on SAVE FIELDS after this pack.  
**Justification:** Task forbade rewrite of other WAVE6 sections. Product paint is not XSS. Orchestrator must retarget that pin to `look`.

#### 🟢 LOW: Encyclopedia lines remain authored `textContent`

**Location:** `src/systems/hud.js` CONTROLS `<li>` via `el()`  
**Issue:** None live. Keep `textContent`.  
**Justification:** Cite only. `controls.js` not claimed.

### Passed Checks

- [x] No secrets in this pack
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `onboarding.js` (paint is `textContent`)
- [x] Prototype / reserved `seen` ids skip unless `typeof id === 'string'` and the id is an authored HINTS id
- [x] `seen` not an array → `[]` in memory; never throw
- [x] `when(ctx)` throw → skip that row
- [x] `show` / `update` wrapped fail-closed
- [x] Lesson gate uses `Object.hasOwn(ORIGINS, id)` (unknown origin → no lesson)
- [x] Persist reuses `ctx.world.onboarding.seen`; no new WORLD_FIELDS
- [x] No `flags.paused` write; no auto-open hail/chart/berth/pause
- [x] `state.js` import of `ORIGINS` is read-only
- [x] REDMARCH `castMatches` not touched

### Recommendations

1. Orchestrator: retarget WAVE6 save-fields `seen.includes('move')` to `look` (out of this write-set).
2. Keep hint copy as authored literals. Do not interpolate save strings into the chip.
