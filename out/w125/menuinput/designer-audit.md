# UI Audit: CTL-04 PR1 Digit1–5 weapon-group skip (Wave 125)

Parent `[designer]` pass. Checklist: `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Persona: `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`.

Did **not** edit `src/`. Did **not** spawn agents. Did **not** start Vite or Chrome. Did **not** rubber-stamp `out/w125/menuinput/ui-audit.md`.

Honor checked against live code + MERGE LAW (`out/w124/menuinput/shared-contract.md` §0.2, §0.14; `docs/Ctl04MenuInputDesign.md`).

## UI Audit: `src/systems/controls.js` (input scoping; no new chrome)

### Summary

PR1 scopes Digit1–5 so dock menus and other play surfaces do not rewrite `input.weaponGroup`. Product chrome does not grow. The WPN rail still paints `weaponHudLabel` with a digit prefix via `textContent`. No Blocker. No Major. Verdict: **CLEAN**.

### What's done well

- No new HUD node, overlay, pip, or motion. HUD-01 hub stays empty **80px** (`.rw-reticle` in `src/ui/hud.css` **188–189**). Aim-glass gauges stay off (`rw-hair-off` on combat rails, `hud.js` **919**, **929**). No WPN pip on the reticle.
- Skip lives only in `controls.js` Digit1–5 cases (`357–372`). `TRACKED` still lists Digit1–5 only (`50`). Digit 0 / 8 / 9 stay station (`station.js` **6169–6177**, legend **6047**). Controls does not add Digit6–9/0.
- Open-space Digit1–5 still assign groups 1–5 when skip is false. Flight help still names `1/2/3/4/5 — weapon group` (`controls.js` **405**).
- WPN copy stays authored `textContent` (`hud.js` **1940–1941**). `weaponHudLabel` still prefixes the group number (`hud.js` **255–273**: `g + ' · ' + name`, `4 · —`, `5 · —`). Color is not the only cue.
- No `innerHTML`. No “not available” string. No disabled WPN widget (contract §0.14).
- Station buttons already name keys in text (`4 — Feed & tend`, `5 — Repair`, `station.js` **6034–6038**). After PR1, Digit5 opens Repair and the rail **does not** jump to `5 · Psionic bolt`. Digit4 does **not** become empty `4 · —`.
- Hail resolve still uses Digit1–n + `[n]` verbs. `hailOpen` skip stops the dual WPN write without restyling hail.
- Keyboard reach is scoped, not remapped. KeyJ / KeyD / Esc / B stay. `reducedMotion` n/a.

Honor (code):

| Rule | Result |
|---|---|
| HUD-01 empty 80px hub | pass — no hub child |
| Aim-glass gauges off | pass |
| No new Digit | pass |
| No “not available” | pass |
| No `innerHTML` in PR1 | pass |
| Digit 0/8/9 station | pass |
| Digit1–5 flight WPN in open space | pass |
| WPN rail must not silently change while dock menus own digits | pass — skip on `flags.docked === true` |
| Digit prefix in `weaponHudLabel` stays | pass |

Wave 124 **Major** “WPN rail lies while the station menu is open” is **closed in product**, not only in freeze. Worker self-audit was directionally correct; this pass re-checked HUD copy, station legend, TRACKED, and the skip formula against contract §0.1.

### Findings

No 🔴 Blocker. No 🟠 Major (open).

#### 🟡 Minor: No extra cue that dock digits are station-owned

**Location:** station overlay `station.js` **6034–6047**; HUD WPN rail `hud.js` **255–273**, **926–927**; skip `controls.js` **91–111**, **357–372**

**Issue:** After PR1, Digit5 at dock opens Repair and leaves WPN as the pre-dock group. A player who expected to swap groups at berth sees no toast and no muted rail. Station chrome already looks modal; the skip is silent **non-change**.

**Fix:** None in PR1. Contract §0.14 forbids “not available” and new chrome. Station legend already teaches `1-9, 0 select service`. Do not dim the rail with color-only state.

**Status:** accepted — owner freeze. Not a missing widget.

#### 🟡 Minor: Player cannot change WPN while docked

**Location:** contract tradeoff §0.1; Digit cases `controls.js` **357–372**; outfitting Digit 8/9 stay `station.js`

**Issue:** Docked Digit1–5 never retarget weapons. A combat-first player cannot pre-select cannon on the landing list.

**Fix:** That is the inbox. Outfitting still uses Digit **8/9** papers, not groups 1–5. Digit **0** stays shipyard. Owner may override after playtest. Do not add a docked WPN picker.

**Status:** accepted — documented tradeoff.

#### 🟡 Minor: CONTROLS help still names 1–5 as flight WPN only

**Location:** `controls.js` **405**; hail numbered buttons `hail.js` **431–448**; station `1-9, 0` `station.js` **6047**

**Issue:** Help still says 1–5 are weapon groups. Hail cards and the station list also number those keys. After PR1 the **write** is scoped; the help line stays flight-true. A player who reads CONTROLS while docked or on a hail card can think 1–5 still retarget WPN.

**Fix:** Do not add a second CONTROLS line in this leftover. Hail buttons already name `[n]` + verb. Station buttons already name `n — service`. Color is not the only cue.

**Status:** accepted — no new chrome.

#### 💡 Suggestion: Hail.js still comments the old dual-bind

**Location:** `hail.js` **431–432** (out of write-set)

**Issue:** Comment still says Digit1–3 also switch weapon groups. After PR1, `hailOpen` skips the WPN write. Hail resolve still runs. The comment can confuse a later HUD pass.

**Fix:** Other worker. Not UI chrome. This pack must not edit `hail.js`.

**Status:** accepted.

#### 💡 Suggestion: Chart / berth still have no Digit legend

**Location:** skip via `hailDigitsAllowed === false` / `chartOpen` / `berthOpen` (`controls.js` **96–105**); chart/berth chrome unchanged

**Issue:** Digit1–5 on map or berth now no-op for WPN. Those surfaces do not paint 1–5. Previously the keys silently rewrote the rail behind the card. Skip is the better outcome. A Digit legend on the chart would be extra chrome.

**Fix:** None. Do not paint 1–5 on the chart.

**Status:** accepted — skip is enough.

### Accessibility

- Keyboard: station 1–9/0 stay reachable (`station.js` **6169–6177**). Flight 1–5 stay reachable in open space. Skip does not `preventDefault` on digits and does not start `stopImmediatePropagation`.
- Named close: Esc/B launch stay (`station.js` **6047**, **6161–6166**). PR1 does not steal Esc.
- Contrast: existing cyan-on-void rails and station scrim. No new color-only selected-group cue. Digit prefix remains the WPN identity.
- Focus: typing skip (`shouldSkipDockPulse` / `playSurfaceBlocked`) stops Digit-in-field from changing WPN.
- Semantics: no new control without a name. Existing `textContent` / `el()` / `h()` / `btn()` stay.
- Disabled state: intentional absence. A disabled WPN meter would need copy the contract forbids.

### Player-facing flows (spec check; Vite not started)

1. Dock. Snapshot WPN. Digit5 Repair. Group unchanged. Digit4 Feed. Group unchanged (must not become empty group 4).
2. Digit 0 shipyard. Digit 8/9 station services. Open space Digit1–5 set WPN.
3. Hail open: Digit1–3 resolve hail when `hailDigitsAllowed`; no `weaponGroup` write.
4. Chart / berth / settings / pause / title / models / typing: Digit1–5 do not write `weaponGroup`.
5. Direct `ctx.input.weaponGroup = n` still paints the rail (combat pins). Label still uses the digit prefix.

### Worker self-audit vs this pass

`out/w125/menuinput/ui-audit.md` claimed Pass, no Blocker/Major. That severity call matches this pass. This pass adds the docked-WPN tradeoff and CONTROLS-help dual-numbering as **accepted Minors** (already frozen in Wave 124 UI audit), and restates chart/berth as a Suggestion. It does not raise severity. It does not invent chrome.

### Verdict

**CLEAN.** 0 Blocker. 0 Major. 3 Minor (accepted). 2 Suggestion (accepted). No new chrome. WPN rail no longer changes behind station menus. Digit prefix in `weaponHudLabel` stays.
