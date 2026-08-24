# UI Audit: NAV-04 galaxy chart hover (Wave 96)

**Reviewer:** designer (UI/UX audit, review only)  
**Scope:** `src/systems/galaxychart.js`, `src/ui/hud.css` (`.rw-galaxy-hover*`, `.is-hover`, reduced-motion), `src/game/chart-hover.js`  
**Merge law:** `out/w95/nav04/shared-contract.md`  
**Brief:** `docs/Nav04HoverDesign.md`  
**Product source:** not edited

### Summary

The hover inspect surface is a reserved in-flow strip under the SVG, Digit 9 standing copy, and a dashed extra ring. Idle, empty, and hover states, a11y live-region gating, contrast tokens, and plot-class composition match the contract. No Blocker or Major.

### Verdict

**CLEAN** — no 🔴 Blocker, no 🟠 Major.

---

### What's done well

- **Placement.** `hoverReadout` is appended after the SVG and before `.rw-galaxy-plot-status` (`galaxychart.js` 333–337). The strip cannot cover nodes, plot/hub strokes, or header Clear / Autopilot / Close.
- **Reserved idle height.** `.rw-galaxy-hover` uses `min-height: 4.05em` and `visibility: hidden` when idle (`hud.css` 1921–1935), so SVG scale does not jump under the pointer. `flex-shrink: 0` keeps the strip from collapsing.
- **Hit path.** Same `isHitDisc` + `sanitizeSystemId` as click (`galaxychart.js` 655–661, 644–653). Hover does not call `plotRoute` / `clearRoute`, does not `preventDefault` / `stopPropagation`, and does not write `world.nav`.
- **Sticky hover.** `pointerover` on hit discs plus `pointerleave` on the SVG (`655–665`) keeps the id until another disc or leave-svg. No native `title`. No child `pointerout` flicker.
- **Highlight is not fill-only.** Node `.is-hover` is a thin dashed white stroke, gated off dest/hop/current/unreachable (`hud.css` 1824–1830). Extra `.rw-galaxy-hover-marker` is a dashed white ring, `pointer-events: none` (`1869–1877`, `galaxychart.js` 304–311). Dest keeps the square; hop keeps dashed accent; current keeps solid white + pulsing accent marker.
- **Plot classes survive.** `retargetPlot` removes only `is-dest` / `is-hop` / `is-unreachable` (`galaxychart.js` 481). `.is-hover` is not stripped.
- **Copy model.** `hoverModel` maps missing/reserved/non-FACTIONS keys to Unknown; `independent` to Independent; `unknowables` to Unknowables; `hollow` to Hollow Reach (`chart-hover.js` 38–66). Panel lines are `Control:` / `Standing:` with explicit tokens (`galaxychart.js` 349–396). No Contested / Unclaimed. No local-standing row.
- **Digit 9 standing.** `Faction: Rank (±N)` via `standingRead` + `rankFor` + signed `Math.round` (`355–360`). Independent still shows standing on key `independent`.
- **Freshness without spam.** `update()` rebuilds the model while hovered (`708–715`). `paintHoverReadout` writes `textContent` only when `id` + standing line change (`389–396`).
- **Live region.** `role="status"` `aria-live="polite"` (`315–317`). Idle sets `aria-hidden="true"` and clears leftover name (`377–386`).
- **Tokens.** `--white`, `--dim`, `--rw-accent`, `--rw-text-scale`. `body.rw-colorblind` / `rw-contrast` / `rw-reduced-motion` already wrap `.rw-galaxy-chart` (`1956–1991`). No hover animation.
- **Hit targets.** `HIT_CSS_DIAMETER = 24`; radii refresh on open and resize (`45`, 429–446, 425, 680–682).
- **No `innerHTML`.** `createElement` / `svgEl` + `textContent` / attributes only. Grep is 0 in `galaxychart.js` and `chart-hover.js`.
- **Keyboard (contract).** Chart keydown stays KeyM / Escape only (`667–678`). No WASD / arrow node picker. Header controls remain real `<button>`s with existing `:focus-visible` rings (`hud.css` 1724–1734). Hover does not steal focus.
- **Close clears.** `setOpen(false)` calls `clearHover()` (`420–426`). Docked auto-close uses the same path (`689`).

---

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: idle strip still occupies three line-heights

**Location:** `src/ui/hud.css:1921–1935`  
**Issue:** The reserved `min-height: 4.05em` + `visibility: hidden` keeps an empty gap when nothing is hovered. SVG plot area is slightly smaller on short viewports.  
**Why it is not Major:** `display: none` would change SVG scale under the pointer (PR3 flicker). Contract §4.1 wants a reserved strip.  
**Fix:** Accept. Do not switch idle to `display: none`.  
**Status:** accepted tradeoff

#### 💡 Suggestion: announce the three lines as one unit

**Location:** `src/systems/galaxychart.js:313–317`  
**Issue:** `role="status"` without `aria-atomic="true"` may announce only the standing child when reputation changes mid-hover.  
**Fix (optional):** `hoverReadout.setAttribute('aria-atomic', 'true')` so name + control + standing read together. Not required for polite anti-spam (DOM writes are already gated).  
**Status:** optional

#### 💡 Suggestion: chart description still describes click only

**Location:** `src/systems/galaxychart.js:172` (`aria-describedby`)  
**Issue:** Dialog copy says click-to-plot and M / Escape. It does not mention pointer inspect. Keyboard-only users still cannot pick a node (correct per contract §2.2). Pointer users with a screen reader already get the live strip.  
**Fix (optional):** One authored sentence, e.g. “Point at a system to read its name, control, and standing.” Do not add a node picker.  
**Status:** optional

#### 💡 Suggestion: contrast mode does not thicken the hover ring

**Location:** `src/ui/hud.css:1962–1877` vs plot thicken at `1978–1980`  
**Issue:** `body.rw-contrast` boosts plot stroke width; hover marker stays `1.4`. Pattern (dash + extra ring vs dest square) still distinguishes the cue.  
**Fix (optional):** A slightly wider hover marker under `body.rw-contrast .rw-galaxy-hover-marker` if a later pass tunes contrast.  
**Status:** optional

---

### Checklist (task)

| Check | Result |
|---|---|
| `aria-live` without spam | Pass — write gated on id + standing text (`galaxychart.js:389–396`) |
| `role="status"` | Pass (`316`) |
| Contrast | Pass — name `--white`, meta `--dim`; `body.rw-contrast` remaps both |
| Reduced motion | Pass — no hover animation; overlay `animation/transition: none` (`1987–1991`) |
| Text scale | Pass — `calc(11px * var(--rw-text-scale, 1))`; root `--rw-text-scale` (`1924`, `709–713`) |
| Colorblind tokens | Pass — hover is dashed `--white` ring, not dest `--rw-accent` (colorblind sky) |
| Panel below SVG, not covering nodes / strokes / Clear / Autopilot / Close | Pass |
| Hover highlight distinct from dest / hop / current (not fill-only) | Pass |
| Idle / empty / hover states | Pass — idle hidden + cleared text; hover three lines; close clears |
| Independent / Unknown / Unknowables explicit | Pass |
| Hit targets 24 CSS px discs | Pass |
| No `innerHTML` | Pass |
| No WASD / arrow node picker; header buttons stay in tab order | Pass (correct per contract) |

---

### Copy mapping (spot-check)

| Condition | Control line | Standing line |
|---|---|---|
| `faction` missing / reserved / not in `FACTIONS` | `Control: Unknown` | `Standing: Unknown` |
| `independent` | `Control: Independent` | Digit 9 on Independent |
| `unknowables` (`veil`) | `Control: Unknowables` | Digit 9 on Unknowables |
| `hollow` | `Control: Hollow Reach` | Digit 9 on Hollow Reach |
| Other FACTIONS key | `Control: <FACTIONS[key].name>` | Digit 9 on that name |

Contested / Unclaimed are not printed. Local standing is omitted.
)
