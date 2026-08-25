# RIMWARD NAV-07 leftover chart-label a11y

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-07 leftover chart-label a11y |
| **Author** | Wave 120 chart-label leftover integrator |
| **Date** | 2026-08-25 |
| **Status** | Wave 120 leftover freeze — markdown only. Bindings do not change here. |
| **Wave** | 120 — markdown + merge law. Later serial **PR1 chart-label** (named only). |
| **Owner request** | Census live Galaxy Chart labels vs hit discs vs keyboard. If labels still do not activate systems, hit discs stay small/invisible/mouse-only, and there is no accessible name / keyboard focus / searchable destination list, leftover is **REAL**. Freeze later serial **PR1 chart-label** (named only). If already gone, freeze **CONSUME** and serial **none**. |
| **Merge law** | [`out/w120/chartlabel/shared-contract.md`](../out/w120/chartlabel/shared-contract.md). If this document and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. Digit 0 shipyard. Digit 8/9 stay. KeyM stays. CTL-01 KeyJ — cite, do not remap. Do not edit `controls.js`. Overlay mutex — cite, do not steal; do not raise chart z. NAV-05: later write-set must **not** rewrite `showApLive` / `#rw-galaxy-ap-live`. Wave 120 sibling **PR1 chart-close-on-AP** writes Autopilot **button** success `setOpen(false)` only — call out, do not solve, do not fight. Wave 120 sibling **PR1 toast-flood** — call out, do not solve. `state.js` READ-ONLY later. No persist key. No UU. No SKU. No new Digit. `innerHTML` forbidden later. Kit mutate omit. Aim-glass gauges stay off. Do **not** edit the wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Nav06ChartCloseDesign.md`, `docs/Hud*`, or `docs/OwnerDecisions*`. Do **not** write `docs/OwnerDecisionsWave120.md`. Do **not** steal `out/w120/toast/**`, `out/w120/chartclose/**`, `out/w118/**` (read ok), `out/w117/**`, `out/w116/**`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 120 census) | [`out/w120/chartlabel/current-chartlabel-inventory.md`](../out/w120/chartlabel/current-chartlabel-inventory.md) |
| Merge law | [`out/w120/chartlabel/shared-contract.md`](../out/w120/chartlabel/shared-contract.md) |
| Wave 120 security review | [`out/w120/chartlabel/security-review.md`](../out/w120/chartlabel/security-review.md) |
| Wave 120 design-doc review | [`out/w120/chartlabel/code-review.md`](../out/w120/chartlabel/code-review.md) |
| Wave 120 UI audit | [`out/w120/chartlabel/ui-audit.md`](../out/w120/chartlabel/ui-audit.md) |
| Wave 120 notes | [`out/w120/chartlabel/notes.md`](../out/w120/chartlabel/notes.md) |

Siblings overlay-priority / NAV-05 / CTL-01 / toast-flood / close-chart-on-AP, wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Nav06ChartCloseDesign.md`, `docs/Hud*`, and `docs/OwnerDecisions*` are **other workers**. **Do not edit** those paths. **Do not write** `src/`. **Do not steal** sibling Wave 120 toast/chartclose paths or `out/w118/**` / `out/w117/**` / `out/w116/**`.

**This is not CTL-01 KeyJ.** **This is not overlay mutex.** **This is not NAV-05 `showApLive` rewrite.** **This is not P1 toast-flood.** **This is not P2 close-chart-on-AP.** Wishlist chart-label a11y is **INBOX**. Census still finds **labels do not activate; discs are invisible mouse-only; no dest list**.

---

## Overview

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox — **cite, do not edit**):

> IDEA (P2, NAV/A11Y): Galaxy-chart labels are not clickable and route plotting depends on small invisible mouse-only SVG hit discs; make labels activate their systems, enlarge the effective targets, add accessible names and keyboard focus, and provide keyboard navigation or a searchable destination list.

Wave 120 this worker lands markdown only. Bindings do not change here.

Census (code wins): `.rw-galaxy-label` is `pointer-events: none` with no `data-system-id`. SVG click and hover require `isHitDisc`. Hit discs are transparent, 24 CSS px on open, mouse-only. Window keys are KeyM / Escape. SVG is `role=img`. Labels exist only for authored ∪ pinned ∪ hub (~12). `SYSTEMS` is authored 7 + generated 94. There is no dest `<select>`. Leftover is **REAL**. Not CONSUME.

This leftover is **labels activate the same plot path as hit discs** plus **one named HTML destination `<select>`** for all charted systems. It is not a pause. It is not a teleport. It is not a jump emit. It is not a toast. It is not overlay mutex. It is not a rewrite of `showApLive`. It is not Autopilot success close.

This document is the integrator for a **later** implementation wave.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. KeyM stays. Do not invent UU. Do not steal Digit 0/8/9. Do not remap KeyJ.

Wave 120 deputize (recorded here and in the contract; owner may override after playtest): labels get `data-system-id` and pointer-events; click uses shared `activateSystem` (same as discs: current → `clearRoute`, else `plotRoute`). Keep `HIT_CSS_DIAMETER` 24. Enlarge the **effective** target by including the label box. Do **not** grow discs over Autopilot / Close. Add one labeled dest `<select id="rw-galaxy-dest">` built once at init for **all charted** systems (`textContent` names, `sanitizeSystemId` values), **under the desc** (Clear / Autopilot / Close stay in the top actions row). Sync `select.value` from `nav.dest` on `retargetPlot` (no option rebuild). That select is the keyboard + accessible-name path. On the **existing** KeyM handler, if the chart is open and `isTypingFocus()` (call live `overlay-policy.js`; SELECT included), **do not** `setOpen(false)`. That skip is **not** a KeyM remap and **not** a new listener. Escape still closes. Do **not** rewrite overlay-policy. Pointerover **must** share `isPlotTarget` (inspect only). Do **not** require SVG roving tabindex as PR1. Do not plot on hover. Do not pause. Do not persist. Do not autofocus. Do not fight sibling `setOpen(false)` on AP success. Leftover stays **REAL**. Serial stays **PR1 chart-label**.

If census had proved labels already activate, discs already named and keyboarded, **and** a dest list already exists, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w120/chartlabel/current-chartlabel-inventory.md`](../out/w120/chartlabel/current-chartlabel-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Labels | authored ∪ pinned ∪ hub; `textContent` name; **no** `data-system-id` | `galaxychart.js` **52–53**, **283–291** |
| Label CSS | `pointer-events: none` | `hud.css` **2126–2132** |
| Hit discs | transparent; `data-system-id`; 24 CSS px on open | **46**, **272–280**, **443–460**; `hud.css` **2110–2115** |
| `isHitDisc` | class token `rw-galaxy-hit` | **77–85** |
| Click plot | `isHitDisc` only → `clearRoute` / `plotRoute` | **659–668** |
| Hover | `isHitDisc` only; `hoverModel` inspect | **670–676** |
| Keyboard systems | **none** | **682–697** KeyM / Escape |
| Dest list | **none** | — |
| SVG AT | `role=img` one name | **195–201** |
| Tab order | Clear / Autopilot / Close | **133–163** |
| Catalog | 7 authored + 94 generated | `state.js` **580–583** |
| AP button (sibling) | `tryEngage`; empty token does not close **at this census**; sibling may add `setOpen(false)` | **633–650** — **do not steal** |
| `showApLive` | `textContent`; NAV-05 | **586–590** — **do not rewrite** |
| Overlay | `canOpenPlayCard` / z 30 | **5**, **421–425**; `hud.css` **1899–1916** |
| `innerHTML` | **none** | grep 0 |
| Persist chart focus | **none** | keep none |

The player who reads a label and clicks the name does not plot. The player who cannot use a mouse cannot pick a generated system.

### Pain points

- Inbox P2: labels are not clickable. Plot depends on invisible discs.
- Generated systems have **no** labels. Label-click alone does not unblock keyboard play.
- SVG `role=img` hides child names from AT. Accessible names belong on an HTML dest list, not 100 presentational circles.
- A naive later PR that tabs every disc fights overlay tab order and sibling AP-close blur.
- A naive later PR that grows discs to 200 px covers Autopilot / Close and steals overlay.
- A naive later PR that plots on hover steals NAV-04.
- A naive later PR that `innerHTML`s `sys.name` is XSS.
- A naive later PR that persists last dest lies after load.
- A naive later PR that remaps KeyJ steals CTL-01.
- A naive later PR that closes the chart on plot fights sibling AP-close and NAV-05 live line.
- A naive later PR that toasts each plot steals toast-flood (`plotRoute` already `commLine`s).
- A naive later PR that rewrites `showApLive` steals NAV-05.

### Why now (design) / why not now (code)

The owner asked for the chart-label leftover integrator so a later serial can make labels plot and give keyboard dest pick **after** overlay mutex, NAV-05 live line, and sibling AP-close law exist. Inventory shows no label activate and no dest list. Merge law can exist without touching `src/`. Implementation waits so overlay, `showApLive`, AP-close, toast-flood, KeyJ, persist, and freeze-the-sim stay frozen. Wave 120 this worker does not ship `src/`.

If census had proved the inbox already gone, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Goals & Non-Goals

### Goals

1. Document live labels, `isHitDisc`, click/hover, keyboard, aria from **live code**.
2. Freeze leftover = **label activate + named dest `<select>`**. Not CONSUME. Serial is **not** none.
3. Freeze deputize: labels plot via shared `activateSystem`; dest `<select>` for all charted systems; enlarge via label box; keep 24 CSS px discs. Owner may override after playtest. Do not park.
4. Freeze: do **not** require SVG roving tabindex as PR1. Do **not** plot on hover. Do **not** close chart on plot.
5. Freeze persist: **none** new. `state.js` READ-ONLY. No UU. No SKU. No new Digit.
6. Freeze HUD-01 empty hub. Digit 0/8/9 stay. KeyM stays. KeyJ stays CTL-01.
7. Freeze later copy via `textContent`. `innerHTML` forbidden.
8. Freeze jump: `gate.js` sole `jumpRequested` writer. Do not skip zone/charge. Do not teleport.
9. Freeze overlay coupling: do not raise z. Do not skip hail flush. Do not write `overlay-policy.js`.
10. Freeze siblings: do not fight AP success `setOpen(false)`. Do not steal toast channel.
11. Freeze a serial PR plan. This wave writes the document. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No pause-the-sim. No teleport. No skip zone/charge.
- No NAV-05 `showApLive` rewrite. No `#rw-galaxy-ap-live` node rewrite.
- No Autopilot **button** success close. No WAVE117 stay-pin retune.
- No `autopilot.js` `jumpRequested`. No steal of `tryEngage`.
- No CTL-01 KeyJ remap. No `controls.js` edit.
- No overlay mutex rewrite. No `hail.js` write.
- No HUD-02 combat rails. No HUD-01 hub child. No new Digit.
- No `state.js` write. No WORLD_FIELDS.
- No P1 toast-flood. No extra `commLine` on plot.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Nav06ChartCloseDesign.md`, `docs/Hud*`, Bio*, Msn*, Rep*, Tgt*, OwnerDecisions*.
- Do not write `docs/OwnerDecisionsWave120.md`.
- Do not fix known boot FAILs.
- Do not steal `out/w120/toast/**`, `out/w120/chartclose/**`, `out/w118/**`, `out/w117/**`, `out/w116/**`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **Yes** — labels/hits/keyboard holes live | Inventory §10 |
| CONSUME? | **No**. Serial is **not** none | Census |
| New persist key? | **No** | Contract §0.6 |
| `state.js` write? | **No** | Contract §0.5 |
| Pause under picker? | **No** | Freeze-the-sim |
| Labels activate? | **Yes** — same `activateSystem` as discs | Inbox |
| Enlarge how? | Label box in the hit; discs stay 24 CSS px | Do not cover Autopilot |
| Keyboard path | Named dest `<select>` | Smallest additive; covers unlabeled generated |
| KeyM dest typeahead | Existing KeyM close skips `isTypingFocus()` | Designer Major; not a remap |
| Dest layout | Under desc; AP/Close stay top actions | Do not shrink chrome |
| SVG tab trap? | **No** as required PR1 | Contract §0.1 |
| Close chart on plot? | **No** | Sibling AP-close |
| `showApLive` rewrite? | **No** | NAV-05 |
| Jump emit from chart? | **No** | `gate.js` sole writer |
| Overlay fight? | **No** | Overlay sibling |
| Toast? | Call out only | Other inbox |
| Named PR1? | **PR1 chart-label** | REAL leftover |

### 2. Current chart pick (do not break NAV-01 / NAV-04 / NAV-05 / overlay / Wave 40)

Title stays `systems[0]` capture. Settings KeyO stays z 80. Pause KeyP stays. Chart still sets `flags.chartOpen`. Click disc still plots. Hover still inspects. Sibling NAV-05 still paints `showApLive`. Sibling Wave 120 PR1 chart-close still owns Autopilot success `setOpen(false)`. Later PR1 **adds** label hits + dest `<select>`. It does **not** rewrite `showApLive`. It does **not** close on plot.

### 3. Smallest additive punch (later)

See contract §0.1. Shared `activateSystem`. Labels pointer-events + `data-system-id`. One dest `<select id="rw-galaxy-dest">` once at init under the desc. Existing KeyM close skips `isTypingFocus()`. Hover `isPlotTarget` inspect only. No new key bind. No KeyM remap. No pause. No overlay-policy write.

### 4. Neighbours

| Module | This leftover does | This leftover does not |
|---|---|---|
| `galaxychart.js` | later PR1: labels + dest `<select>` + `activateSystem` + existing KeyM typing skip; **re-census lines at impl** | rewrite `showApLive`; AP success close; overlay open-gate; KeyM remap |
| `hud.css` | later: label pointer-events; dest-select focus | z-index; toast; overlay geometry |
| Overlay mutex (sibling) | consume | rewrite; hail.js |
| `overlay-policy.js` | **call** live `isTypingFocus` | rewrite body; second helper |
| `autopilot.js` | none | `jumpRequested`; `tryEngage` steal |
| `gate.js` | none (sole jump writer) | — |
| `controls.js` | none | KeyJ; KeyM remap |
| `nav.js` | **call** `plotRoute` / `clearRoute` / `sanitizeSystemId` | rewrite BFS |
| `chart-hover.js` | **call** `hoverModel` | rewrite |
| `hail.js` / `hud.js` | none | toasts; Digit; combat rails |
| `save.js` | none | persist dest |
| `state.js` | none | write |
| Title / origins / settings | honor capture | steal Enter; steal KeyO |
| Sibling chart-close | do not fight `setOpen(false)` | WAVE pin retune |
| Sibling toast-flood | no extra toast | linger / source tag |

### 5. Serial PR plan

Matches contract §3. **Named only. Do not implement in Wave 120.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 chart-label** | label activate; dest `<select id="rw-galaxy-dest">` under desc; shared helper; CSS pointer-events + dest focus; existing KeyM `isTypingFocus` close skip; hover `isPlotTarget`; **re-census** `galaxychart.js` | persist; pause; KeyJ; `showApLive` rewrite; AP success close; WAVE pins; toast; Digit steal; `innerHTML`; overlay rewrite; SVG tab trap; plot-on-hover; KeyM remap; new KeyM listener |
| **PR2 stills (optional)** | Playtest stills: label click plots; dest list plots a generated system | Required with PR1; toast-flood; known FAILs |
| **PR3 census (optional skip)** | Re-grep: label pointer-events; dest select; no `innerHTML`; `showApLive` unchanged | New world field |

First remaining serial for **this** leftover is **PR1 chart-label**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim Autopilot success close. It must not land in this worker.

### 6. Picture

Reuse live chart dialog, live discs, live `plotRoute`. Player opens KeyM. Clicks a **name** → route plots. Tabs to **Destination** under the desc. Types a generated name (including **M**). The chart **stays**. Enter/change plots. Autopilot / Close stay in the top row. Sibling AP success still closes the map (other leftover). Hover still inspects, does not plot.

No hub pip. Digit 0 stays shipyard. KeyM stays. KeyJ stays CTL-01.

---

## Player outcome (later serial; freeze here)

Fly. Open Galaxy Chart with M. Click the **label** “Freehold Drift”. Route plots (or clears if already there). Same as a disc click.

Fly. Open the chart. Tab to **Destination** (under the desc). Pick a **generated** system with the keyboard. Type **M** as typeahead. The chart **stays open**. Route plots. No mouse on an invisible disc. Escape still closes.

Fly. Hover a disc or a now-active label. Readout still inspects. Hover does **not** plot.

Fly. Click Autopilot. **Sibling** leftover may close the chart on success. This leftover does **not** close on plot and does **not** fight that close.

Pause is still P. Settings is still O. Title still captures. KeyM still toggles the chart. Digit 0/8/9 stay.

`reducedMotion` is unchanged. No new motion.

**Overlay mutex** is **not** this work. **NAV-05 AP live line** is **not** this work. **CTL-01 KeyJ** is **not** this work. **P1 toast-flood** is **not** this work. **P2 close-chart-on-AP** is **not** this work.

---

## Security

See [`out/w120/chartlabel/security-review.md`](../out/w120/chartlabel/security-review.md).

- Title capture already swallows most keys. Do not break `systems[0]`. Later PR1 must not add a capture listener or a new KeyM listener. The **existing** KeyM close must skip `isTypingFocus()` so dest typeahead **M** does not close the map.
- Dest `<select>` values pass `sanitizeSystemId`. Names are `textContent`, never `innerHTML`.
- Prototype-safe option build: `Object.keys` + `hasOwn`. Never `for-in` a save blob.
- Do not persist dest or focus.
- Fail-closed never freeze the sim. Never throw. Never set `flags.paused`.
- Do not parse untrusted SVG/HTML into the chart.

---

## Acceptance direction (implementation wave)

1. Click a `.rw-galaxy-label`: `activateSystem` runs (same as disc). Boot or playtest cannot leave labels as paint-only.
2. Dest `<select>` change with a charted id: same `activateSystem`. Generated unlabeled systems are reachable from the keyboard.
3. Dest `<select>` focused, player types KeyM: chart **stays**. `isTypingFocus()` skip on the **existing** handler. Escape still closes. Overlay-policy body unchanged.
4. Empty dest value: no-op. Clear button still clears.
5. Hover still does not plot. `hoverModel` body not rewritten. Pointerover uses `isPlotTarget`.
6. `showApLive` body not rewritten. Autopilot success close not claimed.
7. Hail/chart/berth never set `flags.paused` from this leftover.
8. KeyM still the chart bind. KeyJ untouched. Digit 0/8/9 untouched.
9. `gate.js` still the only `jumpRequested` writer. Zone 60 unchanged. No teleport.
10. Overlay mutex still owns open-gate. This PR does not retune hail/berth and does not write `overlay-policy.js`.
11. No new `WORLD_FIELDS`. No `innerHTML`.
12. Known boot FAILs untouched.

---

## Alternatives considered

| Alternative | Why not |
|---|---|
| Freeze CONSUME / serial none | Census: labels inert; discs mouse-only; no dest list |
| SVG roving tabindex as required PR1 | 100 stops; fights sibling blur; `role=img` children | Dest `<select>` is smaller |
| Labels-only, skip dest list | Generated systems stay unnamed and unkeyboardable |
| Search `<input>` + custom listbox | Heavier than native `<select>` typeahead; more innerHTML risk |
| Dest `<select>` without KeyM typing skip | Typeahead **M** closes the map (designer Major) |
| Remap KeyM / new KeyM listener | Forbidden; skip lives on the **existing** handler |
| Skip Escape while dest focused | Frozen no unless playtest |
| Grow discs to 44+ CSS px as the leftover | Covers Autopilot/Close if unbounded; 24 already exists; enlarge via **labels** |
| Plot on hover | Steals NAV-04 |
| Close chart on dest pick | Fights sibling AP-close and inspect-then-engage |
| Pause sim while picking | Drops events; freeze-the-sim |
| `innerHTML` names | XSS |
| Persist last dest | Hostile save / lie after load |
