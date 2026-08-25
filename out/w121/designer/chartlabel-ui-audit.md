# UI Audit: NAV-07 PR1 chart-label (live UI)

**Auditor:** `[designer]` (independent of `out/w121/chartlabel/ui-audit.md`)
**Scope:** Wave 121 serial **PR1 chart-label**. Live UI in `src/systems/galaxychart.js` + `src/ui/hud.css` only. Confirm visible Destination label, dest under desc, dest focus ring, label click target, keyboard dest pick, KeyM typeahead does not close the chart, Escape still closes, no dest autofocus on open, chart z stays, Autopilot / Close still named, no `innerHTML` names, HUD-01 empty 80 px hub, no dest pip on the aim glass.
**Review file:** `out/w121/designer/chartlabel-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Nav07ChartLabelDesign.md`, merge law `out/w120/chartlabel/shared-contract.md` (wins on conflict), worker self-audit `out/w121/chartlabel/ui-audit.md` (read, not copied). Static audit of landed DOM/CSS. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w120/chartlabel/shared-contract.md` wins if the brief forks. Findings bind **this** landed PR1, not a later leftover invent.

## UI Audit: Galaxy Chart labels + Destination `<select>`

### Summary

PR1 lands a visible labeled Destination `<select>` under the chart description, turns authored/pinned/hub labels into the same plot target as hit discs, and skips KeyM close while that select (or any typing focus) is active. Escape still closes. Autopilot / Close stay named in the top actions row. Chart z stays 30. Hub stays an empty 80 px reticle. No dest pip on the aim glass. Names use `textContent`. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; frozen keyboard path), 2 suggestions. Worker self-audit CLEAN holds. Independent check does not raise severity.

### What's done well

- Visible name: `<label class="rw-galaxy-dest-label">` text `Destination` with `htmlFor` / `for="rw-galaxy-dest"` (`galaxychart.js` 196–203). Clicking the label focuses the select.
- Dest sits **under the desc**, not in the title/actions row. DOM: header (Clear / Autopilot / Close) → `#rw-galaxy-chart-desc` → `.rw-galaxy-dest-field` → SVG (`galaxychart.js` 394–397). CSS is in-flow flex, no absolute overlay (`hud.css` 2022–2028).
- Keyboard dest pick is a real `<select id="rw-galaxy-dest">` **outside** `svg[role=img]`. Placeholder `Plot a system` (`value=""`) is a no-op (`galaxychart.js` 204–207, 742–746). Charted options use `textContent` names, `sanitizeSystemId` values, sorted `localeCompare` (208–227).
- Tab order: Clear → Autopilot → Close → Destination. Dest is after those buttons in DOM. No SVG `tabindex` / `role=button` on labels. No focus trap. No `autofocus`. `setOpen(true)` does not call `destSelect.focus()` (`482–502`).
- `:focus-visible` on `.rw-galaxy-dest` matches chart buttons: accent border + `outline: 2px solid var(--rw-accent)` / `outline-offset: 2px` (`hud.css` 2003–2013 vs 2052–2058). Select `min-height: 24px` (2038–2041). Discs stay `HIT_CSS_DIAMETER` 24 (`galaxychart.js` 48).
- Label click target: `.rw-galaxy-label` has `pointer-events: all; cursor: pointer` (`hud.css` 2165–2172). Labels get `data-system-id` when sanitize succeeds (`galaxychart.js` 340–350). Label layer is painted **after** the hit layer (353–355), so the glyph is the extra hit, not a grown disc.
- Shared `activateSystem` for disc click, label click, and dest `change` (`726–752`). Hover `pointerover` uses `isPlotTarget` then `applyHoverId` only — never `plotRoute` (`754–758`).
- KeyM typeahead: **existing** window `keydown` only. If `open` and `isTypingFocus()` (live export includes `SELECT`, `overlay-policy.js` 72–80), do **not** `setOpen(false)`. Fallback: `activeElement.id === 'rw-galaxy-dest'`. Helper miss closes as live (`galaxychart.js` 766–779). Not a remap. Not a second listener.
- Escape while open still `setOpen(false)` with no dest skip (`786–788`). Close blurs `activeElement` in the chart root (`493–500`). Sibling Autopilot success still owns `setOpen(false)` + blur (`706–721`). Dest does not re-focus.
- Autopilot visible/accessible name stays `Autopilot` (`170–171`; flying retargets to `Cancel autopilot` in `syncApButton` 665–675). Close accessible name stays `Close galaxy chart` (`177–179`). Clear stays `Clear route`. Dest does not `preventDefault` on those buttons.
- `showApLive` stays `textContent` + `aria-live="polite"` (`157–162`, `644–647`). No second live region. No `aria-live=assertive`.
- `innerHTML` / `insertAdjacentHTML` / `document.write` in `galaxychart.js`: **none**. Labels and options use `textContent`.
- Chart z-index stays `30` (`hud.css` 1909). No toast z change. No dest-list animation. `reducedMotion` still kills chart animation only (`2305–2308`).
- HUD-01: `.rw-reticle` remains `80px` × `80px` (`hud.css` 184–191). Dest control is chart-panel only. No dest pip, gauge, or `#hud` child from this PR.

### Task checklist (static)

| Check | Result | Cite |
|---|---|---|
| Visible Destination label | **Pass.** Real `<label>` + `htmlFor` | `galaxychart.js` 196–200 |
| Dest under desc | **Pass.** After desc, before SVG; not in actions | `galaxychart.js` 394–397; `hud.css` 2022–2028 |
| Dest focus ring | **Pass.** Same accent outline as AP/Close | `hud.css` 2052–2058 |
| Label click target | **Pass.** `pointer-events: all` + `data-system-id` + `isPlotTarget` | `hud.css` 2165–2172; `galaxychart.js` 89–96, 340–350, 748–752 |
| Keyboard dest pick | **Pass.** Native `<select>` `change` → `activateSystem` | `galaxychart.js` 201–227, 742–746 |
| KeyM typeahead must not close | **Pass.** Existing handler skips `isTypingFocus` / dest id | `galaxychart.js` 766–779; `overlay-policy.js` 72–77 |
| Escape still closes | **Pass.** No dest skip | `galaxychart.js` 786–788 |
| No dest autofocus on open | **Pass.** `setOpen(true)` only unhides + hit radii | `galaxychart.js` 482–502 |
| Chart z stays | **Pass.** `z-index: 30` | `hud.css` 1909 |
| Autopilot / Close still named | **Pass.** | `galaxychart.js` 170–179 |
| No `innerHTML` names | **Pass.** | `galaxychart.js` (grep 0) |
| Empty 80 px hub | **Pass.** | `hud.css` 184–191 |
| No dest pip on aim glass | **Pass.** Dest is chart overlay only | `galaxychart.js` 194–230, 401–402 |

### Findings

#### 🟡 Minor: Native dest list is long (~100 charted ids)
**Location:** `src/systems/galaxychart.js:208–227`
**Issue:** The frozen keyboard path is one native `<select>` of every charted system. On a short viewport the OS list is long. Typeahead still works; visual scan is slow.
**Fix:** None in PR1. Contract forbids a custom listbox and a required SVG tab trap.
**Justification:** Generated unlabeled systems need names. Smallest additive a11y. Status: accepted.

#### 🟡 Minor: SVG label hit is glyph-only (letter-spacing gaps)
**Location:** `src/ui/hud.css:2165–2172`; `src/systems/galaxychart.js:340–350`
**Issue:** `.rw-galaxy-label` uses `pointer-events: all` on SVG `<text>` with `letter-spacing: 0.08em`. Some engines hit the glyphs, not a padded box, so clicks between letters can miss the label and fall through to the disc or empty map.
**Fix:** None in PR1 unless playtest shows misses. Do **not** grow `HIT_CSS_DIAMETER` over Autopilot / Close. Dest `<select>` remains the keyboard path.
**Justification:** Contract enlarges the target by including the label glyph, not a huge disc. Discs stay 24 CSS px. Status: accepted.

#### 💡 Suggestion: Dest control has no `min-width: 24` on the label text
**Location:** `src/ui/hud.css:2030–2041`
**Issue:** `.rw-galaxy-dest-label` is text, not a 24×24 control. `.rw-galaxy-dest` is `min-height: 24px` and `flex: 1` (wide in the panel).
**Fix:** None. WCAG 2.5.8 applies to the select. Top-row buttons already keep 24 px.
**Justification:** Hit-target law is met on the control that receives the pointer. Status: no change.

#### 💡 Suggestion: Chart desc does not name the Destination list
**Location:** `src/systems/galaxychart.js:192`
**Issue:** Desc still says click a system and that M or Escape closes. It does not mention the Destination list. The visible `<label>` already names the control.
**Fix:** Optional later copy only. Do not steal Autopilot / Close names. Do not add a second live region.
**Justification:** Visible label + `htmlFor` is the accessible name. Status: no change in PR1.

### Steal / freeze honor (Blocker if PR1 did these)

| Forbidden | Live | Result |
|---|---|---|
| Raise `.rw-galaxy-chart` z | `z-index: 30` (`hud.css` 1909) | **Pass.** |
| Autofocus dest on `setOpen(true)` | No `.focus()` on dest | **Pass.** |
| Focus trap / SVG tab loop | No `tabindex` on labels | **Pass.** |
| Skip Escape while dest focused | Escape still `setOpen(false)` | **Pass.** |
| Dest `<select>` without KeyM typing skip | Existing handler + `isTypingFocus` | **Pass.** |
| New KeyM window listener / remap | One `keydown` at 764 | **Pass.** |
| `innerHTML` names | grep 0 | **Pass.** |
| Plot on hover | `applyHoverId` only | **Pass.** |
| Close chart on dest/label plot | `activateSystem` does not `setOpen` | **Pass.** |
| Fight AP success close | AP click still `setOpen(false)` 706 | **Pass.** |
| Rewrite `showApLive` | Unchanged `textContent` helper 644–647 | **Pass.** |
| Grow discs over chrome | `HIT_CSS_DIAMETER` 24 | **Pass.** |
| Dest over SVG / Autopilot / Close | In-flow under desc | **Pass.** |
| HUD-01 hub child / dest pip | 80 px reticle; no dest in `#hud` | **Pass.** |
| Digit 0/8/9 / KeyJ / `controls.js` | Not this write-set | **Pass.** |
| Pause on pick | No `flags.paused` write | **Pass.** |
| Persist dest / focus | No `localStorage` / `WORLD_FIELDS` | **Pass.** |
| `aria-live=assertive` / second live region | polite AP + hover only | **Pass.** |
| Dest animation / `reducedMotion` invent | none | **Pass.** |

### Accessibility / theming / states (static)

| Check | Result |
|---|---|
| Contrast / tokens | Dest uses `--dim` / `--white` / `--panel-edge` / `--rw-accent`. Label `#7d93ab` on panel ~`#09101e` is about 6:1 (AA for 10 px). Contrast mode lightens `--dim` (`hud.css` 2280–2285). Color is not the only cue: option **names** and label **text**. |
| Keyboard | Dest `<select>` is the system picker. Typeahead M does not close. Escape closes. Clear / Autopilot / Close stay first in tab order. |
| Names | Destination, Plot a system, Autopilot, Close galaxy chart, Clear route. Option names are catalog `textContent`. |
| Focus | `:focus-visible` 2 px accent, offset 2 px. No autofocus. Close/AP-success blur still wins. |
| Semantic HTML | Real `<label>` + `<select>` + `<option>`. Dialog `aria-labelledby` / `aria-describedby` unchanged. SVG `role=img` stays. |
| Hit targets | Select ≥ 24 px tall. Buttons 24×24. Discs 24 CSS px. Labels add glyph area. |
| States | Empty dest = no-op. Plotted/blocked sync `select.value` (`561–563`). Hover inspect. AP unavailable still named. No loading spinner (catalog is init-time). No dest-disabled (not needed). |
| Responsive | Dest `flex-shrink: 0`; SVG `min-height: 0`. Dest does not cover the header. Long native list is the accepted Minor. |
| Overlay | Chart z 30, below pause 50 / settings 80 / fatal 99. Hail z 40 not stolen. |

### Worker self-audit

`out/w121/chartlabel/ui-audit.md` is CLEAN (0 Blocker, 0 Major). Independent designer pass agrees. Extra Minor (glyph hit gaps) does not raise lifecycle severity. Extra Suggestion (desc copy) is optional.

### Method

Static DOM/CSS audit only. Verifier owns live browser. Did not start Vite. Did not edit `src/`.
