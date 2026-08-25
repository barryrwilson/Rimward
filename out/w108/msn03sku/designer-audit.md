# UI Audit: Wave 108 MSN-03 remaining unique SKU brief (spec only)

**Auditor:** `[designer]` (independent of `out/w108/msn03sku/ui-audit.md`)
**Scope:** Design-spec only. Digit 2 Jobs last-step grant copy, Digit map, HUD-01 hub, fail-closed +2 copy. No live UI this wave.
**Review file:** `out/w108/msn03sku/designer-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `docs/Msn03UniqueSkuDesign.md`, merge law `out/w108/msn03sku/shared-contract.md`, inventory `out/w108/msn03sku/current-msn03sku-inventory.md`, and live cites those files name. Worker self-audit `out/w108/msn03sku/ui-audit.md` is secondary, not the source of truth.
**Date:** 2026-08-24
**Product source:** none this wave (markdown only). Live `src/` was read for cite check only. No Vite. No Chrome. [NO BROWSER COVERAGE] [NO SCREENSHOTS].

## UI Audit: Digit 2 Jobs last-step grant copy (spec)

### Summary

Wave 108 does not ship UI. The brief and contract keep grant chrome on Digit 2 Jobs: one `textContent` catalog-name hint, live `Gear seated.` / fail ` Compact thanks +2 UU.`, no hub child, no memorial pane, no new Digit. Fail +2 is UU, not a hull. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions.

### What's done well

- UI stays inside `renderJobs`. Contract §0.3 / brief §6. Live board is Digit 2 (`DOCK_KEY_SERVICES[1]` = `jobs`, `src/systems/station.js` 188, 5904, 6039–6046).
- Extra line is `textContent` / existing `h()` (`src/systems/station.js` 4368–4373). `innerHTML` is forbidden later (contract §0.4). Live `station.js` has no `innerHTML`. Overlay wipe stays `overlay.textContent = ''` (5890, 6022).
- Catalog **name** only: `Dart rack` / `Auto turret` (`src/game/weapon-fit.js` 41, 51). Shop integers 6500 / 4200 stay shop costs (contract §0.1, §0.11). Forbidden on Jobs.
- Refuse hedge is in the hint: `if this hull has a hardpoint.` That is the current hull, not a new hull.
- `commLine` success keeps live `Gear seated.` (`src/systems/station.js` 3524). Fail suffix is ` Compact thanks +2 UU.` — credits unit, not a class key.
- Digit 0 stays shipyard (last `DOCK_KEY_SERVICES` + Digit 0 bind). Digit 8 dock root stays launch. Digit 9 dock root stays Standing / epics. Outfitting 8/9 stay papers (`src/systems/station.js` 1633–1634). PR3 is Jobs copy only.
- HUD-01 empty 80 px hub stays empty. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–193). Live children: pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). No quest widget. No SKU pip.
- HUD reads `player.hullKind` only (`src/systems/hud.js` 86–87). HUD does not write `hullKind`. Spec freezes that (contract §0.5).
- Unique DONE hide already skips unique DONE rows (`src/systems/station.js` 3631–3634). Spec adds no memorial list of finished grants.
- `reducedMotion`: no extra animation (contract §0.1 copy). Mouse Accept past index 8 stays. Digit 1–9 offered-only stays.
- Serial PR3 must not steal Digit 0/8/9 and must not write `state.js`. First remaining serial home is `jobs-chains.js` rows, not station chrome.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Last-step card may grow a second pay-green line

**Location:** brief §6; contract §0.1 copy; live `src/systems/station.js:5213–5219`; wrap class `src/ui/screens.css:250–254`
**Issue:** Live chain cards already paint one `.job-reward` UU line (`Last paper pays ${est} UU…` / `Chain paper — last step pays ${est} UU`). Spec adds one extra `textContent` line with the catalog name. `.job-reward` uses `var(--rw-good)` (pay green). A second green line on a dense Jobs card can wrap on a small overlay. That is density, not a Digit steal. It does not print 6500/4200.
**Fix:** Later PR3: one extra line only. Prefer reuse of `h('div', …)` with wrap (`.job-reward` has no `white-space: nowrap`). Do not add a pane, Digit, icon column, or shop cost. Do not use shipyard classes (`shipyard-hull-meta`, `shipyard-mounted`) for this hint.
**Status:** spec already says one extra `textContent` line. No brief rewrite required.

#### 💡 Suggestion: Gate the SKU hint on last step (`parsed.step === 3`)

**Location:** contract §0.1 copy (“Last-step SKU hint” / `only when chainGrantSpec is non-null`); brief §6 (“Last-step with non-null spec”)
**Issue:** After PR1 every authored employer has a non-null spec. A helper that checks only `chainGrantSpec` would paint `Dart rack` / `Auto turret` on steps 1–2 and promise kit three docks early.
**Fix:** Later PR3: require `parsed.step === 3` (or last-step copy only) **and** non-null spec. Brief §6 already says last-step. Contract table title says last-step. Keep both gates.
**Status:** implied; acceptable. Do not rewrite the brief this wave.

#### 💡 Suggestion: Keep `UU` on the fail suffix so +2 cannot be read as a hull or a second standing write

**Location:** contract §0.1 `commLine` fail ` Compact thanks +2 UU.`; live complete line `src/systems/station.js:3525` (`Chain sealed — ${pay} UU posted.${repLine}${grantLine}`); standing already `standing +${MINING_REP}` (`src/systems/station.js:3510`)
**Issue:** Fail-closed consolation is integer **2**. Live last-step already appends employer `standing +2`. If PR2 drops `UU` and writes `Compact thanks +2.`, the token collides with standing +2 and can be misread as a hull or remount token. Spec already includes `UU`. Digit 0 shipyard must not show this line.
**Fix:** Later PR2: keep ` Compact thanks +2 UU.` exactly. Do not say `Gear seated.` on fail. Do not name a `classKey`. Do not route the suffix through Digit 0.
**Status:** spec already correct. Call out for PR2 copy freeze.

### Required checks (this leftover)

| Check | Spec | Result |
|---|---|---|
| Digit 2 stays Jobs | contract §0.3; `DOCK_KEY_SERVICES[1]` | **Pass** |
| No memorial pane | brief §6; no Digit 9 SKU log; unique DONE hide stays hide | **Pass** |
| No quest widget on 80 px hub | contract §0.2; `.rw-reticle` RANGE only | **Pass** |
| Digit 0 shipyard | last dock key + Digit 0 bind | **Pass** |
| Digit 8/9 stay | dock root launch / Standing; outfitting 8/9 papers | **Pass** |
| No new Digit | contract §0.3; grant is not a dock verb | **Pass** |
| SKU hint `textContent` only | contract §0.4; `h()` | **Pass** |
| Catalog name only | `Dart rack` / `Auto turret`; not ids | **Pass** |
| Do not print shop cost as grant price | 6500/4200 forbidden on Jobs | **Pass** |
| Fail-closed +2 must not look like a hull grant | fail copy is `+2 UU`; success is `Gear seated.`; no `classKey` / remount / Digit 0 chrome; `grantChainSku` never writes hull | **Pass** |
| No `innerHTML` | contract §0.4; live grep 0 in `station.js` | **Pass** |
| No HUD `hullKind` write | contract §0.5; `hud.js` 86–87 read only | **Pass** |
| `reducedMotion` | no extra animation | **Pass** |
| Contrast / tokens | N/A this wave (no new CSS). Live `.job-reward` already `--rw-good`; contrast restyle is `.job-detail` | N/A |
| Hit targets | Mouse Accept unchanged; Digit 1–9 offered-only unchanged | **Pass** |

### Fail-closed +2 vs hull grant (detail)

- Jobs card never names a hull grant. Hint names kit (`Dart rack` / `Auto turret`) plus a hardpoint hedge.
- Consolation is credits **2 UU** after last-step `grantChainSku` false (null spec, unknown employer, `!canSeat`, blank write). Not a `SHIP_CLASSES` row. Not Digit 0 remount.
- Success copy is `Gear seated.` (gear, not hull). Fail must not reuse that string.
- Shop 6500/4200 must not appear as if they were the consolation price.

### Worker `ui-audit.md`

Worker self-audit also reports 0 blockers / 0 majors. Independent read agrees. Worker minor (second reward line) kept. Worker step-1 hint suggestion kept and tightened: gate on `parsed.step === 3` because PR1 makes every authored spec non-null.

### Method notes

Independent read of `docs/Msn03UniqueSkuDesign.md` (Honor, §6 UI, §8 serial), `out/w108/msn03sku/shared-contract.md` §0–§0.1 / §2–§3, `out/w108/msn03sku/current-msn03sku-inventory.md` §§6–10. Cite-check only: `src/systems/station.js` 188, 1633–1634, 3494–3526, 3629–3634, 4368–4373, 5106–5219, 5904, 6039–6046; `src/systems/hud.js` 86–87, 709–712; `src/ui/hud.css` 184–193; `src/ui/screens.css` 238–254; `src/game/weapon-fit.js` 33–61. Compared worker `out/w108/msn03sku/ui-audit.md` after the spec read. Did not edit product source. Did not open a browser. Did not apply a code fix. Did not land PR1–PR4.
