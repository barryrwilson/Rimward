# UI Audit: HUD-02 PR1 target facing class tokens (Wave 116)

**Auditor:** `[designer]` (independent of `out/w116/hud02tgt/ui-audit.md`)  
**Scope:** Live HUD-02 PR1 target class hint on existing lock facing chrome. Player class CSS scoped to `.rw-combat-self`. Allowlisted `data-class-key` on `.rw-combat-target` only.  
**Review file:** `out/w116/designer/hud02tgt-ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Hud02RemainingTargetSilhouettesDesign.md`; merge law `out/w115/hud02tgt/shared-contract.md` (wins on conflict). Worker self-audit `out/w116/hud02tgt/ui-audit.md` read, not copied, not overwritten. Live cites: `src/systems/hud.js` (`lockClassToken`, `applyTgtClassKeyAttr`, tgt rail writer), `src/ui/hud.css` (player `.rw-combat-self`; target `.rw-combat-target[data-class-key]`). No Playwright. No Vite. No Chrome. Static CSS/DOM-writer review. [NO BROWSER COVERAGE].  
**Date:** 2026-08-24  
**Product source:** review only (no `src/` / `scripts/` / wishlist / `PROGRESS.md` / sibling nav05/ctl01 edits)

Merge law: `out/w115/hud02tgt/shared-contract.md` wins if the design doc forks. This is shipped PR1 chrome, not a named-only leftover.

### Verdict

**CLEAN**

No open Blocker. No open Major. Target class is a 22×10 facing hint on the lock row. Player class no longer restyles `tgtFacing`. Lock class never writes `#hud`.

**Counts:** 🔴 Blocker **0**. 🟠 Major **0**. 🟡 Minor **2** (accepted freeze / residual). 💡 Suggestion **2**.

---

## UI Audit: HUD-02 target facing class tokens

### Summary

PR1 lands the frozen leftover: allowlisted visible lock class on `.rw-combat-target`, player tokens narrowed to `.rw-combat-self`, WAVE113/114 metrics cited under target selectors. Empty 80 px hub, RANGE, FORE/AFT words, Digit 0, and player `hudFamily` stay. Fail-closed omit keeps generic family facing on the target row. Static review finds no unusable or inaccessible defect.

---

### Honor / Blocker gate

Flag **Blocker** if PR1 puts class chrome on `.rw-reticle`, grows the sil box, puts lock class on `#hud`, leaks player tokens onto `tgtFacing`, `innerHTML`s a glyph, unmasks Q-ship class, or steals Digit 0/8/9. None of those landed.

| Honor | Contract / design | Live | Result |
|---|---|---|---|
| HUD-01 empty 80 px hub | §0.2 | `.rw-reticle` 80×80 (`hud.css` 184–193). Build: pupil + 3 cilia + RANGE only (`hud.js` 747–750). Clamp still `cx - 44` (`hud.js` 1251). | **Pass.** No class pip. |
| 22×10 sil | §0.14 | `.rw-facing-sil` width/height 22×10, `flex: 0 0 22px` (`hud.css` 239–244). Family rules restate 22×10 (`1262–1265`, `1607–1610`). No class rule retunes sil size. | **Pass.** |
| Digit 0 shipyard | §0.3 | HUD writers do not bind a Digit. Probe still greps `DOCK_KEY_SERVICES` + `if (d === 0)`. | **Pass** (this write-set). |
| Player family | §0.8 / Wave 62 | `hudFamily` from player hullKind (`hud.js` 81–89). `#hud.dataset.family` only (`1121`, `1771`). Target CSS gated on player `#hud[data-family]`. | **Pass.** |
| Q-ship cover class | §0.12 | `lockClassToken` uses `coverClass ?? 'freighter'` while `qship === true && revealed !== true` (`hud.js` 118–129). Mk II pierce writes **name** only (`2092–2099`). | **Pass.** |
| Fail-closed omit | §0.12 / §2 | Unknown / proto / non-string / no state → `''` then `delete rail.dataset.classKey` (`131–136`). Hide omits immediately (`1280–1286`). | **Pass.** |
| No `innerHTML` | §0.4 | No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`. Facing via `el()` + `textContent`. CSS authored, not concatenated from keys. | **Pass.** |
| No lock class on `#hud` | §0.11–0.13 | Root writer is still `classKeyToken` / `applyClassKeyAttr` (player) (`101–115`, `1122`, `1781`). Rail writer is `applyTgtClassKeyAttr(tgtRail, …)` (`131–136`, `1286–1289`, `1782`). | **Pass.** |
| Player tokens must not leak onto `tgtFacing` | §0.13 / PR1 | Every player class rule includes `.rw-combat-self`. Target rules are `.rw-combat-target[data-class-key]`. Generic `#hud[data-family] .rw-facing-*` is **family** chrome, not class. | **Pass.** |
| `reducedMotion` | §0.15 | `#hud *` kills animation (`hud.css` 1185–1188). No new facing `@keyframes`. Class sil is static clip / plate. | **Pass.** |

If a later edit drops `.rw-combat-self` from player selectors, writes `applyClassKeyAttr(root, last, lockClassToken(…))`, or parents a class label into `.rw-reticle`, that **violates this freeze**.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Accessibility — contrast | **Pass.** Class restyle is geometry (plate box / clip-path), not a new hue. FORE/AFT still uses fill vs hollow **plus the word** (`hud.js` 374–400; `hud.css` 231–317). Colorblind already restyles `.rw-facing-end` (`310–317`). Palette comment still pairs color with text/shape (`hud.css` 4). | — |
| Accessibility — focus / keyboard | **Pass (n/a).** Facing is not a control. `#hud` stays `pointer-events: none` except live toggles (`hud.css` 6–7). KeyT / KeyV / KeyK / KeyX untouched. | contract §0.3 |
| Accessibility — names | **Pass by freeze.** Class is a glance glyph, not a name on the hub. Rail name is still `textContent` (`hud.js` 2098). No unlabeled interactive. | §0.2 forbids class name on aim glass |
| Semantic markup | **Pass.** Target rail remains `section.rw-combat-target` (`hud.js` 894). Sil is `div` + `span`s (`375–379`). No extra hub child. | — |
| Theming | **Pass.** Mech plates inherit live cyan rgba. Bio clips keep `var(--vein)` color-mix from generic bio facing (`1612–1630`). No new hardcoded class palette. Contrast body already restyles combat rails (`1178–1181`). | — |
| Responsive / overflow | **Pass.** Sil box frozen. Mech `body.left + body.width ≤ 21` (budget 22). Bio bodies reach 22, not past. `RAIL_GAP` still 78 (`hud.js` 138). AGEZ hair uses existing rail measure. | §0.14 |
| States — empty / unknown | **Pass.** Omit attribute → generic family facing still paints (`#hud[data-family] .rw-facing-*`). Light has **no** `data-class-key="light"` CSS. | `hud.css` 1262–1280, 1607–1630; contract §0.1 light |
| States — hide / error | **Pass.** Non-ship / destroyed hides rail and deletes the attribute immediately (`hud.js` 1274–1286). Never throw. `#hud` missing still disables HUD (`739–742`). | §2 |
| States — hover / focus | **n/a.** Not interactive. | — |
| Visual hierarchy | **Pass.** Same glance set: name, FORE/AFT, SCREEN/SHELL/ENGINE/hull/SPD/DIST/CLOS. Class is accent **inside** the sil. Hub RANGE unchanged (`hud.css` 207–220). | §0.16 |
| Duel parity | **Pass.** No extra instrument. No sil grow toward 78 px gap. | §0.16 |
| Family language | **Pass (freeze).** Bio player locking a plated hull still sees WAVE113 clips on the target row. Family is player, class is inside family. | contract §0.1 / §2 |
| Alloc | **Pass.** No new nodes. Write-on-change `last.tgtClassKey`. No per-frame clip-path string from the key. 5 Hz while shown (`hud.js` 1755–1782). | §0.11 |
| Persist | **Pass.** DOM attribute only. Session `rw-hud-family` still mech\|bio (`hud.js` 92–97). | §0.6 |

---

### 22×10 cite (player vs target; must match)

Target declaration blocks copy live player metrics. Probe equality is the cite, not new art.

| Family / key | Self body (live player) | Target body | Box |
|---|---|---|---|
| mech heavy | left 5 / top 1 / 16×8 (`hud.css` 1287–1292) | 1339–1344 | 21×9 |
| mech ace | left 4 / top 3 / 14×4 (`1298–1303`) | 1350–1355 | 18×7 |
| mech cutter | left 4 / top 2 / 17×6 (`1309–1314`) | 1361–1366 | 21×8 |
| mech frigate | left 3 / top 3 / 18×4 (`1320–1325`) | 1372–1377 | 21×7 |
| mech freighter | left 3 / top 1 / 18×8 (`1331–1336`) | 1383–1388 | 21×9 |
| bio heavy | left 6 / top 0 / 16×10 + ellipse nose (`1643–1657`) | 1724–1738 | 22×10 |
| bio ace | left 6 / top 2 / 13×6 (`1659–1673`) | 1740–1754 | 19×8 |
| bio cutter | left 5 / top 1 / 17×9 (`1675–1689`) | 1756–1770 | 22×10 |
| bio frigate | left 4 / top 2 / 18×6 (`1691–1705`) | 1772–1786 | 22×8 |
| bio freighter | left 5 / top 0 / 17×10 (`1707–1721`) | 1788–1802 | 22×10 |
| light (both) | **no class rule** | **no class rule** | generic family plate / clip |

Mech generic plate (no class, or light): body left 5 / top 2 / 16×6 (`1274–1280`). Unique vs authored class tuples.

---

### What's done well

- Two writers, two nodes: player `applyClassKeyAttr` on `#hud` (`hud.js` 110–115); lock `applyTgtClassKeyAttr` on `.rw-combat-target` (`131–136`). That split is the leak close.
- `classKeyToken` still reads `ctx.player.classKey` only (`101–108`). `lockClassToken` is a different helper with `hasOwn` `SHIP_CLASSES` (`125–126`). Proto `__proto__` / `constructor` omit.
- Hide path deletes the attribute **before** the 5 Hz text pass (`1277–1286`). Show path writes the allowlisted key immediately so the first paint is not a player-class lie.
- Unrevealed Q-ship glyph follows cover class; revealed uses record/state class. Mk II scanner pierce unmasks **name** (`2092–2099`) and does **not** feed `lockClassToken`.
- Light keeps generic family facing on purpose. Missing CSS for a live key cannot throw; the generic family rule still paints.
- FORE/AFT words remain beside the sil (`hud.js` 380–382). Color is not the only facing cue. Class cue is shape, not a second color code.
- Hub children stay pupil / cilia / RANGE. No class word on RANGE (`hud.js` 750; `hud.css` 207–220).
- `reducedMotion` already kills HUD motion; class sil adds none. Existing flash kill on FORE/AFT stays (`hud.css` 305–308).
- Earth-photocopy risk is low: plates are rectangles; bio clips are ellipses / polygons, not shark/squid toys.
- Worker self-audit correctly treated bio-on-plated as contract freeze, not a defect to “fix” with lock-family `data-family`.

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Bio player locking a plated hull still sees bio clips

**Location:** `src/ui/hud.css:1723–1802`; `src/systems/hud.js:81–89`; contract §0.1 / §2  
**Issue:** Class sits inside **player** `#hud[data-family]`. A living hull locking a plated ace paints WAVE113 clips on the target row, not WAVE114 plates. The lock’s 3D mesh can be plated while the 22 px hint speaks bio.  
**Fix:** Do not invent lock-family `data-family` on the rail (forbidden). Keep player family chrome. Optional PR2 stills teach the pairing.  
**Status:** accepted freeze. Not a PR1 defect.

#### 🟡 Minor: Target CSS duplicates player metric blocks

**Location:** `src/ui/hud.css:1286–1388` (mech), `1642–1802` (bio)  
**Issue:** Plate tuples and clip-paths are copied under `.rw-combat-target`. Drift risk if a later wave retunes only one side.  
**Fix:** Keep the cite (contract §0.21 forbids new art). If PR2/PR3 retunes px, edit **both** self and target blocks to the same numbers. Do not introduce a preprocessor in this leftover.  
**Status:** accepted cite pattern. Not a visual defect today (blocks match).

#### 💡 Suggestion: Lock-vs-player mismatch stills (optional PR2)

**Location:** design serial §3 PR2; `out/w116/hud02tgt/ui-audit.md` suggestion  
**Issue:** This auditor did not run Vite or capture 1600×900 stills. Boot pin exercises dataset mismatch; it does not prove 22 px shapes read at a glance next to FORE/AFT.  
**Fix:** After playtest, stills: player light / lock heavy; player heavy / lock ace; unrevealed Q-ship cover vs revealed cutter; omit unknown. Skip if owners already read in-box.  
**Status:** optional. Contract names PR2 skippable.

#### 💡 Suggestion: Lock switch while the rail stays shown is 5 Hz

**Location:** `src/systems/hud.js:1277–1290` vs `1755–1782`  
**Issue:** New lock or hide/show writes immediately. Same-rail lock swap waits for the text interval (same cadence as name / DIST). Up to one text tick of stale class on a still-visible row.  
**Fix:** None required. Matches contract §0.11 write-on-change at 5 Hz while shown. Do not add a per-frame dataset write.  
**Status:** residual, documented.

---

### Passed Checks

- [x] No class pip on `.rw-reticle`
- [x] No new DOM on `.rw-reticle`
- [x] Hub 80×80 unchanged
- [x] Sil 22×10 / `flex: 0 0 22px` unchanged
- [x] FORE/AFT words stay
- [x] RANGE stays TGT-01
- [x] Player tokens scoped to `.rw-combat-self`
- [x] Target tokens scoped to `.rw-combat-target[data-class-key]`
- [x] Lock class not written on `#hud`
- [x] One root class writer (`applyClassKeyAttr`)
- [x] Q-ship cover class; Mk II does not unmask glyph
- [x] Fail-closed omit; generic family facing remains
- [x] Light keeps generic
- [x] No `innerHTML`
- [x] No new persist key / session class picker
- [x] No new facing keyframes
- [x] `hudFamily` still player-only
- [x] Digit 0 not stolen by this write-set
- [x] Worker self-audit not overwritten

---

### Worker self-audit delta

`out/w116/hud02tgt/ui-audit.md` is thin but correct: no Blocker/Major; bio-on-plated freeze; PR2 stills later. This file adds honor-gate evidence, 22×10 cite table, Q-ship/Mk II split, hide-immediate vs 5 Hz, and leak-close selectors. It does not reopen those as product bugs.
