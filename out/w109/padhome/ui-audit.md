# UI Audit: PHY-05 remaining pad-home brief (Wave 109)

### Summary

No product chrome ships this wave. This audit treats the pack as a **traffic-picture spec** for later patrol persist heal — measured against live AI-01 holds, HUD-01 empty 80 px hub, and Digit 0/8/9. Picture is **hulls that do not spawn inside the station**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a pad-home pip). Digit theft is **not** proposed. Fail-closed missing helper keeps dest (traffic does not halt). That is the correct empty-data state, not a freeze overlay.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **traffic behavior**: patrols no longer pop from the D5 core after save/load. No new string, Digit, or required toast.
- Empty hub freeze is explicit: no pad-home pip, hold marker, or station-ring on `.rw-reticle` (`src/ui/hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- Hull strike / STAR HEAT / star-kill toasts stay as today (`hud.js` 587–593). Pad-home does not add “clear of station.”
- Digit 0/8/9 stay shipyard / launch / Standing. Pad-home is not a dock verb.
- Manual stick is unchanged. Player still feels bounce on ram.
- reducedMotion: not a HUD pulse; heal has no `@keyframes`. Do not invent a “safe pad” overlay for vestibular users.
- Both HUD families keep the same glance set. No family-specific hold widget.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Heal stays invisible; bounce is still the only contact language

**Location:** `hud.js` 591–593 `bodyHit` only if `damage > 0`; `world.js` 702–726 heal has no FX.

**Issue:** A successful pad-home rewrite has **no** glance cue. Wishlist wanted credibility of motion, not a pip. Players may still see an occasional bounce and think the hold failed.

**Fix:** None this leftover. Do not add hub chrome to “explain” a miss. Playtest counts in-cylinder spawns, not UI.

**Status:** frozen; picture is hulls.

#### 🟡 Minor: Live patrol still orbits; it does not sit on a visible berth

**Location:** `npc.js` 257–258 loiter ring; brief player outcome.

**Issue:** After heal, abstract home is a hold, but the live mesh still loiters 80–150 u out. That can read as “they never dock,” not as a HUD bug.

**Fix:** Out of this leftover (contract §0.19). Do not draw a berth marker on glass.

**Status:** documented.

#### 💡 Suggestion: Do not reuse RANGE for hold distance

**Location:** `hud.js` 712 RANGE.

**Issue:** Painting station-hold range on RANGE would smash TGT-01.

**Fix:** Contract already forbids. PR2 grep RANGE / `.rw-reticle`.

**Status:** frozen.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets.
- No new CSS tokens.
- No responsive overlay.
- Empty / error / loading states: N/A (no panel). Fail closed is **keep flying**, which is the correct disabled-data state (traffic does not halt).

### Digit / hub freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new | forbidden |
| Pad-home pip | none | forbidden |
| Digit 0 | shipyard | do not steal |
| Digit 8/9 | launch / epics; outfitting papers | do not steal |
| Toast | not required | do not add “hold clear” |

### Verdict

Spec honors HUD-01 and Digit law. Later serials must not grow chrome to sell the persist heal.
