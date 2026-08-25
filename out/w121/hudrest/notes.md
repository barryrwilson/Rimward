# Wave 121 hudrest — notes

**Status:** leftover **CONSUME**. Named serial: **none**. Name: **no remaining HUD feedback leftover.**  
**Write-set:** `docs/Hud05RemainingFeedbackDesign.md`, `out/w121/hudrest/**` only.  
**No `src/`.**

## Census (code wins)

HUD-04 Wave 120 PR1 is **live**:

- `TOAST_DEDUP_WINDOW = 8` — `src/systems/hud.js` 66
- five-row linger, not chip-tied — `hud.js` 530–555, 848–855
- expire `aria-hidden` — `hud.js` 1243
- AUTOSAVE HELD vs SAVE BLOCKED — `hud.js` 596–600
- `save.js` `source: 'autosave'|'berth'` — 1040, 1422, 1428, 1535, 1540

`commLine` → `toastForEvent` → same `pushToast` (`hud.js` 560–568, 1235).  
Banner = one `.rw-banner` on `systemLoaded` (`hud.js` 858–863, 1247–1265).  
Onboarding = one `.rw-onboard-hint`, persist `seen` (`onboarding.js`).  
`pushToast` exists only in `hud.js`. No second unnamed toast channel.  
`aria-live=assertive`: none under `src/`.

## Why CONSUME

Owner test: toasts linger; banner/commLine/onboarding are not a flood leftover; no second unnamed toast channel. All three hold.

Do **not** invent HUD-05 PR1 for banner `aria-hidden` or hint `aria-live`. That would add chrome / a live region HUD-04 forbade.

## Did not touch

`src/**`, wishlist, `PROGRESS.md`, `docs/Hud04ToastFloodDesign.md`, `docs/Hud03*`, `docs/Hud02*`, `docs/Nav07ChartLabelDesign.md`, `docs/OwnerDecisions*`, `out/w121/chartlabel/**`, `out/w121/expdock/**`, `out/w120/toast/**`, `out/w118/toast/**`.

No Vite. No Chrome. No `docs/OwnerDecisionsWave121.md`.

## Siblings

- Toast PR1 already landed Wave 120.
- Chart-label sibling writes `galaxychart.js` this wave (NAV-07). Do not steal.

## Reviews

Security: Low, 0 HIGH/CRITICAL (second pass).  
Code: Approve CONSUME, 0 Blocker/Major. One Minor (hub cite) resolved in inventory §7.  
UI: self-applied checklist, 0 Blocker/Major; banner/hint a11y minors documented as not leftover.
