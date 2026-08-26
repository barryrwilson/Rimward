# Wave 128 HUD-07 leftover — verifier report

**Status:** CLEAN  
**Date:** 2026-08-26  
**Domain:** data (no Vite, no Chrome, no `npm run test:boot`)  
**Verdict:** leftover **REAL** is justified. Named serial **PR1**. HUD-01 80 px hub stays empty in freeze. This pack write-set is markdown only.

## What I tested

- Live `src/systems/hud.js` and `src/ui/hud.css` vs inventory, contract, and `docs/Hud07DeconflictionDesign.md`.
- Spot-checks: empty 80 px hub; `.in-combat` collapse; duplicate lock names; RANGE/LEAD words; HUD-06 HOME pip / chevron inset 108; TGT arrow 84; banner/toast seats.
- `git status` / `git diff --stat` for write-set vs dirty `src/` (Wave 127 OTHER).
- Sibling docs Hail01 / Hail02 / Hud06 / Nav09 authors (not this pack).
- Honor: no hub gauges; no HUD-06 pip steal; no HUD-04 rewrite; color not only cue; no new pulse.
- Merge law: contract wins; serial PR1; later write-set `hud.js` + `hud.css` only.

## Bugs found

None that invert leftover law, hub freeze, write-set, or named serial.

## Environmental issues

None. Census is file/line against live HUD. Browser smoke was out of scope.

## Spot-check (live code)

| Claim | Live | Result |
|---|---|---|
| 80 px hub empty of gauges | `hud.css` 184–193 `.rw-reticle` 80×80; children are iris + RANGE **word** at `bottom: -16px` (207–220), not a compass/PPI | MATCH. Freeze: no **new** hub child. RANGE word is leftover to yield. |
| No general yield vs four regions | `agezHairOff` (`hud.js` 209–221) used only when `last.family === 'bio'` (1545–1561). No `deconflict` in `src/`. `overlap` only in a dock/jump **comment** (2376). Mech rails never yield. | MATCH. REAL. |
| `.in-combat` collapse | `#hud.in-combat .rw-fade` 0.14 (`hud.css` 89); `.rw-aux` 0.38 (999); chartmark 0.14 (632); home-mark 0.14 (688). Combat rails stay full (`941–960`). Combat **lights** rails; cruise does not quiet RANGE/LEAD/FORE/AFT words. | MATCH. Inverse of “exploration quieter than combat” for combat chips. |
| Duplicate labels | Bracket `tName.textContent = name` with `stripHudText` (2265–2271, 2322). Rail `tgtNameEl.textContent = railName` **no** strip (2345–2349). Same lock, two names. | MATCH. |
| RANGE / LEAD on aim column | `el(..., 'RANGE')` child of reticle (861); `.in-range` toggled 1564–1576. `el(..., 'LEAD')` on lead pip (895); lead shown 1494–1520. Rail DIST 2352–2355. | MATCH. |
| HUD-06 pip + inset 108 | `HOME_EDGE_INSET = 108` (75); pip 903–906, 1920–1935; chevron 907–909, 1936–1958 uses 108. Hide when `kind === 'station'` (1907–1908). POS HOME 2181–2196. | MATCH. Do not steal / retune. |
| TGT arrow 84 | `EDGE_MARGIN = 84` (74); `edgeArrow` 896, 1521–1541. | MATCH. |
| Banner / toasts off aim column | Banner injected `top: 96px; right: 14px` (769–773). Toasts `top: 14px; right: 168px` (`hud.css` 691–695). Two `aria-live=polite` (933–934, 947). Jump card is center, jump-only (804–808). | MATCH. Do not redo HUD-04. |
| `innerHTML` | grep 0 in `hud.js`. Copy via `el()` `textContent` (288–293). | MATCH. |
| HUD-05 CONSUME / HUD-06 live | `docs/Hud05RemainingFeedbackDesign.md` leftover CONSUME, serial none. HUD-06 Wave 127 PR1 live in dirty `hud.js`. | MATCH. This leftover is not those packs. |

## Write-set / neighbors

This pack (untracked markdown):

- `docs/Hud07DeconflictionDesign.md`
- `out/w128/deconflict/*.md` except `verify/`

Dirty `src/` (`hud.js` +221, `hud.css` +68, hail/npc/controls, …) is **Wave 127 OTHER**. No `deconflict` / yield classes in `src/`. Pack did not write `src/`.

Sibling docs exist as other workers:

- Hail01 — author Wave 126 leftover integrator
- Hail02 — author Wave 128 Hail02 leftover integrator
- Hud06 — author Wave 126 HUD-06 leftover integrator
- Nav09 — author Wave 128 NAV-09 leftover integrator

This pack did not rewrite them. `out/w128/hailmiss/**` and `out/w128/chartread/**` were not stolen.

Wishlist line 100–105 still INBOX (cite). This pack listed it as cite-only. Dirty `PLAYER-EXPERIENCE-WISHLIST.md` / `PROGRESS.md` are other wave edits, not HUD-07 implementation.

## Merge law / honor

- Leftover **REAL**. Named serial **PR1** (dynamic deconfliction + quieter exploration). CONSUME / “no HUD-07 leftover” forbidden. Consistent across design, contract, inventory, notes, reviews.
- Contract wins vs design (`shared-contract.md`). Later write-set: `src/systems/hud.js` + `src/ui/hud.css` only.
- HUD-01 empty 80 px hub freeze. Digit 0/8/9 stay. KeyH/J/L/M/P stay. `state.js` READ-ONLY. No persist. No new pulse (`hud.css` 1252–1258). Color + text/shape (`hud.js` 48–49).
- Do not steal HUD-06 pip, TGT arrow, NAV-02 cue, HUD-04 channel.

## Notes (not bugs)

1. Live already has a **third** polite live region: `.rw-nav-readout-live` (`hud.js` 1098–1100) besides toasts + banner. Contract “no third `aria-live`” means **do not add another**, not that only two exist. Policy still holds.
2. Inventory “grep overlap 0” misses the dock/jump comment at `hud.js` 2376. No collision loop exists.

## Evidence paths

- This report: `out/w128/deconflict/verify/report.md`
- Write-set: `out/w128/deconflict/verify/write-set.txt`
