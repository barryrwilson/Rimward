# Wave 120 NAV-07 leftover — chart-label a11y

## Verdict

**Leftover is real.** Serial name: **PR1 chart-label**. Serial is **not** none. **Not CONSUME.**

Labels do not activate systems. Plot still depends on invisible mouse-only SVG hit discs. There is no accessible name on systems, no keyboard focus among systems, and no searchable destination list.

Deputize: labels activate the **same** `plotRoute` / `clearRoute` path as discs; enlarge the effective target by including the label box; add one named dest `<select>` for **all charted** systems (keyboard + names). Do **not** require SVG roving tabindex as PR1. Owner may override after playtest. Do not park.

## Census (code wins)

- `galaxychart.js` **77–85**: `isHitDisc` — class token `rw-galaxy-hit` only.
- `galaxychart.js` **46**, **272–280**, **443–460**: invisible discs; 24 CSS px on open/resize. No `tabindex`. No `aria-label`.
- `galaxychart.js` **283–291**: `.rw-galaxy-label` `textContent` name; **no** `data-system-id`; authored ∪ pinned ∪ hub only (~12). Generated ~94 have discs, no labels (`state.js` **580–583**).
- `hud.css` **2126–2132**: labels `pointer-events: none`.
- `galaxychart.js` **659–668**: click plots **only** if `isHitDisc`.
- `galaxychart.js` **670–676**: hover **only** if `isHitDisc`. NAV-04 inspect. Do not plot on hover.
- `galaxychart.js` **698–713**: KeyM / Escape only. No dest keyboard. Open always `setOpen(false)` (**700–704**). `playSurfaceBlocked` on **open** only. No `isTypingFocus` import (line **5**).
- `overlay-policy.js` **72–80**: `isTypingFocus` includes `SELECT`. Call later. Do **not** rewrite.
- `galaxychart.js` **195–201**: SVG `role=img`. Children not a control list.
- `galaxychart.js` **133–163**: tab order Clear / Autopilot / Close.
- `innerHTML` in galaxychart: **none**.
- Sibling AP button **633–650**: `tryEngage` / `showApLive`. **Do not steal.** Wave 120 PR1 chart-close may insert `setOpen(false)` on empty token. **Do not fight.**
- `showApLive` **586–590**: NAV-05. **Do not rewrite.**
- Overlay import **5**; `setOpen` **421–441**. **Do not rewrite** mutex.
- `controls.js` **302–304**: KeyJ `pendingDock`. Cite. Do not remap.

Invisible mouse-only discs plus inert labels are **not** a feature. Treating 24 CSS px discs as CONSUME would leave generated dests unnamed.

## Deputize

- Labels: `data-system-id` + CSS `pointer-events: all`; click → `activateSystem`.
- Hits: keep. `HIT_CSS_DIAMETER` stays 24. Do not grow over Autopilot / Close.
- Shared `activateSystem` + `isPlotTarget` (hit or label). Call `plotRoute` / `clearRoute` only.
- Dest `<select id="rw-galaxy-dest">` once at init **under the desc**; visible label `htmlFor`; `textContent` names; `sanitizeSystemId` values; `change` → `activateSystem`; empty → no-op.
- Existing KeyM close: if `open` and `isTypingFocus()`, do **not** `setOpen(false)`. Not a remap. Not a new listener. Escape still closes.
- Hover **must** share `isPlotTarget` (inspect only).
- Sync `select.value` from `nav.dest` on `retargetPlot` (property write, no rebuild).
- Keyboard among SVG discs: **not** required PR1.
- Hover: inspect only. May share `isPlotTarget`. Never plot on hover. Do not rewrite `hoverModel`.
- Do not pause. Do not teleport. Do not skip zone/charge.
- Do not close chart on plot. Sibling owns AP success `setOpen(false)`.
- No hub pip, no Digit steal, no `state.js` write, no new persist key, no `innerHTML`.

## Later PR1 may write

- `src/systems/galaxychart.js` **labels + dest `<select>` + `activateSystem` / `isPlotTarget` + existing KeyM `isTypingFocus` skip** (not `showApLive`, not overlay open-gate, not AP success close, not overlay-policy body). Re-census lines at impl.
- `src/ui/hud.css` **label pointer-events + dest-select focus only**

Must **not** claim `src/game/autopilot.js`, `src/systems/gate.js`, `src/systems/controls.js`, `src/systems/hail.js`, `src/systems/hud.js` toasts, `src/game/save.js`, `showApLive` rewrite, `overlay-policy.js`, or WAVE117 close pins. This worker wrote **no** `src/`.

## Honor

- Wishlist Idea inbox P2 NAV/A11Y chart-label — cite, do not edit.
- `docs/Nav05HandoffDesign.md` — `showApLive`; cite; do not rewrite.
- Wave 120 sibling **PR1 chart-close-on-AP** — Autopilot button success `setOpen(false)`; do not fight; do not census that branch as this leftover.
- Wave 120 sibling **PR1 toast-flood** — call out only; no extra toast / `commLine`.
- Overlay mutex — cite; do not raise z; do not skip hail flush.
- CTL-01 KeyJ — cite, do not remap. Do not edit `controls.js`.
- `docs/OwnerDecisions*.md` — cite, do not edit. No `docs/OwnerDecisionsWave120.md`.
- Do not steal `out/w120/toast/**`, `out/w120/chartclose/**`, `out/w118/**` (read ok), `out/w117/**`, `out/w116/**`.
- No wishlist. No `PROGRESS.md`. No `docs/Ctl02*` / `docs/Ctl01*` / `docs/Hud*` / `docs/Nav06*` edits.

## Coupling for orchestrator

- Wave 120 chart-close sibling writes `galaxychart.js` **engage-success close only**. This leftover’s later PR1 writes **labels / dest `<select>` / click helper / existing KeyM typing skip**. Disjoint symbols in one file. Re-census at impl. Re-grep `showApLive` after merge.
- Designer Major (typeahead M closes chart): **closed in freeze**. Do **not** CONSUME. Serial stays **PR1 chart-label**.
- Wave 120 toast sibling writes `hud.js` toast + optional `save.js` source tag. Chart-label must **not** emit extra `commLine` (`plotRoute` already does).
- Overlay already landed: `overlay-policy.js`; chart open-gate. Do not revert.
- NAV-05 `showApLive` stays sibling-owned.
- `flags.chartOpen` is AP steer-freeze. Plot must **not** close the chart.
- `gate.js` stays sole `jumpRequested` writer.
- Wave 40 title `systems[0]` capture still swallows keys. Keep that. No new listener.
- HUD-01 empty hub. Digit 0/8/9 stay.

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed. `[NO BROWSER COVERAGE]` is correct for this markdown freeze. No process to stop. Reduced coverage: census is code + inventory; live click not run.
