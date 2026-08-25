# UI Audit: PHY-04 remaining NPC avoid brief (Wave 108)

### Summary

No product chrome ships this wave. This audit treats the pack as a **traffic-picture spec** for later NPC avoid — measured against live PHY-02 bias, PHY-01 bounce, HUD-01 empty 80 px hub, and Digit 0/8/9. Picture is **hulls going around**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds an avoid pip). Digit theft is **not** proposed. Re-review: mermaid jump skip keeps dest (traffic does not halt). That is the correct empty-data state, not a freeze overlay.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **traffic behavior**: traders/miners complete legs without routine bounces. No new string, Digit, or required toast.
- Empty hub freeze is explicit: no avoid pip, traffic arrow, or keep-out ring on `.rw-reticle` (`hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- Hull strike / STAR HEAT / star-kill toasts stay as today (`hud.js` 587–593). Avoid does not add “traffic clear.”
- Digit 0/8/9 stay shipyard / launch / Standing. Avoid is not a dock verb.
- Manual stick is unchanged. Player still feels bounce on ram. Autopilot still threads the gate bore (skip gate bodies) — a readable lane, not a new chrome.
- reducedMotion: not a HUD pulse; NPC steer has no extra `@keyframes`. Do not invent a “safe path” overlay for vestibular users.
- Both HUD families keep the same glance set. No family-specific avoid widget.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Avoid stays invisible; bounce is still the only contact language

**Location:** `hud.js` 591–593 `bodyHit` only if `damage > 0`; `npc.js` 608–658 bias has no FX.

**Issue:** A successful mid-sample steer has **no** glance cue. Wishlist wanted credibility of motion, not a pip. Players may still see an occasional bounce and think avoid failed.

**Fix:** None this leftover. Do not add hub chrome to “explain” a miss. Playtest counts bounces, not UI.

**Status:** frozen; picture is hulls.

#### 🟡 Minor: Patrol pad-center dest can still look like a station dive

**Location:** `world.js` 381; contract PR2 frame hold.

**Issue:** Until PR2, a patrol nose may push at the pad then slide off the cylinder. That reads as clumsy, not as a HUD bug.

**Fix:** Later PR2 frame hold. Do not draw a hold marker on glass.

**Status:** documented.

#### 💡 Suggestion: Do not reuse RANGE for avoidHits

**Location:** `hud.js` 712 RANGE; `live.avoidHits` `npc.js` 656.

**Issue:** `avoidHits` is a debug count. Painting it on RANGE would smash TGT-01.

**Fix:** Contract already forbids. PR4 grep RANGE.

**Status:** frozen.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets.
- No new CSS tokens.
- No responsive overlay.
- Empty / error / loading states: N/A (no panel). Fail closed is **keep flying**, which is the correct disabled-data state (traffic does not halt).

### Verdict

Spec honors HUD-01 and Digit law. Later serials must not grow chrome to sell the steer.
