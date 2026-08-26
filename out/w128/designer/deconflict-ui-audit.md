# Designer audit: Wave 128 HUD-07 leftover later UI freeze

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-26 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | Later UI freeze (markdown only): `docs/Hud07DeconflictionDesign.md`, `out/w128/deconflict/shared-contract.md`, worker `out/w128/deconflict/ui-audit.md`. Live `src/systems/hud.js` / `src/ui/hud.css` as cite only. |
| **Not in scope** | Product `src/` edits, Vite, Playwright, design-doc edits, sibling `out/w128/hailmiss/**` / `out/w128/chartread/**`, wishlist, `PROGRESS.md` |
| **Wave** | 128 markdown freeze. No HUD bindings in this wave. Findings are freeze vs live occupancy. |
| **Graph** | `r-mt9mx9k7-cbec8679` `blocked_ambiguous` (Word vs slides vs catalog; false). Retry `r-mt9myjif-f905d745` bound `codex/workflow-catalog-maintenance` (false bind). This pass does **not** `graph_propose`. Owner named this scratch path and forbade Vite / product edits. Local HUD-brief audit only. |
| **Verdict** | **CLEAN** — no open Blocker, no open Major |

Merge law: if the brief and the contract disagree, the contract wins (`out/w128/deconflict/shared-contract.md` header). This pass is independent of worker `out/w128/deconflict/ui-audit.md`. It does not upgrade that file.

Focus: 80 px hub empty; four protected regions; quieter cruise without hiding HOME / NAV-02 / dock J / POS; color not only cue; no new pulse; `reducedMotion`; hide-not-delete; fade contrast; HUD-06 pip / TGT arrow collision.

---

## UI Audit: HUD-07 dynamic deconfliction (later freeze)

### Summary

The freeze names leftover **REAL** and serial **PR1** as one `#hud` yield policy: protect four sight regions; hide duplicate **words and labels**; quiet RANGE/LEAD **words** in cruise; keep HOME / GATE / dock J / POS. It does not put a widget in the 80 px hub. It does not steal HUD-06 pip, TGT arrow, or NAV-02 cue. Wave 128 ships no chrome.

### Freeze checklist (must not reopen)

| Check | Result | Evidence |
|---|---|---|
| HUD-01 empty 80 px hub; no deconflict widget / compass / PPI / gauge in `.rw-reticle` | **Pass** | Live hub is `80px` × `80px` (`src/ui/hud.css:184–193`). Clamp `cx - 44` keeps hub on glass (`src/systems/hud.js:1400–1405`). Reticle children stay pupil / cilia / RANGE (`hud.js:858–861`). RANGE word sits **under** the box (`hud.css:207–220`, `bottom: -16px`), not a new iris gadget. Contract §0.2 forbids a hub child (`shared-contract.md:20`). Brief: no hub gadget (`Hud07DeconflictionDesign.md:41, 120, 267`). Worker audit locks the same (`ui-audit.md:19–23`). |
| Four protected regions; no silhouette HUD widget | **Pass** | Contract §0.1: reticle hub, silhouette **proxy** (stroke rails + AGEZ, do not add a silhouette widget), `.rw-target-box` 60 px, reticle→lead segment (`shared-contract.md:52–59`). Live: hub (`hud.css:184–189`); stroke-only rails (`hud.css:937–949`); bracket 60 px (`hud.css:404–409`); AGEZ segment (`hud.js:209–221`, `1545–1561`). Brief mermaid forbids a hub child (`Hud07DeconflictionDesign.md:157–176`). |
| Exploration quieter; do **not** hide HOME / NAV-02 / dock J / POS | **Pass** | Contract §0.16 / §0.1 keep-full table (`shared-contract.md:41, 82–97`). Prompt / GATE / pip / TGT arrow: do not hide as only nav (`shared-contract.md:77–78`). Live POS is `.rw-fade` (`hud.js:1115`); GATE row is `.rw-aux` (`hud.js:1095`); dock J is `.rw-prompt` (`hud.css:798–802`, `hud.js:2375–2379`); pip hide-on-station-lock stays (`hud.js:1907–1908`). Cruise fade is RANGE/LEAD **words**, not a second nav strip. |
| Color is not the only cue | **Pass** | Contract §0.13 (`shared-contract.md:38`). Live palette law (`hud.js:48–49`; `hud.css:1–4`). RANGE hide keeps dashed vs solid ring (`hud.css:195–205`) and/or rail DIST (`hud.js:2352–2355`). LEAD hide keeps ring + cross (`hud.css:533–562`). Home label hide keeps square pip + POS HOME (`hud.css:651–657`; `hud.js:2181–2196`). Chart label hide keeps diamond (`hud.css:611–618`). Dup name hide keeps rail name. |
| No new pulse; `reducedMotion` | **Pass** | Contract §0.12: no new `@keyframes`; opacity / display / transform only; honor `body.rw-reduced-motion` (`shared-contract.md:37`; `hud.css:1252–1258`). FORE/AFT already outline-fallback (`hud.css:305–308`). Mech range-in already killed (`hud.css:1310–1312`). |
| Hide-not-delete pooled nodes | **Pass** | Contract §0.11 (`shared-contract.md:32–35`). Live `.is-hidden { display: none }` (`hud.css:36`). Chartmarks / home / lead / toasts already pool + hide (`hud.js:893–927`). Formulas: never `remove()` (`shared-contract.md:136–137`). |
| Do not steal HUD-06 pip / chevron **108** | **Pass** | `HOME_EDGE_INSET = 108` (`hud.js:75`, `1949–1950`). Pip is not a reticle child (`hud.js:37–38, 903–909`). Contract §0.6: hide **label** only; do not retune; hide-on-station-lock stays (`shared-contract.md:27`). |
| Do not steal TGT arrow / NAV-02 cue inset **84** | **Pass** | `EDGE_MARGIN = 84` (`hud.js:74`). Arrow class `.rw-edge-arrow` (`hud.css:575–594`). Gate cue off-glass (`hud.js:1836–1859`). Contract §0.7–0.8 (`shared-contract.md:28–29`). |
| Fade contrast; do not stack a second 0.14 onto HOME | **Pass** (with Minor) | Live combat dim: `.rw-fade` **0.14** (`hud.css:89`), chartmark **0.14** (`hud.css:632`), home-mark **0.14** (`hud.css:688`), aux **0.38** (`hud.css:999`). Contract: keep those numbers; do not stack a hide of HOME / GATE / POS (`shared-contract.md:91–97`). Formulas **hide** words/labels; they do not multiply opacity on `.rw-home-mark`. Open Minor: cruise copy still says “fade / quieter” without a floor. |
| No third `aria-live`; no new interactive hub control | **Pass** (cite note) | Toasts + banner already `aria-live=polite` (`hud.js:934, 947`). NAV-02 also has `navLive` polite (`hud.js:1100`). Contract forbids a **new** live region (`shared-contract.md:30`). Pointer-events stay off except existing AP/AM / controls (`hud.css:6–7`). |

### What's done well

- Empty-hub law is repeated, not implied: honor line, non-goals, deputize, mermaid forbidden edges, acceptance 7, alternatives (`Hud07DeconflictionDesign.md:12, 120, 173–175, 267, 281`; `shared-contract.md:20, 115, 145–146`).
- Yield order is words/labels first. Glyphs, rings, POS HOME, GATE, dock J stay. That is the smallest additive picture.
- One `#hud.in-combat` mood, not two HUD trees. Existing career fade stays the combat dimmer.
- Neighbor identities stay named: HUD-06 square pip + chevron 108, TGT amber triangle 84, NAV-02 ticks 84, HUD-04 top-right 8 s linger.
- Fail-closed empty/error: skip yield; never throw; missing lock does not invent chrome (`shared-contract.md:107–109`).
- Accessibility: color+shape already live (range dashed vs solid; lead ring+cross; chart diamond vs home square vs TGT triangle). Freeze reuses that, and bans a yield pulse.
- Keyboard reach unchanged: KeyH/J/L/M/P stay; no new hub hit target. AP/AM already have `:hover` / `:focus-visible` (`hud.css:763–770`).
- Hide-not-delete matches the live create-once pool (`hud.js:31–35`).
- Theming: later class `rw-yield` or reuse `rw-hair-off`; no new hardcoded state color required.

---

### Findings

No open 🔴 Blocker. No open 🟠 Major. The freeze does **not** put a widget in the 80 px hub. It does **not** hide HOME / NAV-02 / dock J / POS as the cruise quiet. It does **not** steal HUD-06 pip or TGT arrow.

Closed reopeners (do not treat as open defects):

#### 🔴 Blocker (closed in freeze): Hub gadget / compass / PPI in 80 px glass

**Location:** `src/ui/hud.css:184–193`; `src/systems/hud.js:858–861, 1400`; `out/w128/deconflict/shared-contract.md:20, 145–146`; `docs/Hud07DeconflictionDesign.md:41, 267`  
**Issue:** A collision widget inside `.rw-reticle` would occupy HUD-01 empty aim glass. RANGE word is already a **child**, seated at `bottom: -16px` (`hud.css:207–220`), not a new iris gauge.  
**Fix:** Forbidden. RANGE **word** may hide; ring may stay. No new hub child in PR1.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Cruise that hides HOME / GATE / J / POS

**Location:** `shared-contract.md:41, 82–97`; `hud.css:89, 688, 798–802, 999`; `hud.js:1115, 2375–2379`  
**Issue:** A quiet cruise that also hides the only nav recreates the HUD-06 POS-only pain. Live combat already dims POS (`.rw-fade` 0.14) and GATE (`.rw-aux` 0.38). A second cruise hide would steal identity.  
**Fix:** Keep POS, POS HOME, GATE row, gate cue, dock J, pip/chevron. Fade RANGE/LEAD **words**.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Color-only yield / new pulse

**Location:** `hud.js:48–49`; `hud.css:195–205, 533–562, 1252–1258`; `shared-contract.md:37–38`  
**Issue:** Opacity-only hide of RANGE without DIST/ring would leave in-envelope state as color. A pulse on yield would violate `reducedMotion`.  
**Fix:** Keep `.in-range` ring and/or rail DIST; keep lead ring; keep pip + POS HOME. No new `@keyframes`.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Steal HUD-06 pip or TGT arrow as yield sprite

**Location:** `hud.js:74–75, 896, 903–909, 1949–1950`; `hud.css:575–594, 634–688`; `shared-contract.md:27–29`  
**Issue:** Reusing `.rw-home-mark` or `.rw-edge-arrow` as a deconflict toy mixes pad / lock / layout jobs. Retuning 108 or 84 would drift neighbors.  
**Fix:** Label yield only. Pip, chevron, arrow, gate cue stay.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Delete pooled nodes

**Location:** `hud.css:36`; `hud.js:31–35, 911–927`; `shared-contract.md:32–35`  
**Issue:** `remove()` on chartmarks / rails / home / lead would break the create-once pool and per-frame alloc contract.  
**Fix:** `.is-hidden` / opacity class. Never `remove()`.  
**Status:** addressed in freeze

---

#### 🟡 Minor: Cruise copy mixes hide / fade / quieter with no opacity floor

**Location:** `out/w128/deconflict/shared-contract.md:63, 85–89, 130–135`; `docs/Hud07DeconflictionDesign.md:47, 235`  
**Issue:** Formulas use boolean **hide** for RANGE/LEAD words. The exploration table says **fade / collapse**. Player outcome says words stay **quiet**. Live combat already uses **0.14** on POS / chart / home (`hud.css:89, 632, 688`). A later `#hud:not(.in-combat)` rule that also uses 0.14 on remaining chips, or a yield opacity stacked on `.rw-home-mark` / `.rw-chartmark` in combat, would make the leftover glyph fail contrast on void.  
**Fix:** PR1: hide RANGE/LEAD **words** (class on the word node). Do not set a second opacity on `.rw-home-mark` or `.rw-chartmark` roots. If a fade remains on rails, floor it at aux **0.38** (`hud.css:999`) or keep full. Do not multiply 0.14 × yield.  
**Status:** open — document in PR1 CSS; does not reopen leftover

#### 🟡 Minor: RANGE yield vs `.in-range { display: block }`

**Location:** `src/ui/hud.css:36, 218–220`; `shared-contract.md:70–71`  
**Issue:** `.rw-reticle.in-range .rw-reticle-range { display: block }` will fight a yield class that is not `#hud .is-hidden` (ID selector). Opacity-0 without `display:none` still paints the word under the hub.  
**Fix:** Yield RANGE with `.is-hidden` on `.rw-reticle-range` (ID wins) or a more specific `#hud` hide rule. Do not rely on color dim.  
**Status:** open — implementation note for PR1

#### 🟡 Minor: Bracket info scrim can still sit on the path after name hide

**Location:** `src/ui/hud.css:439–450`; `src/systems/hud.js:872–875`; `shared-contract.md:68–69`  
**Issue:** Duplicate-name yield hides `.rw-target-name` and keeps meta/dist/band. Parent `.rw-target-info` still has a boxed scrim 36 px below the 60 px bracket. That plate can still cover the reticle→lead segment. Smallest additive accepts this.  
**Fix:** Accept in PR1. If playtest still blocks the shot path, hide or opacity-yield the **scrim** while meta stays, or shift info off the segment — not onto the hub.  
**Status:** open — playtest; not a freeze hole

#### 🟡 Minor: FORE/AFT listed under cruise fade

**Location:** `out/w128/deconflict/shared-contract.md:87`  
**Issue:** Exploration “fade / collapse” lists FORE/AFT **flash** next to RANGE/LEAD words. FORE/AFT is a hit state (`hud.js:1579–1584`), not a loud cruise chip. A blanket `#hud:not(.in-combat)` fade of facing ends would quiet the only hull-hit glance in cruise. Shape fallback already exists (`hud.css:305–308`).  
**Fix:** PR1 quieter set = RANGE word + LEAD word (+ MATCH only if still match-speed noise). Do not fade FORE/AFT.  
**Status:** open — copy tighten; contract still “combat-only chips”

---

#### 💡 Suggestion: AP/AM chip nudge can clip the top edge

**Location:** `src/ui/hud.css:704–715`; `shared-contract.md:75`  
**Issue:** Chips sit `top: 14px` center. Contract allows a small **up** nudge if they hit the hub, not a hub child. Up from 14 px clips under the viewport.  
**Fix:** Optional in PR1. Prefer a smaller stack gap, or skip the nudge if `top` would go negative. Do not move chips into the iris.

#### 💡 Suggestion: Dock `J` may sit on the lower shot path

**Location:** `src/ui/hud.css:798–802`; `src/systems/hud.js:2375–2379`; `shared-contract.md:77`  
**Issue:** `.rw-prompt` is center, `bottom: 20%`. Relocating it is tempting. Brief: do not hide dock J when it is the only nav.  
**Fix:** PR1 does not move prompt. Owner may override after playtest.

#### 💡 Suggestion: Live polite regions are already three

**Location:** `src/systems/hud.js:934, 947, 1096–1100`; `shared-contract.md:30`; worker `out/w128/deconflict/ui-audit.md:57`  
**Issue:** Freeze says “no third `aria-live`” and counts toasts + banner. Live also has `navLive` `aria-live=polite`. PR1 must not add another.  
**Fix:** Treat the ban as **no new** live region (fourth). Do not announce yield.

#### 💡 Suggestion: `body.rw-contrast` does not need a new yield color

**Location:** `src/ui/hud.css:1237–1250`  
**Issue:** Contrast overrides toast / prompt / banner / rail backgrounds. Yield should stay a class toggle (hide or opacity), not a new hex.  
**Fix:** Reuse tokens. No extra contrast paint in PR1.

---

### HUD-01 / occupancy

- [x] `.rw-reticle` 80×80 stays empty of extras
- [x] No new hub child in PR1 plan
- [x] RANGE ring allowed; RANGE word may yield
- [x] Silhouette proxy is not a new HUD node

### Contrast / a11y

- [x] Color not the only cue (ring, DIST, pip, POS HOME, diamond, rail name)
- [x] No new pulse / `@keyframes`
- [x] `reducedMotion` global kill cited
- [x] Chartmarks / HOME pip already `aria-hidden` (POS / comm carry names)
- [x] No new live region
- [x] Fade: do not stack 0.14 on HOME; open Minor names the floor for PR1

### Neighbors

- [x] HUD-06 chevron inset **108** not retuned
- [x] TGT / NAV-02 inset **84** not stolen
- [x] HUD-04 8 s linger not retuned
- [x] Hide-not-delete pools
- [x] Prompt / GATE / POS kept in cruise

No remaining open Blocker/Major in the later UI freeze.
