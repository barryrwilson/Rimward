# Wave 121 re-census — PR1 chart-label live lines

**Census time:** 2026-08-25. **Code wins.** Line numbers are 1-based from live `src/` after Wave 121 PR1 chart-label.

**Leftover serial:** **PR1 chart-label** landed in `src/systems/galaxychart.js` and `src/ui/hud.css`.

**Not this leftover:** CTL-01 KeyJ. Overlay hail/chart/berth mutex. NAV-05 `showApLive` rewrite. P1 toast-flood. P2 close-chart-on-AP Autopilot **button** success `setOpen(false)` (live **705–706** — not claimed).

---

## 1. Verdict table

| Question | Live after PR1 | Cite |
|---|---|---|
| Labels activate their systems? | **YES** | Labels set `data-system-id` (**339–349**). CSS `pointer-events: all` (`hud.css` **2165–2172**). Click uses `isPlotTarget` → `activateSystem` (**747–751**). |
| Hit discs still 24 CSS px? | **YES** | `HIT_CSS_DIAMETER = 24` (**48**, **513**). Not grown. |
| Dest `<select>`? | **YES** | `#rw-galaxy-dest` once at init under desc (**194–230**, **394–396**). Visible `<label htmlFor>` (**196–200**). |
| Keyboard among SVG systems? | **Not required** | Dest `<select>` is the keyboard path. No SVG `tabindex`. |
| KeyM close skips dest typing? | **YES** | Existing handler **765–778**. Calls live `isTypingFocus` (import **5**). Fallback `ae.id === 'rw-galaxy-dest'`. Escape still closes (**785–787**). |
| Hover plots? | **NO** | `pointerover` uses `isPlotTarget` then `applyHoverId` only (**753–757**). |
| `showApLive` rewritten? | **NO** | **644–647** `textContent` only. |
| Overlay-policy rewritten? | **NO** | Chart **calls** `isTypingFocus` (`overlay-policy.js` **72–80**). |

---

## 2. Live knobs

| Knob | Live | Cite |
|---|---|---|
| `HIT_CSS_DIAMETER` | 24 CSS px | `galaxychart.js` **48**, **513** |
| `isHitDisc` | class token `rw-galaxy-hit` | **79–87** |
| `isPlotTarget` | hit **or** `.rw-galaxy-label` | **89–97** |
| `activateSystem` | sanitize → current `clearRoute` else `plotRoute` → `retargetPlot(true)` | **726–732** |
| Label build | authored ∪ pinned ∪ hub; `textContent` name; `data-system-id` sanitized | **339–350** |
| Label CSS | `pointer-events: all`; `cursor: pointer` | `hud.css` **2165–2172** |
| Dest `<select>` | built once; `Object.keys` + `Object.hasOwn` + `sanitizeSystemId`; `textContent` names | **194–230** |
| Dest layout | under `#rw-galaxy-chart-desc`; AP/Close stay top actions | **184–200**, **394–396** |
| Dest sync | `select.value` write on `retargetPlot` when plotted/blocked else `''` | **551–562** |
| Click | `isPlotTarget` → `activateSystem` | **747–751** |
| Hover | `isPlotTarget` → `applyHoverId` | **753–757** |
| KeyM | existing window keydown; typing skip | **763–784** |
| `isTypingFocus` | live export; includes `SELECT` | `overlay-policy.js` **72–80** |
| `showApLive` | unchanged | **644–647** |
| AP success close | sibling `setOpen(false)` | **705–706** |
| Chart z | 30 | `hud.css` **1899–1916** |
| `innerHTML` | **none** | grep 0 |
| `for-in` | **none** | dest loop is `Object.keys` |

---

## 3. Proof (code wins — PR1 landed)

| Sequence | Live result |
|---|---|
| Click “Freehold Drift” glyph | Label is a plot target. Current system → `clearRoute`. Else `plotRoute`. |
| Tab through open chart | Clear → Autopilot → Close → Destination `<select>`. |
| Keyboard user, generated dest | `#rw-galaxy-dest` options include all charted ids (probe: 101). |
| Dest focused, type KeyM | `isTypingFocus()` skip. Chart stays. Escape closes. |
| Hover label | Inspect only. No `plotRoute` on `pointerover`. |

Probe: `node --import ./scripts/with-css-stub.mjs out/w121/chartlabel/probe.mjs` — **PASS**.
