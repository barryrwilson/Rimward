# UI Audit: NAV-01 galaxy chart plot (Wave 84 design freeze)

**Auditor:** `[designer]` (independent of `out/w84/nav01/ui-audit.md` — do not rubber-stamp)
**Scope:** Proposed KeyM chart plot UI. Click-to-plot, reachable vs unreachable vs far, LMB vs fire, keyboard, color-not-only, reducedMotion, aria, hit targets, no HUD-01 / combat-lock steal.
**Review file:** `out/w84/nav01/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live baseline. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-21
**Product source:** review only (no `src/` edits). Wave 84 does not ship UI.

Sources: `docs/Nav01RouteDesign.md`, `out/w84/nav01/shared-contract.md` (merge law), `out/w84/nav01/ui-audit.md` (worker self-audit), live `src/systems/galaxychart.js`, `src/ui/hud.css` galaxy block, `src/systems/controls.js` LMB.

## UI Audit: NAV-01 galaxy chart plot

### Summary
The freeze keeps plot on the Wave 21 KeyM overlay, splits player strokes from hub gold, and fail-closes LMB fire, lock steal, and unreachable-vs-far copy. It is not CLEAN: the proposed hit disc of 16 chart units is still a tiny CSS target, and live hub rings will eat clicks unless PR3 freezes fill, pointer-events, and paint order.

### Verdict
**NOT CLEAN.** 0 blockers, **1 major**, 6 minors, 3 suggestions.

Worker U1–U3 (guns, `.rw-galaxy-route` collision, blocked copy with no hop count) are fail-closed in the contract with named PR3. Worker U4 is **not** closed: 16 chart units is the wrong unit and omits SVG hit rules.

### What's done well
- Chart is already a real dialog: `role="dialog"`, `aria-modal="false"`, labelled title, described copy, Close `<button type="button">` (`galaxychart.js:78–101, 232–235`). Gameplay continues. Chart does not pause.
- Current system is not fill-only: `.is-current` thick outline + dashed `.rw-galaxy-current-marker` + pulse (`hud.css:1525–1562`; `galaxychart.js:214–220`). Reduced-motion already kills the pulse (`hud.css:1619–1623`).
- Hub vs physical gate already uses pattern + hue: solid slate `.rw-galaxy-gate` vs dashed gold `.rw-galaxy-route` (`hud.css:1504–1516`). Plot class family `.rw-galaxy-plot*` is the right fence.
- Uncharted systems never become nodes (`galaxychart.js:181`). Labels use `textContent` (`207`). No `innerHTML`. No mystery read.
- LMB fire-through is named and fail-closed: `ctx.flags.chartOpen` + `controls.js` must not publish `fireHeld`; chart never `preventDefault` / `stopPropagation` (contract §3.3, §0.4; live window `mousedown` `controls.js:314–316`; overlay `hud.css:1421–1432`).
- Plot never writes `ctx.targets.current` and does not steal KeyV / KeyT / Digit 0–9 (contract §0.5–0.6, §6). HUD-01 rails stay closed. Hop strip is NAV-02 (Q3).
- Unreachable vs far: blocked status has **no** hop count (`No route from here.`); `.is-unreachable` outline; far dests plot and show `N jumps` (contract §3.5; brief §6).
- Clear is a real `<button type="button">` in the header tab order with Close; click current clears (Q1). Status `.rw-galaxy-plot-status` is `aria-live` polite; toasts already are (`hud.js:723–727`).
- Keyboard node cursor is an explicit owner fail-close (Q4): arrows would fight WASD; chart does not pause. Not an accidental skip.
- Colorblind / contrast tokens already wrap `.rw-galaxy-chart` (`hud.css:1599–1618`). Worker correctly keeps plot on `--white` / weight, not a new hue that collapses to hub gold.
- Current marker already has `pointer-events: none` (`hud.css:1554`). Labels too (`1543`). Plot clicks can still hit the current node (clear).

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major: Hit disc of 16 chart units is not a usable target

**Location:** `src/systems/galaxychart.js:35–37, 184–198`; `src/ui/hud.css:1498–1536`; contract §3.3 / §11; worker U4 in `out/w84/nav01/ui-audit.md:41–45`
**Severity:** major
**Status:** open (must tighten the freeze or PR3 paint notes before CLEAN)

**Issue:** Live `NODE_R = 8` is chart units, not CSS pixels. The SVG `viewBox` fits a ~2000×1400 data box plus `MARGIN` 80 (`galaxychart.js:10–12, 33–34, 71–75, 127–132`). The panel is `min(1100px, 92vw)` × `min(760px, 88vh)` (`hud.css:1446–1447`). At a typical window the SVG scale is ~0.3 px per chart unit, so:

- painted node ≈ **5 px** across
- proposed hit `r = 16` ≈ **10 px** across

That is below WCAG 2.5.8 (24 CSS px). Worker U4 called this fixed. It is not.

Two SVG rules make it worse:

1. Default `pointer-events` is `visiblePainted`. A hit circle with `fill: none` is **not** a disc; only a stroke (if any) receives the click.
2. Hub rings (`HUB_RING_R = 15`, `galaxychart.js:194–198`) are appended **after** the node and have **no** `pointer-events: none` (`hud.css:1530–1536`). The ring stroke sits on top of the node. Clicks on the annulus miss `data-system-id`. Current marker is already `pointer-events: none`; hub rings are not.

Dense generated systems will overlap if the disc grows to 24 CSS px. That is still better than a 10 px target with a hub ring stealing the click.

**Fix:** PR3 must freeze all of the following (markdown only this wave):

- Hit geometry is a **CSS-pixel floor**, not `16` chart units. Target ≥ 24 CSS px diameter (scale from the live viewBox), or the largest disc that still lets adjacent catalog nodes be told apart. Cap overlaps: topmost hit disc wins; do not treat overlap as “no plot”.
- Hit `circle` uses a painted fill (`fill="transparent"` or `fill-opacity="0"`) **or** `pointer-events: all`. Never `fill: none` as the only hit surface.
- Paint order: gates → hub routes → plot strokes → painted nodes / hub rings → **hit discs** → labels → current marker.
- `.rw-galaxy-hub-ring` and `.rw-galaxy-current-marker` and labels stay `pointer-events: none`.
- Hit disc is SVG-only, no second catalog (already stated). Paint radius stays `NODE_R = 8`.

Do not `stopPropagation`. Do not grow the painted node to 24 px (it would smear the map).

#### 🟡 Minor: Dest / hop / unreachable shapes are still under-specified

**Location:** contract §3.5; `src/ui/hud.css:1525–1556, 1530–1536`; worker suggestion
**Severity:** minor
**Status:** open for PR3 CSS notes

**Issue:** Color-not-only is required and the current cue is already a **dashed ring**. Hub systems already have a dashed gold ring (`r=15`). If `.is-dest` is another dashed or double circle, dest, hub, and current collide. `.is-current` already uses a thick **white** node stroke (`hud.css:1525–1528`). An unreachable “outline” that is also a thick white stroke will look like “you are here”. `.is-hop` has no geometry at all. Plot vs gate is both solid; only “thicker” is named, with no width.

**Fix:** Freeze non-hue cues in PR3 CSS (do not invent a third gold):

- Dest: diamond **or** square, filled with stroke, **not** a dashed circle. Not `.rw-galaxy-route`. Not the current cyan dash.
- Hop: same circle as a node, extra solid stroke (not white 3.5 px — that is current).
- Unreachable: X, square outline, or long-dash slate; **never** a hop number.
- Plot polyline: solid, `stroke-dasharray: none`, stroke-width ≥ 3, `stroke: var(--white)`. Contrast bump under `body.rw-contrast` like gates (`hud.css:1611–1613`).
- Origin `path[0]` may be `.is-hop` in data; CSS must not restyle the current node as dest.

#### 🟡 Minor: Clear chrome has no hover / focus / disabled states

**Location:** contract §3.4; live Close `src/ui/hud.css:1472–1488`; header `galaxychart.js:89–104`, `hud.css:1455–1460`
**Severity:** minor
**Status:** open for PR3

**Issue:** Close already has hover + `:focus-visible` (border/color swap, `outline: none`). `.rw-galaxy-clear` is named but has no states. Header is `justify-content: space-between` with title vs one button; two chrome buttons need a cluster or Clear sits alone on the left. Idle (no `world.nav`) has no disabled/hidden rule. Checklist: missing disabled.

**Fix:** Put Clear and Close in a header-actions group (tab: Clear then Close, or Close then Clear — pick one and keep it). Reuse Close hover/focus-visible. Keep a visible focus cue (`outline: none` only if the border swap stays). Always show Clear; `disabled` + `aria-disabled` when the bag is omitted. Do not use `innerHTML`. Accessible name stays `Clear route`. Min chrome height 24 CSS px if cheap.

#### 🟡 Minor: Status live region empty/idle and DOM home are unspecified

**Location:** contract §3.5; `galaxychart.js:106–125, 222–226`; `hud.js:723–727`
**Severity:** minor
**Status:** open for PR3

**Issue:** `.rw-galaxy-plot-status` must be `aria-live="polite"` and `textContent` only. The freeze does not say where it sits (header vs under desc vs legend) or what idle/arrived paint looks like besides copy. A live region that is created only after the first plot will miss the first announcement. Duplicate `commLine` toasts are fine; a disappearing status node is not.

**Fix:** Create the status node at init (empty string when idle). Keep it in the panel, next to desc or legend. Idle: empty or static `No route plotted.` Arrived: `Arrived · <name>`, no plot strokes (already frozen). Do not put hop counts in blocked copy. Extend the static desc (`galaxychart.js:109`) to mention click-to-plot and Clear (worker U6) via `textContent`.

#### 🟡 Minor: Keyboard / SR cannot pick a dest (owner Q4, not an accident)

**Location:** contract §3.1, §11 Q4; `galaxychart.js:127–132` `role="img"`; worker U5
**Severity:** minor
**Status:** accepted fail-closed (do not reopen a node cursor this slice)

**Issue:** SVG is `role="img"` with one `aria-label`. That is correct **today** because nodes are not widgets. Click-to-plot does not add `role="button"` or tabindex. Keyboard-only users cannot plot. Screen readers learn the dest from status + `commLine` **after** a pointer plot. 100 tabindex nodes would be a tab trap while flight still runs (`aria-modal="false"`).

**Fix:** None this slice. Keep Q4. Do **not** add a WASD/arrow node cursor. Do **not** tabindex every node. Keep `role="img"` on the SVG (map stays one image) **or**, if impl drops `role="img"`, still leave nodes out of tab order. Close + Clear remain the only tab stops on the overlay. A docked dest list is out of scope (chart is closed while docked, `galaxychart.js:258`).

#### 🟡 Minor: Legend does not name the player plot

**Location:** `galaxychart.js:111–124`; `hud.css:1564–1595`; contract §3.5
**Severity:** minor
**Status:** open for PR3

**Issue:** Legend is gate / hub route / hub. After NAV-01 the new solid plot stroke can read as “a thicker gate”. Unreachable has no key.

**Fix:** Add one legend item for `plot` (solid `--white` bar, not dashed gold) and optionally `no route` (the unreachable outline). `textContent` only. Inherit colorblind/contrast on the overlay tokens.

#### 🟡 Minor: Node hover / cursor / pre-click hop preview missing

**Location:** `src/ui/hud.css:1518–1523`; `galaxychart.js:174–210`; inventory §1.3 “No hover title”
**Severity:** minor
**Status:** open (nice to have in PR3)

**Issue:** Plottable nodes have no `cursor: pointer`, no hover stroke, no `title`/`aria-description`. Generated dests have no map label (only authored six, hubs, pinned — `galaxychart.js:201–208`). The player finds the dest from the status line after click. Hover is a state the checklist asks for.

**Fix:** `cursor: pointer` on the hit disc. Hover: slight stroke brighten, no fill-only flash, `prefers`/`.rw-reduced-motion` safe (no new animation). Optional: `title` = `SYSTEMS[id].name` via `setAttribute` (not `innerHTML`). Do not BFS on mousemove (cost). Do not show a hop number on hover for unreachable (that reopens U3).

#### 💡 Suggestion: Do not animate plot dashes

**Location:** `src/ui/hud.css:1548–1562, 1619–1623`
**Severity:** suggestion
**Status:** optional

**Issue:** Current already pulses. A marching dash on `.rw-galaxy-plot` would look like a hub route and fight reduced-motion.

**Fix:** Static plot stroke. Rely on the existing overlay reduced-motion kill if someone adds a transition later.

#### 💡 Suggestion: Zero held fire when the chart opens

**Location:** `src/systems/controls.js:314–319`; contract §3.3
**Severity:** suggestion
**Status:** optional (law already says LMB must not publish `fireHeld` while open)

**Issue:** The written mechanism is “ignore button-0 down”. A hold that started **before** KeyM can leave `fireDown` true. Gameplay continues under the overlay by design, but the contract sentence is stronger than the bullet.

**Fix:** PR3: while `chartOpen`, `fireHeld` is false every frame (held or new). Do not `stopPropagation`.

#### 💡 Suggestion: Label the dest (and only the dest) when it has no map text

**Location:** `galaxychart.js:201–208`; contract §3.5
**Severity:** suggestion
**Status:** optional

**Issue:** Most generated systems have no label. Dest highlight + status name is enough if dest shape is distinct (see Minor on shapes). A second dest `<text>` would help glance, at overlap risk.

**Fix:** Optional dest label via `textContent = SYSTEMS[id].name`, `pointer-events: none`. Do not label every hop. Do not read mystery to fill holes.

### Required checks

| Check | Result |
| --- | --- |
| KeyM chart, no pause | **Pass.** Toggle, docked/paused close-only, `aria-modal=false`, no key swallow (`galaxychart.js:21–24, 240–250`; contract §3.1). |
| Click-to-plot | **Pass as verb.** Charted `data-system-id` only; replace; current click clears (Q1). **Fail hit geometry** — see Major. |
| Reachable vs unreachable vs far | **Pass.** Far plots with `N jumps`. Blocked: no hop count, `.is-unreachable`, persist dest (Q2). |
| LMB vs fire | **Pass (fail-closed).** `chartOpen` + controls; no chart `stopPropagation`; named PR3. See suggestion on held fire. |
| Keyboard | **Pass as owner Q4.** Click + Clear + live status. No WASD cursor. Do not tabindex 100 nodes. |
| Color-not-only | **Pass intent / weak dest spec.** Current already dashed ring. Plot must not reuse hub gold. Pin dest diamond/square in PR3 (Minor). |
| reducedMotion | **Pass.** Overlay already `animation: none !important`. Do not add plot pulse. |
| aria | **Pass with gaps.** Dialog + Close + `aria-live` status + toasts. SVG `role="img"` stays (Q4). Clear needs disabled/focus (Minor). |
| Hit targets | **Fail.** 16 chart units ≈ 10 CSS px; hub ring intercepts; `fill: none` is not a disc. Major. |
| No HUD-01 / lock steal | **Pass.** No `targets.current`. No KeyV/KeyT/digits. No hop strip. No mystery. Plot on map only. |
| Theming | **Pass if PR3 uses overlay tokens.** `--white` / `--rw-accent` / `--rw-route`; no new hex; colorblind inherits. |
| innerHTML / names | **Pass.** `textContent` / SVG attrs / `h()`. |

### Worker self-audit delta

| Worker id | Designer |
| --- | --- |
| U1 LMB fire | Agree. Fail-closed. Not remaining Major. |
| U2 plot vs hub class | Agree. Fail-closed. |
| U3 unreachable vs far | Agree. Fail-closed. |
| U4 hit r=16 | **Reject as closed.** Wrong unit; SVG fill/stack omitted. Remaining Major. |
| U5 keyboard | Agree Minor + Q4. Add: keep `role="img"`; no tabindex nodes. |
| U6 desc copy | Agree Minor (folded into status Minor). |
| U7 hops while map closed | Agree. Q3 / NAV-02. Not a NAV-01 defect. |
| U8 Clear next to Close | Agree. Expanded: cluster, focus, disabled. |

### Re-review bar
CLEAN when the Major hit-geometry freeze is in the contract or in a PR3 paint note (CSS-px floor, fill/`pointer-events`, hub ring none, paint order). Minors may ship as PR3 CSS comments.

---

## NAV-01 worker follow-up (2026-08-21, after designer Major)

Independent designer text above is unchanged. Worker patch:

- Contract **§3.3.1** + brief UI + PR3 now freeze: hit diameter ≥ **24 CSS px**, filled hit (not `fill: none`), `.rw-galaxy-hub-ring` `pointer-events: none`, plot overlay above hub gold/rings, hit discs on top so **nodes receive the click**, painted `NODE_R` stays 8.
- That is the designer re-review bar for the Major. Minors stay PR3 CSS comments (dest diamond, Clear cluster, legend plot, hover cursor).
- Persist consume table (verifier HIGH) lives in contract **§1.4.1**; not a UI finding.
