# Code Review: NAV-07 leftover chart-label a11y (Wave 120)

Design-only. Census: labels **283–291** have no `data-system-id`; CSS `pointer-events: none` (`hud.css` **2126–2132**); click/hover require `isHitDisc` (**675–692**); keyboard **698–713** is KeyM / Escape with **always-close** on open (**700–704**); no dest `<select>`; SVG `role=img` **195–201**. MERGE LAW deputizes label `activateSystem` + named dest `<select>` + **existing** KeyM `isTypingFocus` close skip (§0.1 / §0.3 / §0.7 / §4), forbids pause-the-sim, `showApLive` rewrite, AP success close, WAVE pin retune, jump steal, KeyJ, toast-flood, overlay-policy **rewrite**, KeyM remap, new KeyM listener, SVG tab trap as required PR1, CONSUME. Census leftover is **real**. Designer KeyM Major **closed in freeze**. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **labels activate + dest `<select>`**; smallest additive is shared `activateSystem` plus one named HTML list; KeyM dest typeahead skip lives on the **existing** handler (`isTypingFocus` call, not a remap); SVG roving tabindex is **not** required PR1; sibling AP-close and toast-flood stay out of the write-set. Census leftover is **real**. Not CONSUME. Serial **PR1 chart-label**.

### What's done well

- Re-census treats 24 CSS px discs as **partial**, not CONSUME: still invisible, mouse-only, unlabeled generated dests.
- Picks dest `<select>` instead of a 100-node tab trap (CPU + sibling blur).
- Partial-merge rows require **both** label pointer-events **and** dest list (inventory §5: ~12 labels vs ~94 generated).
- Write-set names `galaxychart.js` **labels/dest/helper only** so NAV-05 `showApLive` and sibling AP success close stay owned.
- Overlay / toast / KeyJ / Digit / hub / persist / `innerHTML` / pause explicitly forbidden.
- Fail-closed table covers bad ids, empty select, hover-no-plot, title capture, sibling blur.
- `select.value` sync on `retargetPlot` keeps AT/name aligned with NAV-01 `world.nav` without a rebuild.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | header not CONSUME; serial not none | Match |
| Serial name | **PR1 chart-label** | §3 | Match |
| Labels activate | same plot path as discs | §0.1 `activateSystem` | Match |
| Enlarge | label box; discs stay 24 | §0.1 | Match |
| Keyboard | dest `<select>` | §0.1 / §0.19 | Match |
| KeyM typeahead | existing close skips `isTypingFocus` | §0.3 / §0.7 / §4 | Match (designer Major closed) |
| Dest layout | under desc | §0.1 | Match |
| SVG tab trap | not required PR1 | explicit non-picks | Match |
| Pause | no | §0.7 | Match |
| `showApLive` rewrite | no | §0.8 | Match |
| AP success close | sibling; do not fight | §0.11 | Match |
| Toast | call out | §0.10 | Match |
| Jump emit | `gate.js` only | §0.8 | Match |
| Persist / `state.js` | none | §0.5–0.6 | Match |
| Digit / hub | no | §0.2 | Match |
| `innerHTML` | no | §0.4 | Match |
| KeyJ / `controls.js` | cite only | §0.3 | Match |
| `overlay-policy.js` | none | §4 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: `galaxychart.js` is in overlay, NAV-05, chart-close, and this leftover write-sets (disjoint symbols)

**Location:** contract §4; overlay open-gate KeyM **698–713**; NAV-05 `showApLive` **586–590**, **635–639**, **727–737**; sibling AP click (re-census); this leftover labels **283–291**, click helper, dest under desc, KeyM typing skip on **700–704**.

**Issue:** Four named serials may edit one file. A sloppy label PR that reformats `showApLive` or the Autopilot success branch fights siblings.

**Fix:** PR1 touches **label build, CSS pointer-events, click/hover `isPlotTarget`, dest `<select>` under desc, `retargetPlot` value sync, existing KeyM close `isTypingFocus` skip**. **Re-census lines at impl.** Do not edit `showApLive`, cancel line, fly disengage loop, overlay open-gate, or Autopilot **button** success. Re-grep after merge.

**Status:** documented; serial coupling, not a Wave 120 defect.

#### 🟡 Minor: Line numbers will drift when sibling inserts `setOpen(false)`

**Location:** inventory AP click **633–650**; contract “re-census at impl”.

**Issue:** Wave 120 PR1 chart-close may add lines in the Autopilot handler. Inventory cites will go stale.

**Fix:** Later PR1 **must re-census**. Do not treat sibling close as this leftover.

**Status:** documented in inventory header and notes.

#### 🟡 Minor: Dest `<select>` empty value is no-op, not Clear

**Location:** contract §0.1 dest list; fail-closed empty value.

**Issue:** A player who opens the select and picks the first “Plot a system” row might expect `clearRoute`. Freeze keeps Clear as the explicit clear (avoids stealing the header button and accidental wipes).

**Status:** accepted; contract freeze. Owner may override after playtest.

#### 💡 Suggestion: Do not rewrite `nav.js` BFS to “search”

**Location:** `nav.js` `plotRoute` **279–300**; contract §4 forbidden `nav.js` rewrite.

**Issue:** Searchable dest is a **UI** list of catalog ids. Plot still BFS from `currentSystem`.

**Status:** frozen; call exports only.

#### 💡 Suggestion: Do not close from `activateSystem`

**Location:** contract explicit non-picks; sibling chart-close.

**Issue:** Close-on-plot would hide hover inspect and fight AP-close law.

**Status:** frozen.

### Test coverage (later)

This wave: markdown freeze. `[NO BROWSER COVERAGE]`. Later PR1 should pin: label click plots; dest `<select>` plots a generated id without `isHitDisc`; hover still does not plot; `showApLive` body unchanged; Autopilot success close (if sibling landed) still runs; no `innerHTML`. Do not “fix” known boot FAILs.
