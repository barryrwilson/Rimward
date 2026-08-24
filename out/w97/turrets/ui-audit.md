## UI Audit: Wave 97 NPC turrets HUD freeze

### Summary
No product UI ships this wave. The freeze keeps HUD-01 empty 80 px hub, WPN groups 1–5, FORE/AFT hit-only, and the Wave 83 `Incoming dart.` toast exclusive to missiles. No Blocker / Major after the no-toast / no-pip / reducedMotion combat pin.

### What's done well
- Color is already not the only FORE/AFT cue (`hud.js` 323–349: words + fill + flash).
- WPN rail stays `textContent` (`weaponHudLabel`); turret is not a sixth Digit.
- Dart incoming line stays authored (`Incoming dart.`) and throttled (`DART_TOAST_GAP` 2.5 s).
- Station Digit 9 copy uses `h()` → `textContent`.
- No new `#hud` node (performance contract: create once in `initHud`).
- HUD never writes `hullKind`.

### Findings

#### 💡 Suggestion: Do not steal toast slots
**Location:** `src/systems/hud.js:59-62, 567-571`; `TOAST_SLOTS` 5  
**Issue:** A later owner toast for turret would compete with dart / sun / hull lines.  
**Fix:** Contract already forbids a turret toast. Keep it.

#### 💡 Suggestion: reducedMotion
**Location:** `src/systems/combat.js:1854` (missiles: combat, not decoration)  
**Issue:** Hiding NPC turret bolts under `reducedMotion` would make combat silent on glass while song still barks.  
**Fix:** Bolts keep simulating. Only decorative glow/sparks stay reduced. Frozen in contract §1.1 (forbidden-glance table) and `docs/NpcTurretsDesign.md` merge table.

### Passed (HUD freeze)
- [x] No incoming turret gauge
- [x] No lock box
- [x] No aim-glass pip
- [x] FORE/AFT stays `playerHit`
- [x] Digit 0 shipyard; Digit 8/9 player papers
- [x] No power ledger chrome
- [x] `textContent` / `h()` / `el()` only
