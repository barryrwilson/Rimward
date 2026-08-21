## UI Audit: Gilded hangar graft desk copy

### Summary
Kill standing is non-UI (helper + `commLine` only; no Digit 9 in this write-set). Graft desk copy now names 4000 UU on the offer row and the confirm meta. Two-step confirm, Esc cancel, and one-flight busy stay.

### What's done well
- Price uses `GRAFT_LIST_UU` through station `h()` `textContent` (`station.js` ~3842–3845).
- Confirm still shows the Beautiful hostility warning (full and reduced-motion).
- Credits short uses the same player line as yard buy: `Not enough credits.`
- Hostile Gilded still hides the offer (`graftOfferVisible` + `reputation` refuse).
- Confirm graft / Esc — Cancel pairing is unchanged.

### Findings

No Blocker or Major items.

#### 🟡 Minor: Confirm meta is a long single line
**Location:** `src/systems/shipyard-desk.js:242-243`
**Issue:** Confirm meta is `4000 UU ·` plus the existing warning sentence. Narrow dock panels will wrap.
**Fix:** Keep one meta node (task asked for confirm meta `textContent`). Wrapping is acceptable.

#### 💡 Suggestion: Offer row no longer says only “Mounted plated hull.”
**Location:** `src/systems/shipyard-desk.js:271`
**Issue:** Meta is now `4000 UU · Mounted plated hull.` The plated constraint still shows.
**Fix:** None. Price must be visible before arming confirm.

### Kill helper
Non-UI. `applyPlayerKillStanding` emits existing `commLine` after a real write. HUD already toasts that event with `textContent`. This worker did not spawn `[designer]`.
