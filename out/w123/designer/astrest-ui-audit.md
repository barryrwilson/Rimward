# UI Audit: remaining AST leftover after AST-01/02 (Wave 123 CONSUME)

**Auditor:** `[designer]` (independent of `out/w123/astrest/ui-audit.md`)
**Scope:** Wave 123 leftover census. Markdown only. Worker did **not** change live UI. Freeze leftover **CONSUME**: remaining AST after named AST-01/02 + Wave 70/71 MATCH is **gone**. Specified later UI: **none**. Named serial: **none**. Name: **no remaining AST leftover.** This leftover adds **no** chrome.
**Review file:** `out/w123/designer/astrest-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Ast03RemainingAstDesign.md`, inventory `out/w123/astrest/current-ast-remaining-inventory.md`, merge law `out/w123/astrest/shared-contract.md`, worker self-audit `out/w123/astrest/ui-audit.md` (read, not copied). Live group-3 cue / MATCH lamp cites only: `src/systems/hud.js`, `src/ui/hud.css`, `src/game/jump.js`, `src/systems/station.js`, `src/systems/ship.js`. Did **not** steal `out/w123/phyrest/**` or `out/w123/fxrest/**`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w123/astrest/shared-contract.md` wins if the brief forks. This wave does not ship asteroid chrome. Findings bind **later workers**: do not invent a hub PPI, a chart/scanner rock mark, a new Digit, MATCH lamp copy, or a leftover AST serial while live cue + lamp already paint the jobs.

## UI Audit: remaining AST player-facing find-aid (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**. Specified later UI is the **existing** group-3 `Mine · belt Nu` prompt plus the Wave 71 MATCH lamp. CONSUME does **not** invent HUD chrome. Freeze does **not** steal HUD-01 hub, Digit 0/8/9, or chart/scanner rock marks. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; owner omit / live lamp, not leftover holes), 2 suggestions. CONSUME freeze holds.

### What's done well

- Find-aid reuses the one context prompt slot. Group 3 without a rock lock paints `Mine · belt ` + finite `Nu` (`hud.js` **2200–2206**). Dock / Jump / Hail / Target still win (`hud.js` **2166–2199**). A rock lock skips the belt cue (`!isRockTarget`).
- Prompt writes real `textContent` on `promptKey` / `promptVerb` (`hud.js` **872–874**, **2226–2227**). `el()` also uses `textContent` (`hud.js` **283–288**). `innerHTML` in `hud.js` / `asteroids.js`: **none**.
- Arrival find-aid is a spare `commLine` (`jump.js` **48–58**, **177–178**), same HUD print path as other Echo lines. Copy is English + a finite integer `u`, not a chart mark.
- MATCH lamp is a real `<span class="rw-match-lamp">` with the word MATCH (`hud.js` **356**). Hidden via `is-hidden` (`hud.css` **222–229**). Lights for ship **or** rock lock (`hud.js` **1896**: `flags.matchSpeed && (shipTgt || isRockLock)`). Color is paired with the word (`--cyan`).
- Rock lock detect in HUD matches ship: list membership + `lockKind === 'rock'` (`hud.js` **438–444**; `ship.js` **692–696**). Rest-frame hold is live (`ship.js` **851–897**). This leftover cites MATCH; it does not rewrite it.
- Empty 80 px hub stays empty (`.rw-reticle` `hud.css` **184–193**). Aim-glass gauges stay off. No rock PPI. RANGE remains existing TGT chrome, not AST leftover.
- Digit 0 stays shipyard (`station.js` **188**, **6171–6173**). Digit 8/9 stay launch / epics (`DOCK_KEY_SERVICES` index 7 / 8; handler `station.js` **6175–6176**). AST is not a Digit. Group 3 uses prompt key `3`, not Digit 0/8/9.
- Contract §0.2 / §0.3 / §0.11 and brief §7 agree: later UI = **none**. Worker self-audit agrees independently.

### CONSUME steal check (Blocker if this leftover scheduled these)

| Forbidden later work | Brief / freeze | Live honor | Result |
|---|---|---|---|
| HUD-01 hub child / rock pip | Brief Honor + Goals 6; contract §0.2; brief §7 | `.rw-reticle` 80×80 (`hud.css` **184–193**). Cue is `.rw-prompt` bottom-center (`hud.css` **742–754**). Lamp is on SPD (`hud.js` **349–356**) | **Pass.** Not scheduled. |
| Hub PPI / radar pip | Contract §0.2; inventory §9; serial **none** | No AST PPI class. Contacts arc is TGT sibling, not this leftover | **Pass.** |
| Digit 0/8/9 theft / new AST Digit | Contract §0.3; brief Digit freeze | Digit 0 → shipyard; 8 → launch; 9 → epics (`station.js` **188**, **6171–6176**) | **Pass.** |
| Chart / scanner / landmark rock marks as leftover | Contract §0.11; AstOrbitsDesign §7; inventory §5 / §9 | Find-aid is `commLine` + group-3 prompt. Charted landmarks stay Wave 15 mystery, not belt rocks | **Pass.** Owner omit, not a hole. |
| Second MATCH lamp / rock-specific legend | Contract §0.12; Wave 71 cite | One `.rw-match-lamp` (`hud.js` **356**, **1896**) | **Pass.** |
| Aim-glass gauge / kit mutate | Contract §0.2 / §0.5 | Not proposed | **Pass.** |
| `innerHTML` belt / MATCH copy | Contract §0.4 | `textContent` / `el()` | **Pass.** |
| New persist key / pose persist | Contract §0.6 | Session cue/lamp only | **Pass.** |
| MATCH rewrite | Contract §0.12 | Cite `ship.js` **851–897** | **Pass.** |
| PHY / FX leftover steal | Contract §0.13 | This pack did not write sibling dirs | **Pass.** |
| Pause sim for AST | Contract §0.16 | Never | **Pass.** |

If a later worker adds a hub PPI, an AST Digit, chart/scanner rock marks as this leftover, or a second MATCH lamp while these surfaces exist, that **violates this freeze** and is a Blocker then. This pack does **not** schedule that work. Serial plan: **PR1 remaining AST does not exist** (`docs/Ast03RemainingAstDesign.md` **199–202**; contract §3).

### Does CONSUME invent HUD chrome?

**No.** Brief §7: this wave no chrome; later UI none. Specified picture is live:

| Spec (later = none) | Live |
|---|---|
| Group-3 find-aid | `pKey = '3'`; `pVerb = 'Mine · belt ' + n + 'u'` when `weaponGroup === 3` and no rock lock (`hud.js` **2200–2206**) |
| Arrival | `Belt lies N u sun-relative, off the station.` `from: Echo` (`jump.js` **48–58**, **177–178**) |
| MATCH lamp | MATCH word; `is-hidden` until `flags.matchSpeed` and ship or rock lock (`hud.js` **356**, **1896**) |
| Hub | 80 px empty (`hud.css` **184–193**) |
| Digit | none for AST (`station.js` **188**, **6171–6176**) |

CONSUME adds **no** UI. Live cue and lamp already cover the specified later picture. Wishlist chart/scanner/landmark rock marks stay **owner omit**.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Group-3 `Mine · belt Nu` | Prompt slot; Dock/Jump/Hail/Target win | Wave 69 PR4 | **Must not** retune copy, move the rail, or add a second verb |
| Arrival `Belt lies` | Spare `commLine` | Wave 69 | **Must not** add a second arrival instrument |
| MATCH lamp | One MATCH word on SPD | Wave 71 | **Must not** add rock-specific lamp copy |
| Rock MATCH rest-frame | `_lockVel` + skip world damping | Wave 70 | **Must not** rewrite as leftover |
| Empty hub | 80 px | HUD-01 | **Must not** add a rock pip or PPI |
| Digit 0/8/9 | shipyard / launch / epics | Honor | **Must not** bind AST |
| Chart/scanner rock marks | Absent | Owner omit | **Must not** reopen HUD-02 as leftover |
| Prompt `textContent` | `hud.js` **2226–2227** | XSS freeze | **Must not** `innerHTML` belt names |

### Accessibility / theming / states (live HUD, static)

| Check | Result |
|---|---|
| Contrast / tokens | MATCH lamp uses `var(--cyan)` (`hud.css` **222–227**). Prompt key uses `--void` on `--cyan`; verb uses `--cyan` (`hud.css` **756–772**). Contrast restyle already includes `.rw-prompt` (`hud.css` **1170**). No new leftover color. |
| Keyboard | Cue is output, not a control. Group 3 is existing weapon cycle. KeyX MATCH is Wave 70. Digit 0/8/9 stay dock. |
| Names | Visible English: `Mine · belt Nu`, MATCH word, `Belt lies …`. Color is not the only cue. |
| Focus | Prompt and lamp are not focus targets. Correct. |
| Semantic HTML | Prompt is a `div` with two `span`s (`hud.js` **872–874**). Lamp is a `span` with the word MATCH. No leftover `role` invention. |
| Empty | Prompt `is-hidden` when no verb (`hud.js` **2228–2231**). Lamp `is-hidden` when MATCH off (`hud.js` **369**; `hud.css` **229**). |
| Error | Fail-closed: `beltMineDist` returns finite `0` (`hud.js` **527**). NaN rock pose skips MATCH (`ship.js` **732–736**). Cue still paints a number. |
| Disabled | N/A (output). |
| Loading | No spinner. Do not add one. |
| Hover | Not required. |
| Reduced motion | Existing HUD kill is sibling. Orbit phase still runs (`asteroids.js` **2010–2027** vs tumble skip **2048**). Do not freeze the belt as leftover. |
| Responsive | Prompt is bottom-center, off the 80 px hub (`hud.css` **742–747**). Lamp sits in the SPD value row. |
| Hub | 80 px stays empty of AST leftover chrome. |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Group-3 cue is prompt-slot only; no scanner/chart rock mark

**Location:** `src/systems/hud.js:2200-2206` vs wishlist AST-02 “chart, scanner, landmarks”

**Issue:** Keyboard/glance find-aid is the prompt + arrival line. There is no chart icon for the belt.

**Why it is not leftover:** AstOrbitsDesign §7 already chose commLine + group-3. Contract §0.11 forbids HUD-02 chart marks, mystery landmarks, and scanner-arc rocks as leftover. Treating omit as a hole would invent chrome.

**Fix:** Do not invent leftover chrome. CONSUME stands.

**Status:** accepted — owner omit, not a missing AST-01/02 hole.

#### 🟡 Minor: MATCH lamp has no extra rock-specific copy

**Location:** `src/systems/hud.js:356`, `1896`

**Issue:** Rock MATCH and ship MATCH share the same MATCH word. A new player might not know the hold is rock-relative.

**Why it is not leftover:** Wave 71 named one lamp, not a second legend. Contract §0.12: cite, do not rewrite MATCH. A second glance string would be new chrome.

**Fix:** Do not invent leftover lamp copy. Live lamp meets Wave 71.

**Status:** accepted — CONSUME stands.

#### 💡 Suggestion: Digit 8/9 honor cite is the generic Digit handler

**Location:** inventory `out/w123/astrest/current-ast-remaining-inventory.md` §8 (`station.js` **6175–6176**); live `station.js` **188**, **6169–6176**

**Issue:** Digit 0 is explicit (`d === 0` → last service = shipyard). Digit 8/9 are `i = d - 1` into `DOCK_KEY_SERVICES` (`launch` / `epics`). Brief table compresses 8/9 onto **6171–6173**.

**Fix:** Do not treat cite shorthand as Digit theft. Honor still holds. Do not bind AST.

**Status:** documentation nit — not leftover chrome.

#### 💡 Suggestion: Reduced-motion still orbits the belt

**Location:** `src/systems/asteroids.js:2010-2048`

**Issue:** `reducedMotion` skips tumble, not closed-form phase. A frozen belt would be a clump again.

**Fix:** Do not freeze orbit as leftover. HUD cue still updates distance. Cite only.

**Status:** accepted — out of scope for this leftover.

### Census cite check (code wins)

| Claim | Live | Notes |
|---|---|---|
| Group-3 `Mine · belt Nu` | `hud.js` **2200–2206** | Match. Copy is `'Mine · belt ' + n + 'u'`. |
| Prompt `textContent` | `hud.js` **2226–2227** | Match |
| `beltMineDist` | `hud.js` **487–527** | Match. Work-sector first, then any `ore>0`, else `field.center`. |
| `isRockLock` | `hud.js` **438–444** | Match |
| MATCH lamp node | `hud.js` **356** | Match. `el('span', 'rw-match-lamp is-hidden', value, 'MATCH')` |
| `matchOn` ship or rock | `hud.js` **1896** | Match |
| MATCH CSS | `hud.css` **222–229** | Match |
| Empty hub 80 px | `hud.css` **184–193** | Match |
| Arrival line | `jump.js` **48–58**, **177–178** | Match |
| Digit 0 shipyard | `station.js` **188**, **6171–6173** | Match |
| Digit 8/9 launch/epics | `station.js` **188**, **6175–6176** | Index 7/8 via `d - 1`. Honor holds. |
| Rock MATCH rest-frame | `ship.js` **851–897** | Match |
| `innerHTML` hud/asteroids | none | Match |

None of the cites reopen leftover. Inventory line numbers hold on this census date.

### Visual hierarchy

Hub empty → SPD MATCH word → one bottom-center prompt (`Mine · belt`) → arrival `commLine` on the existing toast path. CONSUME keeps that split. A hub PPI, chart rock mark, or AST Digit would flatten hierarchy onto HUD-01 / dock keys.

### Worker self-audit

`out/w123/astrest/ui-audit.md` is accurate on CONSUME, later UI = live cue / lamp, Digit/hub not stolen, and “do not add chart/scanner rock marks.” Independent live read agrees. Do not copy that file as the designer record; this file is the parent `[designer]` pass.

### Verdict close

**CONSUME freeze is the UI-correct outcome.** Remaining AST leftover is gone. Live group-3 cue and MATCH lamp already paint find-aid and rock hold. Do not add HUD chrome, a hub PPI, Digit 0/8/9 theft, or chart/scanner rock marks as this leftover.
