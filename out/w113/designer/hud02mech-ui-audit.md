# UI Audit: HUD-02 remaining plated / mech class silhouettes (Wave 113 designer, iteration 3)

**review_file:** `out/w113/designer/hud02mech-ui-audit.md`  
**Wave:** 113. Spec re-audit only. No product `src/` edits. No Vite. No Chrome.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Sources:** `docs/Hud02RemainingMechSilhouettesDesign.md`, `out/w113/hud02mech/shared-contract.md`. Cite-only: `out/w113/hud02mech/current-hud02-mech-silhouette-inventory.md`, `out/w113/hud02mech/ui-audit.md`.  
**Graph:** `graph_resolve` with `codex/agent-codex` → `proceed_unmodeled` (no binding document-production stack). Markdown scratch only. Word / Drive runtime not used.

### Summary

Iteration 3 **closes** the remaining Major: `heavy` is tall-only **16×8**; `freighter` is tall **and** realloc **18×8** (nose 3 / left 3). Prior overflow and sibling-steal Majors stay closed. No new layout or accessibility defect rises to Major. The leftover picture stays right: one live mech plate, class hint inside `.rw-facing-sil`, empty 80 px hub, FORE/AFT words, Digit 0/8/9 frozen.

**Counts:** 🔴 Blocker **0**. 🟠 Major **0** open (3 closed).

### Prior Majors (must stay closed)

| Prior Major | Iteration 3 | Verdict |
|---|---|---|
| Longer cutter / frigate overflow 22×10 | Contract §0.14 + numeric table 132–137; design hint table 216–223; mermaid realloc; player outcome 270 | **Closed.** Do not re-open. |
| Fail-closed generic plate stealing living sibling | Contract §0.12 / §2 bio row; deputize 204; mermaid `bioFace`; overview 44; pain 85; acceptance 297–299; forbidden “Force mech plate onto bio” / “Delete sibling attribute” | **Closed.** Do not re-open. |
| `heavy` ≡ `freighter` metrics | Contract table: heavy nose 5 / body 5,1,16×8; freighter nose 3 / body 3,1,18×8. Design 219, 223, 266–268. Uniqueness invariant + forbidden collide row | **Closed.** Do not re-open. |

### What's done well

- Player-facing change is restyle of existing `.rw-facing-sil` plate, not a new HUD widget (`docs/Hud02RemainingMechSilhouettesDesign.md` 44, 256–258).
- HUD-01 empty hub is explicit: no class pip, name, or meter on `.rw-reticle` (contract §0.2).
- FORE/AFT stay words + fill vs hollow; color is never the only cue. Class plate is accent.
- Digit 0 stays shipyard; Digit 8/9 stay launch / Standing / papers (contract §0.3). Class hint is not a dock verb.
- `reducedMotion` freeze: static triangle/square metrics only. Spec forbids new facing `@keyframes` (contract §0.15).
- Same glance set / duel parity (contract §0.16). Rails, hub, RANGE, MATCH, contacts stay.
- Fail-closed unknown key omits `data-class-key` and never throws (contract §0.12, §2). Light may keep the live generic plate on purpose.
- Zoo law is frozen: hint plated class, do not photocopy tanks / jet fighters / wet-navy hulls (contract §0.19).
- InnerHTML / SVG from `classKey` forbidden. Authored CSS only (contract §0.4).
- Family skins stay Wave 62 consume. This leftover is **inside mech**, not a third family.
- Mech CSS gate `#hud[data-family="mech"][data-class-key]` is the right visual switch. Sibling bio clip-path is named consume, not rewrite (contract §0.21).
- Length law is numeric, not prose “longer”: cutter and frigate `left+width=21`. Sil never grows.
- Sibling steal law is explicit in mermaid, deputize, §2, and forbidden table.
- Heavy vs freighter now split on a second in-box axis (width / nose realloc), not fill color.

### Tuple uniqueness (iteration 3 check)

Contract §0.14 playable defaults. Two authored keys (except `light` matching unknown) must not share nose / left / top / width / height.

| `classKey` | Nose | left | top | width | height | left+width | top+height | Unique vs others |
|---|---|---|---|---|---|---|---|---|
| `light` | 5 | 5 | 2 | 16 | 6 | 21 | 8 | live generic plate (empty/unknown match allowed) |
| `heavy` | 5 | 5 | 1 | 16 | 8 | 21 | 9 | tall-only vs light; **not** freighter |
| `ace` | 4 | 4 | 3 | 14 | 4 | 18 | 7 | narrower + thinner |
| `cutter` | 4 | 4 | 2 | 17 | 6 | 21 | 8 | realloc vs light; **21 ≤ 22** |
| `frigate` | 3 | 3 | 3 | 18 | 4 | 21 | 7 | realloc + thin; **21 ≤ 22** |
| `freighter` | 3 | 3 | 1 | 18 | 8 | 21 | 9 | tall **and** realloc vs heavy |

Invariants hold: sil 22×10 never changes; every row `left+width ≤ 22`; every row `top+height ≤ 10`. Heavy width stays **16**. Freighter width is **18**. Tuples do not collide.

### Closed: 🟠 Major (iter 1) — “Longer” cutter / frigate overflow 22 px

**Location:** contract §0.14 table 132–137; design 216–225, 270.

**Issue (iter 1):** Live glyph already fills 0–21 px. “Longer wedge / capital plate” could grow sil or overflow toward the 78 px rail gap.

**Fix landed:** sil `width` / `height` / `flex-basis` never change. `body.left + body.width ≤ 22`. `body.top + body.height ≤ 10`. Apparent length only by shrink nose, then lower `left`, then raise `width`. Cutter: nose 4 / body 4,2,17×6 (`left+width=21`). Frigate: nose 3 / body 3,3,18×4 (`left+width=21`). Unreadable key omits that selector. No wet-navy photocopy.

**Status:** **closed.** Do not re-open as Major.

### Closed: 🟠 Major (iter 1) — Fail-closed generic plate stealing living sibling

**Location:** contract §0.12 / §2; design mermaid 181–183, deputize 204.

**Issue (iter 1):** English “keep generic plate if not mech” named the mech glyph. A later PR could force triangle+square onto bio, or delete `data-class-key` whenever family is not mech.

**Fix landed:** unknown → omit attribute → live **family** facing (mech generic plate **or** bio organism + sibling tokens). Family not mech → no mech class CSS; do not paint the mechanical plate; do not delete an allowlisted attribute. PR1 extends one `classKeyToken` writer. Mermaid `cssGate -->|no|` goes to bio organism plus sibling tokens.

**Status:** **closed.** Do not re-open as Major.

### Closed: 🟠 Major (iter 2) — Authored `heavy` and `freighter` share one plate

**Location:** contract §0.14 playable-defaults 132–140; uniqueness row 126; forbidden collide 162; design hint table 218–223; player outcome 266–268; alternatives 328; regression 351.

**Issue (iter 2):** Both keys were nose 5 / body `left 5; top 1; width 16; height 8`. Combat heavy and trade freighter would paint one taller square.

**Fix landed (iter 3):** Heavy stays tall-only: nose 5 / body `5,1,16×8` (`left+width=21`, `top+height=9`). Freighter is tall **and** realloc: nose 3 / body `3,1,18×8` (`left+width=21`, `top+height=9`). Still border-triangle + square. No sil grow. No gold/grey fill as class cue. No wet-navy photocopy. Unreadable-key omit still applies. Design mermaid names `heavy tall-only 16x8` and `freighter tall realloc 18x8`. Player outcome says the plates must not match.

**Status:** **closed.** Do not re-open as Major.

### Findings

No 🔴 Blocker (open). No 🟠 Major (open). Three prior Majors closed. Residual Minors / Suggestions only.

#### 🟡 Minor: Self and target facing share the player class token

**Location:** contract §0.13 / §0.1 “Target facing uses the same player token.” Design 169.

**Issue:** After PR1 a plated heavy player sees two thicker plates. FORE/AFT still mean lock hemisphere. Players can read the target sil as “the lock is a heavy.”

**Fix:** Keep player-wide identity (same as `data-family`). Do **not** key the target sil off lock `classKey` (TGT / Q-ship). Do not add a class caption. Playtest may ask a later self-only token; not PR1.

**Status:** accepted residual; family already paints both facings the same. Sibling bio tokens already use this pattern.

#### 🟡 Minor: Ace / cutter plate language can still invite Earth fighter glyphs

**Location:** design 220–221 “sharper triangle” / “reallocated plate”; contract §0.19; shape language is border-triangle + square only.

**Issue:** Residual risk is PR1 CSS that copies bio `clip-path` or a jet side-view into plated lineage.

**Fix:** Keep PR1 on **border triangle + square metrics** only (contract §0.1 / §0.14). Do not import bio polygons onto mech. Playtest may retune px; do not retune into tanks / jets / destroyers.

**Status:** documented; PR1 CSS must stay plate metrics.

#### 🟡 Minor: Light plated and unknown key look the same

**Location:** deputize `light` keep live plate (design 218); contract §2 missing-rule row.

**Issue:** Allowlisted `light` and omitted unknown / hangar-not-synced all paint one triangle + square. That is the fail-closed empty/error state, and it is also starter identity. Reviewers may say PR1 “did nothing” for light.

**Fix:** Acceptance: light bit-identical to today’s plate is **pass**. Heavy / ace / cutter / frigate / freighter must differ inside 22×10 (iter 3 closed heavy vs freighter). Do not add a class word on RANGE to split light from unknown (TGT-01 / HUD-01).

**Status:** accepted; same pattern as sibling light organism.

#### 🟡 Minor: Cutter 1 px realloc may not read at glance

**Location:** cutter freeze nose 4 / body 17 vs live 5 / 16 (contract 136; design 221).

**Issue:** Cutter is only 1 px longer than light inside a 22 px box. At 1600×900 that can fail as a class hint. Spec already says omit an unreadable key’s CSS. If cutter fails and is omitted, cutter looks like light — same trap as the accepted light/unknown pair, but for an authored “longer” class.

**Fix:** If playtest cannot tell cutter from light, either omit cutter CSS (law) **or** retune inside the budget (example: also drop height, or shrink nose to 3 like frigate). Do not grow sil. Do not add a caption.

**Status:** residual; optional table retune before PR1. Unreadable-key omit is already frozen. Not a Major: the budget law already names the escape.

#### 💡 Suggestion: Nose vertical metrics are not in the numeric table

**Location:** contract table lists nose `border-right` only (128–137). Ace / frigate body height 4 at `top: 3`. Heavy / freighter body height 8 at `top: 1`.

**Issue:** Later CSS that copies body box but leaves live 6 px triangle will mismatch ace (short body, tall nose) and heavy (tall body, short nose). Still in 10 px, so not the closed overflow Major.

**Fix:** Freeze nose `top` and `border-top` / `border-bottom` so triangle height tracks body height. Example: ace/frigate nose `top` 3, borders 2/2; heavy nose `top` 1, borders 4/4. Keep join `body.left === nose border-right`.

**Status:** optional; prevents PR1 guesswork.

#### 💡 Suggestion: Do not reuse RANGE or the mech tick ring for class

**Location:** contract §0.2; design acceptance 300.

**Issue:** A class word on RANGE, or class pips on the tick ring, steals HUD-01 empty 80 px glass without a new child node.

**Fix:** PR1 touches `.rw-facing-nose` / `.rw-facing-body` only. Hub tree and tick ring stay Wave 62 family chrome. PR2 grep `.rw-reticle`.

**Status:** frozen in contract; keep on the later checklist.

#### 💡 Suggestion: Class plate restyles should keep token colors

**Location:** contract §0.14 / §0.19 geometry only; forbidden gold/grey fill.

**Issue:** Later class rules that hardcode a new fill (gold heavy, grey freighter) make color the class cue and fight color-blind FORE/AFT rings.

**Fix:** Geometry only. Keep `var(--rw-accent)` / existing cyan rgba. Do not drop FORE/AFT words. Sil stays px — do not scale the plate into AGEZ.

**Status:** optional; geometry-only is already frozen. Iter 3 split used width, not color.

### Accessibility / theming / layout / states

| Check | Spec | Honor |
|---|---|---|
| Contrast | No new ink; plate is hollow square + triangle | Geometry only. `rw-contrast` rail rules stay |
| Focus / keyboard | No new controls | No new hit target. Facing is not a button |
| Semantic | Existing spans | `textContent` / `el()` FORE/AFT. No innerHTML |
| Theming | Authored CSS under `#hud[data-family="mech"][data-class-key]` | Family hook consume. Class hook mech-absent until later PR1 |
| Responsive | Stay 22×10; no AGEZ growth | Sil frozen. Length realloc in-box. Heavy 16×8 / freighter 18×8 both `left+width=21` |
| Loading | Hangar not synced → generic family facing | Contract §2 |
| Empty / error | Unknown key omit attribute; live **family** facing | Contract §0.12 |
| Disabled | N/A (not a control) | — |
| Hover | None | Correct |
| Vestibular | No new facing loops | Contract §0.15 |
| Visual hierarchy | Class is 22 px accent; FORE/AFT remain data | Do not replace words with icon-only. Heavy vs freighter **split** |

### Digit / hub / glance freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new | forbidden |
| Class pip / plated meter / RANGE word | none | forbidden |
| Mech tick ring | Wave 62 family | do not retune as class emblem |
| Facing glyph | `.rw-facing-sil` 22×10 triangle + square | CSS tokens only; no sil grow; §0.14 realloc |
| FORE/AFT | words + fill vs hollow | do not replace with icon-only |
| Glance set | same positions / cadence | no new row |
| Digit 0 | shipyard | do not steal |
| Digit 8/9 | launch / epics; outfitting papers | do not steal |
| Toast | not required | do not add `CLASS: HEAVY` |
| HUD-03 skin picker | closed | do not add |
| Bio clip-path | sibling consume | do not author here; do not delete attribute |
| Earth tanks / jets | forbidden | plate metrics only |
| `reducedMotion` | static plate | no new `@keyframes` |
| Heavy vs freighter | different tuples | heavy 16×8; freighter 18×8 |

### Re-review

- 🔴 Blocker: **0**
- 🟠 Major: **0** open. Three closed (overflow; sibling-steal; heavy ≡ freighter).
- 🟡 Minor: **4** (accepted residuals; cutter 1 px readability)
- 💡 Suggestion: **3**

Do not re-open overflow, sibling-steal, or heavy/freighter collide as Major. Do not invent a new Major: no remaining layout overflow, hub theft, contrast-as-only-cue, or fail-closed sibling steal in the spec. Hub, Digit 0, FORE/AFT, `reducedMotion`, glance-set freeze, zoo law, family fail-closed, numeric no-grow sil, uniqueness, and “leftover is real on mech” stay sound.
