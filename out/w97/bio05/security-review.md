## Security Review: BIO-05 Wave 97 owner close

### Risk Level: Low

### Summary
Deep audit of the Wave 97 markdown close (`docs/OwnerDecisionsWave97.md`, Bio05 status bump, `out/w97/bio05` contract and inventory note). No `src/` diff in this write-set. No CRITICAL or HIGH findings. The freeze keeps `innerHTML` forbidden, own-key `grafted`, proto id skip, no new persist key, standing allowlist, and no invented UU.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` plus orchestrator `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Markdown only. Nested subagents forbidden.

### Findings

None at 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Restore still `Object.assign`s the player blob before hangar heal

**Location:** live `save.js` 1203 then 1216–1221; contract §3  
**Issue:** A crafted save can put `grafted: true` (or a getter) on `snap.player` before `healPlayerHullKind` / `syncMountedToPlayer`. Live heal then drops living/Unknowables flags and copies the **row**. Wave 97 does not add a restore path.  
**Impact:** Tamper cannot keep living-grafted after sanitize (Wave 96 inventory §6). Built tamper still triggers the −10 cap (intended).  
**Fix (accepted):** Later leftover PRs (only if a successor opens them) must keep row-wins heal. Do not skip `sanitizeHangar`. No new persist key that bypasses the allowlist.

#### 🟢 LOW: `ctx.emit` smash if a later NPC PR spreads a hangar blob

**Location:** `ctx.js` event queue spreads payload; `kill-standing.js` 112–120  
**Issue:** Emitting `{ ...hangar }` or a model with `type` would smash the queue. Wave 97 keeps NPC spawn **off**, so no new emit path lands.  
**Fix:** Contract §3: graft confirm emits nothing. Kill `commLine` stays `{ text }` primitives. Faction names come from `FACTIONS`, not NPC strings.

#### 🟢 LOW: Desk copy remains source literals

**Location:** `shipyard-desk.js` 52–69, 360–418; owner file Hangar-badge section  
**Issue:** Player-controlled hull `name` is shown on hangar cards via `h()` `textContent`. Graft papers do not interpolate names. Wave 97 restates live Gilded warn only. No new desk string.  
**Fix:** Keep graft strings as literals. Do not `innerHTML` a hull name into Confirm graft. Badge stays omit.

### Passed Checks

- [x] No secrets, API keys, or credentials in the write-set
- [x] No network / auth / server trust boundary
- [x] `innerHTML` forbidden; `textContent` / `h()` / `el()`
- [x] `grafted` own-key boolean only (`hasOwnProperty` / `Object.hasOwn`)
- [x] Living / Unknowables drop the flag
- [x] Hull ids: `SAFE_ID` + `RESERVED_IDS`
- [x] Standing writes `'beautiful'` only if `FACTIONS` owns the key
- [x] No new `WORLD_FIELDS` / `localStorage` key
- [x] No invented UU or standing deltas (4000 / −10 / −5 / +5)
- [x] Digit 0 remains shipyard
- [x] HUD never writes `hullKind`
- [x] No `src/` scheduled in Wave 97
- [x] Ungraft SKU forbidden (no `state.js` commodity)
- [x] NPC `grafted` spawn stays absent (`npc.js` 0 hits; `src/game/traffic.js` 0 hits)
- [x] Prototype keys never become reputation keys (`hangar.js` 162; `kill-standing.js` 19–21)

### Recheck (after Bio05 status bump)

No new persist key, Digit, UU, or `innerHTML` landed in the owner file or brief. Destroy +5 remains the Wave 82 integer. NPC traffic closed **off**. Overlay omit. Badge omit. Ungraft forbidden. Risk Level stays Low. No CRITICAL / HIGH.

### Recommendations

1. Keep `state.js` closed unless a successor owner file opens a SKU.
2. If a successor opens PR3: never `innerHTML`; never emit hangar; NPC `grafted` own-key only on built.
3. Do not add a dedicated abomination `WORLD_FIELDS` key.
