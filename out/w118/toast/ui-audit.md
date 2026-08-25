# UI Audit: HUD-04 leftover toast-flood (Wave 118)

### Summary

No product chrome ships this wave. Spec picture is **five existing toast chips**, identical copy sharing **one** visible chip for 8 s via a **key linger ring** (not chip-tied), expire **`aria-hidden`**, and **readable** autosave vs berth refusal strings. Place stays top-right off the aim column. Hub stays empty 80 px. Color is not the only cue (glyphs + words). `aria-live=polite` stays (not assertive). Identical refresh does not rewrite text. Overlay cards stay above toasts. `reducedMotion`: no new toast animation.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit, not a running page. Did **not** start Vite or Chrome. `[NO BROWSER COVERAGE]`. This leftover **is** UI policy — audit not skipped.

### What's done well

- Reuses live `.rw-toasts` / `.rw-toast` (`hud.js` 813–819; `hud.css` 635–646, 717–738). No new widget.
- Live glyphs already pair with color: `▲` warn, `✧` comm, `■` good (`toastForEvent` 530–648). Autosave line keeps `▲`.
- Polite live region already set; freeze forbids `textContent` rewrite on identical refresh so screen readers are not flooded. Expire must set `aria-hidden` so stale chips leave the region.
- High-contrast already restyles `.rw-toast` (`hud.css` 1167–1175). `--rw-text-scale` already scales toast type (717).
- Empty hub freeze: no toast pip on `.rw-reticle` (`hud.css` 184–193).
- Toasts stay `pointer-events: none` — they do not steal hail/chart/berth clicks.
- Distinct copy (AUTOSAVE HELD vs SAVE BLOCKED) is **words**, not a second color-only state.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Autosave retry blinks every 5 s and fills the stack

**Location:** `save.js` 1588–1590 vs `hud.js` 64, 1155–1157, 1197–1201.

**Issue:** Inbox P1. Lifetime 4 s; retry 5 s; expire clears key; new chip; can overwrite a new sting.

**Fix landed (markdown):** 8 s identical-key window; visible extend; linger-ring **suppress** so chips stay free for **new** copy.

**Status:** closed in contract §0.1 / §2. Do not reopen as CONSUME.

#### 🟠 Major (closed in freeze): Slot-tied linger loses the 8 s window in the pirate-bubble scene

**Location:** prior freeze tied linger to chip `key`; live expire **1197–1201** already clears chip `key`. Designer re-dispatch.

**Issue:** AUTOSAVE HELD, then four other distinct lines, reuse all five chips. A linger stored on the chip dies. The 5 s autosave retry restacks. Named scene fails.

**Fix landed:** five-row linger ring of **keys**, independent of which chip paints. Chip reuse does **not** clear linger. Clear only when `now > lastShown + 8`.

**Status:** closed in contract §0.1 formulas / §2. PR1 must land this.

#### 🟠 Major (closed in freeze): Expired chips stay in the polite live region

**Location:** `hud.js` 813–816 `aria-live=polite`; expire 1197–1201 removes `show` only.

**Issue:** Stale `textContent` remains inside the live region. AT can still traverse or re-read faded chips. Identical refresh already avoids rewrite; expire did not hide from the tree.

**Fix landed:** expire `aria-hidden="true"`; keep `textContent`. Real show: `aria-hidden="false"` **then** `textContent`. Do not use `assertive`. Do not add a second live region. Optional CSS `visibility: hidden` on `.rw-toast:not(.show)` is a hide, not a z raise.

**Status:** closed in contract §0.19 / §2. PR1 must land this.

#### 🟠 Major (closed in freeze): Autosave and berth share SAVE BLOCKED + berth wording

**Location:** `hud.js` 568–569; `save.js` 1028, 1039–1041.

**Issue:** Player cannot tell a background retry from a KeyL SAVE failure. Autosave even says **berth record refused**.

**Fix landed:** AUTOSAVE HELD authored line vs SAVE BLOCKED + reason; emit `source` tag.

**Status:** closed in contract formulas.

#### 🟡 Minor: Toasts sit under hail/berth (z 10 vs 40/60)

**Location:** `style.css` 24–29; hail / berth z; contract §0.8.

**Issue:** While a play card is open, chips are easy to miss. Raising z would fight overlay mutex and Digit glance.

**Fix:** Do **not** raise toast z. Overlay sibling owns stacking. Player closes the card (H intent / M / L) to see HUD chips again.

**Status:** accepted residual. Call out in notes. Do not solve overlay here.

#### 🟡 Minor: Suppress-after-fade can feel like a “missed” second comm

**Location:** contract post-expire suppress inside 8 s.

**Issue:** A second identical hail line 5 s later stays quiet. Inbox asked not to obscure **new** information; identical is not new.

**Fix:** Distinct text still shows. Owner may retune 8 s after playtest.

**Status:** accepted; deputized.

#### 🟡 Minor: Long SAVE BLOCKED + berth reason may clip (`white-space: nowrap`)

**Location:** `hud.css` 730 `.rw-toast { white-space: nowrap }`; hostile reason `save.js` 1028.

**Issue:** AUTOSAVE HELD is short. Berth SAVE BLOCKED plus the long hostile sentence may clip at `--rw-text-scale` XL.

**Fix:** Prefer **keep CSS**. If playtest clips, shorten the **berth authored reason**, not the HUD prefix. Do not wrap into the aim column. Do not add slots.

**Status:** accepted cheap fold. Not required PR1 unless playtest clips.

#### 💡 Suggestion: Do not restack toast CSS if window holds

**Location:** contract §4 `hud.css`.

**Issue:** Moving chips back to aim-column undoes Wave A–F utility. Adding slots is a taller flood. Optional `:not(.show) { visibility: hidden }` is the only allowed CSS.

**Status:** frozen. No z-index. No geometry.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.18; live fade `hud.css` 729.

**Status:** no new toast animation; do not add one.

### Verdict

Spec UI is existing chips with a **named** key linger (not chip-tied), expire **`aria-hidden`**, and **named** copy split. No open Blocker/Major. Designer Majors closed in freeze. Optional PR2 stills are skippable. Did not spawn designer. Did not start a browser.
