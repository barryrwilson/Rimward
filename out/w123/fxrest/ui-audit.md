# UI Audit: remaining FX leftover after named FX slices brief (Wave 123)

### Summary

No product chrome ships this wave. Leftover is **CONSUME**, so the pack is inventory-only plus merge law. Specified later FX is the **existing** muzzle pop, WAVE111 hull-local ripple, and scrape `spawnHitFx` — CONSUME means **do not add chrome**. Digit theft is **not** proposed (Blocker if a later serial adds an FX Digit). Hub theft is **not** proposed. This audit does **not** say “not available.”

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome. Spec audit of specified later FX vs live muzzle / ripple / scrape.

### What's done well

- CONSUME: no new HUD instrument to sell “remaining FX.”
- Empty hub freeze is explicit: no punch pip, fire meter, or bolt counter on `.rw-reticle` (`hud.css` **184–193**; `hud.js` **781** RANGE stays TGT-01; `hud.css` **207–218** `in-range` show).
- Facing-rail flash stays on `.rw-combat-self` (`hud.js` **919**, **1183–1184**, **1231–1232**, **1474–1482**) — HUD-02 hair, not a hub child.
- Scrape HUD stays `'▲ Hull strike.'` on damaging `bodyHit` (`hud.js` **660–662`) — consume; not a new fire toast.
- Digit 0/8/9 stay shipyard / launch / epics (`station.js` **188**, **6035–6036**). Remaining FX is not a dock verb.
- Live fire-side: family-tinted muzzle glow-dot; first-person steps off the nose and stays small (`combat.js` **1008–1029**) so the 80 px glass stays readable.
- Live shield language: WAVE111 parented ring rides the hull; first-person player host stays world-space (`combat.js` **1050–1106**).
- Live scrape punch: damaging ram calls the same `spawnHitFx` family (`combat.js` **1858–1860`). XOR still shielded-ripple vs sparks+mark (`1110–1116`).
- `reducedMotion` keeps live snap-one-frame (`combat.js` **1009–1021**, **1051–1062`); shake already zeros (`ship.js` **1207–1211`). No new `#hud` `@keyframes`. No new settings checkbox.
- Kit mutate omit. Aim-glass gauges stay off.
- No extra toast. No second incoming-fire live region.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Wishlist still lists muzzle / ripples / sparks as FX-01 bullets

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **1405–1414** (cite only; this pack must not edit it)

**Issue:** A later reader of the wishlist can think remaining FX is still open and add a hub pip “so the player sees punch.”

**Fix:** Contract CONSUME + “no punch pip” is the merge law. Do not edit the wishlist in this worker. Live muzzle / ripple / scrape already punch in world space.

**Status:** accepted — CONSUME named; not a missing chrome hole.

#### 🟡 Minor: Hit `spawnFlash` is still an untextured square next to mapped muzzle dots

**Location:** `combat.js` **990–1001** vs muzzle `map: glowTex` **609–614**

**Issue:** Hit squares can still look cheap. That is **FX-01 flash map**, skippable, not remaining leftover.

**Fix:** Do not require flash map as leftover PR1. Contract §0.11. Specified later UI must not put that map on the hub.

**Status:** accepted — skippable omit; CONSUME stands.

#### 💡 Suggestion: Hull-strike toast is scrape HUD, not remaining FX chrome

**Location:** `hud.js` **660–662**

**Issue:** A later worker could add `'▲ FX leftover.'` or a fire combo chip “because toast exists.”

**Fix:** Consume hull-strike. Do not add fire toasts. Incoming fire. stays sibling.

**Status:** accepted — out of scope.

### Specified later UI (CONSUME)

**Later UI = none.** Specified later FX vs live:

| Specified later | Live today | This leftover |
|---|---|---|
| Muzzle punch | `spawnMuzzle` glow-dot, FP small | **consume**; Wave 114 CONSUME; do not crank |
| Shield ripple | WAVE111 `host.add` | **consume**; do not steal parent |
| Scrape punch | `spawnHitFx` **1858–1860** | **consume**; do not steal |
| Recoil / marks | flesh kick; pool 12 | **consume** |
| Hub / Digit | 80 px empty; Digit 0 shipyard | **do not add** |

If an owner re-opens after a true missing-FX census, PR1 (named only then) must:

- Keep empty hub, RANGE TGT-01, facing-rail flash, hull-strike toast, `reducedMotion` snap, `textContent`
- Must not steal Digit 0/8/9, must not `innerHTML` copy, must not add hub chrome or a punch pip, must not add a second incoming-fire live region, must not autofocus trap the sim

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands. Specified later FX is already live muzzle / ripple / scrape. Muzzle leftover stays CONSUME.
