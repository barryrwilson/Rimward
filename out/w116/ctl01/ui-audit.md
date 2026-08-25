# UI Audit: CTL-01 remaining dock/jump bind (Wave 116)

### Summary

No product chrome ships this wave. Spec picture is a **dedicated KeyJ** for the existing dock/jump prompt family, with KeyD remaining lateral strafe. Prompt already has a named key chip **and** a verb. Copy must say **J**. Color is not the only cue. Digit 0/8/9 stay. KeyT/V/K/X stay. Hub stays empty 80 px. `reducedMotion` n/a (no new motion).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit, not a running page. Did **not** start Vite or Chrome.

### What's done well

- Reuses live `.rw-prompt` / `.rw-prompt-key` / `.rw-prompt-verb` (`hud.js` 837–839; `hud.css` 741–772). No new widget.
- Live prompt already writes **text** (`promptKey.textContent`, `promptVerb.textContent` 2184–2185). Letter + verb, not color-only.
- High-contrast body already includes `.rw-prompt` (`hud.css` 1169).
- CONTROLS list is real text lines from `config.controls` (`hud.js` 1019–1023).
- Onboarding is `textContent` (`onboarding.js` 102).
- Same key for dock and jump keeps one prompt family (inbox: “displayed gate or dock prompt”).
- Title legend stays `PRESS 1-n OR CLICK` (`title.js` 177). Enter remains CONTINUE, not dock.
- Empty hub freeze: no dock pip on `.rw-reticle`.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Painted D currently lies against movement

**Location:** `hud.js` 2127–2138; `controls.js` 274–276, 440.

**Issue:** The prompt teaches D for Dock/Jump. Tapping it strafes right and can leave the zone. That is the P0 leftover.

**Fix landed (markdown):** PR1 names **J** on prompt, onboarding, and CONTROLS. KeyD stays A/D strafe only.

**Status:** closed in contract §0.1 / §0.3. Do not reopen as CONSUME.

#### 🟠 Major (closed in freeze): Color-only key chip

**Location:** `hud.css` 755–765 cyan chip; settings “important states are legible without relying on color” (`settings.js` 2–3).

**Issue:** A later “just recolor the chip” would fail colorblind players if the letter were removed.

**Fix landed:** Accessibility freeze: prompt **must name** the new key. Keep `pKey` letter. Verb may also include `J — Jump` on hub rows.

**Status:** closed in contract §0.14.

#### 🟡 Minor: Players trained on D-to-dock

**Location:** onboarding `'D — dock'` / `'D — jump the gate'` (`onboarding.js` 50, 53); CONTROLS `'D — dock'` (`controls.js` 353).

**Issue:** Muscle memory. One-time hints only fire if not already `seen`. Existing saves will **not** re-show dock/gate hints.

**Fix:** PR1 still updates hint **source strings** (WAVE6 pin). CONTROLS list always shows. Prompt is the in-zone teacher for veterans. Do not reset `world.onboarding.seen` (that would be a persist/behavior surprise).

**Status:** accepted residual. Call out in notes.

#### 🟡 Minor: Hub row chip stays G

**Location:** `hud.js` 2132–2135.

**Issue:** After PR1 the big chip is still G while jump moves to J inside the verb. Easy to “simplify” by making the chip J and hiding cycle.

**Fix:** Keep G as cycle. Name J in the verb. Optional PR2 dual-chip is skippable.

**Status:** accepted; do not steal G.

#### 💡 Suggestion: Do not add a second bottom prompt or hub dock pip

**Location:** contract §0.2; `hud.css` 184–193 hub (HUD-01).

**Status:** frozen. PR2 chrome is optional polish on **existing** prompt, not a new instrument.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.13.

**Status:** no prompt animation today; do not add one.

### Verdict

Spec UI is the existing prompt with a new **named** key. No open Blocker/Major. Optional PR2 chrome is skippable.
