# UI Audit: CTL-04 remaining station-menu input brief (Wave 124)

### Summary

No product chrome ships this wave. This audit treats the pack as a **UI-spec freeze**: live station Digit labels and live WPN rail stay. After later PR1, tapping Repair / Feed **must not silently change** the WPN value. No new overlay. No “not available” copy. Digit 0/8/9 stay painted station services. Flight help still names 1–5 as weapon groups.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Did **not** skip with “not available”. No Vite. No Chrome. Re-review after contract `settingsOwnsScreen` fallback: no chrome added.

### What's done well

- Reuses live station overlay (`.screen-overlay` z 20, `screens.css` **8–16**) and live WPN meter (`hud.js` **926–927**). No new widget.
- Station already names keys in text: `4 — Feed & tend`, `5 — Repair`, legend `1-9, 0 select service` (`station.js` **6034–6047**). Color is not the only cue.
- Flight CONTROLS line already names `1/2/3/4/5 — weapon group` (`controls.js` **378**). PR1 does not remove that line.
- Empty group copy is already honest: `4 · —` / `5 · —` (`hud.js` **259**, **267**). Inbox repro uses those strings. PR1 stops the silent rewrite; it does not invent a disabled state.
- HUD-01 empty 80 px hub stays empty. Aim-glass gauges stay off. No WPN pip on `.rw-reticle`.
- Digit 0 stays shipyard; Digit 8/9 stay launch / standing / outfitting papers. Outfitting papers are **not** weapon-group 1–5.
- Hail buttons already keep `[n]` + verb (`hail.js` **416**). PR1 does not restyle hail.
- `reducedMotion` n/a — no new motion chrome.
- `innerHTML` absent on the proposed skip. Labels stay `textContent` / `el()` / `h()` / `btn()`.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): WPN rail lies while the station menu is open

**Location:** `controls.js` **329–344**; `hud.js` **255–273**, **926–927**; station labels **6034**

**Issue:** Player taps **5 — Repair**. WPN becomes `5 · Psionic bolt` (or `5 · —` on a built hull). Player taps **4 — Feed & tend**. WPN becomes `4 · —`. The rail changes with **no** combat intent. That is the P1 leftover.

**Fix landed (markdown):** PR1 skips Digit1–5 → `weaponGroup` while `flags.docked === true`. WPN stays at the pre-dock group. Station service still opens.

**Status:** closed in contract §0.1 / brief Player outcome. Do not reopen as CONSUME. Do not “fix” with a new WPN overlay.

#### 🟠 Major (closed in freeze): “not available” / extra chrome as the skip cue

**Location:** owner UI freeze; `hud.js` `weaponHudLabel`; brief Non-goals

**Issue:** A later worker could paint `5 · not available` while docked so the player “understands” the skip. That is extra chrome and a lying state (the group is still the old live group).

**Fix landed:** No new copy. No disabled WPN widget. The rail **does not change**. Station legend already teaches menu digits.

**Status:** closed. UI audit must not skip with “not available”.

#### 🟡 Minor: Player cannot change WPN while docked

**Location:** contract tradeoff; outfitting Digit **8/9** `station.js` **6248–6250**

**Issue:** After PR1, docked Digit1–5 never retarget weapons. A combat-first player may want to pre-select cannon before undock.

**Fix:** That is the point of the inbox. Outfitting still uses Digit 8/9 papers, not groups 1–5. Owner may override after playtest. Do not park. Do not add a docked WPN picker.

**Status:** accepted — documented tradeoff, not a missing widget.

#### 🟡 Minor: Hail Digit1–3 still look like weapon keys in the CONTROLS list

**Location:** `controls.js` **378**; hail buttons `[n]` `hail.js` **416**

**Issue:** Help still says 1–5 are weapon groups. Hail cards also number 1–n. After PR1 the **write** is scoped; the help line stays flight-true.

**Fix:** Do not add a second CONTROLS line this leftover. Hail buttons already name `[n]` + verb. Color is not the only cue.

**Status:** accepted — no new chrome.

#### 💡 Suggestion: Chart / berth have no Digit legend, yet live Digit1–5 still change WPN

**Location:** chart KeyM `galaxychart.js` **764**; berth KeyL `save.js` **1503**; controls Digit cases

**Issue:** Player on the map can accidentally switch WPN. After PR1 `hailDigitsAllowed === false` / `chartOpen` / `berthOpen` skip the write. Map chrome does not need a Digit legend.

**Fix:** Skip is enough. Do not paint 1–5 on the chart.

**Status:** accepted — no new chrome.

### Accessibility

- Keyboard: station 1–9/0 stay reachable. Flight 1–5 stay reachable in open space. Skip is silent **non-change**, not a trap.
- Named close: Esc/B launch stay (`station.js` **6047**, **6161–6166**). PR1 does not steal Esc.
- Contrast: existing cyan-on-void rails and station scrim. No new color-only cue.
- Focus: typing skip prevents Digit-in-field from changing WPN (`isTypingFocus`).

### Responsive / states

- Station panel already scrolls (`station.js` **6012–6016**). Skip adds no DOM.
- Empty WPN group already shows `—`, not a spinner. PR1 keeps whatever group was live.
- Error: never throw; missing flags fly as not-docked.

### Theming

No new CSS. `.screen-overlay` and `.rw-combat-wpn` stay. Kit mutate omit.
