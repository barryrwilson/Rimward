# UI Audit: Wave 136 MSN-04 PR1 mining identity (Jobs pane copy)

**Auditor:** `[designer]` (independent of `out/w136/jobdedup/ui-audit.md`)
**Scope:** Wave 136 MSN-04 PR1 mining identity uniqueness. Frontend-facing job-board **text**. Player must see distinct mining rows (ore name + pay). Digit 2 stays Jobs. No new Digit. No hub pip. Omit the second card when the ore table is too small (legal). Color is not the only cue. `innerHTML` forbidden. Digit 0/8/9 stay.
**Review file:** `out/w136/designer/jobdedup-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Live cites: `src/systems/station.js` mining mint + `renderJobs` + Digit map; `src/ui/screens.css` job-card; `src/game/state.js` hardness-1 names/prices. Worker self-audit `out/w136/jobdedup/ui-audit.md` read, not copied. Merge law `out/w130/jobdedup/shared-contract.md`. Graph resolve `proceed_unmodeled` (`r-mtarhjt7-5a4be576`). No Playwright. No Vite. No Chrome. Did not edit `src/`. [NO BROWSER COVERAGE].
**Date:** 2026-08-26
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w130/jobdedup/shared-contract.md` wins if the brief forks.

**Blocker bar (this pass):** rows still indistinguishable **after mint**; Digit map stolen; `innerHTML` ore names.

## UI Audit: Digit 2 Jobs mining-row identity (PR1 landed)

### Summary

PR1 uniqueness is mint-time in `station.js` mining helpers. The Jobs pane still paints through `h()` `textContent`. After mint, two live mining cards at one origin use different hardness-1 commodities (or the second card is omitted). Titles and pay lines name the ore in text. Digit 2 is still Jobs. Digit 0/8/9 are unchanged. No hub pip. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (omit shortens Digit indices; leftover accepted twins are contract-frozen), 1 suggestion.

### What's done well

- Digit 2 is Jobs. `DOCK_KEY_SERVICES[1] === 'jobs'` (`station.js` **189**). Dock-root Digit 2 selects that key (`station.js` **6255–6262**). Menu copy is `2 — Jobs board` (`station.js` **6120–6124**). No new Digit. Digit 0 is Shipyard, Digit 8 is Launch, Digit 9 is Standing.
- Jobs pane names mining rows in **text**. Live rewrite is `Mine ${oreName}` (`station.js` **5236–5241**). Detail names the same ore (`5242`). Pay line is `Deliver ${need} ${oreName} here — pays ${est} UU` (`5328–5337`). Digit index is in the title (`5300`) and on `Accept (${i + 1})` (`5428–5429`). Color is not the identity channel.
- `h()` writes `textContent` (`station.js` **4544–4549**). `innerHTML` / `insertAdjacentHTML` / `document.write` are **none** in `station.js`. Ore names are `COMMODITIES[key].name` strings (`state.js` **354–355**: `Raw ore`, `Living rock`).
- Mint excludes sibling live commodities (`pickMiningCommodityExcluding` **2239–2253**; `miningSiblingCommodities` **2267–2278**; `makeMiningJob` **2306–2331**). Exhausted table returns `null`. `syncMiningJobs` breaks the fill (`2385–2391`). Honest omit. No ghost duplicate. No blank twin.
- Offered twins remint on the next `renderJobs` sync (`healOfferedMiningTwins` **2334–2393**; `renderJobs` calls `syncMiningJobs` **5220**). The player who opens Digit 2 sees the healed board. No extra toast. No pause write. No scanner-as-feedback.
- Typical live table is two hardness-1 keys (`MINING_ORE_KEYS` **250–253**; `ORE_TYPES` hardness ≤ 1: `rawOre`, `livingRock`). Book pay stays `need * price * HAUL_MARGIN` (`2302–2304`, `FERRY_UNITS` **4**, `HAUL_MARGIN` **1.4**). Raw ore book **784** UU vs living rock book **3360** UU before faction mult. Same dock multiplier keeps those numbers distinct. Title **and** pay differ.
- Unique four stay on the board while offered or accepted (`boardJobs` **3753–3758**). Unique `DONE` is hide-without-splice (**3760–3764**). Digit n still accepts `boardJobs[n - 1]` (**6316–6318**). List is not compacted to “fix” 8 and 9.
- Job cards share one chrome (`screens.css` **230–266**). Pay uses `var(--rw-good)` for **all** rewards (**250–254**), not per-ore hue. `ORE_TYPES.sparkColor` is not a card tint.
- `reducedMotion`: no new animation. HUD-01 hub: no job pip (no hub-pip writes in this pass).
- Fail-closed paint: unknown commodity maps to `'ore'` without throw (`miningOreName` **2425–2427**; pay **5329–5337**). New mint skips missing `COMMODITIES[key]` (`2312`).

### Focus check (must hold)

| Focus | Live after PR1 | Result |
|---|---|---|
| Identical mining rows after mint | Sibling commodity excluded at origin among offered **or** accepted. Offered twins reminted (prefer slot 1). | **Pass.** Distinct ore name, or omit. |
| Honest omit of slot 1 | Fill is `while (count < 2)` then `break` on `null` (`2385–2391`). Cap 2 is max, not a forced fill. | **Pass.** Legal shorter board. |
| `textContent` not `innerHTML` | `h()` **4544–4549**; titles **5300–5301**. No HTML ore interpolation. | **Pass.** |
| Digit 2 stays Jobs | `DOCK_KEY_SERVICES[1]` + Digit 2 (**189**, **6120–6124**, **6255–6262**) | **Pass.** |
| Digit 0 / 8 / 9 | Shipyard / Launch / Standing (**189**, **6120–6124**, **6257–6258**) | **Pass.** Not stolen. |
| No color-only identity | Shared `.job-card` chrome. Distinct **title + pay text**. | **Pass.** |
| No scanner-as-feedback / hub pip | Mint helpers only. No HUD pip. No scanner filter. | **Pass.** |
| Unique four still visible | `boardJobs` keeps offered/accepted unique four | **Pass.** |
| Keyboard accept | Digit n → `boardJobs[...][n-1]` (**6316–6318**). Named `Accept (n)` button (**5428–5429**, `btn` **4551–4555**). | **Pass.** |

### Accessibility / theming / states

| Check | Result |
|---|---|
| Contrast / tokens | No new color. Reuse `.job-card` / `.job-title` / `.job-detail` / `.job-reward` / `.screen-btn`. Identity is ore **name** + pay **number**, not hue. Contrast theme already lifts `.job-detail` (`screens.css` **595–597**). |
| Keyboard | Digit 2 opens Jobs. Digit n accepts the painted index. `Accept (n)` is a named `button`. No new control. |
| Focus | Live `.screen-btn:focus-visible` (`screens.css` **89–100**). No new overlay. |
| Empty | Omit slot 1 = shorter `boardJobs` list. No “slot 1 missing” chrome. Unique four and other families still paint. |
| Error | Unknown commodity → `'ore'` on paint, no throw. Missing key at mint → omit. |
| Disabled | No new disabled mining control. Accepted cards drop Accept and show `ACCEPTED — deliver ${need} ${oreName} here (have ${have})` (`5450–5457`). Ore name stays in that line. |
| Loading | No mining JSON spinner. Dedup at mint/sync, not a per-frame HUD alloc. |
| Hub | 80 px stays empty of job pips. |
| Responsive | No new overlay. Station panel scroller unchanged (`render` **6097–6107**). |
| Reduced motion | No new `@keyframes`. Color is not the only cue. |
| Screen reader / names | Title, detail, pay, and accepted state all include the ore name. Digit index is in the title string. Identity is not in a CSS class only. Hit target for Accept is the existing `.screen-btn`. |

### Findings

#### 🔴 Blocker

None. After mint, offered mining rows are not indistinguishable. Digit map is not stolen. Ore names are not `innerHTML`.

#### 🟠 Major

None.

#### 🟡 Minor: omitted second card shortens Digit indices

**Location:** `src/systems/station.js:2385–2391` (`syncMiningJobs` omit); `5316–5318` Digit n → `boardJobs[n - 1]`; `5300` title index
**Issue:** If hardness-1 keys later drop to one (or both live keys are already taken), the player sees one mining row, not two. Later cards on the same board shift Digit numbers. That is honest omit, not a ghost twin.
**Fix:** Keep omit. Do not force a twin. Do not add “slot 1 missing” chrome. Do not compact unique four to fill the hole.
**Status:** accepted (contract §0.12 / §0.1)

#### 🟡 Minor: accepted same-commodity pair can still paint two equal titles

**Location:** `src/systems/station.js:2346–2352` (`healOfferedMiningTwins` skip when both `accepted`); paint `5236–5241`, `5328–5337`
**Issue:** Pre-PR1 saves (or hostile arrays) can keep two accepted `rawOre` cards. Those two rows still read `Mine Raw ore` with matching need/pay. Merge law leaves accepted cards. New offered twins do not mint this way.
**Fix:** Frozen. Do not rewrite accepted contracts for chrome. Document only.
**Status:** accepted (contract; not “after mint”)

#### 💡 Suggestion: playtest still of two distinct mining rows

**Location:** Digit 2 Jobs at a live dock (typical Freehold table `Raw ore` + `Living rock`)
**Issue:** This pass did not capture stills. Typical live table is two named ores with two pay numbers. Owner playtest confirms the player can tell the rows apart without color.
**Fix:** Owner playtest. Optional stills. Not required to land PR1 chrome (paint channel unchanged).
**Status:** accepted

### Honor (this pass)

| Rule | Result |
|---|---|
| Distinct title + pay text (not color-only) | **Pass.** `Mine Raw ore` vs `Mine Living rock`; pay follows commodity. |
| `innerHTML` forbidden | **Pass.** `h()` `textContent` only. |
| Digit 2 stays Jobs | **Pass.** |
| No new Digit | **Pass.** |
| Digit 0 / 8 / 9 stay | **Pass.** |
| No hub pip | **Pass.** |
| Omit if ore table too small | **Pass.** Legal. |

### Worker self-audit

`out/w136/jobdedup/ui-audit.md` agrees: no Digit/layout/paint-channel change; uniqueness at mint; omit accepted. Independent cites match. Did not copy findings blindly.

### Method notes

- Read mining helpers: `pickMiningCommodityExcluding`, `syncMiningJobs`, `healOfferedMiningTwins`, `makeMiningJob`.
- Read `renderJobs` title/detail/reward/accept paint only.
- Did not edit `src/`. Did not start Vite or Chrome. Did not spawn children.
