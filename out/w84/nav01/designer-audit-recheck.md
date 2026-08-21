# UI Audit recheck: NAV-01 galaxy chart plot (Wave 84)

**Auditor:** `[designer]` (independent of `out/w84/nav01/ui-audit.md` — do not rubber-stamp)
**Scope:** Re-audit of the chart plot freeze after the worker closed the prior Major (hit disc ≥ 24 CSS px, filled, hub rings `pointer-events: none`, plot overlay above rings).
**Review file:** `out/w84/nav01/designer-audit-recheck.md`
**Prior audit:** `out/w84/nav01/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live baseline. No Playwright. [NO BROWSER COVERAGE].
**Stance:** accessibility, theming, responsive layout, states, visual hierarchy.
**Date:** 2026-08-21
**Product source:** review only (no `src/` edits). Wave 84 does not ship UI. Live `src/` still has the Wave 21 chart; PR3 is a later serial.

Sources: `docs/Nav01RouteDesign.md`, `out/w84/nav01/shared-contract.md` (merge law), `out/w84/nav01/ui-audit.md` (worker self-audit), prior `out/w84/nav01/designer-audit.md`, live `src/systems/galaxychart.js`, `src/ui/hud.css` galaxy block, `src/systems/controls.js` LMB.

---

## Stance (checked)

| Area | What this pass checked |
| --- | --- |
| Accessibility | Contrast / color-not-only, focus rings, keyboard reach (Q4), semantic dialog, names, `aria-live`, hit floor WCAG 2.5.8 (24 CSS px), SVG `visiblePainted` |
| Theming | Overlay tokens vs new hex; colorblind / contrast / reduced-motion wrappers; plot vs hub gold |
| Responsive | Panel `min(1100px, 92vw)` × `min(760px, 88vh)`; viewBox scale; hit radius from live CSS size; overlap at dense nodes |
| States | Plot / blocked / arrived / idle-omit; hover / focus / disabled on Clear; loading N/A (no fetch) |
| Hierarchy | Header chrome vs map; plot stroke vs gate vs hub; dest vs current vs hub ring |

---

## UI Audit: NAV-01 galaxy chart plot (recheck)

### Summary
The worker freeze in contract **§3.3.1** closes the prior Major. Hit geometry is now a CSS-pixel floor (≥ 24 CSS px), the hit circle must be a filled disc (or `pointer-events: all`), hub rings / labels / current marker / plot strokes are `pointer-events: none`, and hit discs sit on top so nodes receive the click. Remaining issues are PR3 CSS notes (dest shape, Clear states, legend, hover). They are not freeze holes that block CLEAN.

### Verdict
**CLEAN.** 0 blockers, **0 majors**. Minors and suggestions may ship as PR3 CSS comments.

Live `src/` is unchanged (Wave 84 markdown only). Do not treat missing live CSS as a remaining Major.

### What's done well
- Prior Major is named in merge law, not only in the worker self-audit: brief merge table (`docs/Nav01RouteDesign.md:145`), UI section (`:192–194`), decision 12 (`:243`), regression table (`:273`), contract §3.3.1 (`shared-contract.md:235–248`), PR3 (`:389`), Q11 (`:419`).
- Hit floor uses **CSS pixels**, not `16` chart units. Radius is computed from live viewBox × CSS size at open / resize (`shared-contract.md:241`). Painted `NODE_R` stays 8 (`galaxychart.js:35`).
- Fill rule matches SVG `visiblePainted`: `fill="transparent"` / `fill-opacity="0"` **or** `pointer-events: all`. Never `fill: none` as the only hit surface (`shared-contract.md:242`).
- `.rw-galaxy-hub-ring` is explicitly **not** none today (`hud.css:1530–1536`; `galaxychart.js:194–198`) and PR3 **must** set it none. Labels and current marker already are (`hud.css:1543, 1554`). Plot strokes join that list (`shared-contract.md:243`).
- Hit discs are the click surface (`data-system-id` on the disc). Overlap is still a plot; topmost disc wins (`shared-contract.md:241, 245–248`).
- Chart remains a real dialog: `role="dialog"`, `aria-modal="false"`, labelled title, described copy, Close `<button type="button">` (`galaxychart.js:78–101, 232–235`). Gameplay continues. Chart does not pause.
- Current system is not fill-only: thick outline + dashed `.rw-galaxy-current-marker` + pulse (`hud.css:1525–1562`; `galaxychart.js:214–220`). Reduced-motion already kills the pulse (`hud.css:1619–1623`).
- Hub vs physical gate already uses pattern + hue: solid slate `.rw-galaxy-gate` vs dashed gold `.rw-galaxy-route` (`hud.css:1504–1516`). Plot class family `.rw-galaxy-plot*` is the right fence (`shared-contract.md:263`).
- Unreachable vs far: blocked status has **no** hop count (`No route from here.`); `.is-unreachable` outline; far dests plot and show `N jumps` (`shared-contract.md:264–267`; brief §6).
- LMB fire-through is fail-closed: `ctx.flags.chartOpen`; `fireHeld` false **every frame** while open (held LMB from before KeyM included); chart never `preventDefault` / `stopPropagation` (`shared-contract.md:221–233`; live window `mousedown` `controls.js:314–316`; overlay `hud.css:1421–1432`). Prior suggestion on held fire is now law.
- Plot never writes `ctx.targets.current` and does not steal KeyV / KeyT / Digit 0–9 (`shared-contract.md:18–19, 341–349`). HUD-01 rails stay closed. Hop strip is NAV-02 (Q3).
- Keyboard node cursor stays owner Q4. SVG `role="img"` (`galaxychart.js:127–132`). Close + Clear are the tab stops.
- Colorblind / contrast tokens already wrap `.rw-galaxy-chart` (`hud.css:1599–1618`). Plot stays off hub gold.
- Uncharted systems never become nodes (`galaxychart.js:181`). Names use `textContent` (`:207`). No `innerHTML`.
- Clear is a real `<button type="button">` in the header tab order with Close; click current clears (Q1) (`shared-contract.md:250–255`).

### Recheck of the prior Major (closed)

| Freeze item | Where | Status |
| --- | --- | --- |
| Diameter ≥ 24 CSS px (not 16 chart units) | §3.3.1.1, Q11, brief `:145, :194` | **Closed** |
| Filled hit (`transparent` / `fill-opacity: 0` or `pointer-events: all`) | §3.3.1.2 | **Closed** |
| `.rw-galaxy-hub-ring` `pointer-events: none` | §3.3.1.3; live gap named at `hud.css:1530–1536` | **Closed in freeze** |
| Plot overlay above hub gold; hit discs on top | §3.3.1.4–5, PR3 `:389` | **Closed** (see Minor on parenthetical vs numbered list) |
| Painted `NODE_R` stays 8 | §3.3.1.1 | **Closed** |
| No chart `stopPropagation` | §3.3.1.6, law 4 | **Closed** |

Live code still paints hub rings **after** the node with `fill: none` and no `pointer-events: none` (`galaxychart.js:194–198`; `hud.css:1530–1536`). That is the PR3 job, not a Wave 84 src defect.

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major
None remaining. Prior “Hit disc of 16 chart units is not a usable target” is closed by §3.3.1.

#### 🟡 Minor: Dest / hop / unreachable shapes are still under-specified

**Location:** contract §3.5 (`shared-contract.md:257–267`); `src/ui/hud.css:1525–1536`; prior designer-audit Minor
**Severity:** minor
**Status:** open for PR3 CSS notes (does not reopen the hit Major)

**Issue:** Color-not-only is required. Current cue is already a **dashed ring**. Hub systems already have a dashed gold ring (`r=15`, `hud.css:1530–1536`). If `.is-dest` is another dashed or double circle, dest, hub, and current collide. `.is-current` already uses a thick **white** node stroke (`hud.css:1525–1528`). An unreachable “outline” that is also a thick white stroke will look like “you are here”. `.is-hop` has no geometry. Plot vs gate is both solid; contract says “solid, not gold dash” but does not pin width or `var(--white)`.

**Fix:** Freeze non-hue cues in PR3 CSS (do not invent a third gold):

- Dest: diamond **or** square, filled with stroke, **not** a dashed circle. Not `.rw-galaxy-route`. Not the current cyan dash.
- Hop: same circle as a node, extra solid stroke (not white 3.5 px — that is current).
- Unreachable: X, square outline, or long-dash slate; **never** a hop number.
- Plot polyline: solid, `stroke-dasharray: none`, stroke-width ≥ 3, `stroke: var(--white)`. Contrast bump under `body.rw-contrast` like gates (`hud.css:1611–1613`).
- Origin `path[0]` may be `.is-hop` in data; CSS must not restyle the current node as dest.

#### 🟡 Minor: Clear chrome has no hover / focus / disabled states

**Location:** contract §3.4 (`shared-contract.md:250–255`); live Close `src/ui/hud.css:1472–1488`; header `galaxychart.js:89–104`, `hud.css:1455–1460`
**Severity:** minor
**Status:** open for PR3

**Issue:** Close already has hover + `:focus-visible` (border/color swap, `outline: none`). `.rw-galaxy-clear` is named but has no states. Header is `justify-content: space-between` with title vs one button; two chrome buttons need a cluster or Clear sits alone on the left. Idle (no `world.nav`) has no disabled/hidden rule.

**Fix:** Put Clear and Close in a header-actions group (pick one tab order and keep it). Reuse Close hover/focus-visible. Keep a visible focus cue (`outline: none` only if the border swap stays). Always show Clear; `disabled` + `aria-disabled` when the bag is omitted. Do not use `innerHTML`. Accessible name stays `Clear route`. Min chrome height 24 CSS px if cheap.

#### 🟡 Minor: Status live region empty/idle and DOM home are unspecified

**Location:** contract §3.5, §11 Q4 (`shared-contract.md:264, 417`); `galaxychart.js:106–125, 222–226`; `hud.js:723–727`
**Severity:** minor
**Status:** open for PR3

**Issue:** Q4 requires `aria-live` status. §3.5 names `.rw-galaxy-plot-status` and `textContent` but does not pin `aria-live="polite"`, where the node sits, or idle/arrived paint besides copy. A live region created only after the first plot will miss the first announcement. Duplicate `commLine` toasts are fine; a disappearing status node is not.

**Fix:** Create the status node at init (empty string when idle). Keep it in the panel, next to desc or legend. `aria-live="polite"`. Idle: empty or static `No route plotted.` Arrived: `Arrived · <name>`, no plot strokes (already frozen). Do not put hop counts in blocked copy. Extend the static desc (`galaxychart.js:109`) to mention click-to-plot and Clear via `textContent`.

#### 🟡 Minor: Keyboard / SR cannot pick a dest (owner Q4, not an accident)

**Location:** contract §3.1, §11 Q4; `galaxychart.js:127–132` `role="img"`
**Severity:** minor
**Status:** accepted fail-closed (do not reopen a node cursor this slice)

**Issue:** SVG is `role="img"` with one `aria-label`. Nodes are not widgets. Click-to-plot does not add `role="button"` or tabindex. Keyboard-only users cannot plot. Screen readers learn the dest from status + `commLine` **after** a pointer plot. 100 tabindex nodes would be a tab trap while flight still runs (`aria-modal="false"`).

**Fix:** None this slice. Keep Q4. Do **not** add a WASD/arrow node cursor. Do **not** tabindex every node. Keep `role="img"` on the SVG **or**, if impl drops `role="img"`, still leave nodes out of tab order. Close + Clear remain the only tab stops on the overlay.

#### 🟡 Minor: Legend does not name the player plot

**Location:** `galaxychart.js:111–124`; `hud.css:1564–1595`; contract §3.5
**Severity:** minor
**Status:** open for PR3

**Issue:** Legend is gate / hub route / hub. After NAV-01 the new solid plot stroke can read as “a thicker gate”. Unreachable has no key.

**Fix:** Add one legend item for `plot` (solid `--white` bar, not dashed gold) and optionally `no route` (the unreachable outline). `textContent` only. Inherit colorblind/contrast on the overlay tokens.

#### 🟡 Minor: Node hover / cursor / pre-click hop preview missing

**Location:** `src/ui/hud.css:1518–1523`; `galaxychart.js:174–210`
**Severity:** minor
**Status:** open (nice to have in PR3)

**Issue:** Plottable nodes have no `cursor: pointer`, no hover stroke, no `title`/`aria-description`. Generated dests have no map label (only authored six, hubs, pinned — `galaxychart.js:201–208`). The player finds the dest from the status line after click.

**Fix:** `cursor: pointer` on the hit disc. Hover: slight stroke brighten, no fill-only flash, `prefers` / `.rw-reduced-motion` safe (no new animation). Optional: `title` = `SYSTEMS[id].name` via `setAttribute` (not `innerHTML`). Do not BFS on mousemove. Do not show a hop number on hover for unreachable (that reopens U3).

#### 🟡 Minor: Paint-order parenthetical vs numbered list

**Location:** `shared-contract.md:244` vs PR3 `shared-contract.md:389` vs brief `:194`
**Severity:** minor
**Status:** open as a one-line PR3 comment — **not** a click steal

**Issue:** Numbered paint order (bottom → top) is: gates → hub routes → **plot overlay** → painted nodes + **hub rings** → **hit discs** → labels → current marker. That matches the prior designer bar for **clicks** (hit discs on top; rings `pointer-events: none`). The same sentence’s parenthetical says plot is “above hub gold and hub rings' gold dashes.” PR3’s one-liner says “plot overlay above hub rings.” If impl paints rings **after** the plot overlay, hub rings cover plot strokes at hub perimeters. Clicks still reach hit discs. Hub **route** gold stays under the plot either way.

**Fix:** PR3 CSS comment: keep the **numbered** stack (hit discs on top). Read “above rings” as above **hub route** gold (`.rw-galaxy-route`), not as a second reorder that puts plot above hit discs. Do not put plot strokes above hit discs (that would steal clicks unless plot stays `pointer-events: none` — already required). Do not put hub rings above hit discs without `pointer-events: none` (already required).

#### 💡 Suggestion: Compute hit radius from rendered meet-scale

**Location:** `galaxychart.js:127–132` `preserveAspectRatio: xMidYMid meet`; §3.3.1.1; panel `hud.css:1443–1447`
**Severity:** suggestion
**Status:** optional PR3 impl note

**Issue:** SVG `meet` uses `min(cssWidth/viewW, cssHeight/viewH)`. A radius from one viewBox axis only can undershoot 24 CSS px when the other axis letterboxes.

**Fix:** Use the rendered SVG `getBoundingClientRect()` vs `viewBox`, take the **min** scale, then `r_chart = 12 / scale` (diameter 24). Recompute on open and resize. Do not grow painted `NODE_R`.

#### 💡 Suggestion: Do not animate plot dashes

**Location:** `src/ui/hud.css:1548–1562, 1619–1623`
**Severity:** suggestion
**Status:** optional

**Issue:** Current already pulses. A marching dash on `.rw-galaxy-plot` would look like a hub route and fight reduced-motion.

**Fix:** Static plot stroke. Rely on the existing overlay reduced-motion kill if someone adds a transition later.

#### 💡 Suggestion: Label the dest (and only the dest) when it has no map text

**Location:** `galaxychart.js:201–208`; contract §3.5
**Severity:** suggestion
**Status:** optional

**Issue:** Most generated systems have no label. Dest highlight + status name is enough if dest shape is distinct. A second dest `<text>` would help glance, at overlap risk.

**Fix:** Optional dest label via `textContent = SYSTEMS[id].name`, `pointer-events: none`. Do not label every hop. Do not read mystery to fill holes.

### Required checks

| Check | Result |
| --- | --- |
| KeyM chart, no pause | **Pass.** Toggle, docked/paused close-only, `aria-modal=false`, no key swallow (`galaxychart.js:21–24, 240–250`; contract §3.1). |
| Click-to-plot | **Pass (freeze).** Charted `data-system-id` only; replace; current click clears (Q1). Hit geometry now CSS-px floor + fill + stack. |
| Reachable vs unreachable vs far | **Pass.** Far plots with `N jumps`. Blocked: no hop count, `.is-unreachable`, persist dest (Q2). |
| LMB vs fire | **Pass (fail-closed).** `chartOpen` + `fireHeld` false every frame; no chart `stopPropagation`. |
| Keyboard | **Pass as owner Q4.** Click + Clear + live status. No WASD cursor. Do not tabindex 100 nodes. |
| Color-not-only | **Pass intent / weak dest spec.** Current already dashed ring. Plot must not reuse hub gold. Pin dest diamond/square in PR3 (Minor). |
| reducedMotion | **Pass.** Overlay already `animation: none !important`. Do not add plot pulse. |
| aria | **Pass with gaps.** Dialog + Close + Q4 `aria-live` status + toasts. SVG `role="img"` stays (Q4). Clear needs disabled/focus (Minor). |
| Hit targets | **Pass (freeze).** ≥ 24 CSS px; filled disc; hub rings `pointer-events: none`; hit discs on top. Live src still the Wave 21 8-unit node — PR3. |
| No HUD-01 / lock steal | **Pass.** No `targets.current`. No KeyV/KeyT/digits. No hop strip. No mystery. Plot on map only. |
| Theming | **Pass if PR3 uses overlay tokens.** `--white` / `--rw-accent` / `--rw-route`; no new hex; colorblind inherits. |
| innerHTML / names | **Pass.** `textContent` / SVG attrs / `h()`. |
| Responsive | **Pass with overlap rule.** Small viewports grow chart-unit radius so CSS diameter stays ≥ 24; topmost disc wins. See suggestion on `meet` scale. |
| States | **Pass plot/blocked/arrived.** Clear hover/focus/disabled still PR3 (Minor). |
| Hierarchy | **Pass plot vs hub class.** Dest vs current vs hub ring still needs a non-circle dest (Minor). |

### Worker self-audit delta (this recheck)

| Worker id | Designer (prior) | Recheck |
| --- | --- | --- |
| U1 LMB fire | Agree. Fail-closed. | Still closed. Held fire now law. |
| U2 plot vs hub class | Agree. Fail-closed. | Still closed. |
| U3 unreachable vs far | Agree. Fail-closed. | Still closed. |
| U4 hit r=16 | **Was remaining Major.** | **Closed.** §3.3.1 is the right unit, fill, ring none, and hit-disc stack. |
| U5 keyboard | Agree Minor + Q4. | Unchanged. |
| U6 desc copy | Agree Minor. | Unchanged (folded into status Minor). |
| U7 hops while map closed | Agree. Q3 / NAV-02. | Unchanged. |
| U8 Clear next to Close | Agree. | Unchanged (cluster, focus, disabled). |

Do not treat the worker “Re-review … Blocker/Major remaining: 0” line as proof. This pass re-read §3.3.1 against live SVG rules and agrees.

### Closed from prior designer-audit

- 🟠 Major: hit disc 16 chart units / fill none / hub ring steal — **closed** (§3.3.1).
- 💡 Suggestion: zero held fire when the chart opens — **closed** (`shared-contract.md:233`).

### Re-review bar (met)

CLEAN when the Major hit-geometry freeze is in the contract (CSS-px floor, fill/`pointer-events`, hub ring none, paint order with hit discs on top). That text is in §3.3.1. Minors may ship as PR3 CSS comments.
