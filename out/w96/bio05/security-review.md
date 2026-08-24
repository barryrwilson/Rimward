## Security Review: BIO-05 remaining Abominations (design freeze)

### Risk Level: Low

### Summary
Deep audit of the Wave 96 markdown freeze (inventory, merge law, brief). No `src/` diff. No CRITICAL or HIGH findings after contract fences for `innerHTML`, own-key `grafted`, proto ids, no new persist key, standing allowlist, and no invented UU.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` plus orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Markdown only. Nested subagents forbidden.

### Findings

None at 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Restore still `Object.assign`s the player blob before hangar heal

**Location:** live `save.js` 1203 then 1216–1221; contract §3  
**Issue:** A crafted save can put `grafted: true` (or a getter) on `snap.player` before `healPlayerHullKind` / `syncMountedToPlayer`. Live heal then drops living/Unknowables flags and copies the **row**. The freeze does not add a new restore path.  
**Impact:** Tamper cannot keep living-grafted after sanitize (inventory §6). Built tamper still triggers the −10 cap (intended).  
**Fix (accepted in freeze):** Later leftover PRs must keep row-wins heal. Do not skip `sanitizeHangar`. No new persist key that bypasses the allowlist.

#### 🟢 LOW: `ctx.emit` smash if a later NPC PR spreads a hangar blob

**Location:** `ctx.js` event queue spreads payload; `kill-standing.js` 112–120  
**Issue:** Emitting `{ ...hangar }` or a model with `type` would smash the queue.  
**Fix:** Contract §3: graft confirm emits nothing. Kill `commLine` stays `{ text }` primitives. Faction names come from `FACTIONS`, not NPC strings.

#### 🟢 LOW: Desk copy is already source literals

**Location:** `shipyard-desk.js` 52–69, 360–418  
**Issue:** Player-controlled hull `name` is shown on hangar cards via `h()` `textContent` (`shipyard-desk.js` 399–401). Graft papers do not interpolate names.  
**Fix:** Keep graft strings as literals. Do not `innerHTML` a hull name into Confirm graft.

### Passed Checks

- [x] No secrets, API keys, or credentials in the write-set
- [x] No network / auth / server trust boundary
- [x] `innerHTML` forbidden; `textContent` / `h()` / `el()`
- [x] `grafted` own-key boolean only (`hasOwnProperty` / `Object.hasOwn`)
- [x] Living / Unknowables drop the flag
- [x] Hull ids: `SAFE_ID` + `RESERVED_IDS`
- [x] Standing writes `'beautiful'` only if `FACTIONS` owns the key
- [x] No new `WORLD_FIELDS` / `localStorage` key
- [x] No invented UU or standing deltas
- [x] Digit 0 remains shipyard
- [x] HUD never writes `hullKind`
- [x] No `src/` scheduled in Wave 96
- [x] Prototype keys never become reputation keys (`hangar.js` 162; `kill-standing.js` 19–21)

### Recheck (after brief §2 split)

No new persist key, Digit, UU, or `innerHTML` landed in the brief edit. Destroy +5 remains the Wave 82 integer. Standing recap still described as live `applyAbominationStanding` after the kill write. Risk Level stays Low. No CRITICAL / HIGH.

### Recommendations

1. Later PR1 pins: living tamper drops `grafted`; reserved faction skip; `__proto__` id null.
2. Later PR3 (if opened): never `innerHTML`; never emit hangar; NPC `grafted` own-key only.
3. Keep `state.js` closed unless the owner opens a SKU.
