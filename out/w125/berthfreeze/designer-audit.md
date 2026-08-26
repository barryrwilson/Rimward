## UI Audit: Berth Records hold + RESUME (Wave 125 PR1)

### Summary
PR1 lands a session berth hold with authored `textContent` copy, a full SAVE/LOAD desk on interrupt, and a named **RESUME** control below the slots. No Blocker. No Major. Verdict: **CLEAN**.

Reviewed: `src/game/save.js` (hint, RESUME wrap, LOAD, `setBerthOpen`), `src/systems/overlay-policy.js` (`berthHeld` / `setBerthHold`). Honor: HUD-01 empty hub, no new Digit, no `innerHTML`, interrupt keeps SAVE/LOAD, RESUME named in text below slots and larger than slot SAVE, hint no longer says records hold while you fly, copy names this is not Pause (P), interrupt hint does not say L/ESC dumps to live flight, no Enter/KeyP steal.

### What's done well
- Two authored hint literals match the contract (`save.js:1379–1380`). Open copy names L or ESC. Interrupt copy names RESUME and Pause (P). Neither says “records hold while you fly”.
- Reason lines are authored literals only (`save.js:1381–1383`). No system id interpolation into HTML.
- All berth copy uses `textContent` (`save.js:1373`, `1386`, `1537`, `1546`, `1564`, `1576–1582`). `save.js` has no `innerHTML`.
- Interrupt does not shrink the desk. Slot rows stay in the panel. `syncBerthHoldUi` only toggles the resume wrap (`save.js:1513–1553`, `1573–1578`).
- RESUME sits **below** the slot loop (`save.js:1571` after the row `for`).
- RESUME is more prominent than slot SAVE: full width, `padding:10px 16px` vs SAVE `4px 12px`, `font-size:14px`, `letter-spacing:0.18em`, extra `screen-btn-warm` (`save.js:1538` vs `1566–1567`). Visible label is `RESUME`. Color is not the only cue.
- Native `<button type="button">` with `aria-describedby` on the reason id (`save.js:1561–1565`). Tab order is SAVE/LOAD, then RESUME.
- Create-once wrap: `display:none` + `aria-hidden` when idle (`save.js:1555–1557`, `1577–1578`). No per-frame DOM alloc.
- `setBerthOpen` / `requestBerthClose` keep the desk on interrupt (`save.js:1460–1467`). L and Escape do not dump to live charge.
- LOAD still refuses only `flags.paused` (Wave 28) and still clears hold the same click (`save.js:1486`, `1500–1502`). Overlay helper never writes pause (`overlay-policy.js:4`, `196–203`).
- No new Digit. Berth keydown handles only `KeyL` and `Escape` (`save.js:1602–1617`). Death Enter/Space/Digit1 stay on the death overlay (`save.js:1343–1346`). No window-level Enter or KeyP bind for resume.
- Dialog `role="dialog"` `aria-label="Berth Records"` stays (`save.js:1365–1366`). Root `pointer-events:none` except the panel (`save.js:1354–1361`). HUD-01 hub is untouched.

### Honor checklist

| Rule | Result | Cite |
|---|---|---|
| HUD-01 empty hub | Pass — no hub pip / aim-glass child | no hud write in this PR UI |
| No new Digit | Pass | resume is a text button |
| No `innerHTML` | Pass | `save.js` grep 0 |
| Copy via `textContent` | Pass | `save.js:1373–1386`, `1564`, `1576–1582` |
| Interrupt keeps SAVE/LOAD | Pass | rows always mounted; wrap only hides |
| RESUME below slots | Pass | `save.js:1571` |
| More prominent than slot SAVE | Pass | size, width, type size, warm class |
| Named in text (not color-only) | Pass | `RESUME` + reason + hint |
| Hint must not say “while you fly” | Pass | `BERTH_HINT_HOLD` / `_INTERRUPT` |
| Names this is not Pause (P) | Pass | both hint literals |
| Interrupt hint must not say L/ESC dumps | Pass | `BERTH_HINT_INTERRUPT` |
| Do not steal Enter or KeyP | Pass | `save.js:1602–1617` vs death `1343–1346` |

### Findings

#### 🟡 Minor: Hint contrast is the live gray
**Location:** `src/game/save.js:1387` (`#5f7185`)
**Issue:** Hint remains the same dim legend color as the old string. Readable on the navy panel. Not a new regression. Interrupt reason uses brighter `#9fb2c6` (`save.js:1559`).
**Fix:** Do not retune the whole berth palette in PR1. Optional later contrast pass can brighten the hint only.

#### 💡 Suggestion: Open does not move focus into the dialog
**Location:** `src/game/save.js:1427` `setBerthOpen`
**Issue:** Live berth also did not auto-focus. Keyboard users still reach SAVE/LOAD/RESUME via Tab after L.
**Fix:** Keep. Auto-focus can steal flight keys on the open frame. Do not bind Enter at window level.

#### 💡 Suggestion: `screen-btn-warm` tokens live on `.screen-overlay`
**Location:** `src/game/save.js:1563`; `src/ui/screens.css:8–14`, `102–104`
**Issue:** `--rw-warm` / `--rw-accent` are set on `.screen-overlay`. Berth is a custom root (`#rw-berth-records`), not that class. Resting amber text may not apply. Prominence still holds via label, width, and padding. Slot SAVE already lived outside the overlay tokens.
**Fix:** Optional: set the same CSS variables on `#rw-berth-records`, or inline the warm color. Not required for PR1.

#### 💡 Suggestion: Dialog is still not `aria-modal`
**Location:** `src/game/save.js:1365–1366`
**Issue:** Chart sets `aria-modal="false"` because the sim stays live. Berth now holds the ship. `role="dialog"` is already present. Missing `aria-modal` is the live pattern, not a hold regression.
**Fix:** Optional later: `aria-modal="true"` while open. Do not copy chart’s false value.

### Re-review
No remaining Blocker. No remaining Major. Honor list passes. Verdict **CLEAN**.

Helm re-dispatch did not change UI. RESUME still continues the same flying Autopilot leg.
