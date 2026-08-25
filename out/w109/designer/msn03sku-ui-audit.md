# UI Audit: Wave 109 MSN-03 Digit 2 Jobs SKU grant copy

**Auditor:** `[designer]` (independent of `out/w109/msn03sku/ui-audit.md`)
**Scope:** Live UI after worker PR3. `renderJobs` chain branch + last-step grant `commLine`. Honor: HUD-01 empty 80 px hub, Digit 0 shipyard, Digit 8/9 unchanged, `textContent`/`h()` only, no `innerHTML`, no shop 6500/4200 on Jobs, hint `Last paper may seat a ${name} if this hull has a hardpoint.`
**Review file:** `out/w109/designer/msn03sku-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against live `src/systems/station.js`, `src/ui/screens.css`, `src/ui/hud.css`, `src/systems/hud.js`, `src/game/weapon-fit.js`, `src/game/jobs-chains.js`, brief `docs/Msn03UniqueSkuDesign.md` §6, contract `out/w108/msn03sku/shared-contract.md` §0.1. Worker self-audit is secondary. No Vite. No Chrome. [NO BROWSER COVERAGE] [NO SCREENSHOTS].
**Date:** 2026-08-24
**Product source:** review only. Did not edit `src/`.

## UI Audit: Digit 2 Jobs chain SKU hint + grant commLine

### Summary

Wave 109 ships one extra Jobs `textContent` line from catalog names when `chainGrantSpec` is non-null, plus last-step `commLine` ` Gear seated.` / ` Compact thanks +2 UU.` Chrome stays on Digit 2. HUD hub, Digit 0, and Digit 8/9 do not change. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions.

### What's done well

- Overlay wipe stays `overlay.textContent = ''` (`station.js` 5924, 6056). `h()` sets `textContent` (`station.js` 4387–4392). `innerHTML` is absent in `station.js`.
- Hint is one extra `h('div', 'job-reward', card, chainSkuHint)` (`station.js` 5253). No new Digit, pane, icon, or shipyard class.
- Template matches honor copy: `Last paper may seat a ${skuName} if this hull has a hardpoint.` (`station.js` 5246). Names are `LAUNCHER_IDS.dart.name` / `TURRET_IDS.auto.name` (`weapon-fit.js` 41, 51 → `Dart rack` / `Auto turret`). Shop `cost` 6500 / 4200 (`weapon-fit.js` 37, 49) is not interpolated on Jobs.
- Live UU quote stays first (`station.js` 5233–5234). Hint is additive. Empty `skuName` skips the extra line (`station.js` 5245–5247).
- `commLine` success: `' Gear seated.'` Fail: `' Compact thanks +2 UU.'` (`station.js` 3543–3544 via `completeJob` 3756). Fail token keeps `UU`. Success does not name a `classKey` or hull.
- Digit map unchanged: `DOCK_KEY_SERVICES` (`station.js` 188) + labels (`station.js` 5938–5940). Digit 1 Market, Digit 2 Jobs, Digit 8 Launch, Digit 9 Standing (`epics`), Digit 0 Shipyard. Outfitting 8/9 stay papers (`station.js` 1633–1634, 6152–6154). Jobs digits still accept offered-only (`station.js` 6134–6136). Mouse Accept past index 8 still uses `btn` (`station.js` 5261).
- HUD-01: `.rw-reticle` is 80×80 (`hud.css` 184–193). Live children remain pupil, three cilia, RANGE (`hud.js` 709–712). No SKU pip. No quest widget.
- Chain DONE hide stays (`station.js` 3648). Unique DONE hide stays (`station.js` 3650–3653). No memorial list of finished grants.
- `reducedMotion`: `renderJobs` adds no animation and no `requestAnimationFrame`.
- Unique four still do not call `grantChainSku`. Hint is behind `job.kind === 'chain'`.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: SKU hedge reuses pay-green `.job-reward`

**Location:** `src/systems/station.js:5252-5253`; wrap `src/ui/screens.css:250-254`
**Issue:** The UU line and the kit hedge both use `.job-reward` (`color: var(--rw-good)`). The hedge is not pay. On a dense card the two green 12 px lines can wrap the same as pay. This is density and hierarchy, not a Digit steal. Shop 6500/4200 still do not print.
**Suggestion:** Keep one extra line as specified. Do not add a pane, Digit, or shipyard class. If a later wave retunes hierarchy, a note class (`.job-detail` / `.job-state`) is enough. Do not use `white-space: nowrap`.
**Status:** specified reuse. Not a remaining product defect.

#### 💡 Suggestion: Hint also paints on chain steps 1 and 2

**Location:** `src/systems/station.js:5236-5253`
**Issue:** Gate is non-null `chainGrantSpec` plus live `dart`/`auto` catalog name. After PR1 every authored employer has a spec. Step 1/2 cards therefore say “Last paper may seat…” three docks early. Brief §6 titles this last-step. Contract table also says “only when `chainGrantSpec` is non-null.” Live code follows the table, not `parsed.step === 3`.
**Suggestion:** Keep as shipped unless the owner asks after playtest. A later gate `parsed.step === 3 && grantSpec` would match last-step copy without a new Digit.
**Status:** honor list uses the non-null-spec template. Acceptable.

#### 💡 Suggestion: English article is `a` for both names

**Location:** `src/systems/station.js:5246`; names `src/game/weapon-fit.js:41,51`
**Issue:** Template is `a ${skuName}`. `a Dart rack` reads well. `a Auto turret` is a small grammar miss (`an`). Contract freeze uses `a ${catalog.name}`.
**Suggestion:** Do not change the template this leftover. Owner may later special-case `an` for Auto turret.
**Status:** specified string. Do not rewrite.

### Accessibility

- No new control. Accept stays `button type="button"` (`station.js` 4394–4398).
- Screen readers get a second static reward line when the hint is present. Catalog strings are authored ASCII. `h()` does not inject HTML.
- Keyboard: Digit 1–9 on Jobs still offered-only. Digit 0/8/9 at dock root are unchanged. Focus rings are existing `.screen-btn` rules. No new focus trap.
- Contrast: `.job-reward` uses `--rw-good` (`#7dd8a8` default, `#009E73` in `body.rw-contrast`). High-contrast restyle still targets `.job-detail`, not `.job-reward` (`screens.css` 595–608). Existing token. No new hardcoded color on the hint.
- `station-notice` `aria-live="polite"` (`station.js` 5970–5972) is unchanged. Grant outcome is `commLine`, not a new live region.

### Theming / layout

- No new CSS. No hardcoded color on the hint. Card wrap is existing `.job-card` padding. Overflow risk is the extra wrap line only.
- Does not use `shipyard-hull-meta` / `shipyard-mounted`. Digit 0 shipyard chrome is untouched.

### States

| State | Result |
|---|---|
| Offered chain, spec non-null | UU line + hint |
| Accepted chain, spec non-null | UU line + hint + ACCEPTED state |
| Chain DONE | Hidden from board (`3648`) |
| Last-step grant true | `Chain sealed — … Gear seated.` |
| Last-step grant false | `… Compact thanks +2 UU.` (not `Gear seated.`) |
| Unique four | No hint. No `grantChainSku` |
| Empty hub / RANGE / HUD-01 | Untouched |
| Loading / disabled / hover | No new control; existing Accept hover stays |

### Honor freeze

| Check | Result |
|---|---|
| HUD-01 empty 80 px hub | **Pass** — pupil, cilia, RANGE only |
| Digit 0 shipyard | **Pass** |
| Digit 8/9 unchanged | **Pass** — launch / Standing at dock root; outfitting papers |
| `textContent` / `h()` only | **Pass** |
| No `innerHTML` | **Pass** |
| No shop 6500/4200 on Jobs | **Pass** |
| Hint template | **Pass** — `Last paper may seat a ${name} if this hull has a hardpoint.` |
| Digit 2 Jobs | **Pass** |
| `reducedMotion` | **Pass** — no extra animation |

### Worker `ui-audit.md`

Worker self-audit (`out/w109/msn03sku/ui-audit.md`) reports 0 blockers / 0 majors and the step-1/2 hint suggestion. Independent read agrees. Adds the pay-green reuse as a documented minor (W108 designer already named it). Article `a Auto turret` is a new optional note, not a remaining defect.

### Method notes

Did not start Vite. Did not take stills. Graph resolve returned `codex/workflow-catalog-maintenance` (false match on “review”). This pass did not change the catalog.
