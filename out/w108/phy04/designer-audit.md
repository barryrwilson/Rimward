# UI Audit: PHY-04 remaining NPC avoid brief (Wave 108)

**Auditor:** `[designer]` (parent pass). Worker `out/w108/phy04/ui-audit.md` is a self-audit only; this file is the review of record.  
**Scope:** `docs/Phy04AvoidDesign.md`, `out/w108/phy04/shared-contract.md`, `out/w108/phy04/current-phy04-inventory.md`. Live HUD/Digit/MATCH cited as freeze rails only. No product source edited. No Vite. No Chrome.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Method:** Spec audit (no live UI this wave). Did **not** spawn a nested `[designer]`.  
**Date:** 2026-08-24.

## UI Audit: PHY-04 remaining NPC avoid (markdown only)

### Summary

The leftover is traffic that **goes around**, not a planner overlay and not a new glance widget. MERGE LAW forbids an avoid pip on the 80 px hub, RANGE rewrite, a new Digit, a required toast, MATCH/hover/`planApPath` steal, and Digit 0 theft. This freeze opens **no** 🔴 or 🟠. Later serials that add hub chrome, RANGE paint, Digit/MATCH steal, or a path overlay become Blockers.

### What's done well

- Player picture is hulls on a leg: freighter hold → gate, miner dock at hold, patrol keep-out, pirate still rams (`Phy04AvoidDesign.md` 237–249). No label, no debug chord, no keep-out ring on glass.
- Empty hub freeze is explicit and matches live tree: `.rw-reticle` 80×80 (`hud.css` 184–193); children are pupil, cilia, RANGE (`hud.js` 709–712). Contract §0.2: no avoid pip, traffic arrow, or keep-out ring inside `.rw-reticle`.
- RANGE stays TGT-01: selected-weapon envelope pop (`hud.js` 1374–1386; `hud.css` 207–220). Brief and contract both say do not rewrite RANGE.
- Digit 0 stays shipyard (`station.js` 188 last of `DOCK_KEY_SERVICES`; 6041–6043). Digit 8 dock root is launch; Digit 9 is epics (`station.js` 188, 6045–6046). Avoid is not a dock verb. **No new Digit.**
- **No toast required.** Hull strike / STAR HEAT / star-kill stay damage/heat language (`hud.js` 587–593). Contract forbids `ctx.emit` avoid type and “traffic clear.”
- MATCH stays the SPD lamp (`hud.js` 309–317, 1811–1813). Hover / `planApPath` stay NAV (`ap-path.js` 1–5; contract §0.10). NPC tick must not import that path.
- Fail-closed empty/error state is **keep flying** (contract §2). Traffic does not halt. That is the correct disabled-data picture: no freeze hull, no wait mode, no overlay that explains a miss.
- No new controls, tokens, hit targets, `@keyframes`, or family-specific avoid widget. `innerHTML` forbidden later; **no new DOM**.
- Worker `ui-audit.md` agrees on hub / Digit / RANGE / toast. This pass independently checked live cites; it does not reopen those as defects.

### Findings

No 🔴 Blocker or 🟠 Major in this freeze.

#### 🟡 Minor: Successful steer has no glance cue; bounce stays the only contact language

**Location:** `hud.js` 591–593 `bodyHit` only if `damage > 0`; `npc.js` 603–607, 656 `live.avoidHits` is a count, not HUD; brief §6.

**Issue:** A mid-sample go-around is silent. Players may still see an occasional PHY-01 bounce and read it as “avoid failed.” Wishlist asked for credible motion, not a pip.

**Fix:** None this leftover. Do **not** add hub chrome, RANGE digits, or a “clear” toast to explain a miss. Playtest counts routine bounces, not UI.

**Status:** frozen; picture is hulls.

#### 🟡 Minor: Patrol pad-center dest can still look like a station dive

**Location:** inventory §4.4 `world.js` 374–381; contract §0.1 PR2 frame hold; brief 241–243.

**Issue:** Until PR2, a patrol nose may push at the pad then slide off the cylinder. That reads as clumsy traffic, not a HUD bug. A hold **marker** on glass would be the wrong fix.

**Fix:** Later PR2 frame hold aim only. Do not draw a hold pip, waypoint ribbon, or dock ring.

**Status:** documented.

#### 💡 Suggestion: Do not reuse RANGE, MATCH, or `avoidHits` as chrome

**Location:** `hud.js` 712 RANGE; 1374–1386 in-range; 317 `rw-match-lamp`; `npc.js` 656 `live.avoidHits`; HUD-02 inner keep-out `hud.css` 1197–1210 (56 px).

**Issue:** `avoidHits` is a debug count on the dummy/live object. Painting it on RANGE smashes TGT-01. Hanging it on SPD would steal MATCH. A keep-out ring or tick inside the 80 px hub (or the 56 px HUD-02 mask) reopens HUD-01/02.

**Fix:** Contract already forbids pip / RANGE rewrite / HUD writer. PR4 grep `.rw-reticle` children, `rw-reticle-range`, `MATCH`, Digit 0/8/9, and toast strings `traffic` / `avoid`. Brief may cite the 56 px keep-out so a debug overlay does not land in the hub.

**Status:** frozen in MERGE LAW §0.2–0.3 / §0.10.

### Hub / RANGE / Digit / MATCH freeze (Blocker if a later serial violates)

| Surface | Live | Freeze | This audit |
|---|---|---|---|
| 80 px `.rw-reticle` | `hud.css` 184–193; `hud.js` 709–712 pupil + cilia + RANGE | No avoid pip, traffic arrow, keep-out ring, planner overlay | Pass (not proposed) |
| HUD-02 hub keep-out | `hud.css` 1197–1210 56 px mask | No extra ticks/pips in the disk | Pass (not proposed) |
| RANGE | TGT-01 weapon envelope `hud.js` 1374–1386 | Untouched | Pass |
| Digit 0 | shipyard `station.js` 188, 6041–6043 | No steal, no navigator SKU | Pass |
| Digit 8 / 9 | launch / epics `station.js` 188, 6045–6046 | No steal, **no new Digit** | Pass |
| Toast | hull strike / STAR HEAT `hud.js` 587–593 | No required avoid toast | Pass |
| MATCH | self SPD lamp `hud.js` 317, 1811 | Do not steal | Pass |
| Hover / AP path | `ap-path.js` 1–5; `autopilot.js` 247–275 | No `planApPath` in NPC tick | Pass |
| Picture | bias + bounce; one 40 u probe today | Hulls go around; not a planner overlay | Pass |

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets. Keyboard Digit map stays dock services.
- No new CSS tokens. Family skins keep the same glance set.
- No responsive overlay. Hub size stays 80 px.
- Empty / error / loading: N/A (no panel). Fail closed is keep dest / live 40 u bias (`shared-contract.md` §2).
- `reducedMotion`: do not invent a safe-path overlay or pulse. NPC steer has no extra `@keyframes`.
- Color is never the only cue because there is **no** new cue.

### Worker self-audit

`out/w108/phy04/ui-audit.md` is correct on pass: no Blocker/Major; invisible steer and patrol dive as Minors; RANGE/`avoidHits` as Suggestion. This parent pass adds the MATCH / HUD-02 keep-out / PR4 grep freeze so a later serial cannot “sell” the steer on glass.

### Verdict

**CLEAN.** 0 blockers, 0 majors. Spec honors HUD-01 empty hub, TGT-01 RANGE, Digit 0/8/9, no required toast, hulls-not-overlay, and MATCH/hover non-steal. Implementer must treat `out/w108/phy04/shared-contract.md` as law. Later serials must not grow chrome to explain the mid sample.
