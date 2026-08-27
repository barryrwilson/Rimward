## Security Review: Wave 138 PR1 oreguide (contract-to-rock match)

### Risk Level: Low

### Summary
PR1 reads world jobs and authored ore tables, then filters KeyT rocks and names the HUD cue with `textContent`. No XSS sink, no persist mute flag, no Agent range cheat, no pause write. Prototype commodity / origin keys skip.

### Findings

No CRITICAL or HIGH findings.

#### 🟢 LOW: HUD allocates a `Set` on the 5 Hz cue path
**Location:** `src/systems/hud.js` `beltMineDist` → `acceptedMiningOreKeys`
**Issue:** Each cue refresh builds a new `Set` of at most two authored keys.
**Impact:** Negligible. Not a DOM alloc. Contract allows the existing cue slot.
**Fix:** Cache only if a later profile shows cost. Not required for PR1.
**Status:** accepted — one-line justification: job count is tiny; 5 Hz Set is cheaper than a new persist cache.

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in helper, cycle filter, or cue path
- [x] Cue uses `promptVerb.textContent`
- [x] Ore name from `COMMODITIES[commodity].name` (authored), not `job.title` from save
- [x] `Object.hasOwn` on `SYSTEMS` / `ORE_TYPES` / `COMMODITIES`; reserved `__proto__` / `constructor` / `prototype` skipped
- [x] Unknown oreKey / job commodity → non-match / skip; helpers catch and return empty / false / `'ore'`
- [x] Cycle and cue wrapped so a throw cannot escape `cycleTarget` / cue block
- [x] No `flags.paused` write
- [x] No new WORLD_FIELDS / `state.js` write / save.js sanitize change
- [x] No `lockOre` / agent-api / agent-observe claim
- [x] No field marker mesh
- [x] No secrets

### Recommendations
1. Keep job titles out of the cue. Authored commodity names only.
2. Do not add Agent lock-by-ore in a later PR.
