# UI Audit: FX remaining muzzle / bolt / beam brief (Wave 114)

### Summary

No product chrome ships this wave. Leftover is **CONSUME**, so the pack is inventory-only plus merge law. The brief does **not** add hub pips, Digits, persist, aim-glass gauges, or a new fire toast. Player-facing fire-side language stays the **live** muzzle pop + glow-streak bolt (and the live mining lance). `reducedMotion` keeps the live one-frame snap.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- CONSUME: no new HUD instrument to sell “stronger muzzle.”
- Empty hub freeze is explicit: no punch pip, fire meter, or bolt counter on `.rw-reticle` (`hud.css` 184–193; `hud.js` **726–729** RANGE stays TGT-01; range pop **1392–1404**).
- Facing-rail flash stays on `.rw-combat-self` (`hud.js` **863**, **1127–1128**, **1167–1169**, **1407–1417**) — HUD-02 hair, not a hub child.
- Digit 0/8/9 stay shipyard / launch / Standing. Muzzle is not a dock verb.
- `reducedMotion` keeps live snap-one-frame (`combat.js` 2021–2042); shake already zeros (`ship.js` 1207–1211). No new `#hud` `@keyframes`. No new settings checkbox.
- First-person muzzle already steps off the nose and stays small (`combat.js` 1004–1025) so the 80 px glass does not flood. CONSUME does not grow it.
- Kit mutate omit. Aim-glass gauges stay off.
- No extra toast. Hull-strike remains scrape HUD (`hud.js` **608–610**).

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist still lists muzzle/bolts as FX-01 bullets

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` 1232–1233 (cite only; this pack must not edit it)

**Issue:** A later reader of the wishlist can think fire-side is still open and add a hub pip “so the player sees muzzle.”

**Fix:** Contract CONSUME + “no punch pip” is the merge law. Do not edit the wishlist in this worker.

**Status:** documented. Not a brief chrome add.

#### 💡 Suggestion: Untextured hit flash remains skippable

**Location:** `spawnFlash` without `map` (`combat.js` 594–607, 990–1001)

**Issue:** Hit squares can still look cheap next to mapped muzzle dots. That is **hit-side** flash map, skippable, not this leftover.

**Fix:** None in this pack.

**Status:** documented in inventory §3.6.

### Verdict

Brief does **not** add chrome. HUD-01, Digit 0/8/9, persist, and `reducedMotion` stay honored. CONSUME inventory-only UI risk is **none**.
