## UI Audit: Wave 98 NPC turrets HUD freeze

### Summary
No product UI ships this wave. The freeze keeps HUD-01 empty 80 px hub, WPN groups 1–5, FORE/AFT hit-only, and the Wave 83 `Incoming dart.` toast exclusive to missiles. No new glance node. No Blocker / Major.

**Method:** self-applied `orchestrator/references/ui-audit.md`. Did not spawn `[designer]`. Markdown freeze + live HUD baseline. No Playwright. No Vite. No Chrome.  
**Date:** 2026-08-23.

### What's done well
- Color is already not the only FORE/AFT cue (`hud.js` 323–349: words + fill + flash).
- WPN rail stays `textContent` (`weaponHudLabel`); turret is not a sixth Digit (`hud.js` 210–229, 837–838).
- Dart incoming line stays authored (`Incoming dart.`) and throttled (`DART_TOAST_GAP` 2.5 s) (`hud.js` 61–62, 567–571).
- Station Digit 9 copy uses `h()` → `textContent` (`station.js` 4302–4307, 5424–5448).
- No new `#hud` node (create once in `initHud`). Empty 80 px hub stays (`hud.js` 1185).
- HUD never writes `hullKind`.
- This pack does not add a turret toast and does not author `Incoming fire.` (sibling TGT-03).

### Findings

#### 💡 Suggestion: Do not steal toast slots
**Location:** `src/systems/hud.js:59-62, 567-571`; `TOAST_SLOTS` 5  
**Issue:** A later owner toast for turret would compete with dart / sun / hull lines.  
**Fix:** Contract already forbids a turret toast in this pack. Keep it. Sibling TGT-03 owns `Incoming fire.` if that worker binds cannon-family vsPlayer.

#### 💡 Suggestion: reducedMotion
**Location:** `src/systems/combat.js:1854` (missiles: combat, not decoration)  
**Issue:** Hiding NPC turret bolts under `reducedMotion` would make combat silent on glass while song still barks.  
**Fix:** Bolts keep simulating. Only decorative glow/sparks stay reduced. Frozen in contract §1.1.

### Passed (HUD freeze)
- [x] No incoming turret gauge
- [x] No lock box
- [x] No aim-glass pip
- [x] No new `#hud` glance node
- [x] FORE/AFT stays `playerHit`
- [x] Digit 0 shipyard; Digit 8/9 player papers
- [x] No power ledger chrome
- [x] `textContent` / `h()` / `el()` only
- [x] No turret toast
- [x] No fire-percent chrome
