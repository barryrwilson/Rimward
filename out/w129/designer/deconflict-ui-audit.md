## UI Audit: HUD-07 PR1 deconflict + quieter cruise (`hud.js` yield + `hud.css` cruise)

**Persona:** designer (parent pass). Review only. Did not edit `src/systems/hud.js` or `src/ui/hud.css`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Merge law: `out/w128/deconflict/shared-contract.md` wins over `docs/Hud07DeconflictionDesign.md`. Worker self-audit `out/w129/deconflict/ui-audit.md` checked, not rubber-stamped. Worker Blocker/Major call is correct.
**Scope:** Wave 129 HUD-07 PR1 yield/cruise in `src/systems/hud.js` and `src/ui/hud.css` only. Honor HUD-01 empty 80 px hub; HOME inset 108; TGT/NAV-02 inset 84; Hail02 toasts untouched; `.rw-galaxy-*` untouched; color is not the only cue; `reducedMotion` no new pulse; hide-not-delete; no third `aria-live`.
**Not in scope:** Product source fixes, Hail02 copy, NAV-09 chart chrome, `galaxychart.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`.
**Coverage:** Code review of shipped PR1. `[NO BROWSER COVERAGE]`. No stills under `out/w129/deconflict/` besides markdown. Graph resolve: `r-mt9ozjt1-67e283c9` `proceed_unmodeled`.
**Verdict:** **CLEAN** — no 🔴 Blocker, no 🟠 Major

### Summary

PR1 yields duplicate lock **name**, RANGE **word**, LEAD **word**, and overlapping chart/home **labels**. Nodes stay in the tree (`rw-yield` → `display: none`). Cruise quiets RANGE/LEAD words via `#hud:not(.in-combat)` without a second hide of HOME / GATE / dock J / POS. The 80 px hub gains no child. HOME chevron stays 108. TGT/NAV-02 stay 84. Hail02 toast functions and `.rw-galaxy-*` stay out of the yield block. No new pulse. No fifth `aria-live`.

### What's done well

- Hide-not-delete: `applyYield` / `applyChartYield` toggle `rw-yield` only (`hud.js` **1371–1383**). Chart slots, home pip, lead, rails, and toasts are never `remove()`d. CSS keeps the node: `#hud .rw-yield { display: none; }` (`hud.css` **690–691**).
- Duplicate name: bracket `.rw-target-name` yields when a live ship lock shows the combat rail (`hud.js` **2081**, **1521–1524**). Corners stay (`.rw-target-box` 60 px, `hud.css` **404–409**). Rail name is `textContent` + `stripHudText` (`hud.js` **2502–2506**).
- RANGE **word** yields when rail DIST or bracket meta is up, or when the word box hits hub / bracket / lead path (`hud.js` **2083–2086**). `.in-range` still paints the hub ring (`hud.js` **1667–1670**; `hud.css` **195–205**). `#hud .rw-yield` beats `.rw-reticle.in-range .rw-reticle-range { display: block }` (ID + class vs three classes), so the Wave 128 RANGE specificity hole is closed.
- LEAD **word** yields in cruise always, and in combat on hub/bracket/path hit (`hud.js` **2088–2094**). `.rw-lead-ring` + cross stay (`hud.css` **533–562**; ring created `hud.js` **972–973**).
- Chart / HOME labels yield on collision; diamond / square pip stay (`hud.js` **2096–2116**; glyphs `hud.css` **611–618**, **651–657**). POS HOME still writes name · dist (`hud.js` **2340–2351**). Pip hide-on-station-lock stays (`hud.js` **2003–2004**).
- Cruise CSS names only RANGE/LEAD words (`hud.css` **693–697**). It does not restyle `.rw-home-mark`, `.rw-nav-gate-cue`, `.rw-prompt`, or `.rw-pos`. Existing combat dim numbers stay: `.rw-fade` 0.14 (`hud.css` **89**), chartmark 0.14 (**632**), home-mark 0.14 (**688**), aux 0.38 (**1008**).
- Fail-closed: yield sits in `try/catch`; skip never throws (`hud.js` **2065–2120**). Scratch AABBs live at init (`hud.js` **1113–1115**). `hitsSightProtect` reuses AGEZ `segmentHitsBox` (`hud.js` **201–209**, **224–231**).
- Color is not the only cue: dashed vs solid ring; lead ring+cross; chart diamond vs home square vs TGT triangle; POS HOME text when the pip label hides (`hud.js` **48–49**; `hud.css` **1–4**).
- `reducedMotion`: global kill already on `#hud *` (`hud.css` **1263–1267**). PR1 adds no `@keyframes` and no new transition. Yield is display/class only.
- Hail02 kept: `hailMissToast` / `hailMissKeyName` / `'hailMiss'` (`hud.js` **765**, **771–783**). Linger 8 s, five slots (`hud.js` **68–70**). Toast CSS seat unchanged (`hud.css` **699–711**).
- `.rw-galaxy-*` block still starts at the overlay comment (`hud.css` **1968–1976**). HUD-07 rules sit above toasts, not in the galaxy sheet.

### Honor checklist

| Check | Result | Cite |
|---|---|---|
| HUD-01 empty 80 px hub; no deconflict widget | Pass | `.rw-reticle` 80×80 (`hud.css` **184–193**). Children: pupil, 3 cilia, RANGE word (`hud.js` **936–939**). Clamp `cx - 44` (`hud.js` **1496–1498**). Hub AABB 40 px (`hud.js` **2070**). No `rw-deconflict` node. |
| HOME chevron inset 108; pip not stolen | Pass | `HOME_EDGE_INSET = 108` (`hud.js` **75**, **2045–2046**). Yield is `.rw-home-pip-label` only (**2096–2103**). Glyph stays (**983**, `hud.css` **651–657**). |
| TGT / NAV-02 inset 84; arrow / cue not stolen | Pass | `EDGE_MARGIN = 84` (`hud.js` **74**, **1630–1631**, **1877–1878**, **1946–1947**). `.rw-edge-arrow` / `.rw-nav-gate-cue` are not yield targets (**974–980**). |
| Hail02 toasts untouched | Pass | `hailMissToast` **783–**; `TOAST_DEDUP_WINDOW = 8`; `TOAST_SLOTS = 5`. Yield CSS does not select `.rw-toast`. |
| `.rw-galaxy-*` untouched | Pass | Galaxy rules from `hud.css` **1968**. HUD-07 block is **690–697** only. |
| Color is not the only cue | Pass | Ring / DIST / lead cross / pip / POS HOME / diamond. Opacity 0.14 is a skip-path backup, not the only remaining fact. |
| `reducedMotion`: no new pulse | Pass | `hud.css` **1263–1267**. No HUD-07 `@keyframes`. |
| Hide-not-delete | Pass | Class toggle; `display: none` on the word/label; pool nodes stay. |
| No third (new) `aria-live` | Pass | Live count unchanged: toasts polite **1012**, banner polite **1025**, nav readout `off` **1177**, nav live polite **1181**. Yield does not announce. Treat honor as **no fifth** region. |
| Do not hide HOME / GATE / J / POS as cruise quiet | Pass | Cruise selectors are RANGE + LEAD only (`hud.css` **694–695**). POS panel **1194–1202**. GATE row **1192–1194**. Prompt **1037–1039**, `hud.css` **807–813**. |

### Keyboard / hit targets

No new control. KeyH/J/L/M/P stay. Yield nodes are already `pointer-events: none` under `#hud` except existing AP/AM / automine-rock / controls toggle (`hud.css` **6–7**). Automine rock is not a yield target (`hud.js` **954–970**). Tab order unchanged.

### Theming

Yield is a class, not a new hex. Cruise uses opacity, not a token swap. Contrast/colorblind overlays still wrap toast / prompt / banner / rails (`hud.css` **1245–1258**). No yield-only paint.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Chart / HOME label AABBs are estimates

**Location:** `src/systems/hud.js:2097–2115`
**Issue:** Home uses `56 * ts` × `16 * ts`. Chart uses `96 * ts` × `16 * ts`. Boxes are not `offsetWidth`. A long landmark string can still kiss the hub after the estimate is clear. A short string can yield a few pixels early. Glyphs still stay.
**Fix:** If playtest shows misses, cache `offsetWidth` on the existing 5 Hz label write. Do not add a hub widget. Do not `remove()` the slot.
**Status:** open. Worker code-review already named this. Not a hide-nav defect.

#### 🟡 Minor: Bracket info scrim can still sit on the shot path

**Location:** `src/ui/hud.css:439–450`; `src/systems/hud.js:950–953, 2081`
**Issue:** Duplicate-name yield hides `.rw-target-name`. Parent `.rw-target-info` still has a boxed scrim 36 px below the 60 px bracket, with meta/dist/band (and Automine when a rock). That plate can still cover the reticle→lead segment. Smallest additive accepts this.
**Fix:** Accept in PR1. If playtest still blocks the path, opacity-yield the scrim while meta stays, or shift info off the segment — not onto the hub.
**Status:** open. Freeze already logged this; PR1 did not reopen it as a steal.

#### 🟡 Minor: Cruise RANGE/LEAD opacity 0.14 is a skip-path backup

**Location:** `src/ui/hud.css:693–697`; `src/systems/hud.js:2083–2094, 1667–1670`
**Issue:** `in-range` requires `shipTgt`, and `shipTgt` already forces RANGE yield. Cruise always yields the LEAD word. So the 0.14 rule almost never paints. If the `try/catch` skips, 0.14 cyan on void is below a text contrast floor — the ring/cross remain the cue.
**Fix:** Keep both. Do not also fade `.rw-home-mark` / `.rw-chartmark` / FORE/AFT. Do not multiply combat 0.14 × yield.
**Status:** open. Backup is the fail-closed path. Worker audit agrees.

#### 💡 Suggestion: AP/AM chips were not nudged

**Location:** `src/ui/hud.css:713–719`; contract chip row (nudge **up** if they hit the hub)
**Issue:** PR1 stopped after word/label yield. Chips stay `top: 14px` center. That matches “may stop after the first cheap wins.”
**Fix:** None required. If a later pass nudges, do not clip under `top: 0` and do not move chips into the iris.

#### 💡 Suggestion: Yield does not set `aria-hidden` on RANGE/LEAD

**Location:** `src/systems/hud.js:1371–1376, 939, 973`
**Issue:** Chartmarks and home pip are already `aria-hidden="true"` (`hud.js` **982**, **1002**). RANGE/LEAD are visual chips, not live-region text. `display: none` drops them from the AT tree. Contract allows optional `aria-hidden` only if POS / DIST still carry the fact — they do.
**Fix:** None. Do not add a live region to announce yield.

### HUD-01 / occupancy

- [x] `.rw-reticle` 80×80 stays empty of extras
- [x] No new hub child
- [x] RANGE ring allowed; RANGE word yields
- [x] Silhouette proxy is still AGEZ hair + stroke rails, not a new HUD node (`hud.js` **1641–1652**)

### Contrast / a11y

- [x] Color not the only cue
- [x] No new pulse / `@keyframes` in the HUD-07 block
- [x] `reducedMotion` global kill cited
- [x] Chartmarks / HOME pip already `aria-hidden`; POS / comm / rail DIST carry names
- [x] No new live region
- [x] Combat 0.14 not stacked onto a second home-root fade by PR1

### Neighbors

- [x] HUD-06 chevron inset **108** not retuned
- [x] TGT / NAV-02 inset **84** not stolen
- [x] HUD-04 8 s linger not retuned; Hail02 toast functions kept
- [x] `.rw-galaxy-*` not restyled by the yield block
- [x] Hide-not-delete pools
- [x] Prompt / GATE / POS kept in cruise

### Worker audit

`out/w129/deconflict/ui-audit.md` verdict (no Blocker/Major) stands. This pass adds the honor table, the closed RANGE specificity hole, the still-open scrim Minor from the Wave 128 freeze, and explicit Hail02 / galaxy / live-region cites. It does not upgrade worker severity.

No remaining open Blocker/Major in HUD-07 PR1 UI.
